const HTML_URL = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/bot/src/index.html";
async function getHtml() {
  const r = await fetch(HTML_URL, {cf: {cacheTtl: 60, cacheEverything: true}});
  if (!r.ok) throw new Error("html " + r.status);
  return r.text();
}
const ATLAS = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/HEAD/mdcats2.jpg";
const N_ITEMS = 63;
let ready = false;

const J = (o, s) => new Response(JSON.stringify(o), {status: s || 200, headers: {"content-type": "application/json", "cache-control": "no-store"}});
const enc = s => new TextEncoder().encode(s);
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc(key) : key, {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, typeof msg === "string" ? enc(msg) : msg);
}
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");

async function verify(init, token) {
  if (!init) return null;
  const p = new URLSearchParams(init), h = p.get("hash"); if (!h) return null; p.delete("hash");
  const dcs = [...p.entries()].map(([k, v]) => k + "=" + v).sort().join("\n");
  const key = await hmac("WebAppData", token);
  if (hex(await hmac(key, dcs)) !== h) return null;
  if (Date.now() / 1000 - Number(p.get("auth_date") || 0) > 86400 * 30) return null;
  try { return JSON.parse(p.get("user")); } catch (e) { return null; }
}
const uname = u => ((u.first_name || "") + " " + (u.last_name || "")).trim().slice(0, 24) || u.username || "Игрок";

async function init(db) {
  if (ready) return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, state TEXT, rev INTEGER DEFAULT 0, total REAL DEFAULT 0, imp INTEGER DEFAULT 0, upd INTEGER DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS offers (id INTEGER PRIMARY KEY AUTOINCREMENT, seller INTEGER, sname TEXT, give INTEGER, want INTEGER, ts INTEGER, status TEXT DEFAULT 'open', buyer INTEGER)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_total ON users(total)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_offers ON offers(status)"),
  ]);
  ready = true;
}
const num = x => (typeof x === "number" && isFinite(x)) ? x : 0;
function clean(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  if (JSON.stringify(s).length > 40000) return null;
  if (!Array.isArray(s.b) || !s.inv || typeof s.inv !== "object") return null;
  for (const k of ["pts", "run", "total"]) s[k] = Math.max(0, num(s[k]));
  return s;
}
async function getUser(db, id) { return db.prepare("SELECT * FROM users WHERE id=?").bind(id).first(); }
async function mutate(db, id, fn, name) {
  for (let i = 0; i < 4; i++) {
    const u = await getUser(db, id); if (!u || !u.state) return {error: "Игрок не найден"};
    const s = JSON.parse(u.state); const r = fn(s); if (r) return {error: r};
    const res = await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, upd=? WHERE id=? AND rev=?").bind(JSON.stringify(s), num(s.total), Math.floor(Date.now() / 1000), id, u.rev).run();
    if (res.meta.changes === 1) return {state: s, rev: u.rev + 1};
  }
  return {error: "Занято, попробуй ещё раз"};
}
const inv = (s, k) => s.inv[k] || 0;
const add = (s, k, d) => { const v = inv(s, k) + d; if (v > 0) s.inv[k] = v; else delete s.inv[k]; };

async function api(path, req, env) {
  const db = env.DB; if (!db) return J({error: "Не подключена база DB"}, 500);
  await init(db);
  const user = await verify(req.headers.get("x-init"), env.BOT_TOKEN);
  if (!user) return J({error: "Открой игру из бота"}, 401);
  const id = user.id, name = uname(user); let b = {}; try { b = await req.json(); } catch (e) {}
  const now = Math.floor(Date.now() / 1000);

  if (path === "auth") {
    const u = await getUser(db, id);
    if (!u) return J({id, name, state: null, rev: 0});
    if (u.name !== name) await db.prepare("UPDATE users SET name=? WHERE id=?").bind(name, id).run();
    return J({id, name, state: u.state ? JSON.parse(u.state) : null, rev: u.rev});
  }
  if (path === "save") {
    const s = clean(b.state); if (!s) return J({error: "Некорректные данные"}, 400);
    const u = await getUser(db, id);
    if (!u) {
      await db.prepare("INSERT OR IGNORE INTO users (id,name,state,rev,total,upd) VALUES (?,?,?,?,?,?)").bind(id, name, JSON.stringify(s), 1, num(s.total), now).run();
      const n = await getUser(db, id); return J({rev: n.rev});
    }
    const res = await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, name=?, upd=? WHERE id=? AND rev=?").bind(JSON.stringify(s), num(s.total), name, now, id, Number(b.rev)).run();
    if (res.meta.changes === 1) return J({rev: Number(b.rev) + 1});
    return J({conflict: true, state: JSON.parse(u.state), rev: u.rev});
  }
  if (path === "top") {
    const rows = (await db.prepare("SELECT id,name,total FROM users WHERE total>0 ORDER BY total DESC LIMIT 50").all()).results;
    const u = await getUser(db, id); let rank = 0;
    if (u) rank = (await db.prepare("SELECT COUNT(*)+1 AS r FROM users WHERE total>?").bind(u.total).first()).r;
    return J({rows, rank});
  }
  if (path === "offers") {
    const o = (await db.prepare("SELECT id,seller,sname,give,want FROM offers WHERE status='open' ORDER BY id DESC LIMIT 100").all()).results;
    return J({offers: o});
  }
  if (path === "offer") {
    const give = Number(b.give), want = Number(b.want);
    if (!Number.isInteger(give) || !Number.isInteger(want) || give < 0 || want < 0 || give >= N_ITEMS || want >= N_ITEMS || give === want) return J({error: "Неверные коты"});
    const cnt = (await db.prepare("SELECT COUNT(*) AS c FROM offers WHERE seller=? AND status='open'").bind(id).first()).c;
    if (cnt >= 5) return J({error: "Не больше 5 предложений"});
    const r = await mutate(db, id, s => { if (inv(s, give) < 2) return "Нужен дубликат"; add(s, give, -1); });
    if (r.error) return J(r);
    await db.prepare("INSERT INTO offers (seller,sname,give,want,ts) VALUES (?,?,?,?,?)").bind(id, name, give, want, now).run();
    return J(r);
  }
  if (path === "cancel") {
    const o = await db.prepare("SELECT * FROM offers WHERE id=? AND seller=? AND status='open'").bind(Number(b.id), id).first();
    if (!o) return J({error: "Предложение не найдено"});
    const c = await db.prepare("UPDATE offers SET status='cancel' WHERE id=? AND status='open'").bind(o.id).run();
    if (c.meta.changes !== 1) return J({error: "Уже занято"});
    return J(await mutate(db, id, s => { add(s, o.give, 1); }));
  }
  if (path === "accept") {
    const o = await db.prepare("SELECT * FROM offers WHERE id=? AND status='open'").bind(Number(b.id)).first();
    if (!o) return J({error: "Предложение уже недоступно"});
    if (o.seller === id) return J({error: "Это твоё предложение"});
    const c = await db.prepare("UPDATE offers SET status='done', buyer=? WHERE id=? AND status='open'").bind(id, o.id).run();
    if (c.meta.changes !== 1) return J({error: "Кто-то уже обменял"});
    const r = await mutate(db, id, s => { if (inv(s, o.want) < 2) return "Нужен дубликат: кота " + o.want; add(s, o.want, -1); add(s, o.give, 1); });
    if (r.error) { await db.prepare("UPDATE offers SET status='open', buyer=NULL WHERE id=?").bind(o.id).run(); return J(r); }
    await mutate(db, o.seller, s => { add(s, o.want, 1); });
    return J(r);
  }
  if (path === "import") {
    const s = clean(b.state); if (!s) return J({error: "Некорректный код"});
    const u = await getUser(db, id);
    if (u && u.imp) return J({error: "Перенос уже выполнялся"});
    s.ts = now;
    if (!u) await db.prepare("INSERT INTO users (id,name,state,rev,total,imp,upd) VALUES (?,?,?,?,?,1,?)").bind(id, name, JSON.stringify(s), 1, num(s.total), now).run();
    else await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, imp=1, upd=? WHERE id=?").bind(JSON.stringify(s), num(s.total), now, id).run();
    const n = await getUser(db, id); return J({state: s, rev: n.rev});
  }
  return J({error: "unknown"}, 404);
}

async function tgcall(env, method, body) {
  const r = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
  return r.json();
}
async function secret(env) { return hex(await crypto.subtle.digest("SHA-256", enc("md:" + env.BOT_TOKEN))).slice(0, 32); }

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    try {
      if (p === "/" || p === "/index.html") return new Response(await getHtml(), {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store"}});
      if (p === "/atlas.jpg") {
        const r = await fetch(ATLAS, {cf: {cacheTtl: 86400, cacheEverything: true}});
        return new Response(r.body, {status: r.status, headers: {"content-type": "image/jpeg", "cache-control": "public,max-age=86400"}});
      }
      if (p.startsWith("/api/") && req.method === "POST") return await api(p.slice(5), req, env);
      if (p === "/setup") {
        if (!env.BOT_TOKEN) return new Response("Нет секрета BOT_TOKEN", {status: 500});
        const base = url.origin;
        const a = await tgcall(env, "setWebhook", {url: base + "/bot", secret_token: await secret(env), allowed_updates: ["message"]});
        const b = await tgcall(env, "setChatMenuButton", {menu_button: {type: "web_app", text: "Играть", web_app: {url: base}}});
        const c = await tgcall(env, "setMyCommands", {commands: [{command: "start", description: "Открыть игру"}, {command: "top", description: "Таблица лидеров"}]});
        return new Response(JSON.stringify({webhook: a, menu: b, commands: c}, null, 1), {headers: {"content-type": "application/json"}});
      }
      if (p === "/bot" && req.method === "POST") {
        if (req.headers.get("x-telegram-bot-api-secret-token") !== await secret(env)) return new Response("no", {status: 403});
        const u = await req.json(), m = u.message; if (!m || !m.text) return new Response("ok");
        const base = url.origin;
        if (m.text.startsWith("/top") && env.DB) {
          await init(env.DB);
          const rows = (await env.DB.prepare("SELECT name,total FROM users WHERE total>0 ORDER BY total DESC LIMIT 10").all()).results;
          const f = n => { n = Number(n); if (n < 1000) return String(Math.floor(n)); const S = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx"], i = Math.min(Math.floor(Math.log10(n) / 3), 7); return (n / Math.pow(1000, i)).toFixed(2) + S[i]; };
          await tgcall(env, "sendMessage", {chat_id: m.chat.id, text: "🏅 Топ игроков\n\n" + (rows.map((r, i) => (i + 1) + ". " + r.name + " — " + f(r.total)).join("\n") || "Пока пусто")});
        } else {
          await tgcall(env, "sendMessage", {chat_id: m.chat.id, text: "🍉 MDMelonClicker\n\nТапай монету, копи генераторы, открывай кейсы и собирай котов. Прогресс можно перенести из плагина для exteraGram.", reply_markup: {inline_keyboard: [[{text: "🍉 Играть", web_app: {url: base}}]]}});
        }
        return new Response("ok");
      }
    } catch (e) { return J({error: "Ошибка сервера: " + (e && e.message)}, 500); }
    return new Response("Not found", {status: 404});
  },
};
