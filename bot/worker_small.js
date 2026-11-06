const HTML_URL = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/bot/src/index.html";
async function getHtml() {
  const r = await fetch(HTML_URL, {cf: {cacheTtl: 30, cacheEverything: true}});
  if (!r.ok) throw new Error("html " + r.status);
  return r.text();
}
const ATLAS = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/HEAD/mdcats2.jpg";
const N_ITEMS = 103;
const ADMIN = 1796286471;
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
    db.prepare("CREATE TABLE IF NOT EXISTS grants (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, kind TEXT, a REAL, b INTEGER, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS promos (code TEXT PRIMARY KEY, kind TEXT, a REAL, b INTEGER, mx INTEGER, used INTEGER DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS promo_uses (code TEXT, uid INTEGER, PRIMARY KEY(code, uid))"),
    db.prepare("CREATE TABLE IF NOT EXISTS bcast (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, name TEXT, text TEXT, ts INTEGER)"),
  ]);
  for (const c of ["badges TEXT DEFAULT ''", "banned INTEGER DEFAULT 0", "seen INTEGER DEFAULT 0"]) { try { await db.prepare("ALTER TABLE users ADD COLUMN " + c).run(); } catch (e) {} }
  ready = true;
}
function tidy(s) { if (Array.isArray(s.holo)) s.holo = s.holo.filter(i => (i + "") in s.inv); if (s.eq !== undefined && +s.eq >= 0 && !((s.eq + "") in s.inv)) s.eq = -1; }
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
const bd = (id, s) => { let r = String(s || ""); if (id === ADMIN && !r.includes("c")) r = "c" + r; return r; };
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
    if (!u) return J({id, name, state: null, rev: 0, admin: id === ADMIN, badges: bd(id, "")});
    if (u.name !== name) await db.prepare("UPDATE users SET name=? WHERE id=?").bind(name, id).run();
    return J({id, name, state: u.state ? JSON.parse(u.state) : null, rev: u.rev, admin: id === ADMIN, badges: bd(id, u.badges), banned: !!u.banned});
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
    if (!u.state) return J({reset: true, rev: u.rev});
    return J({conflict: true, state: JSON.parse(u.state), rev: u.rev});
  }
  if (path === "top") {
    const rows = (await db.prepare("SELECT id,name,total,badges FROM users WHERE total>0 ORDER BY total DESC LIMIT 50").all()).results.map(r => ({...r, badges: bd(r.id, r.badges)}));
    const u = await getUser(db, id); let rank = 0;
    if (u) rank = (await db.prepare("SELECT COUNT(*)+1 AS r FROM users WHERE total>?").bind(u.total).first()).r;
    return J({rows, rank});
  }
  if (path === "offers") {
    const o = (await db.prepare("SELECT o.id,o.seller,o.sname,o.give,o.want,u.badges FROM offers o LEFT JOIN users u ON u.id=o.seller WHERE o.status='open' ORDER BY o.id DESC LIMIT 100").all()).results.map(r => ({...r, badges: bd(r.seller, r.badges)}));
    return J({offers: o});
  }
  if (path === "offer") {
    const give = Number(b.give), want = Number(b.want);
    if (!Number.isInteger(give) || !Number.isInteger(want) || give < 0 || want < 0 || give === 70 || give === 71 || want === 70 || want === 71 || give >= N_ITEMS || want >= N_ITEMS || give === want) return J({error: "Неверные коты"});
    const cnt = (await db.prepare("SELECT COUNT(*) AS c FROM offers WHERE seller=? AND status='open'").bind(id).first()).c;
    if (cnt >= 5) return J({error: "Не больше 5 предложений"});
    const r = await mutate(db, id, s => { if (inv(s, give) < 1) return "У тебя нет этого кота"; add(s, give, -1); tidy(s); });
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
    const r = await mutate(db, id, s => { if (inv(s, o.want) < 1) return "У тебя нет нужного кота"; add(s, o.want, -1); add(s, o.give, 1); tidy(s); });
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
  const adm = id === ADMIN;
  if (path === "poll") {
    await db.prepare("UPDATE users SET seen=? WHERE id=?").bind(now, id).run();
    const g = (await db.prepare("SELECT id,kind,a,b FROM grants WHERE uid=? ORDER BY id LIMIT 50").bind(id).all()).results;
    for (const x of g) await db.prepare("DELETE FROM grants WHERE id=?").bind(x.id).run();
    const bc = await db.prepare("SELECT id,text FROM bcast WHERE id>? AND ts>? ORDER BY id DESC LIMIT 1").bind(Number(b.bc) || 0, now - 120).first();
    const maxbc = (await db.prepare("SELECT COALESCE(MAX(id),0) AS m FROM bcast").first()).m;
    const online = (await db.prepare("SELECT COUNT(*) AS c FROM users WHERE seen>?").bind(now - 40).first()).c;
    const u = await getUser(db, id);
    return J({grants: g, bc, maxbc, online, rev: u ? u.rev : 0, banned: !!(u && u.banned), badges: bd(id, u && u.badges)});
  }
  if (path === "chat") {
    const since = Number(b.since) || 0;
    let rows = (await db.prepare("SELECT c.id,c.uid,c.name,c.text,c.ts,u.badges FROM chat c LEFT JOIN users u ON u.id=c.uid WHERE c.id>? ORDER BY c.id DESC LIMIT 60").bind(since).all()).results;
    rows = rows.reverse().map(r => ({...r, badges: bd(r.uid, r.badges)}));
    return J({rows});
  }
  if (path === "chat_send") {
    const u = await getUser(db, id); if (!u) return J({error: "Сначала сыграй"});
    if (u.banned) return J({error: "Ты заблокирован в чате"});
    const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, 200); if (!text) return J({error: "Пусто"});
    const last = await db.prepare("SELECT ts FROM chat WHERE uid=? ORDER BY id DESC LIMIT 1").bind(id).first();
    if (last && now - last.ts < 2 && !adm) return J({error: "Не так быстро"});
    await db.prepare("INSERT INTO chat (uid,name,text,ts) VALUES (?,?,?,?)").bind(id, name, text, now).run();
    return J({ok: true});
  }
  if (path === "profile") {
    const uid = Number(b.uid); const u = await getUser(db, uid); if (!u) return J({error: "Игрок не найден"});
    const s = u.state ? JSON.parse(u.state) : {};
    const cats = Object.keys(s.inv || {}).length;
    return J({id: u.id, name: u.name, badges: bd(u.id, u.badges), banned: !!u.banned, online: (u.seen || 0) > now - 40, total: u.total, taps: s.taps || 0, cats, holo: (s.holo || []).length, prest: s.prest || 0, ach: (s.ach || []).length, eq: s.eq === undefined ? -1 : s.eq, opened: s.opened || 0, bn: Number.isInteger(s.bn) ? s.bn : 0, offers: (await db.prepare("SELECT id,give,want FROM offers WHERE seller=? AND status='open' ORDER BY id DESC LIMIT 5").bind(u.id).all()).results});
  }
  if (path === "promo_use") {
    const code = String(b.code || "").trim().toUpperCase().slice(0, 32); if (!code) return J({error: "Введи промокод"});
    const p = await db.prepare("SELECT * FROM promos WHERE code=?").bind(code).first();
    if (!p) return J({error: "Промокод не найден"});
    if (p.mx > 0 && p.used >= p.mx) return J({error: "Промокод закончился"});
    try { await db.prepare("INSERT INTO promo_uses (code,uid) VALUES (?,?)").bind(code, id).run(); } catch (e) { return J({error: "Ты уже использовал этот промокод"}); }
    await db.prepare("UPDATE promos SET used=used+1 WHERE code=?").bind(code).run();
    return J({kind: p.kind, a: p.a, b: p.b});
  }
  if (path.startsWith("adm_")) {
    if (!adm) return J({error: "Нет доступа"}, 403);
    if (path === "adm_give") {
      const t = Number(b.target) || id, kind = String(b.kind);
      if (!["pts", "gems", "cat", "takepts", "takecat", "takegems"].includes(kind)) return J({error: "Неверный тип"});
      const u = await getUser(db, t); if (!u) return J({error: "Игрок с таким ID не найден"});
      if (kind.startsWith("take")) {
        const a = num(Number(b.a)), m = Math.floor(num(Number(b.b))) || 1;
        let was = null;
        const r = await mutate(db, t, s => {
          was = {pts: num(s.pts), gems: num(s.gems), inv: Object.assign({}, s.inv)};
          let txt = "";
          if (kind === "takepts") { const x = a < 0 ? s.pts : m === 2 ? s.pts * Math.min(a, 100) / 100 : Math.min(s.pts, a); s.pts = Math.max(0, num(s.pts) - x); s.total = a < 0 ? 0 : Math.max(0, num(s.total) - x); s.run = a < 0 ? 0 : Math.max(0, num(s.run) - x); txt = "монеты"; }
          else if (kind === "takegems") { const x = a < 0 ? s.gems : Math.min(num(s.gems), a); s.gems = Math.max(0, num(s.gems) - x); txt = "самоцветы"; }
          else { const k = String(Math.floor(a)); if (!(k in s.inv)) return "У игрока нет этого кота"; s.inv[k] -= m; if (s.inv[k] <= 0) { delete s.inv[k]; s.holo = (s.holo || []).filter(x => x !== +k); if (+s.eq === +k) s.eq = -1; } txt = "кот"; }
          s.tk = (s.tk || 0) + 1; s.tkm = txt;
        });
        if (r.error) return J({error: r.error});
        return J({ok: true, name: u.name, was: {pts: was.pts, gems: was.gems}, now: {pts: num(r.state.pts), gems: num(r.state.gems)}, srv: 3});
      }
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(t, kind, num(Number(b.a)), Math.floor(num(Number(b.b))) || 1, now).run();
      return J({ok: true, name: u.name});
    }
    if (path === "adm_bcast") {
      const text = String(b.text || "").trim().slice(0, 300); if (!text) return J({error: "Пусто"});
      await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind(text, now).run();
      return J({ok: true});
    }
    if (path === "adm_reset") {
      const t = Number(b.uid), u = await getUser(db, t); if (!u) return J({error: "Игрок не найден"});
      await db.prepare("UPDATE users SET state=NULL, total=0, rev=rev+1, upd=? WHERE id=?").bind(now, t).run();
      await db.prepare("UPDATE offers SET status='cancelled' WHERE seller=? AND status='open'").bind(t).run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(t, "reset", 0, 1, now).run();
      return J({ok: true, name: u.name});
    }
    if (path === "adm_resetall") {
      await db.prepare("UPDATE users SET state=NULL, total=0, rev=rev+1, upd=?").bind(now).run();
      await db.prepare("UPDATE offers SET status='cancelled' WHERE status='open'").run();
      await db.prepare("DELETE FROM grants").run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) SELECT id,'reset',0,2,? FROM users").bind(now).run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) SELECT id,'cat',72,1,? FROM users").bind(now).run();
      const c = (await db.prepare("SELECT COUNT(*) AS c FROM users").first()).c;
      return J({ok: true, count: c});
    }
    if (path === "adm_del") { await db.prepare("DELETE FROM chat WHERE id=?").bind(Number(b.id)).run(); return J({ok: true}); }
    if (path === "adm_ban") { await db.prepare("UPDATE users SET banned=? WHERE id=?").bind(b.on ? 1 : 0, Number(b.uid)).run(); if (b.on) await db.prepare("DELETE FROM chat WHERE uid=?").bind(Number(b.uid)).run(); return J({ok: true}); }
    if (path === "adm_badges") { const v = String(b.badges || "").replace(/[^cts]/g, "").slice(0, 3); await db.prepare("UPDATE users SET badges=? WHERE id=?").bind(v, Number(b.uid)).run(); return J({ok: true, badges: bd(Number(b.uid), v)}); }
    if (path === "adm_promo_new") {
      const code = String(b.code || "").trim().toUpperCase().replace(/[^A-Z0-9_А-Я-]/g, "").slice(0, 32), kind = String(b.kind);
      if (!code || !["pts", "gems", "cat"].includes(kind)) return J({error: "Неверные данные"});
      await db.prepare("INSERT OR REPLACE INTO promos (code,kind,a,b,mx,used) VALUES (?,?,?,?,?,COALESCE((SELECT used FROM promos WHERE code=?),0))").bind(code, kind, num(Number(b.a)), Math.floor(num(Number(b.b))) || 1, Math.max(0, Math.floor(num(Number(b.mx)))), code).run();
      return J({ok: true, code});
    }
    if (path === "adm_promo_list") return J({rows: (await db.prepare("SELECT * FROM promos ORDER BY rowid DESC LIMIT 50").all()).results});
    if (path === "adm_promo_del") { const c = String(b.code); await db.prepare("DELETE FROM promos WHERE code=?").bind(c).run(); await db.prepare("DELETE FROM promo_uses WHERE code=?").bind(c).run(); return J({ok: true}); }
  }
  return J({error: "unknown"}, 404);
}

async function tgcall(env, method, body) {
  const r = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
  return r.json();
}
async function secret(env) { return hex(await crypto.subtle.digest("SHA-256", enc("md:" + env.BOT_TOKEN))).slice(0, 32); }

const DEMO = "<script>window.__DEV=1;(function(){var f=window.fetch;var seed={pts:1500000,run:1500000,total:3000000,gems:12,taps:1234,b:[12,8,5,3,1,0,0],inv:{\"3\":1,\"10\":1,\"22\":1,\"40\":1,\"64\":1,\"73\":1,\"80\":1,\"63\":1}};var rows=[[1,\"Мурка\",9.5e9],[2,\"Барсик\",4.2e8],[3,\"Демо\",3e6]].map(function(r){return{id:r[0],name:r[1],total:r[2],badges:\"\"}});var m={auth:{id:3,name:\"Демо\",state:seed,rev:1,admin:false,badges:\"\"},save:{ok:true,rev:1},poll:{grants:[],bc:null,maxbc:0,online:5,rev:1,badges:\"\"},top:{rows:rows,rank:3},offers:{offers:[]},chat:{rows:[{id:1,uid:1,name:\"Мурка\",text:\"Привет! Кто трейд?\",ts:0,badges:\"b\"},{id:2,uid:2,name:\"Барсик\",text:\"Выбил Королевского арбуза!\",ts:0,badges:\"\"}]}};window.fetch=function(u,o){u=String(u);if(u.indexOf(\"/api/\")===0){return Promise.resolve(new Response(JSON.stringify(m[u.slice(5)]||{}),{headers:{\"content-type\":\"application/json\"}}))}return f.apply(this,arguments)}})()</script>";
const ANN = ["5.9.2", ["Обмен: теперь можно менять любых котов, а не только дубликаты (последний кот уходит из инвентаря)", "Новый экран выбора кота для обмена: крупные карточки по редкостям", "Профиль: баннеры на выбор и список твоих активных обменов", "Выключатели анимаций клика и открытия кейсов (Ещё → Игра)", "Перерождение: 1 000 000 за забег = 1 самоцвет, дальше линейно", "Цены кейсов: Особый — 250 млн, Течкот — 101 млн", "Каждое обновление теперь приходит сообщением в бота"]];
let annBusy = false;
async function announce(env, origin) {
  if (annBusy || !env.DB || !env.BOT_TOKEN) return;
  annBusy = true;
  try {
    const db = env.DB; await init(db);
    const cur = await db.prepare("SELECT v FROM kv WHERE k='annver'").first();
    if (!cur) await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES ('annver','5.9.1')").run();
    if (cur && cur.v === ANN[0]) return;
    const nowS = Math.floor(Date.now() / 1000);
    await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES ('annlock','0')").run();
    const lk = await db.prepare("UPDATE kv SET v=? WHERE k='annlock' AND CAST(v AS INTEGER)<?").bind(String(nowS + 30), nowS).run();
    if (lk.meta.changes !== 1) return;
    const lastv = await db.prepare("SELECT v FROM kv WHERE k='annto'").first();
    if (!lastv || lastv.v !== ANN[0]) { await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('annto',?)").bind(ANN[0]).run(); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('annpos','0')").run(); }
    const pos = Number((await db.prepare("SELECT v FROM kv WHERE k='annpos'").first()).v) || 0;
    const rows = (await db.prepare("SELECT id FROM users WHERE id>? AND banned=0 ORDER BY id LIMIT 40").bind(pos).all()).results;
    if (!rows.length) { await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('annver',?)").bind(ANN[0]).run(); return; }
    const text = "🍉 Обновление v" + ANN[0] + "\n\n" + ANN[1].map(x => "• " + x).join("\n");
    const markup = {inline_keyboard: [[{text: "Играть", web_app: {url: origin}}]]};
    for (let i = 0; i < rows.length; i += 10) {
      await Promise.all(rows.slice(i, i + 10).map(r => tgcall(env, "sendMessage", {chat_id: r.id, text, reply_markup: markup}).catch(() => {})));
    }
    await db.prepare("UPDATE kv SET v=? WHERE k='annpos'").bind(String(rows[rows.length - 1].id)).run();
    await db.prepare("UPDATE kv SET v='0' WHERE k='annlock'").run();
  } catch (e) {} finally { annBusy = false; }
}
export default {
  async fetch(req, env, ctx) {
    if (ctx && ctx.waitUntil && req.method === "POST" && new URL(req.url).pathname === "/api/poll") ctx.waitUntil(announce(env, new URL(req.url).origin));
    const url = new URL(req.url), p = url.pathname;
    try {
      if (p === "/" || p === "/index.html") return new Response(await getHtml(), {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store"}});
      if (p === "/demo") return new Response((await getHtml()).replace("<head>", "<head>" + DEMO), {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store"}});
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
