const HTML_URL = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/bot/src/index.html";
async function getHtml(env) {
  // основной путь: страница лежит в Workers Static Assets (public/game.html); запасной: GitHub raw
  if (env && env.ASSETS) { const r = await env.ASSETS.fetch("https://assets.local/game.html"); if (r.ok) return r.text(); }
  const r = await fetch(HTML_URL, {cf: {cacheTtl: 30, cacheEverything: true}});
  if (!r.ok) throw new Error("html " + r.status);
  return r.text();
}

const ATLAS = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/HEAD/mdcats2.jpg";
const BOT_USER = "mdmelonbot";
const N_ITEMS = 103;
const BC_CATS = [["Киллер в плаще", 3], ["Кот-дон", 3], ["Вор-домушник", 2], ["Торговец с рынка", 3], ["Контрабандный ящик", 2], ["Кот-алхимик", 3], ["Кот-чемодан", 2], ["Призрак рынка", 4], ["Золотой слиток", 4], ["Золотой арбуз-лидер", 9], ["Луна", 1], ["Марс", 2], ["Земля", 3], ["Венера", 2], ["Юпитер", 4], ["Сатурн", 4], ["Солнечная система", 5], ["Уран", 3], ["Нептун", 3]];
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
  try { const u = JSON.parse(p.get("user")); u.__sp = String(p.get("start_param") || "").slice(0, 40); return u; } catch (e) { return null; }
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
    db.prepare("CREATE TABLE IF NOT EXISTS chg (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, status TEXT DEFAULT 'wait', w INTEGER DEFAULT 1, s TEXT, tw INTEGER DEFAULT 300000, tb INTEGER DEFAULT 300000, last INTEGER DEFAULT 0, lm TEXT, v INTEGER DEFAULT 0, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS dcm (tid INTEGER, seat INTEGER, code INTEGER, ts INTEGER, n INTEGER DEFAULT 0, PRIMARY KEY (tid, seat))"),
    db.prepare("CREATE TABLE IF NOT EXISTS dc (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, status TEXT DEFAULT 'wait', h1 TEXT, h2 TEXT, turn INTEGER DEFAULT 1, bid TEXT, bseat INTEGER DEFAULT 0, hist TEXT DEFAULT '[]', v INTEGER DEFAULT 0, last INTEGER DEFAULT 0, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS chg (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, status TEXT DEFAULT 'wait', s TEXT, t1 INTEGER DEFAULT 300000, t2 INTEGER DEFAULT 300000, last INTEGER DEFAULT 0, lm TEXT, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, uname TEXT, text TEXT, status TEXT DEFAULT 'new', ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS alog (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, actor INTEGER, an TEXT, role TEXT, act TEXT, tgt INTEGER DEFAULT 0, tn TEXT DEFAULT '', info TEXT DEFAULT '')"),
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
  try { await db.prepare("CREATE TABLE IF NOT EXISTS chr (uid INTEGER PRIMARY KEY, name TEXT, elo INTEGER DEFAULT 1000, w INTEGER DEFAULT 0, l INTEGER DEFAULT 0, d INTEGER DEFAULT 0, bw INTEGER DEFAULT 0, bl INTEGER DEFAULT 0, bd INTEGER DEFAULT 0, ts INTEGER DEFAULT 0)").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS ghost (id INTEGER PRIMARY KEY AUTOINCREMENT, frm INTEGER, fname TEXT, tou INTEGER, tname TEXT, cat INTEGER, rar INTEGER, ts INTEGER, ret INTEGER, claimed INTEGER DEFAULT 0, taken INTEGER DEFAULT 0)").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS friends (a INTEGER, b INTEGER, st INTEGER DEFAULT 0, ts INTEGER, PRIMARY KEY (a, b))").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clans (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, owner INTEGER, ts INTEGER)").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clan_m (uid INTEGER PRIMARY KEY, cid INTEGER, ts INTEGER)").run(); } catch (e) {}
  for (const q of ["ALTER TABLE clans ADD COLUMN descr TEXT DEFAULT ''", "ALTER TABLE clans ADD COLUMN icon TEXT DEFAULT '🛡'", "ALTER TABLE clans ADD COLUMN mode INTEGER DEFAULT 0", "ALTER TABLE clans ADD COLUMN bank REAL DEFAULT 0", "ALTER TABLE clans ADD COLUMN badges TEXT DEFAULT ''", "ALTER TABLE clans ADD COLUMN style TEXT DEFAULT ''", "ALTER TABLE clan_m ADD COLUMN role INTEGER DEFAULT 0", "ALTER TABLE clan_m ADD COLUMN don REAL DEFAULT 0"]) { try { await db.prepare(q).run(); } catch (e) {} }
  for (const q of ["CREATE TABLE IF NOT EXISTS td (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, st TEXT, s1 REAL, s2 REAL, t1 INTEGER DEFAULT 0, t2 INTEGER DEFAULT 0, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER)", "CREATE TABLE IF NOT EXISTS tdr (uid INTEGER PRIMARY KEY, name TEXT, w INTEGER DEFAULT 0, l INTEGER DEFAULT 0, d INTEGER DEFAULT 0)", "ALTER TABLE tdr ADD COLUMN elo INTEGER DEFAULT 1000", "CREATE TABLE IF NOT EXISTS anarchy_bak (id INTEGER PRIMARY KEY, state TEXT, total REAL, cur REAL, rev INTEGER)", "CREATE TABLE IF NOT EXISTS anarchy_clb (id INTEGER PRIMARY KEY, bank REAL, wall INTEGER)", "CREATE TABLE IF NOT EXISTS clg (cid INTEGER, uid INTEGER, score INTEGER, ts INTEGER, PRIMARY KEY (cid,uid))", "CREATE TABLE IF NOT EXISTS clraid (id INTEGER PRIMARY KEY AUTOINCREMENT, att INTEGER, an TEXT, def INTEGER, dn TEXT, uid INTEGER, name TEXT, sc INTEGER, ds INTEGER, win INTEGER, loot REAL, ts INTEGER)", "ALTER TABLE clans ADD COLUMN wall INTEGER DEFAULT 0", "ALTER TABLE clans ADD COLUMN shield INTEGER DEFAULT 0"]) { try { await db.prepare(q).run(); } catch (e) {} }
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clan_req (uid INTEGER PRIMARY KEY, cid INTEGER, ts INTEGER)").run(); } catch (e) {}
  try { await db.prepare("CREATE TABLE IF NOT EXISTS clan_chat (id INTEGER PRIMARY KEY AUTOINCREMENT, cid INTEGER, uid INTEGER, name TEXT, text TEXT, ts INTEGER)").run(); } catch (e) {}
  ready = true;
}
const REF_BONUS = 25, REF_NEW = 10, REF_NEED = 20000, DAILY_R = [5, 5, 10, 10, 15, 20, 50];
const CL_BD = "votpf", CL_IMG = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
const SEASON_REW = [100, 50, 25], COLL_MS = [[10, 5], [25, 10], [50, 25], [75, 40], [90, 100]];
const seasonId = now => { const d = new Date((now + 7200) * 1000); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
const seasonEnd = now => { const d = new Date((now + 7200) * 1000); return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / 1000) - 7200; };
const SEASON_Q = "SELECT u.id,u.name,u.badges,u.total - COALESCE(CAST(k.v AS REAL),0) AS score FROM users u LEFT JOIN kv k ON k.k='sb'||u.id WHERE u.banned<2 AND u.total - COALESCE(CAST(k.v AS REAL),0) > 0 ORDER BY score DESC LIMIT 50";
let seasonSeen = -1;
async function seasonEnsure(db, now) {
  const sid = seasonId(now); if (seasonSeen === sid) return sid;
  const x = await db.prepare("SELECT v FROM kv WHERE k='ssx'").first();
  if (!x || Number(x.v) !== sid) {
    const lock = await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES (?,?)").bind("ssl" + sid, "1").run();
    if (lock.meta.changes === 1) {
      if (x) {
        const top = (await db.prepare(SEASON_Q).all()).results.slice(0, 3);
        for (let i = 0; i < top.length; i++) await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(top[i].id, "gems", SEASON_REW[i], 0, now).run();
        await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('sres',?)").bind(JSON.stringify({s: Number(x.v), top: top.map(r => ({id: r.id, name: r.name, score: r.score}))})).run();
      }
      await db.prepare("DELETE FROM kv WHERE k LIKE 'sb%'").run();
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) SELECT 'sb'||id, CAST(total AS TEXT) FROM users").run();
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('ssx',?)").bind(String(sid)).run();
    }
  }
  seasonSeen = sid; return sid;
}
const ctWeek = now => Math.floor((Math.floor((now + 7200) / 86400) + 3) / 7), ctEnd = wk => ((wk + 1) * 7 - 3) * 86400 - 7200;
async function findUser(db, q) {
  q = String(q || "").trim().slice(0, 30).replace(/[%_]/g, ""); if (!q) return null;
  return /^\d+$/.test(q) ? await db.prepare("SELECT id,name FROM users WHERE id=?").bind(Number(q)).first() : await db.prepare("SELECT id,name FROM users WHERE name LIKE ? ORDER BY (name=?) DESC, total DESC LIMIT 1").bind("%" + q + "%", q).first();
}
async function ctLoad(db, cid, bank, n, now) {
  const wk = ctWeek(now), x = await db.prepare("SELECT v FROM kv WHERE k=?").bind("ct" + cid).first(); let d = null; try { d = x ? JSON.parse(x.v) : null; } catch (e) {}
  if (!d || d.wk !== wk) { d = {wk, tot: 0, mem: {}, big: 0, paid: [], g: [Math.max(1e6, Math.round(num(bank) * .1)), Math.min(5, Math.max(2, Math.ceil(n / 2))), Math.max(1e6, Math.round(num(bank) * .03))]}; await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("ct" + cid, JSON.stringify(d)).run(); }
  return d;
}
const CT_REW = [10, 10, 15];
const ctView = d => ({ends: ctEnd(d.wk), tasks: [d.tot, Object.keys(d.mem).length, d.big].map((cur, i) => ({id: i + 1, cur, goal: d.g[i], rew: CT_REW[i], done: d.paid.includes(i + 1)}))});
const CL_LV = [1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15];
const clLevel = bank => CL_LV.filter(x => num(bank) >= x).length;
function tidy(s) { if (Array.isArray(s.holo)) s.holo = s.holo.filter(i => (i + "") in s.inv); if (s.eq !== undefined && +s.eq >= 0 && !((s.eq + "") in s.inv)) s.eq = -1; }
const num = x => (typeof x === "number" && isFinite(x)) ? x : 0;
// ---- серверная проверка состояния, присланного клиентом (клиент авторитетный, поэтому ограничиваем рост)
const ABS_MAX = 1e21, GEM_MAX = 1e7, IMPORT_MAX = 1e15, IMPORT_GEMS = 1e4;
async function modIdsOf(db) { try { const r = await db.prepare("SELECT v FROM kv WHERE k='mods'").first(); const l = r ? JSON.parse(r.v) : []; return Array.isArray(l) ? l.map(Number) : []; } catch (e) { return []; } }
async function smodIdsOf(db) { try { const r = await db.prepare("SELECT v FROM kv WHERE k='smods'").first(); const l = r ? JSON.parse(r.v) : []; return Array.isArray(l) ? l.map(Number) : []; } catch (e) { return []; } }
const AUDT = {
  adm_ban: b => b.on ? "мут в чате" : "снял мут в чате", adm_fban: b => b.on ? "ЗАБАНИЛ игрока" : "снял бан", adm_del: () => "удалил сообщение из чата", adm_bn_del: () => "удалил баннер",
  adm_give: b => ({pts: "выдал монеты", gems: "выдал самоцветы", cat: "выдал кота", allcats: "выдал всех котов", takepts: "забрал монеты", takecat: "забрал кота", takegems: "забрал самоцветы"})[String(b.kind)] || "выдача/изъятие",
  adm_mod: b => b.on ? (b.senior ? "назначил ведущим модератором" : "назначил помощником") : "снял с модераторов", adm_maint: b => b.on ? "включил техперерыв" : "выключил техперерыв",
  adm_bcast: () => "сообщение всем в игре", adm_tgcast: () => "рассылка во все чаты бота", adm_reset: () => "сбросил прогресс игроку", adm_resetall: () => "СБРОС ПРОГРЕССА ВСЕМ", adm_gemset: () => "сбросил самоцветы",
  adm_badges: () => "изменил значки игрока", adm_promo_new: () => "создал промокод", adm_promo_del: () => "удалил промокод", adm_skiploan: () => "пропустил срок кредита", adm_evt: () => "запустил событие", adm_evt_stop: () => "остановил событие",
  adm_clan_del: () => "удалил клан", adm_clan_invite: () => "изменил приглашение в клан", adm_clan_badge: () => "изменил значок клана",
  uc_approve: () => "одобрил кота мастерской", uc_reject: () => "отклонил кота мастерской", uc_del: () => "удалил кота мастерской", uc_setrar: () => "сменил редкость кота", idea_ok: () => "одобрил идею", idea_rej: () => "отклонил идею"
};
async function auditLog(db, id, name, role, path, b, now) {
  try {
    const f = AUDT[path]; if (!f) return;
    const tgt = Number(b.uid || b.target) || 0; let tn = "";
    if (tgt) { const u = await db.prepare("SELECT name FROM users WHERE id=?").bind(tgt).first(); tn = u ? u.name || "" : ""; }
    let info = "";
    if (path === "adm_give" || path === "adm_gemset") info = [b.a, b.b].filter(x => x !== undefined && x !== "" && x !== null).join(" ×");
    else if (path === "adm_bcast" || path === "adm_tgcast" || path === "adm_maint") info = String(b.text || "");
    else if (path === "adm_promo_new" || path === "adm_promo_del") info = String(b.code || "");
    else if (path === "adm_reset" || path === "adm_fban") info = String(b.why || "");
    await db.batch([
      db.prepare("INSERT INTO alog (ts,actor,an,role,act,tgt,tn,info) VALUES (?,?,?,?,?,?,?,?)").bind(now, id, String(name || "").slice(0, 30), role, f(b), tgt, tn.slice(0, 30), info.replace(/\s+/g, " ").slice(0, 90)),
      db.prepare("DELETE FROM alog WHERE id <= (SELECT MAX(id) FROM alog) - 1000"),
    ]);
  } catch (e) {}
}
const MODP = new Set(["adm_del", "adm_ban", "adm_bn_del"]), SMODP = new Set(["adm_give", "adm_tgcast", "adm_tgstat", "adm_bcast"]);
const MIDP = new Set(["adm_give", "adm_tgcast", "adm_tgstat", "adm_bcast", "adm_evt", "adm_wall", "adm_chaos", "adm_float", "adm_hard"]), ADMIN_CATS = new Set([70, 71, 72]), CHAOS = {disco: "Диско", flip: "Вверх ногами", gold: "Золотой век", tiny: "Мелкий шрифт", night: "Ночь", shake: "Землетрясение", invert: "Негатив", blur: "Туман", mirror: "Зеркало", spin: "Карусель"};
async function anarchyOn(db) { try { const r = await db.prepare("SELECT v FROM kv WHERE k='anarchy'").first(); return r ? JSON.parse(r.v) : null; } catch (e) { return null; } }
const fin = (x, mx) => { x = Number(x); return Number.isFinite(x) ? Math.min(mx, Math.max(0, x)) : 0; };
function clean(s, prev, dt, al, adm) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  if (JSON.stringify(s).length > 40000) return null;
  if (!Array.isArray(s.b) || !s.inv || typeof s.inv !== "object") return null;
  s.b = s.b.slice(0, 32).map(v => Math.floor(fin(v, 1e6)));
  { const ni = {}; let n = 0; for (const k of Object.keys(s.inv)) { if (!/^\d{1,4}$/.test(k) || +k >= N_ITEMS + 600 || ++n > 800) continue; const v = Math.floor(fin(s.inv[k], 1e6)); if (v > 0) ni[k] = v; } s.inv = ni; }
  for (const k of ["ach", "sets", "holo", "hist"]) if (s[k] !== undefined) s[k] = Array.isArray(s[k]) ? s[k].slice(0, k === "hist" ? 80 : 300) : [];
  for (const k of ["click", "crit", "fev", "pity", "cv"]) if (s[k] !== undefined) s[k] = Math.floor(fin(s[k], 2000));
  if (s.perks !== undefined) { const np = {}; if (s.perks && typeof s.perks === "object" && !Array.isArray(s.perks)) for (const k of Object.keys(s.perks).slice(0, 60)) np[String(k).slice(0, 30)] = Math.floor(fin(s.perks[k], 2000)); s.perks = np; }
  for (const k of ["taps", "stars", "fevers", "prest", "opened", "xp", "gt"]) if (s[k] !== undefined) s[k] = Math.floor(fin(s[k], 1e15));
  if (s.pl !== undefined) { let mx = 0; while (mx < 30 && (adm || fin(s.total, ABS_MAX) >= 5e12 * Math.pow(4, mx))) mx++; s.pl = Math.min(Math.floor(fin(s.pl, 30)), mx); if (prev) s.pl = Math.min(s.pl, Math.floor(num(prev.pl)) + 1); }
  if (s.wd !== undefined) s.wd = Math.max(0, Math.min(Math.floor(fin(s.wd, 7)), Math.min(Math.floor(num(s.pl)), 7)));
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
// ---------- шахматы: общий код клиента и сервера (0 = a8, 63 = h1; белые >0, чёрные <0; 1 п, 2 к, 3 с, 4 л, 5 ф, 6 кр)
const CH_V = [0, 100, 320, 330, 500, 900, 20000];
function chNew() { const b = Array(64).fill(0), k = [4, 2, 3, 5, 6, 3, 2, 4]; for (let c = 0; c < 8; c++) { b[c] = -k[c]; b[8 + c] = -1; b[48 + c] = 1; b[56 + c] = k[c]; } return {b, t: 1, c: [1, 1, 1, 1], ep: -1, hm: 0, n: 0}; }
function chAtt(b, sq, by) {
  const r = sq >> 3, c = sq & 7, at = (rr, cc, p) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === p * by;
  if (at(r + by, c - 1, 1) || at(r + by, c + 1, 1)) return true;
  for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) if (at(r + dr, c + dc, 2)) return true;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && at(r + dr, c + dc, 6)) return true;
  for (const [dr, dc, a] of [[-1, 0, 4], [1, 0, 4], [0, -1, 4], [0, 1, 4], [-1, -1, 3], [-1, 1, 3], [1, -1, 3], [1, 1, 3]]) {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const v = b[rr * 8 + cc]; if (v) { if (v * by > 0 && (Math.abs(v) === a || Math.abs(v) === 5)) return true; break; } rr += dr; cc += dc; }
  }
  return false;
}
function chGen(st, caps) {
  const b = st.b, t = st.t, out = [];
  for (let f = 0; f < 64; f++) {
    const v = b[f]; if (!v || v * t < 0) continue; const p = Math.abs(v), r = f >> 3, c = f & 7;
    const add = (tr, tc) => { if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false; const to = tr * 8 + tc, x = b[to]; if (x * t > 0) return false; if (!caps || x) out.push([f, to, 0]); return !x; };
    if (p === 1) {
      const nr = r - t, pr = nr === 0 || nr === 7 ? 5 : 0;
      if (nr >= 0 && nr < 8) {
        if (!b[nr * 8 + c] && !caps) { out.push([f, nr * 8 + c, pr]); if (r === (t === 1 ? 6 : 1) && !b[(r - 2 * t) * 8 + c]) out.push([f, (r - 2 * t) * 8 + c, 0]); }
        for (const dc of [-1, 1]) { const cc = c + dc; if (cc < 0 || cc > 7) continue; const to = nr * 8 + cc; if ((b[to] * t < 0) || to === st.ep) out.push([f, to, pr]); }
      }
    } else if (p === 2) { for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) add(r + dr, c + dc); }
    else if (p === 6) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(r + dr, c + dc);
      if (!caps) { const base = t === 1 ? 60 : 4, ix = t === 1 ? 0 : 2;
        if (f === base && !chAtt(b, f, -t)) {
          if (st.c[ix] && !b[f + 1] && !b[f + 2] && b[f + 3] === 4 * t && !chAtt(b, f + 1, -t)) out.push([f, f + 2, 0]);
          if (st.c[ix + 1] && !b[f - 1] && !b[f - 2] && !b[f - 3] && b[f - 4] === 4 * t && !chAtt(b, f - 1, -t)) out.push([f, f - 2, 0]);
        } }
    } else {
      const dirs = p === 3 ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : p === 4 ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) { let rr = r + dr, cc = c + dc; while (add(rr, cc)) { rr += dr; cc += dc; } }
    }
  }
  return out;
}
function chApply(st, m) {
  const b = st.b.slice(), [f, to, pr] = m, v = b[f], p = Math.abs(v), t = st.t, cap = b[to] !== 0 || (p === 1 && to === st.ep);
  const c = st.c.slice(); let ep = -1;
  if (p === 1 && to === st.ep && !b[to]) b[to + 8 * t] = 0;
  b[to] = pr ? 5 * t : v; b[f] = 0;
  if (p === 1 && Math.abs(to - f) === 16) ep = (f + to) >> 1;
  if (p === 6) { if (to - f === 2) { b[f + 1] = b[f + 3]; b[f + 3] = 0; } else if (f - to === 2) { b[f - 1] = b[f - 4]; b[f - 4] = 0; } if (t === 1) { c[0] = c[1] = 0; } else { c[2] = c[3] = 0; } }
  if (f === 63 || to === 63) c[0] = 0; if (f === 56 || to === 56) c[1] = 0; if (f === 7 || to === 7) c[2] = 0; if (f === 0 || to === 0) c[3] = 0;
  return {b, t: -t, c, ep, hm: p === 1 || cap ? 0 : st.hm + 1, n: st.n + 1};
}
const chKing = (b, t) => b.indexOf(6 * t);
const chCheck = st => chAtt(st.b, chKing(st.b, st.t), -st.t);
function chLegal(st) { return chGen(st).filter(m => { const s = chApply(st, m), k = chKing(s.b, st.t); return k >= 0 && !chAtt(s.b, k, -st.t); }); }
function chStatus(st) {
  if (!chLegal(st).length) return chCheck(st) ? "mate" : "stalemate";
  if (st.hm >= 100 || st.n >= 240) return "draw";
  let minor = 0; for (const v of st.b) { const p = Math.abs(v); if (p === 1 || p === 4 || p === 5) return ""; if (p === 2 || p === 3) minor++; }
  return minor <= 1 ? "draw" : "";
}
function chEval(st) {
  let s = 0; const b = st.b;
  for (let i = 0; i < 64; i++) { const v = b[i]; if (!v) continue; const p = Math.abs(v), sg = v > 0 ? 1 : -1, r = i >> 3, c = i & 7, cen = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)) * .5 - Math.min(Math.abs(r - 3.5), Math.abs(c - 3.5)) * .5;
    let x = CH_V[p]; if (p === 1) x += (sg > 0 ? 6 - r : r - 1) * 6 + cen * 4; else if (p === 2 || p === 3) x += cen * 9; else if (p === 5) x += cen * 2;
    s += sg * x; }
  return s * st.t;
}
// ход бота: глубина 2 (его ход + ответ), с отсечением и небольшим случайным шумом
function chBest(st, rnd) {
  const moves = chLegal(st); if (!moves.length) return null;
  const sc = m => (st.b[m[1]] ? CH_V[Math.abs(st.b[m[1]])] * 10 - CH_V[Math.abs(st.b[m[0]])] : 0) + (m[2] ? 800 : 0);
  moves.sort((a, b) => sc(b) - sc(a));
  let best = null, bv = -1e9;
  for (const m of moves) {
    const s1 = chApply(st, m); let v;
    if (chCheck(s1)) { if (!chLegal(s1).length) return m; }
    const rep = chGen(s1).sort((a, b) => sc(b) - sc(a)); let worst = 1e9;
    for (const r of rep) { const s2 = chApply(s1, r); const val = chEval({b: s2.b, t: st.t}); if (val < worst) { worst = val; if (worst <= bv) break; } }
    if (!rep.length) worst = 0;
    v = worst + (chCheck(s1) ? 25 : 0) + (rnd ? rnd() * 14 : 0);
    if (v > bv) { bv = v; best = m; }
  }
  return best;
}

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
const RL = new Map(), RL_HEAVY = /^(ns_|bn_|evt_|cz_|ch_|chg_(?!state|list|top)|td_(?!state|list)|fe_|cr_(?!state)|gh_(?!state)|cg_(?!state|list)|dc_|p2_|(offer|accept|cancel)$|chat_send|promo_use|bm_buy|loan_|uc_submit|idea_submit|import|fr_|gift|clan_)/;
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
    if (!u) return J({id, name, state: null, rev: 0, admin: id === ADMIN, mod: id !== ADMIN && (await modIdsOf(db)).includes(id), smod: id !== ADMIN && (await smodIdsOf(db)).includes(id), an: !!(await anarchyOn(db)), badges: bd(id, ""), maint: id === ADMIN ? null : maintT});
    if (u.name !== name) await db.prepare("UPDATE users SET name=? WHERE id=?").bind(name, id).run();
    const un0 = String(user.username || "").slice(0, 40); if ((u.un || "") !== un0) await db.prepare("UPDATE users SET un=? WHERE id=?").bind(un0, id).run();
    return J({id, name, state: u.state ? JSON.parse(u.state) : null, rev: u.rev, admin: id === ADMIN, mod: id !== ADMIN && (await modIdsOf(db)).includes(id), smod: id !== ADMIN && (await smodIdsOf(db)).includes(id), an: !!(await anarchyOn(db)), badges: bd(id, u.badges), banned: !!u.banned, maint: id === ADMIN ? null : maintT});
  }
  if (path === "save") {
    const u = await getUser(db, id);
    let prev = null; if (u && u.state) { try { prev = JSON.parse(u.state); } catch (e) {} }
    const s = clean(b.state, prev, u ? now - (u.upd || now) : 0, prev ? await allowGet(db, id) : null, id === ADMIN); if (!s) return J({error: "Некорректные данные"}, 400);
    const clamped = !!s._clamped; delete s._clamped;
    if (!u) {
      const ins = await db.prepare("INSERT OR IGNORE INTO users (id,name,state,rev,total,cur,upd) VALUES (?,?,?,?,?,?,?)").bind(id, name, JSON.stringify(s), 1, num(s.total), Math.max(0, num(s.pts)), now).run();
      const sp = /^ref_(\d{4,12})$/.exec(String(user.__sp || ""));
      if (ins.meta.changes === 1 && sp && Number(sp[1]) !== id) {
        const rid = Number(sp[1]), ru = await db.prepare("SELECT id FROM users WHERE id=?").bind(rid).first(), cx = await db.prepare("SELECT v FROM kv WHERE k=?").bind("rfc" + rid).first();
        if (ru && (!cx || Number(cx.v) < 100)) {
          await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("rf" + id, String(rid)).run();
          await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("rfc" + rid, String((cx ? Number(cx.v) : 0) + 1)).run();
          await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("rfp" + id, String(rid)).run();
          await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(id, "gems", REF_NEW, 0, now).run();
        }
      }
      await db.prepare("UPDATE users SET un=? WHERE id=?").bind(String(user.username || "").slice(0, 40), id).run();
      const n = await getUser(db, id); return J({rev: n.rev});
    }
    const res = await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, cur=?, name=?, upd=? WHERE id=? AND rev=?").bind(JSON.stringify(s), num(s.total), Math.max(0, num(s.pts)), name, now, id, Number(b.rev)).run();
    if (res.meta.changes === 1 && prev && num(prev.total) < REF_NEED && num(s.total) >= REF_NEED) {
      const rp = await db.prepare("SELECT v FROM kv WHERE k=?").bind("rfp" + id).first();
      if (rp) { await db.prepare("DELETE FROM kv WHERE k=?").bind("rfp" + id).run(); await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(Number(rp.v), "gems", REF_BONUS, 0, now).run(); }
    }
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
  if (adm0 && AUDT[path]) await auditLog(db, id, name, "admin", path, b, now);
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
  if (path === "cz_info") { const j = await jpGet(); return J({jp: (await anarchyOn(db)) ? 999e15 : j.pool, last: j.last}); }
  if (path === "cz_roulette") {
    const bet = Math.floor(Number(b.bet)), pick = String(b.pick);
    if (!(bet >= 100) || !isFinite(bet) || !["r", "b", "g"].includes(pick)) return J({error: "Неверная ставка"});
    const contrib = bet * 0.05;
    await jpGet(); await db.prepare("UPDATE kv SET v=CAST(CAST(v AS REAL)+? AS TEXT) WHERE k='jp'").bind(contrib).run();
    const anJ = !!(await anarchyOn(db)); let sector = crnd(ZN); if (anJ) { for (let i = 0; i < ZN; i++) if (secColor(i) === "j") { sector = i; break; } } const col = secColor(sector); let payout = 0, jackpot = false;
    if (col === "j") { const j = await jpGet(); if (anJ) j.pool = 999e15; payout = bet + j.pool; jackpot = true; await db.prepare("UPDATE kv SET v=? WHERE k='jp'").bind(String(JP_SEED)).run(); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('jplast',?)").bind(JSON.stringify({n: name, a: j.pool, t: now})).run(); }
    else if (col === pick) payout = bet * (pick === "g" ? 24 : 2);
    const j2 = await jpGet(); if (anJ) j2.pool = 999e15;
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
  // ---------- шахматы с ботом, 5 минут на партию; ходы, часы и выплата считаются здесь
  const chKey = "ch" + id, CH_MS = 300000, CH_PAY = 1.9;
  const chGet = async () => { const r = await db.prepare("SELECT v FROM kv WHERE k=?").bind(chKey).first(); return r ? JSON.parse(r.v) : null; };
  const chSave = g => db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(chKey, JSON.stringify(g)).run();
  const chView = (g, pm) => ({s: g.s, bet: g.bet, pm: Math.max(0, Math.round(pm)), om: g.om, lm: g.lm || null, chk: chCheck(g.s)});
  const chrGet = async (uid, nm) => { await db.prepare("INSERT OR IGNORE INTO chr (uid,name,ts) VALUES (?,?,?)").bind(uid, String(nm || "Игрок").slice(0, 40), Math.floor(Date.now() / 1000)).run(); return await db.prepare("SELECT * FROM chr WHERE uid=?").bind(uid).first(); };
  const chrPvp = async (tb, winner) => {
    const a = await chrGet(tb.p1, tb.n1), c = await chrGet(tb.p2, tb.n2), n1 = a.w + a.l + a.d, n2 = c.w + c.l + c.d;
    const sa = winner === 1 ? 1 : winner === 2 ? 0 : .5, ea = 1 / (1 + Math.pow(10, (c.elo - a.elo) / 400));
    const k1 = n1 < 10 ? 40 : 24, k2 = n2 < 10 ? 40 : 24, da = Math.round(k1 * (sa - ea)), dc = Math.round(k2 * ((1 - sa) - (1 - ea)));
    const col = winner === 1 ? ["w", "l"] : winner === 2 ? ["l", "w"] : ["d", "d"], t0 = Math.floor(Date.now() / 1000);
    await db.batch([
      db.prepare("UPDATE chr SET elo=MAX(100,elo+?), " + col[0] + "=" + col[0] + "+1, name=?, ts=? WHERE uid=?").bind(da, String(tb.n1 || "Игрок").slice(0, 40), t0, tb.p1),
      db.prepare("UPDATE chr SET elo=MAX(100,elo+?), " + col[1] + "=" + col[1] + "+1, name=?, ts=? WHERE uid=?").bind(dc, String(tb.n2 || "Игрок").slice(0, 40), t0, tb.p2),
    ]);
  };
  const chrBot = async res => { try { const col = res === "win" ? "bw" : res === "draw" ? "bd" : "bl"; await chrGet(id, name); await db.prepare("UPDATE chr SET " + col + "=" + col + "+1 WHERE uid=?").bind(id).run(); } catch (e) {} };
  const chEnd = async (g, res, why, pm) => {
    const del = await db.prepare("DELETE FROM kv WHERE k=?").bind(chKey).run(); if (del.meta.changes !== 1) return J({error: "Партия уже закончена"});
    const pay = res === "win" ? Math.floor(g.bet * CH_PAY) : res === "draw" ? g.bet : 0;
    await casinoPay(db, id, pay); await chrBot(res);
    return J(Object.assign(chView(g, pm), {done: res, why, pay}));
  };
  if (path === "ch_state") {
    const g = await chGet(); if (!g) return J({none: true});
    const pm = g.pm - (Date.now() - g.last); if (pm <= 0) return chEnd(g, "loss", "time", 0);
    return J(chView(g, pm));
  }
  if (path === "ch_start") {
    const old = await chGet(); if (old) return J(Object.assign(chView(old, old.pm - (Date.now() - old.last)), {resume: true}));
    const bet = Math.floor(Number(b.bet)); if (!(bet >= 100) || !isFinite(bet)) return J({error: "Неверная ставка"});
    const g = {s: chNew(), bet, pm: CH_MS, om: CH_MS, last: Date.now(), lm: null};
    await chSave(g); return J(chView(g, g.pm));
  }
  if (path === "ch_resign") { const g = await chGet(); if (!g) return J({error: "Нет партии"}); return chEnd(g, "loss", "resign", g.pm - (Date.now() - g.last)); }
  if (path === "ch_move") {
    const g = await chGet(); if (!g) return J({error: "Нет партии", none: true});
    const pm = g.pm - (Date.now() - g.last); if (pm <= 0) return chEnd(g, "loss", "time", 0);
    const f = Math.floor(Number(b.f)), t = Math.floor(Number(b.t));
    const mv = chLegal(g.s).find(m => m[0] === f && m[1] === t); if (!mv) return J(Object.assign(chView(g, pm), {error: "Так ходить нельзя", bad: true}));
    let s = chApply(g.s, mv); g.s = s; g.lm = [f, t]; g.pm = pm; g.last = Date.now();
    let st = chStatus(s); if (st === "mate") return chEnd(g, "win", "mate", pm); if (st) return chEnd(g, "draw", st, pm);
    const bm = chBest(s, Math.random); s = chApply(s, bm); g.s = s; g.lm = [bm[0], bm[1]]; g.om = Math.max(0, g.om - 800 - Math.floor(Math.random() * 3500));
    st = chStatus(s); if (st === "mate") return chEnd(g, "loss", "mate", pm); if (st) return chEnd(g, "draw", st, pm);
    await chSave(g); return J(chView(g, pm));
  }
  // ---------- шахматы вдвоём: часы по 5 минут у каждого, ходы и выплата считаются здесь
  const cgFinish = async (g, winner, why) => {
    const pot = g.stake * 2, fee = winner ? pot * 0.05 : 0, res = {winner, why, pay1: winner === 1 ? pot - fee : winner === 0 ? g.stake : 0, pay2: winner === 2 ? pot - fee : winner === 0 ? g.stake : 0};
    const r = await db.prepare("UPDATE chg SET status='done', res=? WHERE id=? AND status='play'").bind(JSON.stringify(res), g.id).run();
    if (r.meta.changes === 1 && fee) { await jpGet(); await db.prepare("UPDATE kv SET v=CAST(CAST(v AS REAL)+? AS TEXT) WHERE k='jp'").bind(fee).run(); }
    if (r.meta.changes === 1) { try { await chrPvp(g, winner); } catch (e) {} }
  };
  const cgClock = g => { const el = Date.now() - g.last, s = JSON.parse(g.s), run = g.status === "play"; return {t1: Math.max(0, g.t1 - (run && s.t === 1 ? el : 0)), t2: Math.max(0, g.t2 - (run && s.t === -1 ? el : 0))}; };
  const cgTick = async g => {
    if (g.status !== "play") return g; const c = cgClock(g);
    if (c.t1 <= 0 || c.t2 <= 0) { await cgFinish(g, c.t1 <= 0 ? 2 : 1, "time"); return await db.prepare("SELECT * FROM chg WHERE id=?").bind(g.id).first(); }
    return g;
  };
  const cgView = (g, me) => {
    const seat = g.p1 === me ? 1 : 2, s = JSON.parse(g.s || "null"), c = g.s ? cgClock(g) : {t1: 300000, t2: 300000};
    const out = {id: g.id, status: g.status, stake: g.stake, seat, n1: g.n1, n2: g.n2, s, t1: Math.round(c.t1), t2: Math.round(c.t2), lm: g.lm ? JSON.parse(g.lm) : null, chk: s ? chCheck(s) : false};
    if (g.status === "done") { const r = JSON.parse(g.res); out.winner = r.winner; out.why = r.why; out.pay = seat === 1 ? r.pay1 : r.pay2; out.claimed = !!g["c" + seat]; }
    if (g.status === "cancel") { out.pay = seat === 1 ? g.stake : 0; out.claimed = !!g["c" + seat]; }
    return out;
  };
  const cgMine = async tid => await db.prepare("SELECT * FROM chg WHERE id=? AND (p1=? OR p2=?)").bind(tid, id, id).first();
  const cgActive = async () => await db.prepare("SELECT id FROM chg WHERE (p1=? OR p2=?) AND status IN ('wait','play') ORDER BY id DESC LIMIT 1").bind(id, id).first();
  if (path === "cg_list") {
    await db.prepare("UPDATE chg SET status='cancel' WHERE status='wait' AND ts<?").bind(now - 1800).run();
    const stale = (await db.prepare("SELECT * FROM chg WHERE status='play'").all()).results; for (const t of stale) if (t.p1 === id || t.p2 === id || Date.now() - t.last > 330000) await cgTick(t);
    const rows = (await db.prepare("SELECT id,n1,stake FROM chg WHERE status='wait' AND p1!=? ORDER BY id DESC LIMIT 20").bind(id).all()).results;
    const act = await cgActive();
    const claims = (await db.prepare("SELECT id FROM chg WHERE ((p1=? AND c1=0) OR (p2=? AND c2=0)) AND status IN ('done','cancel') ORDER BY id DESC LIMIT 5").bind(id, id).all()).results.map(x => x.id);
    return J({rows, mine: act ? act.id : 0, claims});
  }
  if (path === "cg_create") {
    const stake = Math.floor(Number(b.stake)); if (!(stake >= 100) || !isFinite(stake)) return J({error: "Неверная ставка"});
    if (await cgActive()) return J({error: "У тебя уже есть активная партия"});
    const r = await db.prepare("INSERT INTO chg (p1,n1,stake,ts) VALUES (?,?,?,?)").bind(id, name, stake, now).run();
    return J({ok: true, id: r.meta.last_row_id});
  }
  if (path === "cg_join") {
    const g = await db.prepare("SELECT * FROM chg WHERE id=? AND status='wait'").bind(Number(b.id)).first();
    if (!g) return J({error: "Стол уже занят или закрыт"}); if (g.p1 === id) return J({error: "Это твой стол"});
    if (await cgActive()) return J({error: "У тебя уже есть активная партия"});
    const r = await db.prepare("UPDATE chg SET p2=?, n2=?, status='play', s=?, last=? WHERE id=? AND status='wait' AND p1!=?").bind(id, name, JSON.stringify(chNew()), Date.now(), g.id, id).run();
    if (r.meta.changes !== 1) return J({error: "Стол уже занят"});
    tg0(g.p1, "К твоему столу в шахматы сел " + name + "! Заходи в игру, ты играешь белыми.");
    return J({ok: true, id: g.id, stake: g.stake});
  }
  if (path === "cg_cancel") {
    const r = await db.prepare("UPDATE chg SET status='cancel' WHERE id=? AND p1=? AND status='wait'").bind(Number(b.id), id).run();
    return J(r.meta.changes === 1 ? {ok: true} : {error: "Стол уже занят"});
  }
  if (path === "cg_state") {
    let g = await cgMine(Number(b.id)); if (!g) return J({error: "Партия не найдена"});
    g = await cgTick(g); return J(cgView(g, id));
  }
  if (path === "cg_move" || path === "cg_resign") {
    let g = await cgMine(Number(b.id)); if (!g) return J({error: "Партия не найдена"});
    g = await cgTick(g); if (g.status !== "play") return J(cgView(g, id));
    const seat = g.p1 === id ? 1 : 2;
    if (path === "cg_resign") { await cgFinish(g, 3 - seat, "resign"); return J(cgView(await db.prepare("SELECT * FROM chg WHERE id=?").bind(g.id).first(), id)); }
    const s = JSON.parse(g.s); if (s.t !== (seat === 1 ? 1 : -1)) return J(Object.assign(cgView(g, id), {error: "Сейчас ход соперника"}));
    const f = Math.floor(Number(b.f)), t = Math.floor(Number(b.t));
    const mv = chLegal(s).find(m => m[0] === f && m[1] === t); if (!mv) return J(Object.assign(cgView(g, id), {error: "Так ходить нельзя", bad: true}));
    const c = cgClock(g), n = chApply(s, mv), st = chStatus(n), t1 = Math.round(c.t1), t2 = Math.round(c.t2);
    await db.prepare("UPDATE chg SET s=?, t1=?, t2=?, last=?, lm=? WHERE id=? AND status='play'").bind(JSON.stringify(n), t1, t2, Date.now(), JSON.stringify([f, t]), g.id).run();
    const g2 = await db.prepare("SELECT * FROM chg WHERE id=?").bind(g.id).first();
    if (st) { await cgFinish(g2, st === "mate" ? seat : 0, st); }
    return J(cgView(await db.prepare("SELECT * FROM chg WHERE id=?").bind(g.id).first(), id));
  }
  if (path === "cg_claim") {
    const g = await db.prepare("SELECT * FROM chg WHERE id=? AND (p1=? OR p2=?) AND status IN ('done','cancel')").bind(Number(b.id), id, id).first(); if (!g) return J({error: "Нечего забирать"});
    const seat = g.p1 === id ? 1 : 2; if (g.status === "cancel" && seat !== 1) return J({amount: 0});
    const r = await db.prepare("UPDATE chg SET c" + seat + "=1 WHERE id=? AND c" + seat + "=0").bind(g.id).run(); if (r.meta.changes !== 1) return J({amount: 0});
    let amount = g.stake; if (g.status === "done") { const res = JSON.parse(g.res); amount = seat === 1 ? res.pay1 : res.pay2; }
    await casinoPay(db, id, amount);
    return J({amount});
  }
  // ---------- шахматы на двоих: столики, ставка, часы по 5 минут у каждого
  const chgMine = async tid => await db.prepare("SELECT * FROM chg WHERE id=? AND (p1=? OR p2=?)").bind(tid, id, id).first();
  const chgActive = async () => await db.prepare("SELECT id FROM chg WHERE (p1=? OR p2=?) AND status IN ('wait','play') ORDER BY id DESC LIMIT 1").bind(id, id).first();
  const chgLive = tb => { const t = JSON.parse(tb.s).t, el = Date.now() - tb.last; return {w: tb.tw - (t === 1 ? el : 0), b: tb.tb - (t === -1 ? el : 0)}; };
  const chgFinish = async (tb, winner, why) => {
    const pot = tb.stake * 2, fee = winner ? pot * 0.05 : 0, res = {winner, why, pay1: winner === 1 ? pot - fee : winner === 0 ? tb.stake : 0, pay2: winner === 2 ? pot - fee : winner === 0 ? tb.stake : 0};
    const r = await db.prepare("UPDATE chg SET status='done', res=? WHERE id=? AND status='play'").bind(JSON.stringify(res), tb.id).run();
    if (r.meta.changes === 1 && fee) { await jpGet(); await db.prepare("UPDATE kv SET v=CAST(CAST(v AS REAL)+? AS TEXT) WHERE k='jp'").bind(fee).run(); }
    if (r.meta.changes === 1) { try { await chrPvp(tb, winner); } catch (e) {} }
  };
  const chgTick = async tb => {
    if (tb.status !== "play") return tb;
    const lv = chgLive(tb), t = JSON.parse(tb.s).t;
    if ((t === 1 ? lv.w : lv.b) <= 0) { await chgFinish(tb, t === 1 ? (tb.w === 1 ? 2 : 1) : (tb.w === 1 ? 1 : 2), "time"); return await db.prepare("SELECT * FROM chg WHERE id=?").bind(tb.id).first(); }
    return tb;
  };
  const chgView = (tb, me) => {
    const seat = tb.p1 === me ? 1 : 2, color = tb.w === seat ? 1 : -1, done = tb.status === "done", res = done ? JSON.parse(tb.res) : null;
    const out = {id: tb.id, status: tb.status, stake: tb.stake, seat, me: color, opp: seat === 1 ? tb.n2 : tb.n1, v: tb.v};
    if (tb.s) { const s = JSON.parse(tb.s), lv = tb.status === "play" ? chgLive(tb) : {w: tb.tw, b: tb.tb}; out.s = s; out.lm = tb.lm ? JSON.parse(tb.lm) : null; out.chk = chCheck(s); out.pm = Math.max(0, Math.round(color === 1 ? lv.w : lv.b)); out.om = Math.max(0, Math.round(color === 1 ? lv.b : lv.w)); }
    if (done) { out.winner = res.winner === 0 ? 0 : res.winner === seat ? 1 : 2; out.why = res.why; out.pay = seat === 1 ? res.pay1 : res.pay2; out.claimed = !!tb["c" + seat]; }
    if (tb.status === "cancel") { out.pay = seat === 1 ? tb.stake : 0; out.claimed = !!tb["c" + seat]; }
    return out;
  };
  if (path === "chg_list") {
    await db.prepare("UPDATE chg SET status='cancel' WHERE status='wait' AND ts<?").bind(now - 1800).run();
    const stale = (await db.prepare("SELECT * FROM chg WHERE status='play' AND last<? LIMIT 20").bind(Date.now() - 20000).all()).results; for (const t of stale) await chgTick(t);
    const rows = (await db.prepare("SELECT id,n1,stake FROM chg WHERE status='wait' AND p1!=? ORDER BY id DESC LIMIT 20").bind(id).all()).results;
    const act = await chgActive();
    const claims = (await db.prepare("SELECT id FROM chg WHERE ((p1=? AND c1=0) OR (p2=? AND c2=0)) AND status IN ('done','cancel') ORDER BY id DESC LIMIT 5").bind(id, id).all()).results.map(x => x.id);
    return J({rows, mine: act ? act.id : 0, claims});
  }
  if (path === "chg_create") {
    const stake = Math.floor(Number(b.stake)); if (!(stake >= 100) || !isFinite(stake)) return J({error: "Неверная ставка"});
    if (await chgActive()) return J({error: "У тебя уже есть активный столик"});
    const r = await db.prepare("INSERT INTO chg (p1,n1,stake,ts) VALUES (?,?,?,?)").bind(id, name, stake, now).run();
    return J({ok: true, id: r.meta.last_row_id});
  }
  if (path === "chg_join") {
    const tb = await db.prepare("SELECT * FROM chg WHERE id=? AND status='wait'").bind(Number(b.id)).first();
    if (!tb) return J({error: "Столик уже занят или закрыт"}); if (tb.p1 === id) return J({error: "Это твой столик"});
    if (await chgActive()) return J({error: "У тебя уже есть активный столик"});
    const r = await db.prepare("UPDATE chg SET p2=?, n2=?, status='play', w=?, s=?, last=? WHERE id=? AND status='wait' AND p1!=?").bind(id, name, crnd(2) + 1, JSON.stringify(chNew()), Date.now(), tb.id, id).run();
    if (r.meta.changes !== 1) return J({error: "Столик уже занят"});
    tg0(tb.p1, "К твоему столику в шахматы сел " + name + "! Заходи в игру.");
    return J({ok: true, id: tb.id, stake: tb.stake});
  }
  if (path === "chg_cancel") {
    const r = await db.prepare("UPDATE chg SET status='cancel' WHERE id=? AND p1=? AND status='wait'").bind(Number(b.id), id).run();
    return J(r.meta.changes === 1 ? {ok: true} : {error: "Столик уже занят"});
  }
  if (path === "chg_state") {
    let tb = await chgMine(Number(b.id)); if (!tb) return J({error: "Столик не найден"});
    tb = await chgTick(tb); return J(chgView(tb, id));
  }
  if (path === "chg_resign") {
    let tb = await chgMine(Number(b.id)); if (!tb || tb.status !== "play") return J({error: "Игра не идёт"});
    await chgFinish(tb, tb.p1 === id ? 2 : 1, "resign");
    tb = await db.prepare("SELECT * FROM chg WHERE id=?").bind(tb.id).first(); return J(chgView(tb, id));
  }
  if (path === "chg_move") {
    let tb = await chgMine(Number(b.id)); if (!tb || tb.status !== "play") return J({error: "Игра не идёт"});
    tb = await chgTick(tb); if (tb.status !== "play") return J(chgView(tb, id));
    const seat = tb.p1 === id ? 1 : 2, color = tb.w === seat ? 1 : -1, s = JSON.parse(tb.s);
    if (s.t !== color) return J(Object.assign(chgView(tb, id), {error: "Сейчас не твой ход"}));
    const f = Math.floor(Number(b.f)), t = Math.floor(Number(b.t));
    const mv = chLegal(s).find(m => m[0] === f && m[1] === t); if (!mv) return J(Object.assign(chgView(tb, id), {error: "Так ходить нельзя"}));
    const lv = chgLive(tb), s2 = chApply(s, mv);
    const r = await db.prepare("UPDATE chg SET s=?, lm=?, tw=?, tb=?, last=?, v=v+1 WHERE id=? AND status='play' AND v=?").bind(JSON.stringify(s2), JSON.stringify([f, t]), Math.round(lv.w), Math.round(lv.b), Date.now(), tb.id, tb.v).run();
    if (r.meta.changes !== 1) return J({error: "Не успел, попробуй ещё раз"});
    const st = chStatus(s2);
    if (st) { const t2 = await db.prepare("SELECT * FROM chg WHERE id=?").bind(tb.id).first(); await chgFinish(t2, st === "mate" ? seat : 0, st); }
    tb = await db.prepare("SELECT * FROM chg WHERE id=?").bind(tb.id).first(); return J(chgView(tb, id));
  }
  if (path === "chg_claim") {
    const tb = await db.prepare("SELECT * FROM chg WHERE id=? AND (p1=? OR p2=?) AND status IN ('done','cancel')").bind(Number(b.id), id, id).first(); if (!tb) return J({error: "Нечего забирать"});
    const seat = tb.p1 === id ? 1 : 2; if (tb.status === "cancel" && seat !== 1) return J({amount: 0});
    const r = await db.prepare("UPDATE chg SET c" + seat + "=1 WHERE id=? AND c" + seat + "=0").bind(tb.id).run(); if (r.meta.changes !== 1) return J({amount: 0});
    let amount = tb.stake; if (tb.status === "done") { const res = JSON.parse(tb.res); amount = seat === 1 ? res.pay1 : res.pay2; }
    await casinoPay(db, id, amount);
    return J({amount});
  }
  if (path === "chg_top") {
    const top = (await db.prepare("SELECT uid,name,elo,w,l,d FROM chr WHERE w+l+d>0 ORDER BY elo DESC, w DESC LIMIT 20").all()).results;
    const me = await chrGet(id, name), rank = me.w + me.l + me.d > 0 ? (await db.prepare("SELECT COUNT(*) AS c FROM chr WHERE w+l+d>0 AND elo>?").bind(me.elo).first()).c + 1 : 0;
    return J({top, me: {elo: me.elo, w: me.w, l: me.l, d: me.d, bw: me.bw, bl: me.bl, bd: me.bd, rank}, id});
  }
  // ---------- кот-призрак: странник ходит в гости, табличка у хозяина живёт неделю
  const GH_T = 6 * 3600, GH_KEEP = 7 * 86400;
  if (path === "gh_state") {
    await db.prepare("DELETE FROM ghost WHERE ts<?").bind(now - GH_KEEP - 86400).run();
    const mine = await db.prepare("SELECT id,tname,cat,rar,ts,ret,claimed FROM ghost WHERE frm=? AND claimed=0 ORDER BY id DESC LIMIT 1").bind(id).first();
    const traces = (await db.prepare("SELECT id,fname,cat,rar,ts,taken FROM ghost WHERE tou=? AND ts>? ORDER BY id DESC LIMIT 20").bind(id, now - GH_KEEP).all()).results.map(r => ({...r, left: r.ts + GH_KEEP - now}));
    const sent = (await db.prepare("SELECT COUNT(*) AS c FROM ghost WHERE frm=? AND claimed=1").bind(id).first()).c;
    return J({mine, traces, now, sent});
  }
  if (path === "gh_send") {
    const cat = Math.floor(Number(b.cat)), rar = Math.max(0, Math.min(9, Math.floor(Number(b.rar)) || 0));
    if (!Number.isInteger(cat) || cat < 0) return J({error: "Выбери кота"});
    const u = await getUser(db, id); if (!u || !u.state) return J({error: "Игрок не найден"});
    const s = JSON.parse(u.state); if (!s.inv || !(s.inv[String(cat)] > 0)) return J({error: "У тебя нет такого кота"});
    if (await db.prepare("SELECT id FROM ghost WHERE frm=? AND claimed=0").bind(id).first()) return J({error: "Твой кот уже в пути"});
    let t = null;
    if (Math.random() < .5) t = await db.prepare("SELECT u.id,u.name FROM friends f JOIN users u ON u.id=CASE WHEN f.a=? THEN f.b ELSE f.a END WHERE f.st=1 AND (f.a=? OR f.b=?) AND u.state IS NOT NULL AND u.banned=0 ORDER BY RANDOM() LIMIT 1").bind(id, id, id).first();
    if (!t) t = await db.prepare("SELECT id,name FROM users WHERE id<>? AND state IS NOT NULL AND banned=0 AND seen>? ORDER BY RANDOM() LIMIT 1").bind(id, now - 14 * 86400).first();
    if (!t) return J({error: "Пока некуда идти: в игре мало людей"});
    await db.prepare("INSERT INTO ghost (frm,fname,tou,tname,cat,rar,ts,ret) VALUES (?,?,?,?,?,?,?,?)").bind(id, name, t.id, String(t.name || "Игрок").slice(0, 24), cat, rar, now, now + GH_T).run();
    return J({ok: true, tname: t.name, ret: now + GH_T});
  }
  if (path === "gh_claim") {
    const g = await db.prepare("SELECT * FROM ghost WHERE frm=? AND claimed=0 ORDER BY id DESC LIMIT 1").bind(id).first(); if (!g) return J({error: "Кот никуда не ходил"});
    if (g.ret > now) return J({error: "Кот ещё в пути", left: g.ret - now});
    const r = await db.prepare("UPDATE ghost SET claimed=1 WHERE id=? AND claimed=0").bind(g.id).run(); if (r.meta.changes !== 1) return J({error: "Уже забрано"});
    const u = await getUser(db, id), tot = Math.max(0, num(u && u.total));
    const gems = 1 + Math.floor(g.rar / 2), pts = Math.round(Math.min(1e13, Math.max(5000, tot * .0008 * (1 + g.rar * .5))));
    await allowAdd(db, id, pts, gems);
    return J({pts, gems, tname: g.tname});
  }
  if (path === "gh_take") {
    const r = await db.prepare("UPDATE ghost SET taken=1 WHERE id=? AND tou=? AND taken=0 AND ts>?").bind(Number(b.id), id, now - GH_KEEP).run();
    if (r.meta.changes !== 1) return J({error: "Подарок уже забран"});
    const g = await db.prepare("SELECT rar FROM ghost WHERE id=?").bind(Number(b.id)).first(), gems = 1 + (g && g.rar >= 4 ? 1 : 0);
    await allowAdd(db, id, 0, gems);
    return J({gems});
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
  if (path === "ref_info") { const cx = await db.prepare("SELECT v FROM kv WHERE k=?").bind("rfc" + id).first(); return J({count: cx ? Number(cx.v) : 0, bonus: REF_BONUS, welcome: REF_NEW}); }
  if (path === "daily_info" || path === "daily_claim") {
    const dayN = Math.floor((now + 7200) / 86400), kk = "dl" + id, kx = await db.prepare("SELECT v FROM kv WHERE k=?").bind(kk).first();
    let d = {d: 0, s: 0}; try { if (kx) d = JSON.parse(kx.v); } catch (e) {}
    if (d.d && dayN - d.d > 1) d.s = 0;
    const can = d.d !== dayN;
    if (path === "daily_info") return J({can, streak: d.s, rewards: DAILY_R});
    if (!can) return J({error: "Сегодня уже получено"});
    const g = DAILY_R[d.s % 7], old = kx ? kx.v : null;
    await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(kk, JSON.stringify({d: dayN, s: d.s + 1})).run();
    const r = await mutate(db, id, st => { st.gems = num(st.gems) + g; });
    if (r.error) { if (old) await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(kk, old).run(); else await db.prepare("DELETE FROM kv WHERE k=?").bind(kk).run(); return J(r); }
    return J({...r, gems: g, streak: d.s + 1, rewards: DAILY_R});
  }
  if (path === "wm_info" || path === "wm_water") {
    // Мировой арбуз: весь сервер поливает общий арбуз монетами; созрел -> кристаллы участникам и бонус дохода всем
    const goalOf = r => Math.min(20000, 3000 + 500 * r), WM_COOL = 600;
    await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES ('wr','1')").run(); await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES ('wp','0')").run();
    const rd = async () => ({r: Number((await db.prepare("SELECT v FROM kv WHERE k='wr'").first()).v), p: Number((await db.prepare("SELECT v FROM kv WHERE k='wp'").first()).v)});
    const info = async extra => {
      const {r, p} = await rd(), mine = await db.prepare("SELECT v FROM kv WHERE k=?").bind("wc" + r + ":" + id).first();
      const top = (await db.prepare("SELECT k,v FROM kv WHERE k LIKE ? ORDER BY CAST(v AS INTEGER) DESC LIMIT 5").bind("wc" + r + ":%").all()).results;
      const names = {}; for (const t of top) { const uid = Number(t.k.split(":")[1]), u = await db.prepare("SELECT name FROM users WHERE id=?").bind(uid).first(); names[uid] = u ? u.name : "?"; }
      const lt = await db.prepare("SELECT v FROM kv WHERE k='wl'").first(), tt = await db.prepare("SELECT v FROM kv WHERE k=?").bind("wt" + id).first();
      let last = null; try { last = lt ? JSON.parse(lt.v) : null; } catch (e) {}
      return {r, p, goal: goalOf(r), my: mine ? Number(mine.v) : 0, top: top.map(t => ({id: Number(t.k.split(":")[1]), name: names[Number(t.k.split(":")[1])], ml: Number(t.v)})), last, cd: Math.max(0, (tt ? Number(tt.v) : 0) + WM_COOL - now), ...extra};
    };
    if (path === "wm_info") return J(await info({}));
    const amt = Math.floor(Number(b.amt));
    if (!Number.isFinite(amt) || amt < 1000) return J({error: "Минимум 1 000 монет"});
    const tt = await db.prepare("SELECT v FROM kv WHERE k=?").bind("wt" + id).first();
    if (tt && now - Number(tt.v) < WM_COOL) return J({error: "Арбуз ещё впитывает воду, подожди"});
    await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("wt" + id, String(now)).run();
    const mr = await mutate(db, id, st => { if (num(st.pts) < amt) return "Не хватает монет"; st.pts -= amt; });
    if (mr.error) { await db.prepare("DELETE FROM kv WHERE k=?").bind("wt" + id).run(); return J(mr); }
    const ml = Math.floor(Math.pow(Math.log10(amt), 2)), cur = (await rd()).r, ck = "wc" + cur + ":" + id;
    await db.prepare("INSERT OR IGNORE INTO kv (k,v) VALUES (?,'0')").bind(ck).run();
    await db.prepare("UPDATE kv SET v=CAST(CAST(v AS INTEGER)+? AS TEXT) WHERE k=?").bind(ml, ck).run();
    await db.prepare("UPDATE kv SET v=CAST(CAST(v AS REAL)+? AS TEXT) WHERE k='wp'").bind(ml).run();
    let harvest = false; const st2 = await rd();
    if (st2.p >= goalOf(st2.r)) {
      const adv = await db.prepare("UPDATE kv SET v=CAST(CAST(v AS INTEGER)+1 AS TEXT) WHERE k='wr' AND CAST(v AS INTEGER)=?").bind(st2.r).run();
      if (adv.meta.changes === 1) {
        harvest = true; await db.prepare("UPDATE kv SET v=CAST(MAX(0, CAST(v AS REAL)-?) AS TEXT) WHERE k='wp'").bind(goalOf(st2.r)).run();
        const parts = (await db.prepare("SELECT k,v FROM kv WHERE k LIKE ? ORDER BY CAST(v AS INTEGER) DESC").bind("wc" + st2.r + ":%").all()).results, tops = [];
        for (let i = 0; i < parts.length; i++) {
          const uid = Number(parts[i].k.split(":")[1]), g = 10 + (i < 3 ? [30, 20, 10][i] : 0);
          await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(uid, "gems", g, 0, now).run();
          if (i < 3) { const u = await db.prepare("SELECT name FROM users WHERE id=?").bind(uid).first(); tops.push({id: uid, name: u ? u.name : "?", ml: Number(parts[i].v)}); }
        }
        await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('wl',?)").bind(JSON.stringify({r: st2.r, n: parts.length, top: tops, at: now})).run();
        const ex = await db.prepare("SELECT v FROM kv WHERE k='evt'").first(); let live = false; try { if (ex) { const e0 = JSON.parse(ex.v); live = e0.until > now && e0.from <= now && e0.mult >= 1.5; } } catch (e) {}
        if (!live) await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('evt',?)").bind(JSON.stringify({id: "wm" + st2.r, name: "Мировой арбуз созрел", mult: 1.5, from: now, until: now + 1800})).run();
      }
    }
    return J({...mr, ml, harvest, info: await info({})});
  }
  if (path === "season_top") {
    await seasonEnsure(db, now);
    const rows = (await db.prepare(SEASON_Q).all()).results.map(r => ({...r, badges: bd(r.id, r.badges)})); await addPh(db, rows, "id");
    const u = await getUser(db, id), bx = await db.prepare("SELECT v FROM kv WHERE k=?").bind("sb" + id).first(); let myScore = 0, rank = 0;
    if (u) { myScore = Math.max(0, num(u.total) - (bx ? Number(bx.v) : 0)); if (myScore > 0) rank = (await db.prepare("SELECT COUNT(*)+1 AS r FROM users u LEFT JOIN kv k ON k.k='sb'||u.id WHERE u.banned<2 AND u.total - COALESCE(CAST(k.v AS REAL),0) > ?").bind(myScore).first()).r; }
    const pr = await db.prepare("SELECT v FROM kv WHERE k='sres'").first(); let prev = null; try { prev = pr ? JSON.parse(pr.v) : null; } catch (e) {}
    return J({rows, rank, myScore, ends: seasonEnd(now), rew: SEASON_REW, prev});
  }
  if (path === "coll_info" || path === "coll_claim") {
    const u = await getUser(db, id); if (!u || !u.state) return J({error: "Нет данных"});
    const st = JSON.parse(u.state), n = Object.keys(st.inv || {}).filter(k => +k < N_ITEMS && +k !== 70 && +k !== 71).length;
    const cx = await db.prepare("SELECT v FROM kv WHERE k=?").bind("cm" + id).first(); let claimed = []; try { claimed = cx ? JSON.parse(cx.v) : []; } catch (e) {}
    if (path === "coll_info") return J({n, claimed, ms: COLL_MS});
    const i = Number(b.i); if (!Number.isInteger(i) || !COLL_MS[i]) return J({error: "Нет такой награды"});
    if (n < COLL_MS[i][0]) return J({error: "Нужно собрать ещё"}); if (claimed.includes(i)) return J({error: "Уже получено"});
    claimed.push(i); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("cm" + id, JSON.stringify(claimed)).run();
    const r = await mutate(db, id, s2 => { s2.gems = num(s2.gems) + COLL_MS[i][1]; }); if (r.error) { claimed.pop(); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("cm" + id, JSON.stringify(claimed)).run(); return J(r); }
    return J({...r, n, claimed, ms: COLL_MS, gems: COLL_MS[i][1]});
  }
  if (path === "poll") {
    await seasonEnsure(db, now);
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
    let chaos = null, an = null; try { an = await anarchyOn(db); const ch = await db.prepare("SELECT v FROM kv WHERE k='chaos'").first(); if (ch) { const c = JSON.parse(ch.v); const l = (Array.isArray(c) ? c : [c]).filter(x => x.until > now); if (l.length) chaos = l; } } catch (e) {}
    let fl = []; if (an) { try { const f = await db.prepare("SELECT v FROM kv WHERE k='floats'").first(); if (f) fl = JSON.parse(f.v).slice(-10); } catch (e) {} }
    return J({clb, evt, uc, an: !!an, chaos, fl, grants: g, bc, maxbc, online, rev: u ? u.rev : 0, banned: !!(u && u.banned), badges: bd(id, u && u.badges), maintA: id === ADMIN ? maintT : undefined, maint: null});
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
      const rows = (await db.prepare("SELECT c.id,c.name,c.owner,c.icon,c.mode,c.descr,c.bank,c.badges,c.style,(SELECT v FROM kv WHERE k='ci'||c.id) AS img," + score + " AS score,(SELECT COUNT(*) FROM clan_m m WHERE m.cid=c.id) AS n FROM clans c ORDER BY score DESC LIMIT 30").all()).results.map(r => ({...r, badges: r.badges || "", style: r.style || "", img: r.img || "", level: clLevel(r.bank)}));
      return J({rows, mine: my ? my.cid : 0, max: CL_MAX});
    }
    if (path === "clan_info") {
      const cid = Number(b.id) || (my ? my.cid : 0); if (!cid) return J({clan: null, inv: await (async () => { const iv = await db.prepare("SELECT v FROM kv WHERE k=?").bind("inv" + id).first(); if (!iv) return null; const c = await db.prepare("SELECT id,name,icon FROM clans WHERE id=?").bind(Number(iv.v)).first(); return c || null; })(), myreq: ((await db.prepare("SELECT cid FROM clan_req WHERE uid=?").bind(id).first()) || {}).cid || 0});
      const c = await db.prepare("SELECT c.id,c.name,c.owner,c.icon,c.mode,c.descr,c.bank,c.badges,c.style," + score + " AS score FROM clans c WHERE c.id=?").bind(cid).first(); if (!c) return J({clan: null});
      c.level = clLevel(c.bank); c.next = CL_LV[c.level] || 0; c.badges = c.badges || ""; c.style = c.style || "";
      try { const ix = await db.prepare("SELECT v FROM kv WHERE k=?").bind("ci" + cid).first(); c.img = ix ? ix.v : ""; } catch (e) { c.img = ""; }
      try { const bx = await db.prepare("SELECT v FROM kv WHERE k=?").bind("cb" + cid).first(); c.bnimg = bx ? bx.v : ""; } catch (e) { c.bnimg = ""; }
      const mem = (await db.prepare("SELECT u.id,u.name,u.total,u.seen,u.badges,m.role,m.don FROM clan_m m JOIN users u ON u.id=m.uid WHERE m.cid=? ORDER BY m.role DESC, u.total DESC LIMIT 40").bind(cid).all()).results.map(r => ({id: r.id, name: r.name, total: r.total, role: r.id === c.owner ? 2 : r.role, don: r.don || 0, online: (r.seen || 0) > now - 40, badges: bd(r.id, r.badges)}));
      await addPh(db, mem, "id");
      const reqs = my && my.cid === cid && role >= 1 ? (await db.prepare("SELECT r.uid AS id,u.name,u.total FROM clan_req r JOIN users u ON u.id=r.uid WHERE r.cid=? LIMIT 30").bind(cid).all()).results : [];
      const myreq = my ? 0 : ((await db.prepare("SELECT cid FROM clan_req WHERE uid=?").bind(id).first()) || {}).cid || 0;
      let owned = []; if (my && my.cid === cid && role >= 2) { const ox = await db.prepare("SELECT v FROM kv WHERE k=?").bind("cso" + cid).first(); owned = ox ? JSON.parse(ox.v) : []; }
      const ct = my && my.cid === cid ? ctView(await ctLoad(db, cid, c.bank, mem.length, now)) : null;
      return J({clan: c, ct, owned, members: mem, reqs, mine: my ? my.cid : 0, myrole: my && my.cid === cid ? (c.owner === id ? 2 : role) : -1, myreq, max: CL_MAX});
    }
    if (path === "clan_create") {
      if (my) return J({error: "Ты уже в клане"});
      const nm = String(b.name || "").replace(/[<>&"]/g, "").trim().slice(0, 20); if (nm.length < 3) return J({error: "Название от 3 символов"});
      const u0 = await getUser(db, id); if (!u0 || num(u0.total) < 1e6) return J({error: "Клан можно создать, накопив 1 000 000 монет"});
      const icon = [..."🛡⚔🔥🍉🐱👑🌟🚀💎🦁🐉🌈"].includes(String(b.icon || "")) ? String(b.icon) : "🛡";
      const r = await db.prepare("INSERT OR IGNORE INTO clans (name,owner,ts,icon) VALUES (?,?,?,?)").bind(nm, id, now, icon).run(); if (r.meta.changes !== 1) return J({error: "Такое название занято"});
      await db.prepare("INSERT OR REPLACE INTO clan_m (uid,cid,ts,role) VALUES (?,?,?,2)").bind(id, r.meta.last_row_id, now).run();
      await db.prepare("DELETE FROM clan_req WHERE uid=?").bind(id).run();
      const im0 = String(b.img || ""); if (im0 && CL_IMG.test(im0) && im0.length <= 16000) await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("ci" + r.meta.last_row_id, im0).run();
      return J({ok: true, id: r.meta.last_row_id});
    }
    if (path === "clan_invite") {
      if (!my || role < 1) return J({error: "Звать игроков могут глава и офицеры"});
      const u = await findUser(db, b.q); if (!u) return J({error: "Игрок не найден"});
      if (await db.prepare("SELECT cid FROM clan_m WHERE uid=?").bind(u.id).first()) return J({error: "Игрок уже в клане"});
      if ((await cnt(my.cid)) >= CL_MAX) return J({error: "В клане нет мест"});
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("inv" + u.id, String(my.cid)).run();
      return J({ok: true, name: u.name});
    }
    if (path === "clan_inv_ok" || path === "clan_inv_no") {
      const iv = await db.prepare("SELECT v FROM kv WHERE k=?").bind("inv" + id).first(); if (!iv) return J({error: "Приглашения нет"});
      await db.prepare("DELETE FROM kv WHERE k=?").bind("inv" + id).run(); if (path === "clan_inv_no") return J({ok: true});
      if (my) return J({error: "Ты уже в клане"});
      const cid = Number(iv.v); if (!(await db.prepare("SELECT id FROM clans WHERE id=?").bind(cid).first())) return J({error: "Клан не найден"});
      if ((await cnt(cid)) >= CL_MAX) return J({error: "В клане нет мест"});
      await db.prepare("INSERT OR REPLACE INTO clan_m (uid,cid,ts,role) VALUES (?,?,?,0)").bind(id, cid, now).run(); await db.prepare("DELETE FROM clan_req WHERE uid=?").bind(id).run(); return J({ok: true});
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
        else { await db.prepare("DELETE FROM kv WHERE k IN (?,?,?)").bind("cb" + my.cid, "ci" + my.cid, "cso" + my.cid).run(); await db.prepare("DELETE FROM clans WHERE id=?").bind(my.cid).run(); await db.prepare("DELETE FROM clan_chat WHERE cid=?").bind(my.cid).run(); await db.prepare("DELETE FROM clan_req WHERE cid=?").bind(my.cid).run(); }
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
      const nn = b.name === undefined ? null : String(b.name).replace(/[<>&"]/g, "").trim().slice(0, 20);
      if (nn !== null) {
        if (nn.length < 3) return J({error: "Название от 3 символов"});
        if (await db.prepare("SELECT id FROM clans WHERE name=? AND id!=?").bind(nn, my.cid).first()) return J({error: "Такое название занято"});
      }
      try { await db.prepare("UPDATE clans SET descr=?, mode=?, icon=?" + (nn !== null ? ", name=?" : "") + " WHERE id=?").bind(...[descr, mode, icon].concat(nn !== null ? [nn] : [], [my.cid])).run(); } catch (e) { return J({error: "Такое название занято"}); }
      return J({ok: true});
    }
    if (path === "clan_img") {
      if (role < 2) return J({error: "Только глава"});
      const img = String(b.img || ""); if (!img) { await db.prepare("DELETE FROM kv WHERE k=?").bind("ci" + my.cid).run(); return J({ok: true}); }
      if (!CL_IMG.test(img) || img.length > 16000) return J({error: "Картинка слишком большая"});
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("ci" + my.cid, img).run(); return J({ok: true});
    }
    if (path === "clan_style") {
      if (role < 2) return J({error: "Только глава"});
      const k = String(b.id || ""), ox = await db.prepare("SELECT v FROM kv WHERE k=?").bind("cso" + my.cid).first(), list = ox ? JSON.parse(ox.v) : [];
      if (k === "") { await db.prepare("UPDATE clans SET style='' WHERE id=?").bind(my.cid).run(); return J({ok: true, owned: list, style: ""}); }
      const price = k === "GA" ? 0 : NS_ST[k]; if (price === undefined || k[0] !== "G") return J({error: "Нет такого стиля"});
      let r = {ok: true};
      if (!list.includes(k) && !(k === "GA" && id === ADMIN)) {
        r = await mutate(db, id, st => { if (num(st.gems) < price) return "Не хватает кристаллов"; st.gems -= price; }); if (r.error) return J(r);
        list.push(k); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("cso" + my.cid, JSON.stringify(list)).run();
      }
      await db.prepare("UPDATE clans SET style=? WHERE id=?").bind(k, my.cid).run();
      return J({...r, owned: list, style: k});
    }
    if (path === "clan_bn") {
      if (role < 2) return J({error: "Только глава"});
      const img = String(b.img || ""); if (!img) { await db.prepare("DELETE FROM kv WHERE k IN (?,?,?)").bind("cb" + my.cid, "ci" + my.cid, "cso" + my.cid).run(); return J({ok: true}); }
      if (!CL_IMG.test(img) || img.length > 90000) return J({error: "Картинка слишком большая"});
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("cb" + my.cid, img).run(); return J({ok: true});
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
      await db.prepare("DELETE FROM clans WHERE id=?").bind(my.cid).run(); await db.prepare("DELETE FROM kv WHERE k IN (?,?,?)").bind("cb" + my.cid, "ci" + my.cid, "cso" + my.cid).run(); return J({ok: true});
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
      try {
        const cb = await db.prepare("SELECT bank FROM clans WHERE id=?").bind(my.cid).first(), n0 = await cnt(my.cid), d = await ctLoad(db, my.cid, cb ? cb.bank : 0, n0, now);
        d.tot += a; d.mem[id] = (d.mem[id] || 0) + a; d.big = Math.max(d.big, a);
        const cur = [d.tot, Object.keys(d.mem).length, d.big]; let paid = false;
        for (let i = 0; i < 3; i++) if (cur[i] >= d.g[i] && !d.paid.includes(i + 1)) { d.paid.push(i + 1); paid = true; for (const m of (await db.prepare("SELECT uid FROM clan_m WHERE cid=?").bind(my.cid).all()).results) await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(m.uid, "gems", CT_REW[i], 0, now).run(); }
        await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("ct" + my.cid, JSON.stringify(d)).run();
        return J({...r, ct: ctView(d), ctPaid: paid});
      } catch (e) { return J(r); }
    }
    return J({error: "?"});
  }
  // ---------- защита от автокликера: человеческий ли ритм тапов
  const humanTaps = (arr, dur) => {
    if (!Array.isArray(arr) || arr.length > 1500) return "bot";
    const t = arr.map(Number); if (t.some(x => !isFinite(x) || x < 0 || x > dur + 1500)) return "bot";
    for (let i = 1; i < t.length; i++) if (t[i] < t[i - 1]) return "bot";
    const n = t.length; if (n < 20) return null;
    const iv = []; for (let i = 1; i < n; i++) iv.push(t[i] - t[i - 1]);
    // автокликер бьёт строго через одинаковые промежутки: почти все интервалы совпадают с медианой с точностью до нескольких миллисекунд
    const so = iv.slice().sort((a, c) => a - c), med = so[Math.floor(so.length / 2)];
    if (iv.filter(x => Math.abs(x - med) <= 3).length / iv.length >= .6) return "bot";
    const m = iv.reduce((a, x) => a + x, 0) / iv.length, sd = Math.sqrt(iv.reduce((a, x) => a + (x - m) * (x - m), 0) / iv.length);
    if (sd < 5) return "bot";
    return null;
  };
  const strikeGet = async () => { const r = await db.prepare("SELECT v FROM kv WHERE k=?").bind("tb" + id).first(); return r ? Number(r.v) || 0 : 0; };
  const strikeAdd = async () => { const n = (await strikeGet()) + 1; await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("tb" + id, String(n)).run(); return n; };
  const kvj = async k => { const r = await db.prepare("SELECT v FROM kv WHERE k=?").bind(k).first(); try { return r ? JSON.parse(r.v) : null; } catch (e) { return null; } };
  const kvs = (k, o) => db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(k, JSON.stringify(o)).run();
  const TD_DUR = 20000;
  // ---------- дуэли тапов
  const tdFinish = async (tb, t1, t2, why) => {
    const w = t1 > t2 ? 1 : t2 > t1 ? 2 : 0, win = Math.floor(tb.stake * 1.9), res = {winner: w, t1, t2, why: why || "", pay1: w === 1 ? win : w === 0 ? tb.stake : 0, pay2: w === 2 ? win : w === 0 ? tb.stake : 0};
    const r = await db.prepare("UPDATE td SET st='done', t1=?, t2=?, res=? WHERE id=? AND st='play2'").bind(t1, t2, JSON.stringify(res), tb.id).run();
    if (r.meta.changes === 1) {
      for (const [u, n] of [[tb.p1, tb.n1], [tb.p2, tb.n2]]) await db.prepare("INSERT OR IGNORE INTO tdr (uid,name,w,l,d,elo) VALUES (?,?,0,0,0,1000)").bind(u, n).run();
      const a = await db.prepare("SELECT * FROM tdr WHERE uid=?").bind(tb.p1).first(), c = await db.prepare("SELECT * FROM tdr WHERE uid=?").bind(tb.p2).first();
      const sa = w === 1 ? 1 : w === 2 ? 0 : .5, ea = 1 / (1 + Math.pow(10, ((c.elo || 1000) - (a.elo || 1000)) / 400)), K = 28, da = Math.round(K * (sa - ea)), dc = -da;
      const col = w === 1 ? ["w", "l"] : w === 2 ? ["l", "w"] : ["d", "d"];
      await db.batch([db.prepare("UPDATE tdr SET name=?, elo=MAX(100,COALESCE(elo,1000)+?), " + col[0] + "=" + col[0] + "+1 WHERE uid=?").bind(tb.n1, da, tb.p1), db.prepare("UPDATE tdr SET name=?, elo=MAX(100,COALESCE(elo,1000)+?), " + col[1] + "=" + col[1] + "+1 WHERE uid=?").bind(tb.n2, dc, tb.p2)]);
    }
  };
  const tdSweep = async () => {
    await db.prepare("UPDATE td SET st='cancel' WHERE st='wait' AND ts<?").bind(now - 1800).run();
    await db.prepare("UPDATE td SET st='cancel' WHERE st='play1' AND s1<?").bind(Date.now() - 45000).run();
    const st = (await db.prepare("SELECT * FROM td WHERE st='play2' AND s2<? LIMIT 20").bind(Date.now() - 45000).all()).results; for (const t of st) await tdFinish(t, t.t1, -1, "time");
  };
  const tdActive = () => db.prepare("SELECT * FROM td WHERE ((p1=? AND st IN ('play1','wait','play2')) OR (p2=? AND st='play2')) LIMIT 1").bind(id, id).first();
  const tdView = (tb) => {
    const seat = tb.p1 === id ? 1 : 2, res = tb.res ? JSON.parse(tb.res) : null, o = {id: tb.id, st: tb.st, stake: tb.stake, seat, opp: seat === 1 ? tb.n2 : tb.n1, t1: tb.t1};
    if (res) { o.winner = res.winner === 0 ? 0 : res.winner === seat ? 1 : 2; o.my = seat === 1 ? res.t1 : res.t2; o.their = seat === 1 ? res.t2 : res.t1; o.pay = seat === 1 ? res.pay1 : res.pay2; o.claimed = !!tb["c" + seat]; }
    if (tb.st === "cancel") { o.pay = seat === 1 && !tb.c1 ? tb.stake : 0; o.claimed = !!tb["c" + seat]; }
    return o;
  };
  if (path.startsWith("td_")) {
    await tdSweep();
    if (path === "td_list") {
      const rows = (await db.prepare("SELECT id,n1,stake,t1 FROM td WHERE st='wait' AND p1!=? ORDER BY id DESC LIMIT 20").bind(id).all()).results;
      const act = await tdActive(), claims = (await db.prepare("SELECT id FROM td WHERE ((p1=? AND c1=0) OR (p2=? AND c2=0)) AND st IN ('done','cancel') ORDER BY id DESC LIMIT 5").bind(id, id).all()).results.map(x => x.id);
      const top = (await db.prepare("SELECT uid,name,w,l,d,COALESCE(elo,1000) AS elo FROM tdr WHERE w+l+d>0 ORDER BY elo DESC, w DESC LIMIT 20").all()).results;
      const me = (await db.prepare("SELECT w,l,d,COALESCE(elo,1000) AS elo FROM tdr WHERE uid=?").bind(id).first()) || {w: 0, l: 0, d: 0, elo: 1000};
      me.rank = me.w + me.l + me.d > 0 ? (await db.prepare("SELECT COUNT(*) AS c FROM tdr WHERE w+l+d>0 AND COALESCE(elo,1000)>?").bind(me.elo).first()).c + 1 : 0;
      return J({rows, mine: act ? act.id : 0, claims, top, me, id});
    }
    if (path === "td_state") { const tb = await db.prepare("SELECT * FROM td WHERE id=? AND (p1=? OR p2=?)").bind(Number(b.id), id, id).first(); return tb ? J(tdView(tb)) : J({error: "Дуэль не найдена"}); }
    if (path === "td_create" || path === "td_join") {
      if ((await strikeGet()) >= 3) return J({error: "Дуэли отключены: замечен автокликер"});
      if (await tdActive()) return J({error: "У тебя уже есть активная дуэль"});
      if (path === "td_create") {
        const stake = Math.floor(Number(b.stake)); if (!(stake >= 100) || !isFinite(stake)) return J({error: "Неверная ставка"});
        const r = await db.prepare("INSERT INTO td (p1,n1,stake,st,s1,ts) VALUES (?,?,?,?,?,?)").bind(id, name, stake, "play1", Date.now(), now).run();
        return J({ok: true, id: r.meta.last_row_id, dur: TD_DUR});
      }
      const tb = await db.prepare("SELECT * FROM td WHERE id=? AND st='wait' AND p1!=?").bind(Number(b.id), id).first(); if (!tb) return J({error: "Дуэль уже занята"});
      const r = await db.prepare("UPDATE td SET st='play2', p2=?, n2=?, s2=? WHERE id=? AND st='wait'").bind(id, name, Date.now(), tb.id).run();
      if (r.meta.changes !== 1) return J({error: "Дуэль уже занята"});
      return J({ok: true, id: tb.id, stake: tb.stake, dur: TD_DUR, t1: tb.t1});
    }
    if (path === "td_end") {
      const tb = await db.prepare("SELECT * FROM td WHERE id=? AND ((p1=? AND st='play1') OR (p2=? AND st='play2'))").bind(Number(b.id), id, id).first(); if (!tb) return J({error: "Дуэль не идёт"});
      const seat = tb.p1 === id ? 1 : 2, el = Date.now() - (seat === 1 ? tb.s1 : tb.s2);
      if (el < TD_DUR - 600) return J({error: "Рано"});
      const bad = el > TD_DUR + 15000 ? "time" : humanTaps(b.taps, TD_DUR);
      if (bad) {
        if (bad === "bot") { await strikeAdd(); }
        if (seat === 1) { await db.prepare("UPDATE td SET st='cancel', c1=1 WHERE id=? AND st='play1'").bind(tb.id).run(); return J({cheat: bad === "bot"}); }
        await tdFinish(tb, tb.t1, -1, bad); const t2 = await db.prepare("SELECT * FROM td WHERE id=?").bind(tb.id).first(); return J({...tdView(t2), cheat: bad === "bot"});
      }
      const score = b.taps.length;
      if (seat === 1) { await db.prepare("UPDATE td SET st='wait', t1=?, ts=? WHERE id=? AND st='play1'").bind(score, now, tb.id).run(); return J({ok: true, score}); }
      await tdFinish(tb, tb.t1, score, ""); const t2 = await db.prepare("SELECT * FROM td WHERE id=?").bind(tb.id).first(); return J(tdView(t2));
    }
    if (path === "td_claim") {
      const tb = await db.prepare("SELECT * FROM td WHERE id=? AND (p1=? OR p2=?) AND st IN ('done','cancel')").bind(Number(b.id), id, id).first(); if (!tb) return J({amount: 0});
      const seat = tb.p1 === id ? 1 : 2; if (tb.st === "cancel" && seat !== 1) return J({amount: 0});
      const r = await db.prepare("UPDATE td SET c" + seat + "=1 WHERE id=? AND c" + seat + "=0").bind(tb.id).run(); if (r.meta.changes !== 1) return J({amount: 0});
      let amount = tb.stake; if (tb.st === "done") { const res = JSON.parse(tb.res); amount = seat === 1 ? res.pay1 : res.pay2; }
      await casinoPay(db, id, amount); return J({amount});
    }
    if (path === "td_cancel") { const r = await db.prepare("UPDATE td SET st='cancel' WHERE id=? AND p1=? AND st='wait'").bind(Number(b.id), id).run(); return J(r.meta.changes === 1 ? {ok: true} : {error: "Уже занята"}); }
  }
  // ---------- события на поле (золотой дождь / угадай арбуз)
  if (path === "fe_roll") {
    const e = await kvj("fe" + id), ms = Date.now(), pub = x => ({type: x.type, ts: x.ts, left: x.ts + 70000 - Date.now(), cat: x.type === "shell" ? x.ans : undefined, sw: x.sw});
    if (e && !e.done && ms < e.ts + 70000) return J({ev: pub(e)});
    if (e && now - e.at < 240) return J({none: 1});
    const type = "shell", sw = []; for (let i = 0; i < 9; i++) { const a = crnd(3); sw.push([a, (a + 1 + crnd(2)) % 3]); }
    const ev = {type, ans: crnd(3), sw: type === "shell" ? sw : undefined, ts: ms, at: now, done: 0};
    await kvs("fe" + id, ev); return J({ev: pub(ev)});
  }
  if (path === "fe_claim") {
    const e = await kvj("fe" + id); if (!e || e.done) return J({error: "Нет события"});
    const el = Date.now() - e.ts;
    if (el < (e.type === "rain" ? 11000 : 2500)) return J({error: "Рано"});
    e.done = 1; await kvs("fe" + id, e);
    const u = await getUser(db, id), unit = Math.max(50, Math.floor(num(u && u.total) * 0.00002));
    let pts = 0, ok = false;
    if (e.type === "rain") {
      if (el < 11000 || el > 40000) return J({error: "Время вышло"});
      if (humanTaps(b.taps, 12000)) { await strikeAdd(); return J({error: "Подозрительный ритм: событие не засчитано"}); }
      pts = Math.min(Array.isArray(b.taps) ? b.taps.length : 0, 45) * unit;
    } else {
      if (el < 2500 || el > 65000) return J({error: "Время вышло"});
      ok = Number(b.pick) === e.ans; pts = (ok ? 25 : 3) * unit;
    }
    if (pts > 0) await casinoPay(db, id, pts);
    return J({ok, pts, ans: e.ans, type: e.type});
  }
  // ---------- клановые рейды и защита
  const crDef = async cid => {
    const c = await db.prepare("SELECT wall FROM clans WHERE id=?").bind(cid).first(), g = await db.prepare("SELECT MAX(score) AS m FROM clg WHERE cid=? AND ts>?").bind(cid, now - 86400).first();
    return Math.round(Math.max(30, (g && g.m) || 0) * (1 + .1 * ((c && c.wall) || 0)));
  };
  if (path.startsWith("cr_")) {
    const my = await db.prepare("SELECT cid,role FROM clan_m WHERE uid=?").bind(id).first(); if (!my) return J({error: "Ты не в клане"});
    if (path === "cr_state") {
      const c = await db.prepare("SELECT id,name,icon,bank,wall,shield FROM clans WHERE id=?").bind(my.cid).first();
      const g = await db.prepare("SELECT score,ts FROM clg WHERE cid=? AND uid=? AND ts>?").bind(my.cid, id, now - 86400).first();
      const tg = (await db.prepare("SELECT c.id,c.name,c.icon,c.shield,c.bank,(SELECT COUNT(*) FROM clan_m m WHERE m.cid=c.id) AS n FROM clans c WHERE c.id!=? ORDER BY (SELECT COALESCE(SUM(u.total),0) FROM clan_m m JOIN users u ON u.id=m.uid WHERE m.cid=c.id) DESC LIMIT 15").bind(my.cid).all()).results.map(x => ({id: x.id, name: x.name, icon: x.icon, n: x.n, shield: Math.max(0, (x.shield || 0) - now), loot: Math.floor((x.bank || 0) * .05)}));
      const log = (await db.prepare("SELECT att,an,def,dn,name,sc,ds,win,loot,ts FROM clraid WHERE att=? OR def=? ORDER BY id DESC LIMIT 8").bind(my.cid, my.cid).all()).results;
      const cd = await kvj("crt" + id);
      return J({clan: {id: c.id, name: c.name, icon: c.icon, bank: c.bank || 0, wall: c.wall || 0, shield: Math.max(0, (c.shield || 0) - now), def: await crDef(my.cid), wallCost: 1e8 * Math.pow(3, c.wall || 0), role: my.role}, my: g || null, cool: cd && cd.until > now ? cd.until - now : 0, tg, log, myc: my.cid});
    }
    if (path === "cr_wall") {
      if (my.role < 1) return J({error: "Только глава или офицер"});
      const c = await db.prepare("SELECT wall,bank FROM clans WHERE id=?").bind(my.cid).first(), lv = c.wall || 0; if (lv >= 10) return J({error: "Максимальная стена"});
      const cost = 1e8 * Math.pow(3, lv); if ((c.bank || 0) < cost) return J({error: "В казне не хватает монет"});
      const r = await db.prepare("UPDATE clans SET bank=bank-?, wall=? WHERE id=? AND COALESCE(wall,0)=? AND bank>=?").bind(cost, lv + 1, my.cid, lv, cost).run();
      return r.meta.changes === 1 ? J({ok: true, wall: lv + 1}) : J({error: "Попробуй ещё раз"});
    }
    if (path === "cr_start") {
      if ((await strikeGet()) >= 3) return J({error: "Рейды отключены: замечен автокликер"});
      const kind = b.kind === "raid" ? "raid" : "guard", cd = await kvj("crt" + id);
      if (cd && cd.until > now) return J({error: "Отдохни ещё " + Math.ceil((cd.until - now) / 60) + " мин"});
      let target = 0;
      if (kind === "raid") {
        target = Number(b.target); const t = await db.prepare("SELECT id,shield FROM clans WHERE id=?").bind(target).first();
        if (!t || t.id === my.cid) return J({error: "Нет такого клана"}); if ((t.shield || 0) > now) return J({error: "Клан под защитой"});
      }
      const s = Date.now(); await kvs("crr" + id, {kind, target, s});
      return J({ok: true, dur: TD_DUR});
    }
    if (path === "cr_end") {
      const run = await kvj("crr" + id); if (!run || run.done) return J({error: "Забег не идёт"});
      run.done = 1; await kvs("crr" + id, run);
      const el = Date.now() - run.s; if (el < TD_DUR - 600 || el > TD_DUR + 15000) return J({error: "Время вышло"});
      if (humanTaps(b.taps, TD_DUR)) { await strikeAdd(); return J({error: "Подозрительный ритм: забег не засчитан", cheat: 1}); }
      const score = b.taps.length;
      if (run.kind === "guard") {
        await db.prepare("INSERT OR REPLACE INTO clg (cid,uid,score,ts) VALUES (?,?,?,?)").bind(my.cid, id, Math.max(score, ((await db.prepare("SELECT score FROM clg WHERE cid=? AND uid=? AND ts>?").bind(my.cid, id, now - 86400).first()) || {}).score || 0), now).run();
        await kvs("crt" + id, {until: now + 600}); return J({ok: true, kind: "guard", score, def: await crDef(my.cid)});
      }
      await kvs("crt" + id, {until: now + 1800});
      const t = await db.prepare("SELECT id,name,bank,shield,owner FROM clans WHERE id=?").bind(run.target).first(), me = await db.prepare("SELECT name FROM clans WHERE id=?").bind(my.cid).first();
      if (!t) return J({error: "Клан исчез"}); if ((t.shield || 0) > now) return J({error: "Клан уже под защитой"});
      const def = await crDef(t.id), win = score > def; let loot = 0;
      if (win) {
        loot = Math.floor((t.bank || 0) * .05);
        const r = await db.prepare("UPDATE clans SET bank=bank-?, shield=? WHERE id=? AND bank>=? AND COALESCE(shield,0)<=?").bind(loot, now + 4 * 3600, t.id, loot, now).run();
        if (r.meta.changes !== 1) loot = 0; else await db.prepare("UPDATE clans SET bank=COALESCE(bank,0)+? WHERE id=?").bind(loot, my.cid).run();
        tg0(t.owner, "Твой клан «" + t.name + "» зарейдили! Клан «" + me.name + "» унёс " + Math.floor(loot) + " монет из казны. Усиль стену и дежурь.");
      }
      await db.prepare("INSERT INTO clraid (att,an,def,dn,uid,name,sc,ds,win,loot,ts) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(my.cid, me.name, t.id, t.name, id, name, score, def, win ? 1 : 0, loot, now).run();
      return J({ok: true, kind: "raid", score, def, win, loot, target: t.name});
    }
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
    return J({id: u.id, name: u.name, un: id === ADMIN ? (u.un || "") : undefined, badges: bd(u.id, u.badges), banned: !!u.banned, ban: u.banned | 0, banat: u.banat || 0, online: (u.seen || 0) > now - 40, total: u.total, taps: s.taps || 0, cats, holo: (s.holo || []).length, prest: s.prest || 0, pl: s.pl || 0, wd: s.wd === undefined ? Math.min(s.pl | 0, 7) : Math.min(s.wd | 0, s.pl | 0, 7), ach: (s.ach || []).length, eq: s.eq === undefined ? -1 : s.eq, bnimg: await (async () => { try { const x = await db.prepare("SELECT v FROM kv WHERE k=?").bind("bn" + uid).first(); return x ? x.v : ""; } catch (e) { return ""; } })(), photo: await (async () => { try { const x = await db.prepare("SELECT v FROM kv WHERE k=?").bind("ph" + uid).first(); return x ? x.v : ""; } catch (e) { return ""; } })(), pf: await (async () => { try { const x = await db.prepare("SELECT v FROM kv WHERE k=?").bind("pf" + uid).first(); return x ? JSON.parse(x.v) : {}; } catch (e) { return {}; } })(), seen: u.seen || 0, achs: s.ach || [], inv: s.inv || {}, stars: s.stars || 0, fevers: s.fevers || 0, gt: s.gt || 0, run: s.run || 0, fr: await (async () => { if (uid === id) return 0; const f = await db.prepare("SELECT a,st FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)").bind(id, uid, uid, id).first(); return !f ? 0 : f.st === 1 ? 1 : f.a === id ? 2 : 3; })(), ...(await (async () => { const c = await db.prepare("SELECT c.id,c.name,c.icon,c.badges,c.style FROM clan_m m JOIN clans c ON c.id=m.cid WHERE m.uid=?").bind(uid).first(); return c ? {clan: (c.icon || "🛡") + " " + c.name, clanb: c.badges || "", clanid: c.id, clanst: c.style || ""} : {clan: ""}; })()), opened: s.opened || 0, bn: Number.isInteger(s.bn) ? s.bn : 0, offers: (await db.prepare("SELECT id,give,want FROM offers WHERE seller=? AND status='open' ORDER BY id DESC LIMIT 5").bind(u.id).all()).results});
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
    if (!adm) {
      const sm = (await smodIdsOf(db)).includes(id) && (await modIdsOf(db)).includes(id), an = !!(await anarchyOn(db));
      const cool = async (key, secs) => { const k = "cd" + key + id, r = await db.prepare("SELECT v FROM kv WHERE k=?").bind(k).first(); if (r && now - Number(r.v) < secs) return Number(r.v) + secs - now; await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(k, String(now)).run(); return 0; };
      if (an && MIDP.has(path)) {
        if (path === "adm_give") {
          const t = Number(b.target) || id, kind = String(b.kind); if (t !== id) return J({error: "Выдавать можно только себе"});
          if (kind === "pts") { const a = Number(b.a); if (!(a > 0) || a > 1e18) return J({error: "Не больше 1Qi за раз"}); }
          else if (kind === "cat") { const a = Math.floor(Number(b.a)), m = Math.floor(Number(b.b)) || 1; if (!(a >= 0) || a > 500 || ADMIN_CATS.has(a)) return J({error: "Админских котов выдавать нельзя"}); if (m < 1 || m > 10) return J({error: "От 1 до 10"}); }
          else return J({error: "Недоступно"});
        } else if (path === "adm_tgcast") { const w = await cool("tg", 1800); if (w) return J({error: "Рассылку можно раз в 30 минут, ещё " + Math.ceil(w / 60) + " мин"}); }
        else if (path === "adm_bcast") { const w = await cool("bc", 60); if (w) return J({error: "Подожди " + w + " с"}); }
        else if (path === "adm_evt") { const w = await cool("ev", 600); if (w) return J({error: "Событие можно раз в 10 минут, ещё " + Math.ceil(w / 60) + " мин"}); b.mult = Math.min(50, Math.max(1, Number(b.mult) || 2)); b.mins = Math.min(30, Math.max(1, Number(b.mins) || 10)); delete b.cat; }
        else if (path === "adm_chaos") { const w = await cool("ch", 180); if (w) return J({error: "Режим можно раз в 3 минуты, ещё " + w + " с"}); }
        else if (path === "adm_hard") { const hk = String(b.kind); const w = await cool("hd" + hk, hk === "steal" ? 120 : 600); if (w) return J({error: "Подожди ещё " + w + " с"}); }
        else if (path === "adm_float") { const w = await cool("fl", 15); if (w) return J({error: "Подожди " + w + " с"}); }
        else if (path === "adm_wall") { if (!b.list) { const w = await cool("wl", 20); if (w) return J({error: "Подожди " + w + " с"}); } }
      } else if (sm && SMODP.has(path)) {
        if (path === "adm_give") { const t = Number(b.target) || id; if (t !== id) return J({error: "Ведущий модератор выдаёт только себе"}); if (!["pts", "cat", "allcats"].includes(String(b.kind))) return J({error: "Недоступно"}); }
      } else {
        if (!MODP.has(path) || !(await modIdsOf(db)).includes(id)) return J({error: "Нет доступа"}, 403);
        const tu = Number(b.uid); if (path !== "adm_del" && (!tu || tu === ADMIN || (await modIdsOf(db)).includes(tu))) return J({error: "Нельзя"});
      }
    }
    if (!adm) await auditLog(db, id, name, (await smodIdsOf(db)).includes(id) ? "smod" : "mod", path, b, now);
    if (path === "adm_log") {
      const act = Number(b.actor) || 0, off = Math.max(0, Math.floor(Number(b.off)) || 0);
      const rows = (await db.prepare("SELECT ts,actor,an,role,act,tgt,tn,info FROM alog WHERE (?=0 OR actor=?) ORDER BY id DESC LIMIT 41 OFFSET ?").bind(act, act, off).all()).results;
      const actors = (await db.prepare("SELECT actor,MAX(an) AS an,MAX(role) AS role,COUNT(*) AS c FROM alog GROUP BY actor ORDER BY MAX(id) DESC LIMIT 12").all()).results;
      return J({rows: rows.slice(0, 40), more: rows.length > 40, actors});
    }
    if (path === "adm_wall") {
      let w = []; try { const r = await db.prepare("SELECT v FROM kv WHERE k='wall'").first(); w = r ? JSON.parse(r.v) : []; } catch (e) {}
      if (b.list) return J({rows: w.slice(-15).reverse()});
      if (b.del && adm) { w = w.filter(x => x.ts !== Number(b.del)); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('wall',?)").bind(JSON.stringify(w)).run(); return J({ok: true}); }
      const text = String(b.text || "").trim().replace(/\s+/g, " ").slice(0, 80); if (text.length < 2) return J({error: "Слишком коротко"});
      w.push({id, name, text, ts: Date.now()}); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('wall',?)").bind(JSON.stringify(w.slice(-40))).run(); return J({ok: true});
    }
    if (path === "adm_hard") {
      const kind = String(b.kind), ids = (await db.prepare("SELECT id FROM users WHERE state IS NOT NULL ORDER BY upd DESC LIMIT 500").all()).results.map(r => r.id);
      if (kind === "rain") {
        for (const u of ids) { await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(u, "pts", 1e12, 1, now).run(); await allowAdd(db, u, 1e12, 0); }
        await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind("Золотой дождь! " + name + " раздал всем по 1 трлн монет", now).run(); return J({ok: true, n: ids.length});
      }
      if (kind === "catrain") {
        for (const u of ids) await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(u, "cat", crnd(70), 1, now).run();
        await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind("Котопад! " + name + " раздал всем по случайному коту", now).run(); return J({ok: true, n: ids.length});
      }
      if (kind === "steal") {
        const t = Number(b.uid); if (!t || t === id || t === ADMIN) return J({error: "Нельзя ограбить этого игрока"});
        const u = await getUser(db, t); if (!u) return J({error: "Игрок не найден"});
        let x = 0; const r = await mutate(db, t, s => { x = Math.floor(num(s.pts) * 0.5); s.pts = Math.max(0, num(s.pts) - x); s.tk = (s.tk || 0) + 1; s.tkm = "ограбление"; });
        if (r.error) return J({error: r.error});
        if (x > 0) { await db.prepare("INSERT INTO grants (uid,kind,a,b,ts) VALUES (?,?,?,?,?)").bind(id, "pts", x, 1, now).run(); await allowAdd(db, id, x, 0); }
        await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind(name + " ограбил " + u.name + " на половину монет", now).run();
        return J({ok: true, name: u.name, x});
      }
      return J({error: "Неверный тип"});
    }
    if (path === "adm_float") {
      let w = []; try { const r = await db.prepare("SELECT v FROM kv WHERE k='floats'").first(); w = r ? JSON.parse(r.v) : []; } catch (e) {}
      if (b.delall && adm) { await db.prepare("DELETE FROM kv WHERE k='floats'").run(); return J({ok: true}); }
      if (b.del && adm) { w = w.filter(x => x.ts !== Number(b.del)); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('floats',?)").bind(JSON.stringify(w)).run(); return J({ok: true}); }
      const text = String(b.text || "").trim().replace(/\s+/g, " ").slice(0, 60); if (text.length < 1) return J({error: "Слишком коротко"});
      w.push({name, text, ts: Date.now()}); await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('floats',?)").bind(JSON.stringify(w.slice(-10))).run(); return J({ok: true});
    }
    if (path === "adm_chaos") {
      const mode = String(b.mode); if (mode !== "off" && !CHAOS[mode]) return J({error: "Неизвестный режим"});
      if (mode === "off") { if (!adm) return J({error: "Только владелец"}); await db.prepare("DELETE FROM kv WHERE k='chaos'").run(); return J({ok: true}); }
      let cl = []; try { const r = await db.prepare("SELECT v FROM kv WHERE k='chaos'").first(); if (r) { const c = JSON.parse(r.v); cl = (Array.isArray(c) ? c : [c]).filter(x => x.until > now && x.mode !== mode); } } catch (e) {}
      cl.push({mode, by: name, until: now + 120});
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('chaos',?)").bind(JSON.stringify(cl)).run();
      await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind("Режим «" + CHAOS[mode] + "» на 2 минуты от " + name, now).run();
      return J({ok: true});
    }
    if (path === "adm_anarchy_state") {
      if (!adm) return J({error: "Только владелец"});
      const an = await anarchyOn(db), c = (await db.prepare("SELECT COUNT(*) AS c FROM anarchy_bak").first()).c;
      return J({on: !!an, ts: an ? an.ts : 0, snap: c});
    }
    if (path === "adm_anarchy_on") {
      if (!adm) return J({error: "Только владелец"}); if (await anarchyOn(db)) return J({error: "Анархия уже идёт"});
      await db.prepare("DELETE FROM anarchy_bak").run(); await db.prepare("DELETE FROM anarchy_clb").run();
      await db.prepare("INSERT INTO anarchy_bak (id,state,total,cur,rev) SELECT id,state,total,cur,rev FROM users").run();
      try { await db.prepare("INSERT INTO anarchy_clb (id,bank,wall) SELECT id,COALESCE(bank,0),COALESCE(wall,0) FROM clans").run(); } catch (e) {}
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('anarchy',?)").bind(JSON.stringify({on: 1, ts: now, by: id})).run();
      await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind("АНАРХИЯ! У каждого игрока теперь есть админка: загляни в меню", now).run();
      let started = false;
      if (b.cast) { const act = await db.prepare("SELECT v FROM kv WHERE k='tgact'").first(); if (!act || act.v !== "1") { const text = "АНАРХИЯ в MDMelonClicker! Теперь у каждого игрока появилась своя админка. Заходи и пробуй: выдавай себе монеты и котов, пиши сообщения во все чаты бота, включай режимы и оставляй надписи на стене."; for (const [k, v] of [["tgtext", text], ["tgpos", "0"], ["tgsent", "0"], ["tgact", "1"], ["tglock", "0"]]) await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind(k, v).run(); started = true; } }
      const c = (await db.prepare("SELECT COUNT(*) AS c FROM anarchy_bak").first()).c;
      return J({ok: true, snap: c, cast: started});
    }
    if (path === "adm_anarchy_off") { if (!adm) return J({error: "Только владелец"}); await db.prepare("DELETE FROM kv WHERE k IN ('anarchy','chaos')").run(); return J({ok: true}); }
    if (path === "adm_anarchy_restore") {
      if (!adm) return J({error: "Только владелец"});
      const c = (await db.prepare("SELECT COUNT(*) AS c FROM anarchy_bak").first()).c; if (!c) return J({error: "Копии до Анархии нет"});
      const rows = (await db.prepare("SELECT u.id, u.rev, u.state AS cur, b.state AS old FROM users u LEFT JOIN anarchy_bak b ON b.id=u.id").all()).results;
      for (const r of rows) {
        let st = null; if (r.old) { try { st = JSON.parse(r.old); } catch (e) {} }
        let rs = 0; try { rs = r.cur ? (JSON.parse(r.cur).rs || 0) : 0; } catch (e) {}
        if (st) { st.rs = rs + 1; st.tk = (st.tk || 0) + 1; }
        await db.prepare("UPDATE users SET state=?, total=?, cur=?, rev=rev+1, upd=? WHERE id=?").bind(st ? JSON.stringify(st) : null, st ? num(st.total) : 0, st ? Math.max(0, num(st.pts)) : 0, now, r.id).run();
      }
      await db.prepare("DELETE FROM grants").run(); await db.prepare("UPDATE offers SET status='cancelled' WHERE status='open'").run();
      try { await db.prepare("UPDATE clans SET bank=COALESCE((SELECT bank FROM anarchy_clb WHERE id=clans.id),0), wall=COALESCE((SELECT wall FROM anarchy_clb WHERE id=clans.id),0)").run(); } catch (e) {}
      await db.prepare("DELETE FROM kv WHERE k IN ('anarchy','chaos','wall','evt','floats')").run();
      await db.prepare("INSERT INTO bcast (text,ts) VALUES (?,?)").bind("Игра восстановлена до Анархии", now).run();
      return J({ok: true, count: rows.length});
    }
    if (path === "adm_mod") {
      const uid = Number(b.uid); if (!uid || uid === ADMIN) return J({error: "Неверный ID"});
      const l = (await modIdsOf(db)).filter(x => x !== uid); if (b.on) l.push(uid);
      const sl = (await smodIdsOf(db)).filter(x => x !== uid); if (b.on && b.senior) sl.push(uid);
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('mods',?)").bind(JSON.stringify(l.slice(0, 20))).run();
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES ('smods',?)").bind(JSON.stringify(sl.slice(0, 20))).run();
      if (b.on) tg0(uid, b.senior ? "Тебя назначили ведущим модератором в MDMelonClicker: мут, удаление сообщений, выдача себе монет и котов, рассылки." : "Тебя назначили помощником в MDMelonClicker: теперь ты можешь мутить игроков и удалять сообщения в чате.");
      return J({ok: true});
    }
    if (path === "adm_mods") {
      const l = await modIdsOf(db), sl = await smodIdsOf(db), rows = []; for (const u of l) { const r = await getUser(db, u); rows.push({id: u, name: r ? r.name : "?", senior: sl.includes(u)}); }
      return J({rows});
    }
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
      const raw = String(b.text || "").trim().slice(0, 1000); if (raw.length < 3) return J({error: "Слишком короткое сообщение"}); const text = raw + "\n\n— " + name;
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
      const raw = String(b.text || "").trim().slice(0, 300); if (!raw) return J({error: "Пусто"}); const text = (raw + " — " + name).slice(0, 400);
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
    if (path === "adm_clan_del") {
      const cid = Number(b.cid); if (!(await db.prepare("SELECT id FROM clans WHERE id=?").bind(cid).first())) return J({error: "Клан не найден"});
      for (const t of ["clan_m", "clan_req", "clan_chat"]) await db.prepare("DELETE FROM " + t + " WHERE cid=?").bind(cid).run();
      await db.prepare("DELETE FROM clans WHERE id=?").bind(cid).run(); await db.prepare("DELETE FROM kv WHERE k IN (?,?,?)").bind("cb" + cid, "ci" + cid, "cso" + cid).run();
      await db.prepare("DELETE FROM kv WHERE k LIKE 'inv%' AND v=?").bind(String(cid)).run();
      return J({ok: true});
    }
    if (path === "adm_clan_invite") {
      const cid = Number(b.cid), q = String(b.q || "").trim().slice(0, 30).replace(/[%_]/g, "");
      if (!(await db.prepare("SELECT id FROM clans WHERE id=?").bind(cid).first())) return J({error: "Клан не найден"});
      if (q.length < 1) return J({error: "Введи имя или ID"});
      const u = await findUser(db, q);
      if (!u) return J({error: "Игрок не найден"});
      if (await db.prepare("SELECT cid FROM clan_m WHERE uid=?").bind(u.id).first()) return J({error: "Игрок уже в клане"});
      await db.prepare("INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)").bind("inv" + u.id, String(cid)).run();
      return J({ok: true, name: u.name, id: u.id});
    }
    if (path === "adm_clan_badge") {
      const v = [...new Set(String(b.badges || "").split(""))].filter(c => CL_BD.includes(c)).join("");
      const r = await db.prepare("UPDATE clans SET badges=? WHERE id=?").bind(v, Number(b.cid)).run();
      return J(r.meta.changes === 1 ? {ok: true, badges: v} : {error: "Клан не найден"});
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
const ANN = ["14.8.8", ["РЕМАСТЕР интерфейса: плавающая навигация-таблетка, новые карточки, кнопки и заголовки", "Мягкие тени, градиенты и пружинные нажатия, быстрее отрисовка списков", "Скоро полный ремастер, много идей, а также загрузка в Плей Маркет"], "Ремастер: первый этап"];
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
      if (p === "/" || p === "/index.html") { const hx = await getHtml(env); let hh = 5381; for (let i = 0; i < hx.length; i += 97) hh = ((hh << 5) + hh + hx.charCodeAt(i)) | 0; const et = '"' + (hh >>> 0).toString(36) + hx.length.toString(36) + '"'; if (req.headers.get("if-none-match") === et) return new Response(null, {status: 304, headers: {"etag": et, "cache-control": "no-cache"}}); return new Response(hx, {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-cache", "etag": et, "x-content-type-options": "nosniff", "referrer-policy": "no-referrer"}}); }
      if (p === "/demo") return new Response((await getHtml(env)).replace("<head>", "<head>" + DEMO), {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store"}});
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
