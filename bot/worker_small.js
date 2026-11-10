const HTML_URL = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/bot/src/index.html";
async function getHtml() {
  const r = await fetch(HTML_URL, {cf: {cacheTtl: 30, cacheEverything: true}});
  if (!r.ok) throw new Error("html " + r.status);
  return r.text();
}
const ATLAS = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/HEAD/mdcats2.jpg";
const BOT_USER = "mdmelonbot";
const N_ITEMS = 103;
const BC_CATS = [["Киллер в плаще", 3], ["Кот-дон", 3], ["Вор-домушник", 2], ["Торговец с рынка", 3], ["Контрабандный ящик", 2], ["Кот-алхимик", 3], ["Кот-чемодан", 2], ["Призрак рынка", 4], ["Золотой слиток", 4]];
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
    db.prepare("CREATE TABLE IF NOT EXISTS ucats (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, uname TEXT, name TEXT, rar INTEGER, img TEXT, status TEXT DEFAULT 'new', idx INTEGER, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, amount REAL, due INTEGER, status TEXT DEFAULT 'open', ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS bm_buys (uid INTEGER, day INTEGER, slot INTEGER, PRIMARY KEY (uid, day, slot))"),
    db.prepare("CREATE TABLE IF NOT EXISTS pk2m (tid INTEGER, seat INTEGER, code INTEGER, ts INTEGER, n INTEGER DEFAULT 0, PRIMARY KEY (tid, seat))"),
    db.prepare("CREATE TABLE IF NOT EXISTS pk2 (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, status TEXT DEFAULT 'wait', h1 TEXT, h2 TEXT, rest TEXT, d1 INTEGER DEFAULT 0, d2 INTEGER DEFAULT 0, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER, dealt INTEGER DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS dcm (tid INTEGER, seat INTEGER, code INTEGER, ts INTEGER, n INTEGER DEFAULT 0, PRIMARY KEY (tid, seat))"),
    db.prepare("CREATE TABLE IF NOT EXISTS dc (id INTEGER PRIMARY KEY AUTOINCREMENT, p1 INTEGER, n1 TEXT, p2 INTEGER, n2 TEXT, stake REAL, status TEXT DEFAULT 'wait', h1 TEXT, h2 TEXT, turn INTEGER DEFAULT 1, bid TEXT, bseat INTEGER DEFAULT 0, hist TEXT DEFAULT '[]', v INTEGER DEFAULT 0, last INTEGER DEFAULT 0, res TEXT, c1 INTEGER DEFAULT 0, c2 INTEGER DEFAULT 0, ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, uname TEXT, text TEXT, status TEXT DEFAULT 'new', ts INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, name TEXT, text TEXT, ts INTEGER)"),
  ]);
  for (const c of ["badges TEXT DEFAULT ''", "banned INTEGER DEFAULT 0", "seen INTEGER DEFAULT 0", "un TEXT DEFAULT ''"]) { try { await db.prepare("ALTER TABLE users ADD COLUMN " + c).run(); } catch (e) {} }
  try { await db.prepare("CREATE TABLE IF NOT EXISTS websess (tok TEXT PRIMARY KEY, uid INTEGER DEFAULT 0, name TEXT DEFAULT '', un TEXT DEFAULT '', sess TEXT DEFAULT '', claimed INTEGER DEFAULT 0, ts INTEGER)").run(); } catch (e) {}
  try { await db.prepare("ALTER TABLE ucats ADD COLUMN bc INTEGER DEFAULT 0").run(); } catch (e) {}
  for (const c of ["ask INTEGER DEFAULT 0", "reward INTEGER DEFAULT 0"]) { try { await db.prepare("ALTER TABLE ucats ADD COLUMN " + c).run(); } catch (e) {} }
  try { await db.prepare("CREATE TABLE IF NOT EXISTS wslikes (k TEXT, cid INTEGER, uid INTEGER, PRIMARY KEY (k, cid, uid))").run(); } catch (e) {}
  try { await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS ucats_bc ON ucats(bc) WHERE bc > 0").run(); } catch (e) {}
  ready = true;
}
function tidy(s) { if (Array.isArray(s.holo)) s.holo = s.holo.filter(i => (i + "") in s.inv); if (s.eq !== undefined && +s.eq >= 0 && !((s.eq + "") in s.inv)) s.eq = -1; }
const num = x => (typeof x === "number" && isFinite(x)) ? x : 0;
function clean(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  if (JSON.stringify(s).length > 40000) return null;
  if (!Array.isArray(s.b) || !s.inv || typeof s.inv !== "object") return null;
  for (const k of ["run", "total"]) s[k] = Math.max(0, num(s[k]));
  s.pts = Math.max(-1e15, num(s.pts));
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

async function ucSig(db) { const r = await db.prepare("SELECT COUNT(*) AS c, COALESCE(SUM(rar*(idx%97+1)+idx),0) AS s FROM ucats WHERE status='ok'").first(); return r.c * 1000003 + r.s; }
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
  let maintT = null; try { const mt = await db.prepare("SELECT v FROM kv WHERE k='maint'").first(); if (mt && mt.v) { const m = JSON.parse(mt.v); if (m && m.on) maintT = m.text || "Технический перерыв"; } } catch (e) {}
  if (maintT && id !== ADMIN && path !== "poll" && path !== "auth") return J({maint: maintT, error: "Технический перерыв"});

  if (path === "auth") {
    const u = await getUser(db, id);
    if (!u) return J({id, name, state: null, rev: 0, admin: id === ADMIN, badges: bd(id, ""), maint: id === ADMIN ? null : maintT});
    if (u.name !== name) await db.prepare("UPDATE users SET name=? WHERE id=?").bind(name, id).run();
    const un0 = String(user.username || "").slice(0, 40); if ((u.un || "") !== un0) await db.prepare("UPDATE users SET un=? WHERE id=?").bind(un0, id).run();
    return J({id, name, state: u.state ? JSON.parse(u.state) : null, rev: u.rev, admin: id === ADMIN, badges: bd(id, u.badges), banned: !!u.banned, maint: id === ADMIN ? null : maintT});
  }
  if (path === "save") {
    const s = clean(b.state); if (!s) return J({error: "Некорректные данные"}, 400);
    const u = await getUser(db, id);
    if (!u) {
      await db.prepare("INSERT OR IGNORE INTO users (id,name,state,rev,total,upd) VALUES (?,?,?,?,?,?)").bind(id, name, JSON.stringify(s), 1, num(s.total), now).run();
      await db.prepare("UPDATE users SET un=? WHERE id=?").bind(String(user.username || "").slice(0, 40), id).run();
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
    const s = clean(b.state); if (!s) return J({error: "Некорректный код"});
    const u = await getUser(db, id);
    if (u && u.imp) return J({error: "Перенос уже выполнялся"});
    s.ts = now;
    if (!u) { await db.prepare("INSERT INTO users (id,name,state,rev,total,imp,upd) VALUES (?,?,?,?,?,1,?)").bind(id, name, JSON.stringify(s), 1, num(s.total), now).run(); await db.prepare("UPDATE users SET un=? WHERE id=?").bind(String(user.username || "").slice(0, 40), id).run(); }
    else await db.prepare("UPDATE users SET state=?, rev=rev+1, total=?, imp=1, upd=? WHERE id=?").bind(JSON.stringify(s), num(s.total), now, id).run();
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
    const out = {id: tb.id, status: tb.status, stake: tb.stake, seat, n1: tb.n1, n2: tb.n2, turn: tb.turn, bid: tb.bid ? JSON.parse(tb.bid) : null, bseat: tb.bseat, hist: JSON.parse(tb.hist || "[]").slice(-8), left: tb.status === "play" ? Math.max(0, DC_T - (now - tb.last)) : 0, dice: tb.h1 ? JSON.parse(seat === 1 ? tb.h1 : tb.h2) : null};
    if (done) { out.oppDice = JSON.parse(seat === 1 ? tb.h2 : tb.h1); out.winner = res.winner === seat ? 1 : 2; out.reason = res.reason; out.cnt = res.cnt; out.rq = res.q; out.rf = res.f; out.pay = seat === 1 ? res.pay1 : res.pay2; out.claimed = !!tb["c" + seat]; }
    if (tb.status === "cancel") { out.pay = seat === 1 ? tb.stake : 0; out.claimed = !!tb["c" + seat]; }
    return out;
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
    return J({amount});
  }
  if (path === "ucats") {
    if ((await db.prepare("SELECT COUNT(*) AS c FROM ucats WHERE bc>0").first()).c < BC_CATS.length) {
      await db.batch(BC_CATS.map((c, k) => db.prepare("INSERT OR IGNORE INTO ucats (uid,uname,name,rar,img,status,idx,ts,bc) SELECT 0,'MDMelon',?,?,'','ok',1+(SELECT COALESCE(MAX(idx),?-1) FROM ucats WHERE idx IS NOT NULL),?,?").bind(c[0], c[1], N_ITEMS, now, k + 1)));
    }
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
      if (u && !cur.includes("g")) await db.prepare("UPDATE users SET badges=? WHERE id=?").bind((cur + "g").slice(0, 4), i.uid).run();
      tg0(i.uid, "💡 Твою идею добавили в игру! Тебе выдан значок «Гений».");
    }
    return J({ok: true});
  }
  if (path === "poll") {
    if (maintT && id !== ADMIN) return J({maint: maintT});
    await db.prepare("UPDATE users SET seen=? WHERE id=?").bind(now, id).run();
    const g = (await db.prepare("SELECT id,kind,a,b FROM grants WHERE uid=? ORDER BY id LIMIT 50").bind(id).all()).results;
    for (const x of g) await db.prepare("DELETE FROM grants WHERE id=?").bind(x.id).run();
    const bc = await db.prepare("SELECT id,text FROM bcast WHERE id>? AND ts>? ORDER BY id DESC LIMIT 1").bind(Number(b.bc) || 0, now - 120).first();
    const maxbc = (await db.prepare("SELECT COALESCE(MAX(id),0) AS m FROM bcast").first()).m;
    const online = (await db.prepare("SELECT COUNT(*) AS c FROM users WHERE seen>?").bind(now - 40).first()).c;
    const u = await getUser(db, id);
    const uc = await ucSig(db);
    return J({uc, grants: g, bc, maxbc, online, rev: u ? u.rev : 0, banned: !!(u && u.banned), badges: bd(id, u && u.badges), maintA: id === ADMIN ? maintT : undefined, maint: null});
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
    return J({id: u.id, name: u.name, un: id === ADMIN ? (u.un || "") : undefined, badges: bd(u.id, u.badges), banned: !!u.banned, online: (u.seen || 0) > now - 40, total: u.total, taps: s.taps || 0, cats, holo: (s.holo || []).length, prest: s.prest || 0, ach: (s.ach || []).length, eq: s.eq === undefined ? -1 : s.eq, opened: s.opened || 0, bn: Number.isInteger(s.bn) ? s.bn : 0, offers: (await db.prepare("SELECT id,give,want FROM offers WHERE seller=? AND status='open' ORDER BY id DESC LIMIT 5").bind(u.id).all()).results});
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
    if (path === "adm_reset") {
      const t = Number(b.uid), u = await getUser(db, t); if (!u) return J({error: "Игрок не найден"});
      await db.prepare("UPDATE users SET state=NULL, total=0, rev=rev+1, upd=? WHERE id=?").bind(now, t).run();
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
      await db.prepare("UPDATE users SET state=NULL, total=0, rev=rev+1, upd=?").bind(now).run();
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
    if (path === "adm_badges") { const v = String(b.badges || "").replace(/[^ctsg]/g, "").slice(0, 4); await db.prepare("UPDATE users SET badges=? WHERE id=?").bind(v, Number(b.uid)).run(); return J({ok: true, badges: bd(Number(b.uid), v)}); }
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
const ANN = ["6.1.0", ["Налог второго уровня: если у тебя больше 1 квинтиллиона монет (Qi), один клик приносит на 50% меньше, а каждый час сгорает 25% всех твоих монет", "Налог от 1 трлн остался как был: клик на 40% меньше, офлайн 5% за 2 часа"]];
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
    if (ctx && ctx.waitUntil && req.method === "POST" && new URL(req.url).pathname === "/api/poll") ctx.waitUntil(announce(env, new URL(req.url).origin).then(() => tgcastStep(env, new URL(req.url).origin)));
    const url = new URL(req.url), p = url.pathname;
    try {
      if (p === "/" || p === "/index.html") return new Response(await getHtml(), {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store"}});
      if (p === "/demo") return new Response((await getHtml()).replace("<head>", "<head>" + DEMO), {headers: {"content-type": "text/html;charset=utf-8", "cache-control": "no-store"}});
      if (p === "/atlas.jpg") {
        const r = await fetch(ATLAS, {cf: {cacheTtl: 86400, cacheEverything: true}});
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
