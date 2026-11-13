const HTML = __HTML__;
const ATLAS = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/HEAD/mdcats2.jpg";
const BOT_USER = "mdmelonbot";
const N_ITEMS = 103;
const BC_CATS = [["Киллер в плаще", 3], ["Кот-дон", 3], ["Вор-домушник", 2], ["Торговец с рынка", 3], ["Контрабандный ящик", 2], ["Кот-алхимик", 3], ["Кот-чемодан", 2], ["Призрак рынка", 4], ["Золотой слиток", 4], ["Золотой арбуз-лидер", 9]];
const LB_HOLD = 72 * 3600, BC_LEADER = 10;
let ADMIN = 1796286471; // по умолчанию; в Cloudflare задай переменную ADMIN_ID, она важнее
const BAN_DAYS = 7;
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
    db.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, state TEXT, rev INTEGER DEFAULT 0, cur REAL DEFAULT 0, total REAL DEFAULT 0, imp INTEGER DEFAULT 0, upd INTEGER DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS offers (id INTEGER PRIMARY KEY AUTOINCREMENT, seller INTEGER, sname TEXT, give INTEGER, want INTEGER, ts INTEGER, status TEXT DEFAULT 'open', buyer INTEGER)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_total ON users(total)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_offers ON offers(status)"),
    db.prepare("CREATE TABLE IF NOT EXISTS grants (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, kind TEXT, a REAL, b INTEGER, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS lbhold (rank INTEGER PRIMARY KEY, uid INTEGER, since INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS lbrew (uid INTEGER PRIMARY KEY, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS promos (code TEXT PRIMARY KEY, kind TEXT, a REAL, b INTEGER, mx INTEGER, used INTEGER DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS promo_uses (code TEXT, uid INTEGER, PRIMARY KEY(code, uid))"),
    db.prepare("CREATE TABLE IF NOT EXISTS bcast (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS ucats (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, uname TEXT, name TEXT, rar INTEGER, img TEXT, status TEXT DEFAULT 'new', idx INTEGER, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, amount REAL, due INTEGER, status TEXT DEFAULT 'open', ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS bm_buys (uid INTEGER, day INTEGER, slot INTEGER, PRIMARY KEY (uid, day, slot))"),
    db.prepare("CREATE TABLE IF NOT EXISTS pk2m (tid INTEGER, seat INTEGER, code INTEGER, ts INTEGER, n INTEGER DEFAULT 0, PRIMARY KEY (tid, seat))"),
    db.prepare("CREATE TABLE IF NOT EXISTS pk2 (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, status TEXT DEFAULT 'wait', h1 TEXT, h2 TEXT, rest TEXT, d1 INTEGER DEFAULT 0, d2 INTEGER DEFAULT 0, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER, dealt INTEGER DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS dcm (tid INTEGER, seat INTEGER, code INTEGER, ts INTEGER, n INTEGER DEFAULT 0, PRIMARY KEY (tid, seat))"),
    db.prepare("CREATE TABLE IF NOT EXISTS dc (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, status TEXT DEFAULT 'wait', h1 TEXT, h2 TEXT, turn INTEGER DEFAULT 1, bid TEXT, bseat INTEGER DEFAULT 0, hist TEXT DEFAULT '[]', v INTEGER DEFAULT 0, last INTEGER DEFAULT 0, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, uname TEXT, text TEXT, status TEXT DEFAULT 'new', ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS bans (id INTEGER PRIMARY KEY, name TEXT, un TEXT, at INTEGER, st TEXT DEFAULT 'ban', endt INTEGER DEFAULT 0, why TEXT DEFAULT '')"),
    db.prepare("CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, name TEXT, text TEXT, ts INTEGER)"),
  ]);
  for (const c of ["cur REAL DEFAULT 0", "badges TEXT DEFAULT ''", "banned INTEGER DEFAULT 0", "seen INTEGER DEFAULT 0", "un TEXT DEFAULT ''", "banat INTEGER DEFAULT 0"]) { try { await db.prepare("ALTER TABLE users ADD COLUMN " + c).run(); } catch (e) {} }
  try { const f = await db.prepare("SELECT v FROM kv WHERE k='curfill'").first(); if (!f) { await db.prepare("UPDATE users SET cur=MAX(0,COALESCE(json_extract(state,'$.pts'),0)) WHERE state IS NOT NULL").run(); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('curfill','1')").run(); } } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS websess (tok TEXT PRIMARY KEY, uid INTEGER DEFAULT 0, name TEXT DEFAULT '', un TEXT DEFAULT '', sess TEXT DEFAULT '', claimed INTEGER DEFAULT 0, ts INTEGER)").run(); } catch (e) {}
  try { await db.prepare("ALTER TABLE ucats ADD COLUMN bc INTEGER DEFAULT 0").run(); } catch (e) {}
  for (const c of ["ask INTEGER DEFAULT 0", "reward INTEGER DEFAULT 0"]) { try { await db.prepare("ALTER TABLE ucats ADD COLUMN " + c).run(); } catch (e) {} }
  try { await db.prepare("CREATE TABLE IF NOT EXISTS wslikes (k TEXT, cid INTEGER, uid INTEGER, PRIMARY KEY (k, cid, uid))").run(); } catch (e) {}
  try { await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS ucats_bc ON ucats(bc) WHERE bc > 0").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS friends (a INTEGER, b INTEGER, st INTEGER DEFAULT 0, ts INTEGER, PRIMARY KEY (a, b))").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clans (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, owner INTEGER, ts INTEGER)").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clan_m (uid INTEGER PRIMARY KEY, cid INTEGER, ts INTEGER)").run(); } catch (e) {}
  for (const q of ["ALTER TABLE clans ADD COLUMN descr TEXT DEFAULT ''", "ALTER TABLE clans ADD COLUMN icon TEXT DEFAULT '🛡'", "ALTER TABLE clans ADD COLUMN mode INTEGER DEFAULT 0", "ALTER TABLE clans ADD COLUMN bank REAL DEFAULT 0", "ALTER TABLE clan_m ADD COLUMN role INTEGER DEFAULT 0", "ALTER TABLE clan_m ADD COLUMN don REAL DEFAULT 0"]) { try { await db.prepare(q).run(); } catch (e) {} }
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clan_req (uid INTEGER PRIMARY KEY, cid INTEGER, ts INTEGER)").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clan_chat (id INTEGER PRIMARY KEY AUTOINCREMENT, cid INTEGER, uid INTEGER, name TEXT, text TEXT, ts INTEGER)").run(); } catch (e) {}
  ready = true;
}
const CL_LV = [1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15];
const clLevel = bank => CL_LV.filter(x => num(bank) >= x).length;
function tidy(s) { if (Array.isArray(s.holo)) s.holo = s.holo.filter(i => (i + "") in s.inv); if (s.eq !== undefined && +s.eq >= 0 && !((s.eq + "") in s.inv)) s.eq = -1; }
const num = x => (typeof x === "number" && isFinite(x)) ? x : 0;
// ---- серверная проверка состояния, присланного клиентом (клиент авторитетный, поэтому ограничиваем рост)
const ABS_MAX = 1e21, GEM_MAX = 1e7, IMPORT_MAX = 1e15, IMPORT_GEMS = 1e4;
const fin = (x, mx) => { x = Number(x); return Number.isFinite(x) ? Math.min(mx, Math.max(0, x)) : 0; };
function clean(s, prev, dt, al) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  if (JSON.stringify(s).length > 40000) return null;
  if (!Array.isArray(s.b) || !s.inv || typeof s.inv !== "object") return null;
  s.b = s.b.slice(0, 32).map(v => Math.floor(fin(v, 1e6)));
  for (const k of ["taps", "stars", "fevers", "prest", "opened", "xp", "gt"]) if (s[k] !== undefined) s[k] = Math.floor(fin(s[k], 1e15));
  for (const k of ["run", "total"]) s[k] = fin(s[k], ABS_MAX);
  s.gems = Math.floor(fin(s.gems, GEM_MAX));
  const pts = Number(s.pts); s.pts = Number.isFinite(pts) ? Math.min(ABS_MAX, Math.max(-1e15, pts)) : 0;
  let clamped = false;
  const cap = (k, v) => { if (s[k] > v) { s[k] = Math.max(0, v); clamped = true; } };
  if (!prev) { cap("pts", IMPORT_MAX); cap("run", IMPORT_MAX); cap("total", IMPORT_MAX); cap("gems", IMPORT_GEMS); cap("gt", IMPORT_GEMS); }
  else {
    dt = Math.max(1, Math.min(dt, 86400 * 3)); al = al || {};
    const pp = Math.max(0, num(prev.pts)), pt = Math.max(0, num(prev.total)), pr = Math.max(0, num(prev.run));
    // прибавка: фиксированная база + доля от накопленного (растёт со временем) + выдачи (выигрыши казино, займы, промо записываются сервером в allowance)
    const gain = 2e6 + pt * (0.02 + dt / 600) + num(al.pts);
    cap("total", pt + gain); cap("run", pr + gain); cap("pts", pp + gain);
    const pg = Math.max(0, num(prev.gems)), pgt = Math.max(0, num(prev.gt));
    const gemGain = 500 + 3 * Math.pow(Math.max(pr, s.run) / 1e6, 0.45) + num(al.gems);
    cap("gems", pg + gemGain); if (s.gt !== undefined) cap("gt", pgt + gemGain);
    if (s.run > s.total) s.total = s.run;
  }
  s._clamped = clamped;
  return s;
}
const allowGet = async (db, uid) => { try { const r = await db.prepare("SELECT v FROM kv WHERE k=?").bind("al" + uid).first(); return r ? JSON.parse(r.v) : {}; } catch (e) { return {}; } };
const allowAdd = async (db, uid, pts, gems) => { const a = await allowGet(db, uid); a.pts = num(a.pts) + num(pts); a.gems = num(a.gems) + num(gems); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("al" + uid, JSON.stringify(a)).run(); };
const allowClear = (db, uid) => db.prepare("DELETE FROM kv WHERE k=?").bind("al" + uid).run();
// после сохранения списываем из допуска то, что реально потрачено на рост; остаток живёт до часа
const allowUse = async (db, uid, grew, now) => {
  const a = await allowGet(db, uid); const used = Math.max(0, grew);
  const pts = Math.max(0, num(a.pts) - used);
  if ((pts < 1 && num(a.gems) < 1) || (a.t && now - a.t > 3600)) return allowClear(db, uid);
  a.pts = pts; a.gems = 0; if (!a.t) a.t = now;
  await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("al" + uid, JSON.stringify(a)).run();
};
const casinoPay = (db, uid, amount) => amount > 0 ? allowAdd(db, uid, amount, 0) : null;
async function banPurge(db, now) {
  const rows = (await db.prepare("SELECT id FROM users WHERE banned=2 AND banat>0 AND banat<? AND state IS NOT NULL LIMIT 20").bind(now - BAN_DAYS * 86400).all()).results;
  for (const r of rows) {
    await db.batch([
      db.prepare("UPDATE users SET state=NULL, cur=0, total=0, badges='', rev=rev+1 WHERE id=?").bind(r.id),
      db.prepare("DELETE FROM offers WHERE seller=?").bind(r.id),
      db.prepare("DELETE FROM chat WHERE uid=?").bind(r.id),
      db.prepare("DELETE FROM lbhold WHERE uid=?").bind(r.id),
      db.prepare("UPDATE bans SET st='purged', endt=? WHERE id=?").bind(now, r.id),
    ]);
  }
}
async function getUser(db, id) { return db.prepare("SELECT * FROM users WHERE id=?").bind(id).first(); }
async function mutate(db, id, fn, name) {
  for (let i = 0; i < 4; i++) {
    const u = await getUser(db, id); if (!u || !u.state) return {error: "Игрок не найден"};
    const s = JSON.parse(u.state); const r = fn(s); if (r) return {error: r};
    const res = await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, cur=?, upd=? WHERE id=? AND rev=?").bind(JSON.stringify(s), num(s.total), Math.max(0, num(s.pts)), Math.floor(Date.now() / 1000), id, u.rev).run();
    if (res.meta.changes === 1) return {state: s, rev: u.rev + 1};
  }
  return {error: "Занято, попробуй ещё раз"};
}
async function addPh(db, rows, key) {
  const ids = [...new Set(rows.map(r => r[key]).filter(x => Number.isInteger(x)))].slice(0, 100); if (!ids.length) return rows;
  try { const m = {}; (await db.prepare("SELECT k,v FROM kv WHERE k IN (" + ids.map(() => "?").join(",") + ")").bind(...ids.map(i => "ph" + i)).all()).results.forEach(r => m[r.k.slice(2)] = r.v); rows.forEach(r => { if (m[r[key]]) r.ph = m[r[key]]; }); } catch (e) {}
  return rows;
}
const bLet = s => String(s || "").split("~")[0], bSuf = s => { const x = String(s || "").split("~"); return x[1] ? "~" + x[1] : ""; };
const bAdd = (s, c) => (bLet(s) + c).slice(0, 6) + bSuf(s);
const NS_ST = {G1: 20, G2: 20, G3: 30, G4: 40, G5: 60, G7: 120, G8: 150, G9: 200, GA: 99000000}, NS_FT = {F1: 15, F2: 15, F3: 25, F4: 40, F5: 30, F6: 35};
const bd = (id, s) => { let r = String(s || ""); if (id === ADMIN && !r.includes("c")) r = "c" + r; return r; };
const inv = (s, k) => s.inv[k] || 0;
const add = (s, k, d) => { const v = inv(s, k) + d; if (v > 0) s.inv[k] = v; else delete s.inv[k]; };

async function ucSig(db) { const r = await db.prepare("SELECT COUNT(*) AS c, COALESCE(SUM(rar*(idx%97+1)+idx),0) AS s FROM ucats WHERE status='ok'").first(); return r.c * 1000003 + r.s; }
async function ensureBc(db, now) {
  if ((await db.prepare("SELECT COUNT(*) AS c FROM ucats WHERE bc>0").first()).c < BC_CATS.length) {
    for (let k = 0; k < BC_CATS.length; k++) { const c = BC_CATS[k]; await db.prepare("INSERT OR IGNORE INTO ucats (uid,uname,name,rar,img,status,idx,ts,bc) SELECT 0,'MDMelon',?,?,'','ok',1+(SELECT COALESCE(MAX(idx),?-1) FROM ucats WHERE idx IS NOT NULL),?,?").bind(c[0], c[1], N_ITEMS, now, k + 1).run(); }
  }
}
async function lbTrack(db, env, now) {
  const top = (await db.prepare("SELECT id FROM users WHERE cur>0 AND banned<2 ORDER BY cur DESC LIMIT 3").all()).results;
  const cur = (await db.prepare("SELECT rank,uid,since FROM lbhold").all()).results;
  for (let r = 1; r <= 3; r++) {
    const t = top[r - 1], c = cur.find(x => x.rank === r);
    if (!t) { if (c) await db.prepare("DELETE FROM lbhold WHERE rank=?").bind(r).run(); continue; }
    if (!c || c.uid !== t.id) await db.prepare("INSERT OR REPLACE INTO lbhold (rank,uid,since) VALUES (?,?,?)").bind(r, t.id, now).run();
  }
  const w = await db.prepare("SELECT uid,since FROM lbhold WHERE rank=1").first();
  if (w && now - w.since >= LB_HOLD) {
    const ins = await db.prepare("INSERT OR IGNORE INTO lbrew (uid,ts) VALUES (?,?)").bind(w.uid, now).run();
    if (ins.meta.changes === 1) {
      await ensureBc(db, now);
      const cat = await db.prepare("SELECT idx FROM ucats WHERE bc=? AND idx IS NOT NULL").bind(BC_LEADER).first();
      if (cat) await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(w.uid, "cat", cat.idx, 1, now).run();
      const u = await db.prepare("SELECT badges FROM users WHERE id=?").bind(w.uid).first(); const bs = String((u && u.badges) || "");
      if (!bs.includes("l")) await db.prepare("UPDATE users SET badges=? WHERE id=?").bind(bAdd(bs, "l"), w.uid).run();
      if (env.BOT_TOKEN) await tgcall(env, "sendMessage", {chat_id: w.uid, text: "🏆 Ты продержался 3 дня на 1 месте в таблице лидеров! Тебе выдан Золотой арбуз-лидер и значок. Открой игру, чтобы забрать кота."}).catch(() => {});
    }
  }
}
const RL = new Map(), RL_HEAVY = /^(ns_|bn_|evt_|cz_|dc_|p2_|(offer|accept|cancel)$|chat_send|promo_use|bm_buy|loan_|uc_submit|idea_submit|import|fr_|gift|clan_)/;
function rateHit(id, path, now) {
  if (id === ADMIN) return false;
  if (RL.size > 5000) RL.clear();
  const heavy = RL_HEAVY.test(path), k = id + (heavy ? "h" : "n"), lim = heavy ? 40 : 240, w = RL.get(k);
  if (!w || now - w.t >= 60) { RL.set(k, {t: now, n: 1}); return false; }
  return ++w.n > lim;
}
// ---- события: админские (kv evt) или по расписанию (золотой час 17:00-18:00 UTC, выходные ×1.25)
async function evtGet(db, now) {
  try { const r = await db.prepare("SELECT v FROM kv WHERE k='evt'").first(); if (r) { const e = JSON.parse(r.v); if (e && e.until > now && e.from <= now) return e; } } catch (e) {}
  const day = Math.floor(now / 86400), hr = Math.floor((now % 86400) / 3600), wd = (day + 4) % 7;
  if (hr === 17) return {id: "gh" + day, name: "Золотой час", mult: 2, until: day * 86400 + 18 * 3600, auto: 1};
  if (wd === 0 || wd === 6) return {id: "we" + day, name: "Бонус выходных", mult: 1.25, until: (day + 1) * 86400, auto: 1};
  return null;
}
async function api(path, req, env) {
  const db = env.DB; if (!db) return J({error: "Не подключена база DB"}, 500);
  await init(db);
  const rnd = () => hex(crypto.getRandomValues(new Uint8Array(16)));
  if (path === "web_new") {
    const t = rnd(), tn = Math.floor(Date.now() / 1000);
    await db.prepare("DELETE FROM websess WHERE sess='' AND ts<?").bind(tn - 3600).run();
    await db.prepare("INSERT INTO websess (tok,ts) VALUES (?,?)").bind(t, tn).run();
    return J({tok: t, link: "https://t.me/" + BOT_USER + "?start=login_" + t});
  }
  if (path === "web_check") {
    let q = {}; try { q = await req.json(); } catch (e) {}
    const w = await db.prepare("SELECT sess,claimed FROM websess WHERE tok=?").bind(String(q.tok || "")).first();
    if (!w) return J({error: "Ссылка устарела, попробуй ещё раз"});
    if (w.sess && !w.claimed) { await db.prepare("UPDATE websess SET claimed=1 WHERE tok=?").bind(String(q.tok)).run(); return J({ok: true, sess: w.sess}); }
    return J({pending: true});
  }
  let user = await verify(req.headers.get("x-init"), env.BOT_TOKEN);
  if (!user && req.headers.get("x-web")) { const w = await db.prepare("SELECT uid,name,un FROM websess WHERE sess=? AND sess!='' AND uid>0").bind(req.headers.get("x-web")).first(); if (w) user = {id: w.uid, first_name: w.name, username: w.un}; }
  if (!user) return J({error: "Открой игру из бота", login: 1}, 401);
  const id = user.id, name = uname(user); let b = {}; try { b = await req.json(); } catch (e) {}
  const now = Math.floor(Date.now() / 1000);
  if (rateHit(id, path, now)) return J({error: "Слишком часто, подожди секунду", rate: 1}, 429);
  let maintT = null; try { const mt = await db.prepare("SELECT v FROM kv WHERE k='maint'").first(); if (mt && mt.v) { const m = JSON.parse(mt.v); if (m && m.on) maintT = m.text || "Технический перерыв"; } } catch (e) {}
  if (id !== ADMIN) { try { const bu = await db.prepare("SELECT banned,banat FROM users WHERE id=?").bind(id).first(); if (bu && bu.banned === 2) return J({fullban: 1, banat: bu.banat || 0, purge: (bu.banat || 0) + BAN_DAYS * 86400, error: "Ты заблокирован"}); } catch (e) {} }
  if (maintT && id !== ADMIN && path !== "poll" && path !== "auth") return J({maint: maintT, error: "Технический перерыв"});

  if (path === "auth") {
    if (user && typeof user.photo_url === "string" && /^https:\/\//.test(user.photo_url) && user.photo_url.length < 300) { try { await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("ph" + id, user.photo_url).run(); } catch (e) {} }
    const u = await getUser(db, id);
    if (!u) return J({id, name, state: null, rev: 0, admin: id === ADMIN, badges: bd(id, ""), maint: id === ADMIN ? null : maintT});
    if (u.name !== name) await db.prepare("UPDATE users SET name=? WHERE id=?").bind(name, id).run();
    const un0 = String(user.username || "").slice(0, 40); if ((u.un || "") !== un0) await db.prepare("UPDATE users SET un=? WHERE id=?").bind(un0, id).run();
    return J({id, name, state: u.state ? JSON.parse(u.state) : null, rev: u.rev, admin: id === ADMIN, badges: bd(id, u.badges), banned: !!u.banned, maint: id === ADMIN ? null : maintT});
  }
  if (path === "save") {
    const u = await getUser(db, id);
    let prev = null; if (u && u.state) { try { prev = JSON.parse(u.state); } catch (e) {} }
    const s = clean(b.state, prev, u ? now - (u.upd || now) : 0, prev ? await allowGet(db, id) : null); if (!s) return J({error: "Некорректные данные"}, 400);
    const clamped = !!s._clamped; delete s._clamped;
    if (!u) {
      await db.prepare("INSERT OR IGNORE INTO users (id,name,state,rev,total,cur,upd) VALUES (?,?,?,?,?,?,?)").bind(id, name, JSON.stringify(s), 1, num(s.total), Math.max(0, num(s.pts)), now).run();
      await db.prepare("UPDATE users SET un=? WHERE id=?").bind(String(user.username || "").slice(0, 40), id).run();
      const n = await getUser(db, id); return J({rev: n.rev});
    }
    const res = await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, cur=?, name=?, upd=? WHERE id=? AND rev=?").bind(JSON.stringify(s), num(s.total), Math.max(0, num(s.pts)), name, now, id, Number(b.rev)).run();
    if (res.meta.changes === 1) { if (prev) await allowUse(db, id, num(s.pts) - num(prev.pts), now); return J(clamped ? {rev: Number(b.rev) + 1, clamp: true, state: s} : {rev: Number(b.rev) + 1}); }
    if (!u.state) return J({reset: true, rev: u.rev});
    return J({conflict: true, state: JSON.parse(u.state), rev: u.rev});
  }
  if (path === "top") {
    const rows = (await db.prepare("SELECT id,name,cur AS total,badges FROM users WHERE cur>0 AND banned<2 ORDER BY cur DESC LIMIT 50").all()).results.map(r => ({...r, badges: bd(r.id, r.badges)})); await addPh(db, rows, "id");
    const u = await getUser(db, id); let rank = 0;
    if (u) rank = (await db.prepare("SELECT COUNT(*)+1 AS r FROM users WHERE cur>? AND banned<2").bind(u.cur).first()).r;
    await lbTrack(db, env, now);
    const hold = (await db.prepare("SELECT rank,uid,since FROM lbhold ORDER BY rank").all()).results;
    const done = (await db.prepare("SELECT COUNT(*) AS c FROM lbrew").first()).c;
    return J({rows, rank, hold, done, now, need: LB_HOLD});
  }
  if (path === "offers") {
    const o = (await db.prepare("SELECT o.id,o.seller,o.sname,o.give,o.want,u.badges FROM offers o LEFT JOIN users u ON u.id=o.seller WHERE o.status='open' ORDER BY o.id DESC LIMIT 100").all()).results.map(r => ({...r, badges: bd(r.seller, r.badges)}));
    return J({offers: o});
  }
  if (path === "offer") {
    const nUc = (await db.prepare("SELECT COALESCE(MAX(idx),?-1)+1-? AS c FROM ucats WHERE idx IS NOT NULL").bind(N_ITEMS, N_ITEMS).first()).c;
    const give = Number(b.give), want = Number(b.want);
    if (!Number.isInteger(give) || !Number.isInteger(want) || give < 0 || want < 0 || give === 70 || give === 71 || want === 70 || want === 71 || give >= N_ITEMS + nUc || want >= N_ITEMS + nUc || give === want) return J({error: "Неверные коты"});
    const cnt = (await db.prepare("SELECT COUNT(*) AS c FROM offers WHERE seller=? AND status='open'").bind(id).first()).c;
    if (cnt >= 5) return J({error: "Не больше 5 предложений"});
    const ins = await db.prepare("INSERT INTO offers (seller,sname,give,want,ts) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM offers WHERE seller=? AND give=? AND want=? AND status='open' AND ts>?)").bind(id, name, give, want, now, id, give, want, now - 15).run();
    if (ins.meta.changes !== 1) return J({error: "Такое предложение уже создано"});
    const r = await mutate(db, id, s => { if (inv(s, give) < 1) return "У тебя нет этого кота"; add(s, give, -1); tidy(s); });
    if (r.error) { await db.prepare("DELETE FROM offers WHERE id=?").bind(ins.meta.last_row_id).run(); return J(r); }
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
    const s = clean(b.state, null); if (!s) return J({error: "Некорректный код"}); delete s._clamped;
    const u = await getUser(db, id);
    if (u && u.imp) return J({error: "Перенос уже выполнялся"});
    s.ts = now;
    if (!u) { await db.prepare("INSERT INTO users (id,name,state,rev,total,cur,imp,upd) VALUES (?,?,?,?,?,?,1,?)").bind(id, name, JSON.stringify(s), 1, num(s.total), Math.max(0, num(s.pts)), now).run(); await db.prepare("UPDATE users SET un=? WHERE id=?").bind(String(user.username || "").slice(0, 40), id).run(); }
    else await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, cur=?, imp=1, upd=? WHERE id=?").bind(JSON.stringify(s), num(s.total), Math.max(0, num(s.pts)), now, id).run();
    const n = await getUser(db, id); return J({state: s, rev: n.rev});
  }
  const adm = id === ADMIN;
  const adm0 = id === ADMIN;
  const tg0 = (uid, text) => env.BOT_TOKEN ? tgcall(env, "sendMessage", {chat_id: uid, text}).catch(() => {}) : null;
  // ---------- казино
  const crnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const JP_SEED = 250000, ZN = 26;
  const secColor = i => i === 0 ? "g" : i === 13 ? "j" : (i % 2 === 1 ? "r" : "b");
  const jpGet = async () => { await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES ('jp',?)").bind(String(JP_SEED)).run(); const r = await db.prepare("SELECT v FROM kv WHERE k='jp'").first(); const l = await db.prepare("SELECT v FROM kv WHERE k='jplast'").first(); let last = null; try { last = l ? JSON.parse(l.v) : null; } catch (e) {} return {pool: Number(r.v) || JP_SEED, last}; };
  const cardRank = c => c % 13, cardSuit = c => Math.floor(c / 13);
  const pkEval = h => {
    const r = h.map(cardRank).sort((a, b) => a - b), cnt = {}; r.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
    const cv = Object.values(cnt).sort((a, b) => b - a), flush = h.every(c => cardSuit(c) === cardSuit(h[0]));
    const uniq = Object.keys(cnt).length === 5, straight = uniq && (r[4] - r[0] === 4 || (r[0] === 0 && r[1] === 1 && r[2] === 2 && r[3] === 3 && r[4] === 12));
    const royal = straight && flush && r[0] === 8;
    if (royal) return {n: "Роял-флеш", m: 250}; if (straight && flush) return {n: "Стрит-флеш", m: 50};
    if (cv[0] === 4) return {n: "Каре", m: 25}; if (cv[0] === 3 && cv[1] === 2) return {n: "Фулл-хаус", m: 9};
    if (flush) return {n: "Флеш", m: 6}; if (straight) return {n: "Стрит", m: 4}; if (cv[0] === 3) return {n: "Тройка", m: 3};
    if (cv[0] === 2 && cv[1] === 2) return {n: "Две пары", m: 2};
    if (cv[0] === 2 && Object.keys(cnt).some(k => cnt[k] === 2 && +k >= 9)) return {n: "Пара валетов или выше", m: 1};
    return {n: "Ничего", m: 0};
  };
  if (path === "bm_info" || path === "bm_buy") {
    const day = Math.floor(now / 86400), left = (day + 1) * 86400 - now;
    if (path === "bm_buy") {
      const slot = Math.floor(Number(b.slot)); if (!(slot >= 0 && slot < 4)) return J({error: "Нет такого товара"});
      const r = await db.prepare("INSERT OR IGNORE INTO bm_buys (uid,day,slot) VALUES (?,?,?)").bind(id, day, slot).run();
      if (r.meta.changes !== 1) return J({error: "Ты уже купил этот товар сегодня"});
      return J({ok: true, day});
    }
    const bought = (await db.prepare("SELECT slot FROM bm_buys WHERE uid=? AND day=?").bind(id, day).all()).results.map(x => x.slot);
    return J({day, left, bought});
  }
  if (path.startsWith("loan_")) {
    const LOAN_H = 3600, LOAN_MUL = 2;
    await db.prepare("UPDATE loans SET status='overdue' WHERE uid=? AND status='open' AND due<?").bind(id, now).run();
    const cur = await db.prepare("SELECT * FROM loans WHERE uid=? AND status IN ('open','overdue') ORDER BY id DESC LIMIT 1").bind(id).first();
    const urow = await db.prepare("SELECT total, state AS state0 FROM users WHERE id=?").bind(id).first();
    let runv = 0; try { runv = num(JSON.parse((urow && urow.state0) || "{}").run); } catch (e) {}
    const lim = Math.min(1e12, Math.max(10000, Math.floor(runv * 0.3)));
    const bk = await db.prepare("SELECT ts FROM loans WHERE uid=? AND status='bankrupt' ORDER BY id DESC LIMIT 1").bind(id).first();
    const ban = bk ? Math.max(0, bk.ts + 3 * 86400 - now) : 0;
    const view = l => l ? {id: l.id, amount: l.amount, due: l.due, left: Math.max(0, l.due - now), status: l.status, fine: Math.ceil(l.amount * LOAN_MUL)} : null;
    if (path === "loan_info") return J({loan: view(cur), max: lim, now, ban});
    if (path === "loan_take") {
      if (cur) return J({error: "Сначала закрой прошлый долг"});
      if (ban > 0) return J({error: "Банк закрыт для тебя ещё " + Math.ceil(ban / 3600) + " ч"});
      try { if (num(JSON.parse(urow.state0 || "{}").pts) < 0) return J({error: "Ты в минусе: сначала отработай долг"}); } catch (e) {}
      const a = Math.floor(Number(b.amount)); if (!isFinite(a) || a < 1000) return J({error: "Минимум 1 000"}); if (a > lim) return J({error: "Лимит долга: " + lim});
      const r = await db.prepare("INSERT INTO loans (uid,amount,due,status,ts) VALUES (?,?,?,'open',?)").bind(id, a, now + LOAN_H, now).run();
      await allowAdd(db, id, a, 0);
      return J({ok: true, loan: view({id: r.meta.last_row_id, amount: a, due: now + LOAN_H, status: "open"})});
    }
    if (path === "loan_repay") {
      if (!cur || cur.status !== "open") return J({error: "Нет долга для возврата"});
      const r = await db.prepare("UPDATE loans SET status='repaid' WHERE id=? AND status='open' AND due>=?").bind(cur.id, now).run();
      if (r.meta.changes !== 1) return J({error: "Срок вышел"});
      return J({ok: true, amount: cur.amount});
    }
    if (path === "loan_bankrupt") {
      if (cur) return J({error: "Сначала закрой долг в банке"});
      if (ban > 0) return J({error: "Ты уже объявлял банкротство"});
      await db.prepare("INSERT INTO loans (uid,amount,due,status,ts) VALUES (?,0,?,'bankrupt',?)").bind(id, now, now).run();
      return J({ok: true, ban: 3 * 86400});
    }
    if (path === "loan_settle") {
      if (!cur || cur.status !== "overdue") return J({error: "Нечего взыскивать"});
      const r = await db.prepare("UPDATE loans SET status='settled' WHERE id=? AND status='overdue'").bind(cur.id).run();
      if (r.meta.changes !== 1) return J({error: "Уже взыскано"});
      return J({ok: true, amount: cur.amount, fine: Math.ceil(cur.amount * LOAN_MUL)});
    }
    return J({error: "?"});
  }
  if (path === "cz_info") { const j = await jpGet(); return J({jp: j.pool, last: j.last}); }
  if (path === "cz_roulette") {
    const bet = Math.floor(Number(b.bet)), pick = String(b.pick);
    if (!(bet >= 100) || !isFinite(bet) || !["r", "b", "g"].includes(pick)) return J({error: "Неверная ставка"});
    const contrib = bet * 0.05;
    await jpGet(); await db.prepare("UPDATE kv SET v=CAST(CAST(v AS REAL)+? AS TEXT) WHERE k='jp'").bind(contrib).run();
    const sector = crnd(ZN), col = secColor(sector); let payout = 0, jackpot = false;
    if (col === "j") { const j = await jpGet(); payout = bet + j.pool; jackpot = true; await db.prepare("UPDATE kv SET v=? WHERE k='jp'").bind(String(JP_SEED)).run(); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('jplast',?)").bind(JSON.stringify({n: name, a: j.pool, t: now})).run(); }
    else if (col === pick) payout = bet * (pick === "g" ? 24 : 2);
    const j2 = await jpGet();
    await casinoPay(db, id, payout);
    return J({sector, payout, jackpot, jp: j2.pool, last: j2.last});
  }
  const pkKey = "pk" + id;
  const pkGet = async () => { const r = await db.prepare("SELECT v FROM kv WHERE k=?").bind(pkKey).first(); return r ? JSON.parse(r.v) : null; };
  if (path === "cz_pk_state") { const h = await pkGet(); return J({hand: h ? h.hand : null, bet: h ? h.bet : 0}); }
  if (path === "cz_pk_deal") {
    const old = await pkGet(); if (old) return J({hand: old.hand, bet: old.bet, resume: true});
    const bet = Math.floor(Number(b.bet)); if (!(bet >= 100) || !isFinite(bet)) return J({error: "Неверная ставка"});
    const deck = Array.from({length: 52}, (_, i) => i); for (let i = 51; i > 0; i--) { const j = crnd(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const hand = deck.slice(0, 5), rest = deck.slice(5, 15);
    await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(pkKey, JSON.stringify({hand, rest, bet})).run();
    return J({hand, bet, ev: pkEval(hand).n});
  }
  if (path === "cz_pk_draw") {
    const h = await pkGet(); if (!h) return J({error: "Нет активной раздачи"});
    const del = await db.prepare("DELETE FROM kv WHERE k=?").bind(pkKey).run(); if (del.meta.changes !== 1) return J({error: "Уже сыграно"});
    const hold = Array.isArray(b.hold) ? b.hold.map(Boolean) : [], hand = h.hand.slice(); let k = 0;
    for (let i = 0; i < 5; i++) if (!hold[i]) hand[i] = h.rest[k++];
    const ev = pkEval(hand);
    await casinoPay(db, id, h.bet * ev.m);
    return J({hand, name: ev.n, mult: ev.m, payout: h.bet * ev.m, bet: h.bet});
  }
  // ---------- покер на двоих
  const pkScore = h => {
    const r = h.map(cardRank), cnt = {}; r.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
    const g = Object.keys(cnt).map(k => [cnt[k], +k]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const flush = h.every(c => cardSuit(c) === cardSuit(h[0])), rs = r.slice().sort((a, b) => a - b);
    const straight = g.length === 5 && (rs[4] - rs[0] === 4 || (rs[0] === 0 && rs[1] === 1 && rs[2] === 2 && rs[3] === 3 && rs[4] === 12));
    let cat, ranks = g.flatMap(x => Array(x[0]).fill(x[1])), nm;
    const top = straight ? (rs[4] === 12 && rs[0] === 0 ? 3 : rs[4]) : 0;
    if (straight && flush) { cat = 8; ranks = [top, 0, 0, 0, 0]; nm = top === 12 ? "Роял-флеш" : "Стрит-флеш"; }
    else if (g[0][0] === 4) { cat = 7; nm = "Каре"; } else if (g[0][0] === 3 && g[1][0] === 2) { cat = 6; nm = "Фулл-хаус"; }
    else if (flush) { cat = 5; nm = "Флеш"; } else if (straight) { cat = 4; ranks = [top, 0, 0, 0, 0]; nm = "Стрит"; }
    else if (g[0][0] === 3) { cat = 3; nm = "Тройка"; } else if (g[0][0] === 2 && g[1][0] === 2) { cat = 2; nm = "Две пары"; }
    else if (g[0][0] === 2) { cat = 1; nm = "Пара"; } else { cat = 0; nm = "Старшая карта"; }
    return {s: cat * 371293 + ranks.reduce((a, x, i) => a + x * Math.pow(13, 4 - i), 0), n: nm};
  };
  const autoHold = h => {
    const ev = pkEval(h).n, all = h.map(() => true), cnt = {}; h.forEach(c => cnt[cardRank(c)] = (cnt[cardRank(c)] || 0) + 1);
    if (["Роял-флеш", "Стрит-флеш", "Фулл-хаус", "Флеш", "Стрит"].includes(ev)) return all;
    if (Object.values(cnt).some(v => v >= 2)) return h.map(c => cnt[cardRank(c)] >= 2);
    const bs = {}; h.forEach(c => bs[cardSuit(c)] = (bs[cardSuit(c)] || 0) + 1); const fs = Object.keys(bs).find(s => bs[s] >= 4);
    if (fs !== undefined) return h.map(c => cardSuit(c) === +fs);
    return h.map(c => cardRank(c) >= 9);
  };
  const p2Draw = (tb, seat, hold) => {
    const k = seat === 1 ? "h1" : "h2", hand = JSON.parse(tb[k]), rest = JSON.parse(tb.rest), used = tb.d1 + tb.d2 === 0 ? 0 : (tb.d1 ? 5 : 0) + (tb.d2 ? 5 : 0); // пул замен: по 5 карт на игрока
    const off = seat === 1 ? 0 : 5; let n = 0; for (let i = 0; i < 5; i++) if (!hold[i]) hand[i] = rest[off + n++];
    return hand;
  };
  const p2Resolve = async tb => {
    const a = pkScore(JSON.parse(tb.h1)), c = pkScore(JSON.parse(tb.h2)), pot = tb.stake * 2, winner = a.s > c.s ? 1 : c.s > a.s ? 2 : 0;
    let pay1 = 0, pay2 = 0, fee = 0;
    if (winner === 0) { pay1 = pay2 = tb.stake; } else { fee = pot * 0.05; const w = pot - fee; if (winner === 1) pay1 = w; else pay2 = w; }
    const res = {winner, e1: a.n, e2: c.n, pay1, pay2};
    const r = await db.prepare("UPDATE pk2 SET status='done', res=? WHERE id=? AND status='play'").bind(JSON.stringify(res), tb.id).run();
    if (r.meta.changes === 1 && fee > 0) { await jpGet(); await db.prepare("UPDATE kv SET v=CAST(CAST(v AS REAL)+? AS TEXT) WHERE k='jp'").bind(fee).run(); }
  };
  const p2Tick = async tb => {
    if (tb.status !== "play") return tb;
    let changed = false;
    if (now - tb.dealt > 60) {
      for (const seat of [1, 2]) { if (!tb["d" + seat]) { const hand = JSON.parse(tb["h" + seat]), nh = p2Draw(tb, seat, autoHold(hand)); await db.prepare("UPDATE pk2 SET h" + seat + "=?, d" + seat + "=1 WHERE id=? AND d" + seat + "=0").bind(JSON.stringify(nh), tb.id).run(); changed = true; tb = await db.prepare("SELECT * FROM pk2 WHERE id=?").bind(tb.id).first(); } }
    }
    if (tb.d1 && tb.d2) { await p2Resolve(tb); changed = true; }
    return changed ? await db.prepare("SELECT * FROM pk2 WHERE id=?").bind(tb.id).first() : tb;
  };
  const p2View = (tb, me) => {
    const seat = tb.p1 === me ? 1 : 2, done = tb.status === "done", res = done ? JSON.parse(tb.res) : null;
    const my = tb.h1 === null ? null : JSON.parse(seat === 1 ? tb.h1 : tb.h2);
    const out = {id: tb.id, status: tb.status, stake: tb.stake, seat, n1: tb.n1, n2: tb.n2, myDone: !!tb["d" + seat], oppDone: !!tb["d" + (3 - seat)], left: tb.status === "play" ? Math.max(0, 60 - (now - tb.dealt)) : 0, hand: my};
    if (done) { out.oppHand = JSON.parse(seat === 1 ? tb.h2 : tb.h1); out.winner = res.winner === 0 ? 0 : (res.winner === seat ? 1 : 2); out.myEv = seat === 1 ? res.e1 : res.e2; out.oppEv = seat === 1 ? res.e2 : res.e1; out.pay = seat === 1 ? res.pay1 : res.pay2; out.claimed = !!tb["c" + seat]; }
    if (tb.status === "cancel") { out.pay = seat === 1 ? tb.stake : 0; out.claimed = !!tb["c" + seat]; }
    return out;
  };
  const P2_PH = 10;
  if (path === "p2_say") {
    const tb = await db.prepare("SELECT * FROM pk2 WHERE id=? AND (p1=? OR p2=?) AND status IN ('wait','play','done')").bind(Number(b.id), id, id).first(); if (!tb) return J({error: "Столик не найден"});
    const code = Math.floor(Number(b.code)); if (!(code >= 0 && code < P2_PH)) return J({error: "Нет такой фразы"});
    const seat = tb.p1 === id ? 1 : 2, old = await db.prepare("SELECT ts FROM pk2m WHERE tid=? AND seat=?").bind(tb.id, seat).first();
    if (old && now - old.ts < 2) return J({error: "Не так быстро"});
    await db.prepare("INSERT INTO pk2m (tid,seat,code,ts,n) VALUES (?,?,?,?,1) ON CONFLICT(tid,seat) DO UPDATE SET code=excluded.code, ts=excluded.ts, n=n+1").bind(tb.id, seat, code, now).run();
    return J({ok: true});
  }
  const p2Active = async () => await db.prepare("SELECT * FROM pk2 WHERE (p1=? OR p2=?) AND status IN ('wait','play') ORDER BY id DESC LIMIT 1").bind(id, id).first();
  if (path === "p2_list") {
    await db.prepare("UPDATE pk2 SET status='cancel' WHERE status='wait' AND ts<?").bind(now - 1800).run();
    const rows = (await db.prepare("SELECT id,n1,stake FROM pk2 WHERE status='wait' AND p1!=? ORDER BY id DESC LIMIT 20").bind(id).all()).results;
    const act = await p2Active();
    const claims = (await db.prepare("SELECT id FROM pk2 WHERE ((p1=? AND c1=0) OR (p2=? AND c2=0)) AND status IN ('done','cancel') ORDER BY id DESC LIMIT 5").bind(id, id).all()).results.map(x => x.id);
    return J({rows, mine: act ? act.id : 0, claims});
  }
  if (path === "p2_create") {
    const stake = Math.floor(Number(b.stake)); if (!(stake >= 100) || !isFinite(stake)) return J({error: "Неверная ставка"});
    if (await p2Active()) return J({error: "У тебя уже есть активный столик"});
    const r = await db.prepare("INSERT INTO pk2 (p1,n1,stake,ts) VALUES (?,?,?,?)").bind(id, name, stake, now).run();
    return J({ok: true, id: r.meta.last_row_id});
  }
  if (path === "p2_join") {
    const tb = await db.prepare("SELECT * FROM pk2 WHERE id=? AND status='wait'").bind(Number(b.id)).first();
    if (!tb) return J({error: "Столик уже занят или закрыт"}); if (tb.p1 === id) return J({error: "Это твой столик"});
    if (await p2Active()) return J({error: "У тебя уже есть активный столик"});
    const deck = Array.from({length: 52}, (_, i) => i); for (let i = 51; i > 0; i--) { const j = crnd(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const r = await db.prepare("UPDATE pk2 SET p2=?, n2=?, status='play', h1=?, h2=?, rest=?, dealt=? WHERE id=? AND status='wait' AND p1!=?").bind(id, name, JSON.stringify(deck.slice(0, 5)), JSON.stringify(deck.slice(5, 10)), JSON.stringify(deck.slice(10, 20)), now, tb.id, id).run();
    if (r.meta.changes !== 1) return J({error: "Столик уже занят"});
    tg0(tb.p1, "🃏 К твоему столику в покере сел " + name + "! Заходи в игру.");
    return J({ok: true, id: tb.id, stake: tb.stake});
  }
  if (path === "p2_state") {
    let tb = await db.prepare("SELECT * FROM pk2 WHERE id=? AND (p1=? OR p2=?)").bind(Number(b.id), id, id).first(); if (!tb) return J({error: "Столик не найден"});
    tb = await p2Tick(tb); const v = p2View(tb, id);
    const ms = (await db.prepare("SELECT seat,code,ts,n FROM pk2m WHERE tid=?").bind(tb.id).all()).results;
    for (const m of ms) { const k = m.seat === v.seat ? "myMsg" : "oppMsg"; v[k] = {code: m.code, n: m.n, ago: now - m.ts}; }
    return J(v);
  }
  if (path === "p2_draw") {
    let tb = await db.prepare("SELECT * FROM pk2 WHERE id=? AND (p1=? OR p2=?)").bind(Number(b.id), id, id).first(); if (!tb || tb.status !== "play") return J({error: "Раздача не идёт"});
    const seat = tb.p1 === id ? 1 : 2; if (tb["d" + seat]) return J(p2View(tb, id));
    const hold = Array.isArray(b.hold) ? b.hold.map(Boolean) : [], nh = p2Draw(tb, seat, hold);
    await db.prepare("UPDATE pk2 SET h" + seat + "=?, d" + seat + "=1 WHERE id=? AND d" + seat + "=0").bind(JSON.stringify(nh), tb.id).run();
    tb = await db.prepare("SELECT * FROM pk2 WHERE id=?").bind(tb.id).first(); tb = await p2Tick(tb); return J(p2View(tb, id));
  }
  if (path === "p2_cancel") {
    const r = await db.prepare("UPDATE pk2 SET status='cancel' WHERE id=? AND p1=? AND status='wait'").bind(Number(b.id), id).run();
    return J(r.meta.changes === 1 ? {ok: true} : {error: "Столик уже занят"});
  }
  if (path === "p2_claim") {
    const tb = await db.prepare("SELECT * FROM pk2 WHERE id=? AND (p1=? OR p2=?) AND status IN ('done','cancel')").bind(Number(b.id), id, id).first(); if (!tb) return J({error: "Нечего забирать"});
    const seat = tb.p1 === id ? 1 : 2; if (tb.status === "cancel" && seat !== 1) return J({amount: 0});
    const r = await db.prepare("UPDATE pk2 SET c" + seat + "=1 WHERE id=? AND c" + seat + "=0").bind(tb.id).run(); if (r.meta.changes !== 1) return J({amount: 0});
    let amount = tb.stake; if (tb.status === "done") { const res = JSON.parse(tb.res); amount = seat === 1 ? res.pay1 : res.pay2; }
    await casinoPay(db, id, amount);
    return J({amount});
  }
  // ---- Кости-блеф (дуэль) ----
  const DC_T = 45, DC_PH = 10;
  const dcFinish = async (tb, winner, reason, extra) => {
    const pot = tb.stake * 2, fee = pot * 0.05, w = pot - fee, res = Object.assign({winner, reason, pay1: winner === 1 ? w : 0, pay2: winner === 2 ? w : 0}, extra || {});
    const r = await db.prepare("UPDATE dc SET status='done', res=? WHERE id=? AND status='play'").bind(JSON.stringify(res), tb.id).run();
    if (r.meta.changes === 1) { await jpGet(); await db.prepare("UPDATE kv SET v=CAST(CAST(v AS REAL)+? AS TEXT) WHERE k='jp'").bind(fee).run(); }
  };
  const dcTick = async tb => {
    if (tb.status !== "play") return tb;
    if (now - tb.last > DC_T) { await dcFinish(tb, 3 - tb.turn, "time"); return await db.prepare("SELECT * FROM dc WHERE id=?").bind(tb.id).first(); }
    return tb;
  };
  const dcView = (tb, me) => {
    const seat = tb.p1 === me ? 1 : 2, done = tb.status === "done", res = done ? JSON.parse(tb.res) : null;
    const out = {solo: tb.p2 === -1, id: tb.id, status: tb.status, stake: tb.stake, seat, n1: tb.n1, n2: tb.n2, turn: tb.turn, bid: tb.bid ? JSON.parse(tb.bid) : null, bseat: tb.bseat, hist: JSON.parse(tb.hist || "[]").slice(-8), left: tb.status === "play" ? Math.max(0, DC_T - (now - tb.last)) : 0, dice: tb.h1 ? JSON.parse(seat === 1 ? tb.h1 : tb.h2) : null};
    if (done) { out.oppDice = JSON.parse(seat === 1 ? tb.h2 : tb.h1); out.winner = res.winner === seat ? 1 : 2; out.reason = res.reason; out.cnt = res.cnt; out.rq = res.q; out.rf = res.f; out.pay = seat === 1 ? res.pay1 : res.pay2; out.claimed = !!tb["c" + seat]; }
    if (tb.status === "cancel") { out.pay = seat === 1 ? tb.stake : 0; out.claimed = !!tb["c" + seat]; }
    return out;
  };
  const dcBotMove = async tb => {
    const bin = (n, p, k) => { let s = 0; for (let i = k; i <= n; i++) { let c = 1; for (let j = 0; j < i; j++) c = c * (n - j) / (j + 1); s += c * Math.pow(p, i) * Math.pow(1 - p, n - i); } return s; };
    const own = JSON.parse(tb.h2), cur = tb.bid ? JSON.parse(tb.bid) : null, cnt = f => own.filter(x => x === f).length, prob = (q, f) => q - cnt(f) <= 0 ? 1 : bin(5, 1 / 6, q - cnt(f));
    if (cur && prob(cur[0], cur[1]) < 0.34 + (Math.random() < 0.12 ? 0.15 : 0)) {
      const all = JSON.parse(tb.h1).concat(own), c = all.filter(x => x === cur[1]).length;
      await dcFinish(tb, c >= cur[0] ? tb.bseat : 2, "call", {q: cur[0], f: cur[1], cnt: c}); return;
    }
    let best = null;
    for (let q = 1; q <= 10; q++) for (let f = 1; f <= 6; f++) {
      if (cur && !(q > cur[0] || (q === cur[0] && f > cur[1]))) continue;
      let sc = prob(q, f) + Math.random() * 0.16 - (cur ? (q - cur[0]) * 0.07 : q * 0.05);
      if (!best || sc > best.sc) best = {q, f, sc};
    }
    if (!best) { const all = JSON.parse(tb.h1).concat(own), c = all.filter(x => x === cur[1]).length; await dcFinish(tb, c >= cur[0] ? tb.bseat : 2, "call", {q: cur[0], f: cur[1], cnt: c}); return; }
    const hist = JSON.parse(tb.hist || "[]"); hist.push([2, best.q, best.f]);
    await db.prepare("UPDATE dc SET bid=?, bseat=2, turn=1, hist=?, v=v+1, last=? WHERE id=? AND status='play'").bind(JSON.stringify([best.q, best.f]), JSON.stringify(hist), now, tb.id).run();
  };
  const dcMine = async (tid) => await db.prepare("SELECT * FROM dc WHERE id=? AND (p1=? OR p2=?)").bind(tid, id, id).first();
  const dcActive = async () => await db.prepare("SELECT id FROM dc WHERE (p1=? OR p2=?) AND status IN ('wait','play') ORDER BY id DESC LIMIT 1").bind(id, id).first();
  if (path === "dc_list") {
    await db.prepare("UPDATE dc SET status='cancel' WHERE status='wait' AND ts<?").bind(now - 1800).run();
    const stale = (await db.prepare("SELECT * FROM dc WHERE status='play' AND last<?").bind(now - DC_T - 5).all()).results; for (const t of stale) await dcTick(t);
    const rows = (await db.prepare("SELECT id,n1,stake FROM dc WHERE status='wait' AND p1!=? ORDER BY id DESC LIMIT 20").bind(id).all()).results;
    const act = await dcActive();
    const claims = (await db.prepare("SELECT id FROM dc WHERE ((p1=? AND c1=0) OR (p2=? AND c2=0)) AND status IN ('done','cancel') ORDER BY id DESC LIMIT 5").bind(id, id).all()).results.map(x => x.id);
    return J({rows, mine: act ? act.id : 0, claims});
  }
  if (path === "dc_solo") {
    const stake = Math.floor(Number(b.stake)); if (!(stake >= 100) || !isFinite(stake)) return J({error: "Неверная ставка"});
    if (await dcActive()) return J({error: "У тебя уже есть активный столик"});
    const roll = () => JSON.stringify(Array.from({length: 5}, () => crnd(6) + 1));
    const r = await db.prepare("INSERT INTO dc (p1,n1,p2,n2,stake,ts,status,h1,h2,turn,last) VALUES (?,?,?,?,?,?,'play',?,?,?,?)").bind(id, name, -1, "Арбуз-бот 🍉", stake, now, roll(), roll(), crnd(2) + 1, now).run();
    let tb = await db.prepare("SELECT * FROM dc WHERE id=?").bind(r.meta.last_row_id).first(); if (tb.turn === 2) await dcBotMove(tb);
    return J({ok: true, id: r.meta.last_row_id, stake});
  }
  if (path === "dc_create") {
    const stake = Math.floor(Number(b.stake)); if (!(stake >= 100) || !isFinite(stake)) return J({error: "Неверная ставка"});
    if (await dcActive()) return J({error: "У тебя уже есть активный столик"});
    const r = await db.prepare("INSERT INTO dc (p1,n1,stake,ts) VALUES (?,?,?,?)").bind(id, name, stake, now).run();
    return J({ok: true, id: r.meta.last_row_id});
  }
  if (path === "dc_join") {
    const tb = await db.prepare("SELECT * FROM dc WHERE id=? AND status='wait'").bind(Number(b.id)).first();
    if (!tb) return J({error: "Столик уже занят или закрыт"}); if (tb.p1 === id) return J({error: "Это твой столик"});
    if (await dcActive()) return J({error: "У тебя уже есть активный столик"});
    const roll = () => JSON.stringify(Array.from({length: 5}, () => crnd(6) + 1));
    const r = await db.prepare("UPDATE dc SET p2=?, n2=?, status='play', h1=?, h2=?, turn=?, last=? WHERE id=? AND status='wait' AND p1!=?").bind(id, name, roll(), roll(), crnd(2) + 1, now, tb.id, id).run();
    if (r.meta.changes !== 1) return J({error: "Столик уже занят"});
    tg0(tb.p1, "🎲 К твоему столику в кости сел " + name + "! Заходи в игру.");
    return J({ok: true, id: tb.id, stake: tb.stake});
  }
  if (path === "dc_state") {
    let tb = await dcMine(Number(b.id)); if (!tb) return J({error: "Столик не найден"});
    tb = await dcTick(tb); const v = dcView(tb, id);
    const ms = (await db.prepare("SELECT seat,code,ts,n FROM dcm WHERE tid=?").bind(tb.id).all()).results;
    for (const m of ms) { const k = m.seat === v.seat ? "myMsg" : "oppMsg"; v[k] = {code: m.code, n: m.n, ago: now - m.ts}; }
    return J(v);
  }
  if (path === "dc_bid" || path === "dc_call") {
    let tb = await dcMine(Number(b.id)); if (!tb || tb.status !== "play") return J({error: "Игра не идёт"});
    tb = await dcTick(tb); if (tb.status !== "play") return J(dcView(tb, id));
    const seat = tb.p1 === id ? 1 : 2; if (tb.turn !== seat) return J({error: "Сейчас не твой ход"});
    const cur = tb.bid ? JSON.parse(tb.bid) : null;
    if (path === "dc_bid") {
      const q = Math.floor(Number(b.q)), f = Math.floor(Number(b.f));
      if (!(q >= 1 && q <= 10 && f >= 1 && f <= 6)) return J({error: "Неверная заявка"});
      if (cur && !(q > cur[0] || (q === cur[0] && f > cur[1]))) return J({error: "Заявка должна быть выше предыдущей"});
      const hist = JSON.parse(tb.hist || "[]"); hist.push([seat, q, f]);
      const r = await db.prepare("UPDATE dc SET bid=?, bseat=?, turn=?, hist=?, v=v+1, last=? WHERE id=? AND status='play' AND v=? AND turn=?").bind(JSON.stringify([q, f]), seat, 3 - seat, JSON.stringify(hist), now, tb.id, tb.v, seat).run();
      if (r.meta.changes !== 1) return J({error: "Не успел, попробуй ещё раз"});
      if (tb.p2 === -1) { const t2 = await db.prepare("SELECT * FROM dc WHERE id=?").bind(tb.id).first(); await dcBotMove(t2); }
    } else {
      if (!cur) return J({error: "Сначала нужна заявка"});
      const all = JSON.parse(tb.h1).concat(JSON.parse(tb.h2)), cnt = all.filter(x => x === cur[1]).length;
      await dcFinish(tb, cnt >= cur[0] ? tb.bseat : seat, "call", {q: cur[0], f: cur[1], cnt});
    }
    tb = await db.prepare("SELECT * FROM dc WHERE id=?").bind(tb.id).first(); return J(dcView(tb, id));
  }
  if (path === "dc_say") {
    const tb = await db.prepare("SELECT * FROM dc WHERE id=? AND (p1=? OR p2=?) AND status IN ('wait','play','done')").bind(Number(b.id), id, id).first(); if (!tb) return J({error: "Столик не найден"});
    const code = Math.floor(Number(b.code)); if (!(code >= 0 && code < DC_PH)) return J({error: "Нет такой фразы"});
    const seat = tb.p1 === id ? 1 : 2, old = await db.prepare("SELECT ts FROM dcm WHERE tid=? AND seat=?").bind(tb.id, seat).first();
    if (old && now - old.ts < 2) return J({error: "Не так быстро"});
    await db.prepare("INSERT INTO dcm (tid,seat,code,ts,n) VALUES (?,?,?,?,1) ON CONFLICT(tid,seat) DO UPDATE SET code=excluded.code, ts=excluded.ts, n=n+1").bind(tb.id, seat, code, now).run();
    return J({ok: true});
  }
  if (path === "dc_cancel") {
    const r = await db.prepare("UPDATE dc SET status='cancel' WHERE id=? AND p1=? AND status='wait'").bind(Number(b.id), id).run();
    return J(r.meta.changes === 1 ? {ok: true} : {error: "Столик уже занят"});
  }
  if (path === "dc_claim") {
    const tb = await db.prepare("SELECT * FROM dc WHERE id=? AND (p1=? OR p2=?) AND status IN ('done','cancel')").bind(Number(b.id), id, id).first(); if (!tb) return J({error: "Нечего забирать"});
    const seat = tb.p1 === id ? 1 : 2; if (tb.status === "cancel" && seat !== 1) return J({amount: 0});
    const r = await db.prepare("UPDATE dc SET c" + seat + "=1 WHERE id=? AND c" + seat + "=0").bind(tb.id).run(); if (r.meta.changes !== 1) return J({amount: 0});
    let amount = tb.stake; if (tb.status === "done") { const res = JSON.parse(tb.res); amount = seat === 1 ? res.pay1 : res.pay2; }
    await casinoPay(db, id, amount);
    return J({amount});
  }
  if (path === "ucats") {
    await ensureBc(db, now);
    const rows = (await db.prepare("SELECT id,idx,name,rar,uid,uname,bc FROM ucats WHERE status='ok' ORDER BY idx").all()).results;
    const del = (await db.prepare("SELECT idx FROM ucats WHERE status='del' AND idx IS NOT NULL").all()).results.map(x => x.idx);
    return J({rows, del, sig: await ucSig(db)});
  }
  if (path === "uc_submit") {
    const nm = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 24), rar = Math.floor(Number(b.rar)), img = String(b.img || "");
    if (nm.length < 2) return J({error: "Название от 2 символов"});
    if (!(rar >= 0 && rar <= 6)) return J({error: "Неверная редкость"});
    const ask = Math.max(0, Math.min(500, Math.floor(Number(b.ask) || 0)));
    if (!img.startsWith("data:image/jpeg;base64,") || img.length > 220000) return J({error: "Нужна картинка (JPEG до ~150 КБ)"});
    const cnt = (await db.prepare("SELECT COUNT(*) AS c FROM ucats WHERE uid=? AND status='new'").bind(id).first()).c;
    if (cnt >= 3) return J({error: "Не больше 3 заявок на проверке"});
    await db.prepare("INSERT INTO ucats (uid,uname,name,rar,img,ts,ask) VALUES (?,?,?,?,?,?,?)").bind(id, name, nm, rar, img.slice(23), now, ask).run();
    if (!adm0) tg0(ADMIN, "🐱 Новая заявка в мастерскую от " + name + ": " + nm);
    return J({ok: true});
  }
  if (path === "uc_mine") {
    const rows = (await db.prepare("SELECT id,name,rar,status,ask,reward FROM ucats WHERE uid=? ORDER BY id DESC LIMIT 20").bind(id).all()).results;
    return J({rows});
  }
  if (path === "uc_pending" && adm0) {
    const rows = (await db.prepare("SELECT id,uid,uname,name,rar,ask FROM ucats WHERE status='new' ORDER BY id LIMIT 30").all()).results;
    return J({rows});
  }
  if (path === "uc_approve" && adm0) {
    const nm = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 24), rar = Math.floor(Number(b.rar)), c = await db.prepare("SELECT * FROM ucats WHERE id=? AND status='new'").bind(Number(b.id)).first();
    if (!c) return J({error: "Заявка не найдена"}); if (nm.length < 2 || !(rar >= 0 && rar <= 9)) return J({error: "Неверные данные"});
    const idx = (await db.prepare("SELECT COALESCE(MAX(idx),?-1)+1 AS i FROM ucats WHERE idx IS NOT NULL").bind(N_ITEMS).first()).i;
    const gm = Math.max(0, Math.min(10000, Math.floor(b.gems === undefined ? (c.ask || 0) : Number(b.gems) || 0)));
    const r = await db.prepare("UPDATE ucats SET status='ok', name=?, rar=?, idx=?, reward=? WHERE id=? AND status='new'").bind(nm, rar, idx, gm, c.id).run();
    if (r.meta.changes !== 1) return J({error: "Уже обработано"});
    await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(c.uid, "cat", idx, 1, now).run();
    if (gm > 0) await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(c.uid, "gems", gm, 0, now).run();
    tg0(c.uid, "✅ Твой кот «" + nm + "» одобрен и добавлен в игру! Он уже у тебя в коллекции." + (gm > 0 ? " Награда: " + gm + " кристаллов." : ""));
    return J({ok: true, idx});
  }
  if (path === "uc_setrar" && adm0) {
    const rar = Math.floor(Number(b.rar)); if (!(rar >= 0 && rar <= 9)) return J({error: "Неверная редкость"});
    const r = await db.prepare("UPDATE ucats SET rar=? WHERE id=? AND status='ok'").bind(rar, Number(b.id)).run();
    return r.meta.changes ? J({ok: true}) : J({error: "Кот не найден"});
  }
  if (path === "uc_del" && adm0) {
    const c = await db.prepare("SELECT idx FROM ucats WHERE id=? AND status='ok'").bind(Number(b.id)).first(); if (!c) return J({error: "Кот не найден"});
    await db.prepare("UPDATE ucats SET status='del', img='' WHERE id=?").bind(Number(b.id)).run();
    await db.prepare("UPDATE offers SET status='cancelled' WHERE status='open' AND (give=? OR want=?)").bind(c.idx, c.idx).run();
    return J({ok: true});
  }
  if (path === "uc_reject" && adm0) {
    const c = await db.prepare("SELECT * FROM ucats WHERE id=? AND status='new'").bind(Number(b.id)).first(); if (!c) return J({error: "Заявка не найдена"});
    await db.prepare("UPDATE ucats SET status='rej', img='' WHERE id=?").bind(c.id).run();
    tg0(c.uid, "❌ Кот «" + c.name + "» не прошёл модерацию мастерской.");
    return J({ok: true});
  }
  if (path === "idea_submit") {
    const tx = String(b.text || "").trim().slice(0, 300);
    if (tx.length < 5) return J({error: "Опиши идею подробнее (от 5 символов)"});
    const cnt = (await db.prepare("SELECT COUNT(*) AS c FROM ideas WHERE uid=? AND status='new'").bind(id).first()).c;
    if (cnt >= 5) return J({error: "Не больше 5 идей на рассмотрении"});
    await db.prepare("INSERT INTO ideas (uid,uname,text,ts) VALUES (?,?,?,?)").bind(id, name, tx, now).run();
    if (!adm0) tg0(ADMIN, "💡 Новая идея от " + name + ": " + tx);
    return J({ok: true});
  }
  if (path === "ws_likes") {
    const rows = (await db.prepare("SELECT k,cid,COUNT(*) AS n FROM wslikes GROUP BY k,cid").all()).results;
    const mine = (await db.prepare("SELECT k,cid FROM wslikes WHERE uid=?").bind(id).all()).results;
    return J({rows, mine});
  }
  if (path === "ws_like") {
    const k = b.k === "idea" ? "idea" : "cat", cid = Math.floor(Number(b.id));
    const t = k === "cat" ? await db.prepare("SELECT uid FROM ucats WHERE id=? AND status='ok' AND COALESCE(bc,0)=0").bind(cid).first() : await db.prepare("SELECT uid FROM ideas WHERE id=? AND status='ok'").bind(cid).first();
    if (!t) return J({error: "Не найдено"}); if (t.uid === id) return J({error: "Свои работы лайкать нельзя"});
    const ex = await db.prepare("SELECT 1 AS x FROM wslikes WHERE k=? AND cid=? AND uid=?").bind(k, cid, id).first();
    if (ex) await db.prepare("DELETE FROM wslikes WHERE k=? AND cid=? AND uid=?").bind(k, cid, id).run(); else await db.prepare("INSERT OR IGNORE INTO wslikes (k,cid,uid) VALUES (?,?,?)").bind(k, cid, id).run();
    const n = (await db.prepare("SELECT COUNT(*) AS c FROM wslikes WHERE k=? AND cid=?").bind(k, cid).first()).c;
    return J({ok: true, liked: !ex, n});
  }
  if (path === "idea_list") {
    const ok = (await db.prepare("SELECT id,uid,uname,text FROM ideas WHERE status='ok' ORDER BY id DESC LIMIT 60").all()).results;
    const mine = (await db.prepare("SELECT id,text,status FROM ideas WHERE uid=? AND status!='ok' ORDER BY id DESC LIMIT 10").bind(id).all()).results;
    const pend = adm0 ? (await db.prepare("SELECT id,uid,uname,text FROM ideas WHERE status='new' ORDER BY id LIMIT 30").all()).results : [];
    return J({ok, mine, pend});
  }
  if ((path === "idea_ok" || path === "idea_rej") && adm0) {
    const i = await db.prepare("SELECT * FROM ideas WHERE id=? AND status='new'").bind(Number(b.id)).first(); if (!i) return J({error: "Идея не найдена"});
    await db.prepare("UPDATE ideas SET status=? WHERE id=?").bind(path === "idea_ok" ? "ok" : "rej", i.id).run();
    if (path === "idea_ok") {
      const u = await getUser(db, i.uid); const cur = String((u && u.badges) || "");
      if (u && !cur.includes("g")) await db.prepare("UPDATE users SET badges=? WHERE id=?").bind(bAdd(cur, "g"), i.uid).run();
      tg0(i.uid, "💡 Твою идею добавили в игру! Тебе выдан значок «Гений».");
    }
    return J({ok: true});
  }
  if (path === "poll") {
    if (maintT && id !== ADMIN) return J({maint: maintT});
    await db.prepare("UPDATE users SET seen=? WHERE id=?").bind(now, id).run();
    try { const lt = await db.prepare("SELECT v FROM kv WHERE k='lbt'").first(); if (!lt || now - Number(lt.v) >= 60) { await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('lbt',?)").bind(String(now)).run(); await lbTrack(db, env, now); } } catch (e) {}
    try { const bt = await db.prepare("SELECT v FROM kv WHERE k='banpg'").first(); if (!bt || now - Number(bt.v) >= 600) { await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('banpg',?)").bind(String(now)).run(); await banPurge(db, now); } } catch (e) {}
    const g = (await db.prepare("SELECT id,kind,a,b FROM grants WHERE uid=? ORDER BY id LIMIT 50").bind(id).all()).results;
    for (const x of g) await db.prepare("DELETE FROM grants WHERE id=?").bind(x.id).run();
    const bc = await db.prepare("SELECT id,text FROM bcast WHERE id>? AND ts>? ORDER BY id DESC LIMIT 1").bind(Number(b.bc) || 0, now - 120).first();
    const maxbc = (await db.prepare("SELECT COALESCE(MAX(id),0) AS m FROM bcast").first()).m;
    const online = (await db.prepare("SELECT COUNT(*) AS c FROM users WHERE seen>?").bind(now - 40).first()).c;
    const u = await getUser(db, id);
    const uc = await ucSig(db);
    const evt = await evtGet(db, now);
    let clb = 0; try { const cb = await db.prepare("SELECT c.bank FROM clan_m m JOIN clans c ON c.id=m.cid WHERE m.uid=?").bind(id).first(); if (cb) clb = clLevel(cb.bank); } catch (e) {}
    return J({clb, evt, uc, grants: g, bc, maxbc, online, rev: u ? u.rev : 0, banned: !!(u && u.banned), badges: bd(id, u && u.badges), maintA: id === ADMIN ? maintT : undefined, maint: null});
  }
  if (path.startsWith("fr_")) {
    const t = Number(b.uid), isF = async (x, y) => !!(await db.prepare("SELECT 1 AS o FROM friends WHERE st=1 AND ((a=? AND b=?) OR (a=? AND b=?))").bind(x, y, y, x).first());
    if (path === "fr_find") {
      const q = String(b.q || "").trim().slice(0, 30).replace(/[%_]/g, ""); if (q.length < 2) return J({error: "Минимум 2 символа"});
      const rows = (await db.prepare("SELECT id,name,total FROM users WHERE name LIKE ? AND id!=? AND banned<2 ORDER BY total DESC LIMIT 10").bind("%" + q + "%", id).all()).results;
      return J({rows});
    }
    if (path === "fr_list") {
      const fr = (await db.prepare("SELECT u.id,u.name,u.cur,u.seen,u.badges FROM friends f JOIN users u ON u.id=CASE WHEN f.a=? THEN f.b ELSE f.a END WHERE f.st=1 AND (f.a=? OR f.b=?) LIMIT 100").bind(id, id, id).all()).results.map(r => ({id: r.id, name: r.name, cur: r.cur, online: (r.seen || 0) > now - 40, seen: r.seen || 0, badges: bd(r.id, r.badges)}));
      await addPh(db, fr, "id");
      const inc = (await db.prepare("SELECT u.id,u.name FROM friends f JOIN users u ON u.id=f.a WHERE f.st=0 AND f.b=? LIMIT 50").bind(id).all()).results;
      const out = (await db.prepare("SELECT b FROM friends WHERE st=0 AND a=? LIMIT 50").bind(id).all()).results.map(r => r.b);
      return J({friends: fr, inc, out});
    }
    if (!Number.isInteger(t) || t === id || t <= 0) return J({error: "Неверный игрок"});
    if (path === "fr_add") {
      if (!(await getUser(db, t))) return J({error: "Игрок не найден"});
      if (await isF(id, t)) return J({error: "Вы уже друзья"});
      if ((await db.prepare("SELECT COUNT(*) AS c FROM friends WHERE a=? OR b=?").bind(id, id).first()).c >= 100) return J({error: "Слишком много друзей"});
      const rev = await db.prepare("SELECT 1 AS o FROM friends WHERE a=? AND b=? AND st=0").bind(t, id).first();
      if (rev) { await db.prepare("UPDATE friends SET st=1 WHERE a=? AND b=?").bind(t, id).run(); return J({ok: true, friend: true}); }
      await db.prepare("INSERT OR IGNORE INTO friends (a,b,st,ts) VALUES (?,?,0,?)").bind(id, t, now).run();
      return J({ok: true});
    }
    if (path === "fr_ok") { const r = await db.prepare("UPDATE friends SET st=1 WHERE a=? AND b=? AND st=0").bind(t, id).run(); return J(r.meta.changes === 1 ? {ok: true} : {error: "Заявка не найдена"}); }
    if (path === "fr_del") { await db.prepare("DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)").bind(id, t, t, id).run(); return J({ok: true}); }
    if (path === "fr_gift") {
      const cat = Number(b.cat); if (!Number.isInteger(cat) || cat < 0 || cat === 70 || cat === 71) return J({error: "Неверный кот"});
      if (!(await isF(id, t))) return J({error: "Дарить можно только друзьям"});
      const day = Math.floor(now / 86400), gk = "gf" + id + "_" + day, c0 = await db.prepare("SELECT v FROM kv WHERE k=?").bind(gk).first();
      if (c0 && Number(c0.v) >= 5) return J({error: "Не больше 5 подарков в день"});
      const r = await mutate(db, id, s => { if (inv(s, cat) < 1) return "У тебя нет этого кота"; add(s, cat, -1); tidy(s); });
      if (r.error) return J(r);
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(gk, String((c0 ? Number(c0.v) : 0) + 1)).run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(t, "cat", cat, 1, now).run();
      return J(r);
    }
    if (path === "fr_coins") {
      const a = Math.floor(Number(b.amount)); if (!isFinite(a) || a < 100) return J({error: "Минимум 100"});
      if (!(await isF(id, t))) return J({error: "Дарить можно только друзьям"});
      const day = Math.floor(now / 86400), gk = "gf" + id + "_" + day, c0 = await db.prepare("SELECT v FROM kv WHERE k=?").bind(gk).first();
      if (c0 && Number(c0.v) >= 5) return J({error: "Не больше 5 подарков в день"});
      const r = await mutate(db, id, s => { if (num(s.pts) < a) return "Не хватает монет"; s.pts -= a; });
      if (r.error) return J(r);
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(gk, String((c0 ? Number(c0.v) : 0) + 1)).run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(t, "pts", a, 1, now).run();
      await allowAdd(db, t, a, 0);
      return J(r);
    }
    return J({error: "?"});
  }
  if (path === "ns_list") {
    const ow = await db.prepare("SELECT v FROM kv WHERE k=?").bind("nso" + id).first(), u0 = await getUser(db, id), sf = bSuf(u0 && u0.badges), ol = ow ? JSON.parse(ow.v) : []; if (id === ADMIN && !ol.includes("GA")) ol.push("GA");
    return J({owned: ol, active: sf.slice(1), prices: {...NS_ST, ...NS_FT}});
  }
  if (path === "ns_buy") {
    const k = String(b.id || ""), price = NS_ST[k] || NS_FT[k]; if (!price) return J({error: "Нет такого стиля"});
    const ow = await db.prepare("SELECT v FROM kv WHERE k=?").bind("nso" + id).first(), list = ow ? JSON.parse(ow.v) : []; if (id === ADMIN && !list.includes("GA")) list.push("GA");
    if (list.includes(k)) return J({error: "Уже куплено"});
    const r = await mutate(db, id, s => { if (num(s.gems) < price) return "Не хватает кристаллов"; s.gems -= price; });
    if (r.error) return J(r);
    list.push(k); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("nso" + id, JSON.stringify(list)).run();
    return J({...r, owned: list});
  }
  if (path === "ns_set") {
    const ow = await db.prepare("SELECT v FROM kv WHERE k=?").bind("nso" + id).first(), list = ow ? JSON.parse(ow.v) : []; if (id === ADMIN) list.push("GA");
    const g = String(b.g || ""), f = String(b.f || ""); if ((g && !list.includes(g)) || (f && !list.includes(f))) return J({error: "Сначала купи этот стиль"});
    const u0 = await getUser(db, id), suf = (g || f) ? "~" + g + f : "", nb = bLet(u0 && u0.badges) + suf;
    await db.prepare("UPDATE users SET badges=? WHERE id=?").bind(nb, id).run(); return J({ok: true, badges: bd(id, nb)});
  }
  if (path === "bn_set") {
    const img = String(b.img || ""); if (!img) { await db.prepare("DELETE FROM kv WHERE k=?").bind("bn" + id).run(); return J({ok: true}); }
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(img) || img.length > 90000) return J({error: "Картинка слишком большая"});
    await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("bn" + id, img).run(); return J({ok: true});
  }
  if (path === "pf_set") {
    const bio = String(b.bio || "").replace(/[<>]/g, "").trim().slice(0, 80), u0 = await getUser(db, id); if (!u0 || !u0.state) return J({error: "Нет профиля"});
    const sv = JSON.parse(u0.state), fav = (Array.isArray(b.fav) ? b.fav : []).map(Number).filter((x, i, a) => Number.isInteger(x) && (sv.inv || {})[x] && a.indexOf(x) === i).slice(0, 3);
    await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("pf" + id, JSON.stringify({bio, fav})).run();
    return J({ok: true, bio, fav});
  }
  if (path.startsWith("clan_")) {
    const CL_MAX = 30, my = await db.prepare("SELECT cid,role FROM clan_m WHERE uid=?").bind(id).first();
    const score = "COALESCE((SELECT SUM(u.total) FROM clan_m m JOIN users u ON u.id=m.uid WHERE m.cid=c.id),0)";
    const cnt = async cid => (await db.prepare("SELECT COUNT(*) AS c FROM clan_m WHERE cid=?").bind(cid).first()).c;
    const role = my ? (my.role | 0) : -1;
    const needMgr = () => !my ? "Ты не в клане" : role < 1 ? "Только глава или офицер" : null;
    if (path === "clan_list") {
      const rows = (await db.prepare("SELECT c.id,c.name,c.owner,c.icon,c.mode,c.descr,c.bank," + score + " AS score,(SELECT COUNT(*) FROM clan_m m WHERE m.cid=c.id) AS n FROM clans c ORDER BY score DESC LIMIT 30").all()).results.map(r => ({...r, level: clLevel(r.bank)}));
      return J({rows, mine: my ? my.cid : 0, max: CL_MAX});
    }
    if (path === "clan_info") {
      const cid = Number(b.id) || (my ? my.cid : 0); if (!cid) return J({clan: null, myreq: ((await db.prepare("SELECT cid FROM clan_req WHERE uid=?").bind(id).first()) || {}).cid || 0});
      const c = await db.prepare("SELECT c.id,c.name,c.owner,c.icon,c.mode,c.descr,c.bank," + score + " AS score FROM clans c WHERE c.id=?").bind(cid).first(); if (!c) return J({clan: null});
      c.level = clLevel(c.bank); c.next = CL_LV[c.level] || 0;
      const mem = (await db.prepare("SELECT u.id,u.name,u.total,u.seen,u.badges,m.role,m.don FROM clan_m m JOIN users u ON u.id=m.uid WHERE m.cid=? ORDER BY m.role DESC, u.total DESC LIMIT 40").bind(cid).all()).results.map(r => ({id: r.id, name: r.name, total: r.total, role: r.id === c.owner ? 2 : r.role, don: r.don || 0, online: (r.seen || 0) > now - 40, badges: bd(r.id, r.badges)}));
      await addPh(db, mem, "id");
      const reqs = my && my.cid === cid && role >= 1 ? (await db.prepare("SELECT r.uid AS id,u.name,u.total FROM clan_req r JOIN users u ON u.id=r.uid WHERE r.cid=? LIMIT 30").bind(cid).all()).results : [];
      const myreq = my ? 0 : ((await db.prepare("SELECT cid FROM clan_req WHERE uid=?").bind(id).first()) || {}).cid || 0;
      return J({clan: c, members: mem, reqs, mine: my ? my.cid : 0, myrole: my && my.cid === cid ? (c.owner === id ? 2 : role) : -1, myreq, max: CL_MAX});
    }
    if (path === "clan_create") {
      if (my) return J({error: "Ты уже в клане"});
      const nm = String(b.name || "").replace(/[<>&"]/g, "").trim().slice(0, 20); if (nm.length < 3) return J({error: "Название от 3 символов"});
      const u0 = await getUser(db, id); if (!u0 || num(u0.total) < 1e6) return J({error: "Клан можно создать, накопив 1 000 000 монет"});
      const icon = [..."🛡⚔🔥🍉🐱👑🌟🚀💎🦁🐉🌈"].includes(String(b.icon || "")) ? String(b.icon) : "🛡";
      const r = await db.prepare("INSERT OR IGNORE INTO clans (name,owner,ts,icon) VALUES (?,?,?,?)").bind(nm, id, now, icon).run(); if (r.meta.changes !== 1) return J({error: "Такое название занято"});
      await db.prepare("INSERT OR REPLACE INTO clan_m (uid,cid,ts,role) VALUES (?,?,?,2)").bind(id, r.meta.last_row_id, now).run();
      await db.prepare("DELETE FROM clan_req WHERE uid=?").bind(id).run();
      return J({ok: true, id: r.meta.last_row_id});
    }
    if (path === "clan_join") {
      if (my) return J({error: "Сначала выйди из своего клана"});
      const cid = Number(b.id), c = await db.prepare("SELECT id,mode FROM clans WHERE id=?").bind(cid).first(); if (!c) return J({error: "Клан не найден"});
      if ((await cnt(cid)) >= CL_MAX) return J({error: "В клане нет мест"});
      if (c.mode === 1) { await db.prepare("INSERT OR REPLACE INTO clan_req (uid,cid,ts) VALUES (?,?,?)").bind(id, cid, now).run(); return J({ok: true, requested: true}); }
      await db.prepare("INSERT OR IGNORE INTO clan_m (uid,cid,ts,role) VALUES (?,?,?,0)").bind(id, cid, now).run();
      return J({ok: true});
    }
    if (path === "clan_unreq") { await db.prepare("DELETE FROM clan_req WHERE uid=?").bind(id).run(); return J({ok: true}); }
    if (path === "clan_leave") {
      if (!my) return J({error: "Ты не в клане"});
      await db.prepare("DELETE FROM clan_m WHERE uid=?").bind(id).run();
      const c = await db.prepare("SELECT owner FROM clans WHERE id=?").bind(my.cid).first();
      if (c && c.owner === id) {
        const nx = await db.prepare("SELECT uid FROM clan_m WHERE cid=? ORDER BY role DESC, ts LIMIT 1").bind(my.cid).first();
        if (nx) { await db.prepare("UPDATE clans SET owner=? WHERE id=?").bind(nx.uid, my.cid).run(); await db.prepare("UPDATE clan_m SET role=2 WHERE uid=?").bind(nx.uid).run(); }
        else { await db.prepare("DELETE FROM clans WHERE id=?").bind(my.cid).run(); await db.prepare("DELETE FROM clan_chat WHERE cid=?").bind(my.cid).run(); await db.prepare("DELETE FROM clan_req WHERE cid=?").bind(my.cid).run(); }
      }
      return J({ok: true});
    }
    if (path === "clan_kick") {
      const e0 = needMgr(); if (e0) return J({error: e0});
      const t = Number(b.uid); if (t === id) return J({error: "Себя исключить нельзя"});
      const tm = await db.prepare("SELECT role FROM clan_m WHERE uid=? AND cid=?").bind(t, my.cid).first(); if (!tm) return J({error: "Игрока нет в клане"});
      if (role < 2 && tm.role >= 1) return J({error: "Офицеров исключает только глава"});
      await db.prepare("DELETE FROM clan_m WHERE uid=? AND cid=?").bind(t, my.cid).run(); return J({ok: true});
    }
    if (path === "clan_edit") {
      if (role < 2) return J({error: "Только глава"});
      const descr = String(b.descr || "").replace(/[<>]/g, "").trim().slice(0, 120), mode = b.mode ? 1 : 0;
      const icon = [..."🛡⚔🔥🍉🐱👑🌟🚀💎🦁🐉🌈"].includes(String(b.icon || "")) ? String(b.icon) : "🛡";
      await db.prepare("UPDATE clans SET descr=?, mode=?, icon=? WHERE id=?").bind(descr, mode, icon, my.cid).run(); return J({ok: true});
    }
    if (path === "clan_role") {
      if (role < 2) return J({error: "Только глава"});
      const t = Number(b.uid), r = b.role ? 1 : 0; if (t === id) return J({error: "Это ты"});
      const x = await db.prepare("UPDATE clan_m SET role=? WHERE uid=? AND cid=?").bind(r, t, my.cid).run(); return J(x.meta.changes === 1 ? {ok: true} : {error: "Игрока нет в клане"});
    }
    if (path === "clan_transfer") {
      if (role < 2) return J({error: "Только глава"});
      const t = Number(b.uid), tm = await db.prepare("SELECT uid FROM clan_m WHERE uid=? AND cid=?").bind(t, my.cid).first(); if (!tm || t === id) return J({error: "Неверный игрок"});
      await db.prepare("UPDATE clans SET owner=? WHERE id=?").bind(t, my.cid).run(); await db.prepare("UPDATE clan_m SET role=2 WHERE uid=?").bind(t).run(); await db.prepare("UPDATE clan_m SET role=1 WHERE uid=?").bind(id).run();
      return J({ok: true});
    }
    if (path === "clan_disband") {
      if (role < 2) return J({error: "Только глава"});
      for (const t of ["clan_m", "clan_req", "clan_chat"]) await db.prepare("DELETE FROM " + t + " WHERE cid=?").bind(my.cid).run();
      await db.prepare("DELETE FROM clans WHERE id=?").bind(my.cid).run(); return J({ok: true});
    }
    if (path === "clan_req_ok" || path === "clan_req_no") {
      const e0 = needMgr(); if (e0) return J({error: e0});
      const t = Number(b.uid), rq = await db.prepare("SELECT 1 AS o FROM clan_req WHERE uid=? AND cid=?").bind(t, my.cid).first(); if (!rq) return J({error: "Заявки нет"});
      await db.prepare("DELETE FROM clan_req WHERE uid=?").bind(t).run();
      if (path === "clan_req_ok") {
        if ((await cnt(my.cid)) >= CL_MAX) return J({error: "В клане нет мест"});
        if (await db.prepare("SELECT 1 AS o FROM clan_m WHERE uid=?").bind(t).first()) return J({error: "Игрок уже в другом клане"});
        await db.prepare("INSERT OR IGNORE INTO clan_m (uid,cid,ts,role) VALUES (?,?,?,0)").bind(t, my.cid, now).run();
      }
      return J({ok: true});
    }
    if (path === "clan_donate") {
      if (!my) return J({error: "Ты не в клане"});
      const a = Math.floor(Number(b.amount)); if (!isFinite(a) || a < 1000) return J({error: "Минимум 1 000"});
      const r = await mutate(db, id, s => { if (num(s.pts) < a) return "Не хватает монет"; s.pts -= a; });
      if (r.error) return J(r);
      await db.prepare("UPDATE clans SET bank=COALESCE(bank,0)+? WHERE id=?").bind(a, my.cid).run();
      await db.prepare("UPDATE clan_m SET don=COALESCE(don,0)+? WHERE uid=?").bind(a, id).run();
      return J(r);
    }
    return J({error: "?"});
  }
  if (path === "evt_claim") {
    const e = await evtGet(db, now); if (!e || !e.cat && e.cat !== 0 || e.auto) return J({error: "Нет подарка"});
    const r = await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES (?,?)").bind("ec" + e.id + "_" + id, "1").run();
    if (r.meta.changes !== 1) return J({error: "Уже забрал"});
    await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(id, "cat", Number(e.cat), 1, now).run();
    return J({ok: true});
  }
  if (path === "chat") {
    const since = Number(b.since) || 0;
    let rows = (await db.prepare("SELECT c.id,c.uid,c.name,c.text,c.ts,u.badges FROM chat c LEFT JOIN users u ON u.id=c.uid WHERE c.id>? ORDER BY c.id DESC LIMIT 60").bind(since).all()).results;
    rows = rows.reverse().map(r => ({...r, badges: bd(r.uid, r.badges)})); await addPh(db, rows, "uid");
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
    return J({id: u.id, name: u.name, un: id === ADMIN ? (u.un || "") : undefined, badges: bd(u.id, u.badges), banned: !!u.banned, ban: u.banned | 0, banat: u.banat || 0, online: (u.seen || 0) > now - 40, total: u.total, taps: s.taps || 0, cats, holo: (s.holo || []).length, prest: s.prest || 0, ach: (s.ach || []).length, eq: s.eq === undefined ? -1 : s.eq, bnimg: await (async () => { try { const x = await db.prepare("SELECT v FROM kv WHERE k=?").bind("bn" + uid).first(); return x ? x.v : ""; } catch (e) { return ""; } })(), photo: await (async () => { try { const x = await db.prepare("SELECT v FROM kv WHERE k=?").bind("ph" + uid).first(); return x ? x.v : ""; } catch (e) { return ""; } })(), pf: await (async () => { try { const x = await db.prepare("SELECT v FROM kv WHERE k=?").bind("pf" + uid).first(); return x ? JSON.parse(x.v) : {}; } catch (e) { return {}; } })(), seen: u.seen || 0, achs: s.ach || [], inv: s.inv || {}, stars: s.stars || 0, fevers: s.fevers || 0, gt: s.gt || 0, run: s.run || 0, fr: await (async () => { if (uid === id) return 0; const f = await db.prepare("SELECT a,st FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)").bind(id, uid, uid, id).first(); return !f ? 0 : f.st === 1 ? 1 : f.a === id ? 2 : 3; })(), clan: await (async () => { const c = await db.prepare("SELECT c.name,c.icon FROM clan_m m JOIN clans c ON c.id=m.cid WHERE m.uid=?").bind(uid).first(); return c ? (c.icon || "🛡") + " " + c.name : ""; })(), opened: s.opened || 0, bn: Number.isInteger(s.bn) ? s.bn : 0, offers: (await db.prepare("SELECT id,give,want FROM offers WHERE seller=? AND status='open' ORDER BY id DESC LIMIT 5").bind(u.id).all()).results});
  }
  if (path === "promo_use") {
    const code = String(b.code || "").trim().toUpperCase().slice(0, 32); if (!code) return J({error: "Введи промокод"});
    const p = await db.prepare("SELECT * FROM promos WHERE code=?").bind(code).first();
    if (!p) return J({error: "Промокод не найден"});
    if (p.mx > 0 && p.used >= p.mx) return J({error: "Промокод закончился"});
    try { await db.prepare("INSERT INTO promo_uses (code,uid) VALUES (?,?)").bind(code, id).run(); } catch (e) { return J({error: "Ты уже использовал этот промокод"}); }
    await db.prepare("UPDATE promos SET used=used+1 WHERE code=?").bind(code).run();
    if (p.kind === "pts") await allowAdd(db, id, num(p.a), 0); else if (p.kind === "gems") await allowAdd(db, id, 0, num(p.a));
    return J({kind: p.kind, a: p.a, b: p.b});
  }
  if (path.startsWith("adm_")) {
    if (!adm) return J({error: "Нет доступа"}, 403);
    if (path === "adm_give") {
      const t = Number(b.target) || id, kind = String(b.kind);
      if (!["pts", "gems", "cat", "allcats", "takepts", "takecat", "takegems"].includes(kind)) return J({error: "Неверный тип"});
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
      if (kind === "pts") await allowAdd(db, t, num(Number(b.a)), 0); else if (kind === "gems") await allowAdd(db, t, 0, num(Number(b.a)));
      return J({ok: true, name: u.name});
    }
    if (path === "adm_tgcast") {
      const text = String(b.text || "").trim().slice(0, 1000); if (text.length < 3) return J({error: "Слишком короткое сообщение"});
      const act = await db.prepare("SELECT v FROM kv WHERE k='tgact'").first(); if (act && act.v === "1") return J({error: "Прошлая рассылка ещё идёт"});
      for (const [k, v] of [["tgtext", text], ["tgpos", "0"], ["tgsent", "0"], ["tgact", "1"], ["tglock", "0"]]) await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(k, v).run();
      const tot = await db.prepare("SELECT COUNT(*) c FROM users WHERE banned=0").first();
      return J({ok: true, total: tot.c});
    }
    if (path === "adm_tgstat") {
      const get = async k => { const r = await db.prepare("SELECT v FROM kv WHERE k=?").bind(k).first(); return r ? r.v : ""; };
      const tot = await db.prepare("SELECT COUNT(*) c FROM users WHERE banned=0").first();
      return J({active: (await get("tgact")) === "1", sent: Number(await get("tgsent")) || 0, total: tot.c});
    }
    if (path === "adm_bcast") {
      const text = String(b.text || "").trim().slice(0, 300); if (!text) return J({error: "Пусто"});
      await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind(text, now).run();
      return J({ok: true});
    }
    if (path === "adm_evt") {
      const nm = String(b.name || "").trim().slice(0, 40) || "Событие", mult = Math.min(10, Math.max(1, Number(b.mult) || 2)), mins = Math.min(60 * 72, Math.max(1, Math.floor(Number(b.mins) || 60)));
      const e = {id: "a" + now, name: nm, mult, from: now, until: now + mins * 60}; if (b.cat !== undefined && b.cat !== "" && Number.isFinite(Number(b.cat))) e.cat = Math.max(0, Math.floor(Number(b.cat)));
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('evt',?)").bind(JSON.stringify(e)).run();
      await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind("🎉 " + nm + "! Доход ×" + mult + " на " + (mins >= 60 ? Math.round(mins / 60 * 10) / 10 + " ч" : mins + " мин") + (e.cat !== undefined ? ". Загляни в игру: тебя ждёт подарок" : ""), now).run();
      return J({ok: true, evt: e});
    }
    if (path === "adm_bn_del") { await db.prepare("DELETE FROM kv WHERE k=?").bind("bn" + Number(b.uid)).run(); return J({ok: true}); }
    if (path === "adm_evt_stop") { await db.prepare("DELETE FROM kv WHERE k='evt'").run(); return J({ok: true}); }
    if (path === "adm_reset") {
      const t = Number(b.uid), u = await getUser(db, t); if (!u) return J({error: "Игрок не найден"});
      await db.prepare("UPDATE users SET state=NULL, total=0, cur=0, rev=rev+1, upd=? WHERE id=?").bind(now, t).run();
      await db.prepare("UPDATE offers SET status='cancelled' WHERE seller=? AND status='open'").bind(t).run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(t, "reset", 0, 1, now).run();
      return J({ok: true, name: u.name});
    }
    if (path === "adm_gemset") {
      const g = Math.max(0, Math.min(1e6, Math.floor(Number(b.gems) || 0)));
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) SELECT id,'gemset',?,0,? FROM users").bind(g, now).run();
      const c = (await db.prepare("SELECT COUNT(*) AS c FROM users").first()).c;
      return J({ok: true, count: c, gems: g});
    }
    if (path === "adm_resetall") {
      await db.prepare("UPDATE users SET state=NULL, total=0, cur=0, rev=rev+1, upd=?").bind(now).run();
      await db.prepare("UPDATE offers SET status='cancelled' WHERE status='open'").run();
      await db.prepare("DELETE FROM grants").run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) SELECT id,'reset',0,2,? FROM users").bind(now).run();
      await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) SELECT id,'cat',72,1,? FROM users").bind(now).run();
      const c = (await db.prepare("SELECT COUNT(*) AS c FROM users").first()).c;
      return J({ok: true, count: c});
    }
    if (path === "adm_skiploan") { const r = await db.prepare("UPDATE loans SET due=? WHERE uid=? AND status='open'").bind(now - 1, id).run(); return J(r.meta.changes ? {ok: true} : {error: "Нет активного долга"}); }
    if (path === "adm_maint") { const on = !!b.on, text = String(b.text || "").trim().slice(0, 200) || "Скоро вернёмся, играть можно будет чуть позже."; await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('maint',?)").bind(JSON.stringify({on, text})).run(); return J({ok: true, on, text}); }
    if (path === "adm_del") { await db.prepare("DELETE FROM chat WHERE id=?").bind(Number(b.id)).run(); return J({ok: true}); }
    if (path === "adm_ban") { await db.prepare("UPDATE users SET banned=? WHERE id=?").bind(b.on ? 1 : 0, Number(b.uid)).run(); if (b.on) await db.prepare("DELETE FROM chat WHERE uid=?").bind(Number(b.uid)).run(); return J({ok: true}); }
    if (path === "adm_fban") {
      const uid = Number(b.uid); if (!uid || uid === ADMIN) return J({error: "Нельзя"});
      const u = await getUser(db, uid); if (!u) return J({error: "Игрок не найден"});
      if (b.on) {
        await db.batch([
          db.prepare("UPDATE users SET banned=2, banat=? WHERE id=?").bind(now, uid),
          db.prepare("DELETE FROM chat WHERE uid=?").bind(uid),
          db.prepare("DELETE FROM offers WHERE seller=? AND status='open'").bind(uid),
          db.prepare("INSERT OR REPLACE INTO bans (id,name,un,at,st,endt,why) VALUES (?,?,?,?,'ban',0,?)").bind(uid, u.name || "", u.un || "", now, String(b.why || "").slice(0, 80)),
        ]);
        tg0(uid, "🚫 Ты заблокирован администратором. Доступ к игре закрыт.");
      } else {
        await db.batch([
          db.prepare("UPDATE users SET banned=0, banat=0 WHERE id=?").bind(uid),
          db.prepare("UPDATE bans SET st='unban', endt=? WHERE id=?").bind(now, uid),
        ]);
        tg0(uid, "✅ Блокировка снята. Можешь снова играть.");
      }
      return J({ok: true});
    }
    if (path === "adm_banlist") {
      const rows = (await db.prepare("SELECT b.id,b.name,b.un,b.at,b.st,b.endt,u.cur FROM bans b LEFT JOIN users u ON u.id=b.id ORDER BY b.at DESC LIMIT 15").all()).results;
      return J({rows, days: BAN_DAYS});
    }
    if (path === "adm_badges") { const old = await getUser(db, Number(b.uid)), v = String(b.badges || "").replace(/[^ctsgl]/g, "").slice(0, 6) + bSuf(old && old.badges); await db.prepare("UPDATE users SET badges=? WHERE id=?").bind(v, Number(b.uid)).run(); return J({ok: true, badges: bd(Number(b.uid), v)}); }
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
const ANN = __ANN__;
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
    const text = "🍉 " + (ANN[2] || "Обновление") + " v" + ANN[0] + "\n\n" + ANN[1].map(x => "• " + x).join("\n");
    const markup = {inline_keyboard: [[{text: "Играть", web_app: {url: origin}}]]};
    for (let i = 0; i < rows.length; i += 10) {
      await Promise.all(rows.slice(i, i + 10).map(r => tgcall(env, "sendMessage", {chat_id: r.id, text, reply_markup: markup}).catch(() => {})));
    }
    await db.prepare("UPDATE kv SET v=? WHERE k='annpos'").bind(String(rows[rows.length - 1].id)).run();
    await db.prepare("UPDATE kv SET v='0' WHERE k='annlock'").run();
  } catch (e) {} finally { annBusy = false; }
}
let tgBusy = false;
async function tgcastStep(env, origin) {
  if (tgBusy || !env.DB || !env.BOT_TOKEN) return;
  tgBusy = true;
  try {
    const db = env.DB; await init(db);
    const act = await db.prepare("SELECT v FROM kv WHERE k='tgact'").first(); if (!act || act.v !== "1") return;
    const nowS = Math.floor(Date.now() / 1000);
    await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES ('tglock','0')").run();
    const lk = await db.prepare("UPDATE kv SET v=? WHERE k='tglock' AND CAST(v AS INTEGER)<?").bind(String(nowS + 20), nowS).run();
    if (lk.meta.changes !== 1) return;
    const get = async k => { const r = await db.prepare("SELECT v FROM kv WHERE k=?").bind(k).first(); return r ? r.v : ""; };
    const text = await get("tgtext"), pos = Number(await get("tgpos")) || 0, sent0 = Number(await get("tgsent")) || 0;
    const rows = (await db.prepare("SELECT id FROM users WHERE id>? AND banned=0 ORDER BY id LIMIT 40").bind(pos).all()).results;
    if (!rows.length || !text) { await db.prepare("UPDATE kv SET v='0' WHERE k='tgact'").run(); await db.prepare("UPDATE kv SET v='0' WHERE k='tglock'").run(); return; }
    const markup = {inline_keyboard: [[{text: "Играть", web_app: {url: origin}}]]};
    let ok = 0;
    for (let i = 0; i < rows.length; i += 10) {
      const rs = await Promise.all(rows.slice(i, i + 10).map(r => tgcall(env, "sendMessage", {chat_id: r.id, text, reply_markup: markup}).catch(() => null)));
      ok += rs.filter(x => x && x.ok).length;
    }
    await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('tgpos',?)").bind(String(rows[rows.length - 1].id)).run();
    await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('tgsent',?)").bind(String(sent0 + ok)).run();
    await db.prepare("UPDATE kv SET v='0' WHERE k='tglock'").run();
  } catch (e) {} finally { tgBusy = false; }
}
export default {
  async fetch(req, env, ctx) {
    if (env.ADMIN_ID && Number(env.ADMIN_ID) > 0) ADMIN = Number(env.ADMIN_ID);
    if (ctx && ctx.waitUntil && req.method === "POST" && new URL(req.url).pathname === "/api/poll") ctx.waitUntil(announce(env, new URL(req.url).origin).then(() => tgcastStep(env, new URL(req.url).origin)));
    const url = new URL(req.url), p = url.pathname;
    try {
      if (p === "/" || p === "/index.html") return new Response(HTML, {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer"}});
      if (p === "/demo") return new Response(HTML.replace("<head>", "<head>" + DEMO), {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store"}});
      if (p === "/atlas.jpg") {
        const r = env.ASSETS ? await env.ASSETS.fetch("https://assets.local/mdcats2.jpg") : await fetch(ATLAS, {cf: {cacheTtl: 86400, cacheEverything: true}});
        return new Response(r.body, {status: r.status, headers: {"content-type": "image/jpeg", "cache-control": "public,max-age=86400"}});
      }
      const um = p.match(/^\/ucat\/(\d+)\.jpg$/);
      if (um && env.DB) {
        await init(env.DB);
        const c = await env.DB.prepare("SELECT img FROM ucats WHERE id=? AND status!='rej'").bind(Number(um[1])).first();
        if (!c || !c.img) return new Response("no", {status: 404});
        const bin = atob(c.img), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Response(arr, {headers: {"content-type": "image/jpeg", "cache-control": "public,max-age=86400"}});
      }
      if (p.startsWith("/api/") && req.method === "POST") return await api(p.slice(5), req, env);
      if (p === "/.well-known/assetlinks.json") {
        // привязка Android-приложения к сайту (открывается без адресной строки)
        return new Response(JSON.stringify([{relation: ["delegate_permission/common.handle_all_urls"], target: {namespace: "android_app", package_name: "app.mdmelonclicker", sha256_cert_fingerprints: ["B5:94:7B:65:A0:33:B8:90:37:85:19:08:E4:B0:A7:76:10:9C:16:F8:46:11:1A:FA:FF:FB:FD:B3:5C:3A:89:C7"]}}]), {headers: {"content-type": "application/json", "cache-control": "public,max-age=3600"}});
      }
      if (p === "/setup") {
        if (!env.BOT_TOKEN) return new Response("Нет секрета BOT_TOKEN", {status: 500});
        const base = url.origin;
        const a = await tgcall(env, "setWebhook", {url: base + "/bot", secret_token: await secret(env), allowed_updates: ["message"]});
        const b = await tgcall(env, "setChatMenuButton", {menu_button: {type: "web_app", text: "Играть", web_app: {url: base}}});
        const c = await tgcall(env, "setMyCommands", {commands: [{command: "start", description: "Открыть игру"}, {command: "top", description: "Таблица лидеров"}, {command: "link", description: "Адрес игры и скачивание"}]});
        return new Response(JSON.stringify({webhook: a, menu: b, commands: c}, null, 1), {headers: {"content-type": "application/json"}});
      }
      if (p === "/bot" && req.method === "POST") {
        if (req.headers.get("x-telegram-bot-api-secret-token") !== await secret(env)) return new Response("no", {status: 403});
        const u = await req.json(), m = u.message; if (!m || !m.text) return new Response("ok");
        const base = url.origin;
        try { if (env.DB && m.from && m.from.id !== ADMIN) { const bb = await env.DB.prepare("SELECT banned FROM users WHERE id=?").bind(m.from.id).first(); if (bb && bb.banned === 2) { await tgcall(env, "sendMessage", {chat_id: m.chat.id, text: "🚫 Ты заблокирован администратором."}); return new Response("ok"); } } } catch (e) {}
        const lg = m.text.match(/^\/start login_([0-9a-f]{32})$/);
        if (lg && env.DB) {
          await init(env.DB);
          const tn = Math.floor(Date.now() / 1000), w = await env.DB.prepare("SELECT ts,sess FROM websess WHERE tok=?").bind(lg[1]).first();
          if (!w || w.sess || tn - w.ts > 600) await tgcall(env, "sendMessage", {chat_id: m.chat.id, text: "Ссылка для входа устарела. Вернись в приложение и нажми «Войти через Telegram» ещё раз."});
          else {
            const f = m.from || {}, nm = ((f.first_name || "") + " " + (f.last_name || "")).trim().slice(0, 24) || f.username || "Игрок";
            await env.DB.prepare("UPDATE websess SET uid=?, name=?, un=?, sess=? WHERE tok=?").bind(f.id, nm, String(f.username || "").slice(0, 40), hex(crypto.getRandomValues(new Uint8Array(16))), lg[1]).run();
            await tgcall(env, "sendMessage", {chat_id: m.chat.id, text: "✅ Вход выполнен! Вернись в игру, она откроется сама."});
          }
          return new Response("ok");
        }
        if (/^\/link(@\w+)?$/.test(m.text)) {
          await tgcall(env, "sendMessage", {chat_id: m.chat.id, text: "🍉 Игра: " + base + "\n📲 Скачать приложение: " + base + "/download.html", disable_web_page_preview: true});
          return new Response("ok");
        }
        if (m.text.startsWith("/top") && env.DB) {
          await init(env.DB);
          const rows = (await env.DB.prepare("SELECT name,cur AS total FROM users WHERE cur>0 AND banned<2 ORDER BY cur DESC LIMIT 10").all()).results;
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
