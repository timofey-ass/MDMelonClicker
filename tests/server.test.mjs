import test from "node:test";
import assert from "node:assert/strict";
import { makeEnv, U, ADMIN, ADMIN_ID, baseState, initData, BOT_TOKEN } from "./helpers.mjs";

const A = U(1001), B = U(1002);

test("auth: без initData и с подделкой — 401", async () => {
  const { call, worker, env, ctx } = await makeEnv();
  assert.equal((await call(null, "auth"))._status, 401);
  const bad = initData(A).replace(/hash=[0-9a-f]+/, "hash=" + "0".repeat(64));
  const r = await worker.fetch(new Request("https://t.test/api/auth", { method: "POST", headers: { "x-init": bad } , body: "{}" }), env, ctx);
  assert.equal(r.status, 401);
});

test("auth: чужой токен бота и просроченный auth_date отклоняются", async () => {
  const { env, worker, ctx } = await makeEnv();
  const go = async h => (await worker.fetch(new Request("https://t.test/api/auth", { method: "POST", headers: { "x-init": h }, body: "{}" }), env, ctx)).status;
  assert.equal(await go(initData(A, undefined, "999:OTHER")), 401);
  assert.equal(await go(initData(A, Math.floor(Date.now() / 1000) - 86400 * 40)), 401);
  assert.equal(await go(initData(A)), 200);
});

test("save: создание, rev-конфликт, мусор отклоняется", async () => {
  const { call, sq } = await makeEnv();
  assert.equal((await call(A, "auth")).state, null);
  const r1 = await call(A, "save", { rev: 0, state: baseState({ pts: 500, total: 500 }) });
  assert.equal(r1.rev, 1);
  const r2 = await call(A, "save", { rev: 1, state: baseState({ pts: 600, total: 600 }) });
  assert.equal(r2.rev, 2);
  const r3 = await call(A, "save", { rev: 1, state: baseState() });
  assert.equal(r3.conflict, true);
  assert.equal((await call(A, "save", { rev: 2, state: "x" }))._status, 400);
  assert.equal((await call(A, "save", { rev: 2, state: { b: "no", inv: {} } }))._status, 400);
  assert.equal(sq.prepare("SELECT cur FROM users WHERE id=1001").get().cur, 600);
});

test("save: NaN/Infinity/строки/отрицательные не попадают в базу", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState() });
  const s = baseState({ pts: "999999", total: -5, run: null, gems: "9e99", gt: -1, b: ["a", -3, 1e99, 0, 0, 0, 0] });
  const r = await call(A, "save", { rev: 1, state: s });
  assert.ok(r.rev);
  const st = JSON.parse(sq.prepare("SELECT state FROM users WHERE id=1001").get().state);
  for (const k of ["pts", "total", "run", "gems", "gt"]) assert.ok(Number.isFinite(st[k]) && st[k] >= 0, k + " = " + st[k]);
  for (const v of st.b) assert.ok(Number.isInteger(v) && v >= 0 && v <= 1e6, "b: " + v);
});

test("save: нельзя мгновенно накрутить монеты и самоцветы", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 5000, total: 5000, run: 5000 }) });
  const r = await call(A, "save", { rev: 1, state: baseState({ pts: 1e30, total: 1e30, run: 1e30, gems: 1e9, gt: 1e9 }) });
  assert.ok(r.rev, "сохранение не должно зависать на клиенте");
  const row = sq.prepare("SELECT cur,total,state FROM users WHERE id=1001").get();
  const st = JSON.parse(row.state);
  assert.ok(st.total < 1e12, "total = " + st.total);
  assert.ok(row.cur < 1e12, "cur = " + row.cur);
  assert.ok(st.gems < 1000, "gems = " + st.gems);
});

test("save: честный рост за разумное время проходит без обрезки", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 1e6, total: 1e6, run: 1e6 }) });
  const r = await call(A, "save", { rev: 1, state: baseState({ pts: 3e6, total: 3e6, run: 3e6, gems: 2, gt: 2 }) });
  assert.equal(r.clamp, undefined);
  assert.equal(JSON.parse(sq.prepare("SELECT state FROM users WHERE id=1001").get().state).total, 3e6);
});

test("import: одноразовый, значения ограничены", async () => {
  const { call, sq } = await makeEnv();
  const r = await call(A, "import", { state: baseState({ pts: 1e40, total: 1e40, run: 1e40, gems: 1e9, gt: 1e9 }) });
  assert.ok(r.state);
  const st = JSON.parse(sq.prepare("SELECT state FROM users WHERE id=1001").get().state);
  assert.ok(st.total <= 1e15 && st.gems <= 1e4);
  assert.match((await call(A, "import", { state: baseState() })).error, /уже/);
});

const ADM = ["adm_give", "adm_gemset", "adm_badges", "adm_ban", "adm_fban", "adm_banlist", "adm_maint", "adm_bcast", "adm_tgcast", "adm_tgstat", "adm_reset", "adm_resetall", "adm_del", "adm_skiploan", "adm_promo_new", "adm_promo_list", "adm_promo_del"];
test("админские пути недоступны обычному игроку", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState() });
  for (const p of ADM) { const r = await call(A, p, { uid: 1001, target: 1001, kind: "pts", a: 1e9 }); assert.equal(r._status, 403, p); }
});

test("админ: выдача, промокод один раз на игрока и по лимиту", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState() }); await call(B, "save", { rev: 0, state: baseState() });
  assert.ok((await call(ADMIN, "adm_promo_new", { code: "hi", kind: "gems", a: 5, b: 1, mx: 1 })).ok);
  assert.equal((await call(A, "promo_use", { code: "hi" })).kind, "gems");
  assert.match((await call(A, "promo_use", { code: "hi" })).error, /уже|закончил/);
  assert.match((await call(B, "promo_use", { code: "hi" })).error, /закончил/);
  assert.ok((await call(ADMIN, "adm_give", { target: 1001, kind: "pts", a: 10 })).ok);
  const p = await call(A, "poll", {});
  assert.equal(p.grants.length, 1);
  assert.equal((await call(A, "poll", {})).grants.length, 0, "грант выдаётся один раз");
});

test("техперерыв блокирует всё, кроме poll/auth, админа не касается", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState() });
  await call(ADMIN, "adm_maint", { on: true, text: "стоп" });
  assert.equal((await call(A, "top")).maint, "стоп");
  assert.equal((await call(A, "save", { rev: 1, state: baseState() })).maint, "стоп");
  assert.ok((await call(A, "auth")).maint);
  assert.equal((await call(A, "poll", {})).maint, "стоп");
  assert.equal((await call(ADMIN, "top")).maint, undefined);
  await call(ADMIN, "adm_maint", { on: false });
  assert.ok((await call(A, "top")).rows);
});

test("полный бан: fullban на запросах, пропадает из таблицы, разбан возвращает", async () => {
  const { call, tgCalls } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 9e5, total: 9e5 }) });
  assert.ok((await call(ADMIN, "adm_fban", { uid: 1001, on: true, why: "t" })).ok);
  assert.equal((await call(A, "top")).fullban, 1);
  assert.equal((await call(ADMIN, "top")).rows.find(r => r.id === 1001), undefined);
  assert.ok(tgCalls.some(c => c.body && c.body.chat_id === 1001));
  assert.ok((await call(ADMIN, "adm_fban", { uid: 1001, on: false })).ok);
  assert.ok((await call(A, "top")).rows);
  assert.equal((await call(ADMIN, "adm_fban", { uid: ADMIN_ID, on: true })).error, "Нельзя");
});

test("таблица лидеров: порядок по текущим монетам", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 900, total: 900 }) });
  await call(B, "save", { rev: 0, state: baseState({ pts: 100, total: 5000 }) });
  const t = await call(A, "top");
  assert.deepEqual(t.rows.map(r => r.id), [1001, 1002]);
  assert.equal(t.rank, 1);
});

test("обмен котами: создание, принятие, двойное принятие и отмена", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ inv: { 3: 1 } }) });
  await call(B, "save", { rev: 0, state: baseState({ inv: { 5: 1 } }) });
  assert.match((await call(A, "offer", { give: 99, want: 99 })).error, /Неверные/);
  assert.match((await call(A, "offer", { give: 4, want: 5 })).error, /нет этого кота/);
  const o = await call(A, "offer", { give: 3, want: 5 });
  assert.ok(!o.error);
  const id = (await call(B, "offers")).offers[0].id;
  assert.match((await call(A, "accept", { id })).error, /твоё/);
  const [r1, r2] = await Promise.all([call(B, "accept", { id }), call(B, "accept", { id })]);
  assert.equal([r1, r2].filter(r => r.state).length, 1, "обмен проходит ровно один раз");
  const inv = u => JSON.parse(sq.prepare("SELECT state FROM users WHERE id=?").get(u).state).inv;
  assert.deepEqual(inv(1001), { 5: 1 }); assert.deepEqual(inv(1002), { 3: 1 });
});

test("обмен: отмена возвращает кота", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ inv: { 3: 1 } }) });
  await call(A, "offer", { give: 3, want: 5 });
  const id = (await call(A, "offers")).offers[0].id;
  assert.ok(!(await call(A, "cancel", { id })).error);
  assert.deepEqual(JSON.parse(sq.prepare("SELECT state FROM users WHERE id=1001").get().state).inv, { 3: 1 });
  assert.match((await call(A, "cancel", { id })).error, /не найдено/);
});

test("рулетка: неверные ставки отклоняются, выплата только 0/×2/×24/джекпот", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState() });
  for (const bet of [0, 99, -5, "x", Infinity, NaN]) assert.match((await call(A, "cz_roulette", { bet, pick: "r" })).error || "", /Неверная/, "bet=" + bet);
  assert.match((await call(A, "cz_roulette", { bet: 100, pick: "z" })).error || "", /Неверная/);
  let seen = new Set();
  for (let i = 0; i < 80; i++) { const r = await call(A, "cz_roulette", { bet: 100, pick: "r" }); if (r._status === 429) continue; seen.add(r.payout === 0 ? "0" : r.jackpot ? "j" : String(r.payout)); }
  for (const k of seen) assert.ok(["0", "200", "j"].includes(k), "выплата " + k);
});

test("чат: бан в чате, антиспам", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState() });
  assert.ok((await call(A, "chat_send", { text: "привет" })).ok);
  assert.match((await call(A, "chat_send", { text: "ещё" })).error, /быстро/);
  assert.equal((await call(A, "chat", {})).rows.length, 1);
  await call(ADMIN, "adm_ban", { uid: 1001, on: true });
  assert.match((await call(A, "chat_send", { text: "x" })).error, /заблок/);
});

test("выдачи админа, промокод и кредит не режутся лимитом роста", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 100, total: 100, run: 100 }) });
  await call(ADMIN, "adm_give", { target: 1001, kind: "pts", a: 5e9 });
  await call(ADMIN, "adm_give", { target: 1001, kind: "gems", a: 3000 });
  const r = await call(A, "save", { rev: 1, state: baseState({ pts: 5e9, total: 5e9, run: 5e9, gems: 3000, gt: 3000 }) });
  assert.equal(r.clamp, undefined);
  const st = JSON.parse(sq.prepare("SELECT state FROM users WHERE id=1001").get().state);
  assert.equal(st.pts, 5e9); assert.equal(st.gems, 3000);
  // без выдачи тот же прыжок обрезается, и клиент получает исправленное состояние
  const r2 = await call(A, "save", { rev: 2, state: baseState({ pts: 5e15, total: 5e15, run: 5e15 }) });
  assert.equal(r2.clamp, true); assert.ok(r2.state.pts < 1e13);
});

test("ADMIN_ID из окружения заменяет встроенный ID админа", async () => {
  const { call } = await makeEnv({ ADMIN_ID: "555" });
  await call(U(1001), "save", { rev: 0, state: baseState() });
  assert.equal((await call(ADMIN, "adm_banlist", {}))._status, 403);
  assert.notEqual((await call(U(555), "adm_banlist", {}))._status, 403);
});

test("бот: /link отвечает адресом игры и страницей скачивания; чужой секрет вебхука отклоняется", async () => {
  const { env, worker, ctx, tgCalls } = await makeEnv();
  const { createHash } = await import("node:crypto");
  const sec = createHash("sha256").update("md:" + BOT_TOKEN).digest("hex").slice(0, 32);
  const send = (text, secret) => worker.fetch(new Request("https://game.test/bot", { method: "POST", headers: { "x-telegram-bot-api-secret-token": secret }, body: JSON.stringify({ message: { text, chat: { id: 7 }, from: { id: 7 } } }) }), env, ctx);
  assert.equal((await send("/link", "wrong")).status, 403);
  assert.equal((await send("/link", sec)).status, 200);
  const m = tgCalls.find(c => c.url.includes("sendMessage"));
  assert.match(m.body.text, /https:\/\/game\.test\b/); assert.match(m.body.text, /\/download\.html/);
});

test("казино: выигрыш записывается сервером и проходит сохранение, а выдуманный — нет", async () => {
  const { call, sq } = await makeEnv();
  const big = 1e12;
  await call(A, "save", { rev: 0, state: baseState({ pts: big, total: big, run: big }) });
  let rev = 1, win = 0, bet = 4e11;
  for (let i = 0; i < 60 && !win; i++) { const r = await call(A, "cz_roulette", { bet, pick: "r" }); if (r.payout > 0) win = r.payout; }
  assert.ok(win > 0, "выигрыш за 60 попыток");
  const st = baseState({ pts: big - bet + win, total: big + win, run: big + win });
  const r = await call(A, "save", { rev, state: st }); rev = r.rev;
  assert.ok(!r.clamp, "честный выигрыш не должен резаться");
  // без новых выигрышей прибавить такую же сумму нельзя
  const r2 = await call(A, "save", { rev, state: baseState({ pts: 1e16, total: 1e16, run: 1e16 }) });
  assert.ok(r2.clamp || JSON.parse(sq.prepare("SELECT state FROM users WHERE id=1001").get().state).pts < 1e14);
});

test("лимит запросов: частые тяжёлые запросы получают 429, админ — нет", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 1e6, total: 1e6 }) });
  let hit = 0; for (let i = 0; i < 60; i++) { const r = await call(A, "cz_info".replace("cz_info", "cz_roulette"), { bet: 100, pick: "r" }); if (r._status === 429) hit++; }
  assert.ok(hit >= 15, "429 получено " + hit);
  const ok = await call(ADMIN, "auth"); assert.notEqual(ok._status, 429);
});

test("события: золотой час/админ-событие приходят в poll, подарок выдаётся один раз", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState() });
  assert.equal((await call(A, "adm_evt", { name: "X", mult: 2, mins: 5, cat: 3 }))._status, 403 || 200);
  await call(ADMIN, "save", { rev: 0, state: baseState() });
  const ev = await call(ADMIN, "adm_evt", { name: "Тест", mult: 3, mins: 10, cat: 5 });
  assert.ok(ev.ok);
  const p = await call(A, "poll", {}); assert.equal(p.evt.name, "Тест"); assert.equal(p.evt.mult, 3);
  assert.ok((await call(A, "evt_claim", {})).ok);
  assert.match((await call(A, "evt_claim", {})).error, /Уже/);
  assert.ok((await call(A, "poll", {})).grants.some(g => g.kind === "cat" && g.a === 5));
  await call(ADMIN, "adm_evt_stop", {});
});

test("друзья: заявка, принятие, подарок кота только другу, лимит", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ inv: { 3: 2 } }) });
  await call(B, "save", { rev: 0, state: baseState() });
  assert.match((await call(A, "fr_gift", { uid: 1002, cat: 3 })).error, /друзьям/);
  assert.ok((await call(A, "fr_add", { uid: 1002 })).ok);
  assert.equal((await call(B, "fr_list", {})).inc.length, 1);
  assert.ok((await call(B, "fr_ok", { uid: 1001 })).ok);
  assert.equal((await call(A, "fr_list", {})).friends.length, 1);
  const g = await call(A, "fr_gift", { uid: 1002, cat: 3 }); assert.ok(!g.error, g.error);
  assert.equal(JSON.parse(sq.prepare("SELECT state FROM users WHERE id=1001").get().state).inv[3], 1);
  assert.ok((await call(B, "poll", {})).grants.some(x => x.kind === "cat" && x.a === 3));
  assert.match((await call(A, "fr_gift", { uid: 1002, cat: 9 })).error, /нет этого/);
  const pr = await call(B, "profile", { uid: 1001 }); assert.equal(pr.fr, 1); assert.ok(pr.inv);
});

test("кланы: создание требует 1 млн, вступление, выход передаёт главу", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ total: 5000 }) });
  assert.match((await call(A, "clan_create", { name: "Арбузы" })).error, /1 000 000/);
  await call(A, "save", { rev: 1, state: baseState({ total: 1.5e6, run: 1.5e6, pts: 1.5e6 }) });
  assert.ok((await call(A, "clan_create", { name: "Арбузы" })).ok);
  await call(B, "save", { rev: 0, state: baseState() });
  assert.match((await call(B, "clan_create", { name: "Арбузы" })).error || "x", /1 000 000|занято/);
  const l = await call(B, "clan_list", {}); assert.equal(l.rows.length, 1);
  assert.ok((await call(B, "clan_join", { id: l.rows[0].id })).ok);
  assert.equal((await call(A, "clan_info", {})).members.length, 2);
  await call(A, "clan_leave", {});
  assert.equal((await call(B, "clan_info", {})).clan.owner, 1002);
});

test("кланы 2: заявки, чат, казна и уровень, роли, настройки", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ total: 2e6, run: 2e6, pts: 2e6 }) });
  await call(B, "save", { rev: 0, state: baseState({ pts: 100 }) });
  const c = await call(A, "clan_create", { name: "Тест", icon: "🔥" }); assert.ok(c.ok);
  assert.ok((await call(A, "clan_edit", { descr: "Привет", mode: 1, icon: "🐉" })).ok);
  const l = await call(B, "clan_list", {}); assert.equal(l.rows[0].icon, "🐉");
  assert.ok((await call(B, "clan_join", { id: c.id })).requested);
  assert.equal((await call(B, "clan_info", {})).myreq, c.id);
  assert.equal((await call(A, "clan_info", {})).reqs.length, 1);
  assert.match((await call(B, "clan_req_ok", { uid: 1002 })).error, /клане/);
  assert.ok((await call(A, "clan_req_ok", { uid: 1002 })).ok);
  assert.match((await call(B, "clan_donate", { amount: 5000 })).error, /Не хватает/);
  assert.ok((await call(A, "clan_donate", { amount: 1500000 })).state.pts <= 5e5 + 1);
  const i = await call(A, "clan_info", {}); assert.equal(i.clan.level, 1); assert.equal((await call(A, "poll", {})).clb, 1);
  assert.match((await call(B, "clan_kick", { uid: 1001 })).error, /глав|офицер/);
  assert.ok((await call(A, "clan_role", { uid: 1002, role: 1 })).ok);
  assert.match((await call(B, "clan_edit", { descr: "x" })).error, /глава/);
  assert.ok((await call(A, "clan_transfer", { uid: 1002 })).ok);
  assert.equal((await call(A, "clan_info", {})).myrole, 1);
  assert.ok((await call(B, "clan_disband", {})).ok);
  assert.equal((await call(A, "clan_info", {})).clan, null);
});

test("друзья 2: поиск, монеты, профиль о себе и витрина", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 5000, inv: { 3: 1, 4: 1 } }) });
  await call(B, "save", { rev: 0, state: baseState() });
  assert.ok((await call(A, "fr_find", { q: "Test" })).rows !== undefined);
  await call(A, "fr_add", { uid: 1002 }); await call(B, "fr_ok", { uid: 1001 });
  assert.match((await call(A, "fr_coins", { uid: 1002, amount: 99999 })).error, /Не хватает/);
  const r = await call(A, "fr_coins", { uid: 1002, amount: 1000 }); assert.ok(!r.error, r.error);
  assert.ok((await call(B, "poll", {})).grants.some(g => g.kind === "pts" && g.a === 1000));
  const p = await call(A, "pf_set", { bio: "я <i>кот", fav: [3, 4, 99, 3] }); assert.deepEqual(p.fav, [3, 4]);
  const pr = await call(B, "profile", { uid: 1001 }); assert.equal(pr.pf.bio, "я iкот"); assert.deepEqual(pr.pf.fav, [3, 4]);
});

test("стили ника и баннер: покупка за кристаллы, выбор, видно в профиле", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ gems: 50 }) });
  assert.match((await call(A, "ns_set", { g: "G1", f: "" })).error, /купи/);
  assert.match((await call(A, "ns_buy", { id: "G9" })).error, /Не хватает/);
  assert.ok((await call(A, "ns_buy", { id: "G1" })).owned.includes("G1"));
  assert.match((await call(A, "ns_buy", { id: "G1" })).error, /Уже/);
  const r = await call(A, "ns_set", { g: "G1", f: "" }); assert.match(r.badges, /~G1/);
  assert.match((await call(B, "profile", { uid: 1001 })).badges, /~G1/);
  assert.ok((await call(A, "bn_set", { img: "data:image/jpeg;base64,AAAA" })).ok);
  assert.ok((await call(B, "profile", { uid: 1001 })).bnimg.startsWith("data:image/jpeg"));
  assert.ok((await call(A, "bn_set", { img: "data:text/html;base64,AAAA" })).error);
});

test("золотой градиент: у админа есть сразу, у остальных стоит 99 млн", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ gems: 1000 }) });
  assert.match((await call(A, "ns_buy", { id: "GA" })).error, /Не хватает/);
  assert.match((await call(A, "ns_set", { g: "GA", f: "" })).error, /купи/);
  assert.equal((await call(A, "ns_buy", { id: "G6" })).error, "Нет такого стиля");
  await call(ADMIN, "save", { rev: 0, state: baseState() });
  assert.ok((await call(ADMIN, "ns_list", {})).owned.includes("GA"));
  assert.match((await call(ADMIN, "ns_set", { g: "GA", f: "" })).badges, /~GA/);
});

test("кланы 3: заставка, переименование, значки только от админа, чужой клан", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ total: 2e6, run: 2e6, pts: 2e6 }) });
  await call(B, "save", { rev: 0, state: baseState({ pts: 100 }) });
  const c = await call(A, "clan_create", { name: "Старое" }); assert.ok(c.ok);
  assert.match((await call(A, "clan_edit", { name: "ab" })).error, /3 символ/);
  assert.ok((await call(A, "clan_edit", { name: "Новое имя", descr: "", mode: 0, icon: "🛡" })).ok);
  assert.equal((await call(B, "clan_info", { id: c.id })).clan.name, "Новое имя");
  const img = "data:image/jpeg;base64,AAAA";
  assert.ok((await call(A, "clan_bn", { img })).ok);
  assert.equal((await call(B, "clan_info", { id: c.id })).clan.bnimg, img);
  assert.ok(!(await call(A, "clan_bn", { img: "data:text/html;base64,AA" })).ok);
  assert.equal((await call(B, "clan_info", { id: c.id })).myrole, -1);
  assert.ok((await call(B, "clan_join", { id: c.id })).ok);
  assert.match((await call(B, "clan_bn", { img })).error, /глава/);
  assert.notEqual((await call(A, "adm_clan_badge", { cid: c.id, badges: "v" })).ok, true);
  const r = await call(ADMIN, "adm_clan_badge", { cid: c.id, badges: "vxv" }); assert.equal(r.badges, "v");
  assert.equal((await call(B, "clan_list", {})).rows[0].badges, "v");
  assert.ok((await call(A, "clan_bn", { img: "" })).ok);
  assert.equal((await call(B, "clan_info", {})).clan.bnimg, "");
});

test("кланы 4: картинка клана и покупка градиента за кристаллы", async () => {
  const { call } = await makeEnv();
  const img = "data:image/jpeg;base64,AAAA";
  await call(A, "save", { rev: 0, state: baseState({ total: 2e6, run: 2e6, pts: 2e6, gems: 50 }) });
  await call(B, "save", { rev: 0, state: baseState({}) });
  const c = await call(A, "clan_create", { name: "Картинка", img }); assert.ok(c.ok);
  assert.equal((await call(B, "clan_list", {})).rows[0].img, img);
  assert.match((await call(B, "clan_style", { id: "G1" })).error, /Только глава|клан/i);
  assert.match((await call(A, "clan_style", { id: "G9" })).error, /кристалл/);
  const r = await call(A, "clan_style", { id: "G1" }); assert.equal(r.style, "G1"); assert.deepEqual(r.owned, ["G1"]); assert.equal(r.state.gems, 30);
  assert.equal((await call(A, "clan_style", { id: "G1" })).state, undefined);
  assert.equal((await call(B, "clan_list", {})).rows[0].style, "G1");
  assert.equal((await call(A, "clan_style", { id: "" })).style, "");
  assert.ok((await call(A, "clan_img", { img: "" })).ok);
  assert.equal((await call(B, "clan_list", {})).rows[0].img, "");
});

test("кланы 5: админ удаляет клан и зовёт игрока", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ total: 2e6, run: 2e6, pts: 2e6 }) });
  await call(B, "save", { rev: 0, state: baseState({}) });
  const c = await call(A, "clan_create", { name: "Удалить" }); assert.ok(c.ok);
  assert.notEqual((await call(B, "adm_clan_invite", { cid: c.id, q: "1001" })).ok, true);
  assert.match((await call(ADMIN, "adm_clan_invite", { cid: c.id, q: "999999" })).error, /не найден/);
  assert.match((await call(ADMIN, "adm_clan_invite", { cid: c.id, q: "1001" })).error, /уже в клане/);
  const r = await call(ADMIN, "adm_clan_invite", { cid: c.id, q: "1002" }); assert.ok(r.ok);
  assert.equal((await call(B, "clan_info", {})).inv.id, c.id);
  assert.ok((await call(B, "clan_inv_ok", {})).ok);
  assert.equal((await call(B, "clan_info", {})).clan.id, c.id);
  assert.notEqual((await call(B, "adm_clan_del", { cid: c.id })).ok, true);
  assert.ok((await call(ADMIN, "adm_clan_del", { cid: c.id })).ok);
  assert.equal((await call(B, "clan_info", {})).clan, null);
  assert.equal((await call(A, "clan_list", {})).rows.length, 0);
});

test("ежедневный вход и рефералы", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ gems: 0 }) });
  const i1 = await call(A, "daily_info", {}); assert.equal(i1.can, true); assert.equal(i1.streak, 0);
  const c1 = await call(A, "daily_claim", {}); assert.equal(c1.gems, 5); assert.equal(c1.state.gems, 5); assert.equal(c1.streak, 1);
  assert.match((await call(A, "daily_claim", {})).error, /уже/);
  assert.equal((await call(A, "daily_info", {})).can, false);
  assert.equal((await call(A, "ref_info", {})).count, 0);
});

test("рефералы: бонус обоим, себя приглашать нельзя, повторно не платит", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({}) });
  const C = { ...U(1003), __sp: "ref_1001" }, S1 = { ...U(1004), __sp: "ref_1004" };
  await call(S1, "save", { rev: 0, state: baseState({}) });
  await call(C, "save", { rev: 0, state: baseState({}) });
  assert.equal((await call(A, "ref_info", {})).count, 1);
  assert.equal((await call(A, "poll", {})).grants.length, 0);
  const gc = (await call(C, "poll", {})).grants; assert.deepEqual(gc.map(x => [x.kind, x.a]), [["gems", 10]]);
  await call(C, "save", { rev: 1, state: baseState({ total: 30000, run: 30000, pts: 30000 }) });
  assert.deepEqual((await call(A, "poll", {})).grants.map(x => [x.kind, x.a]), [["gems", 25]]);
  await call(C, "save", { rev: 2, state: baseState({ total: 60000, run: 60000, pts: 60000 }) });
  assert.equal((await call(A, "ref_info", {})).count, 1);
  assert.equal((await call(S1, "poll", {})).grants.length, 0);
});

test("клан: приглашение от главы и задания недели", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ total: 5e6, run: 5e6, pts: 5e6 }) });
  await call(B, "save", { rev: 0, state: baseState({ pts: 5e3, total: 5e3 }) });
  const c = await call(A, "clan_create", { name: "Задания" }); assert.ok(c.ok);
  assert.match((await call(B, "clan_invite", { q: "1001" })).error, /глава и офицеры/);
  assert.match((await call(A, "clan_invite", { q: "нет такого" })).error, /не найден/);
  assert.match((await call(A, "clan_invite", { q: "1001" })).error, /уже в клане/);
  assert.ok((await call(A, "clan_invite", { q: "1002" })).ok);
  assert.equal((await call(B, "clan_info", {})).inv.id, c.id);
  assert.ok((await call(B, "clan_inv_ok", {})).ok);
  const d1 = await call(A, "clan_donate", { amount: 2e6 });
  assert.deepEqual(d1.ct.tasks.map(t => t.done), [true, false, true]);
  const d2 = await call(B, "clan_donate", { amount: 2000 });
  assert.deepEqual(d2.ct.tasks.map(t => t.done), [true, true, true]);
  assert.equal((await call(A, "clan_info", {})).ct.tasks.length, 3);
  const g = (await call(B, "poll", {})).grants; assert.ok(g.every(x => x.kind === "gems") && g.length >= 1);
});

test("коллекция: награды за прогресс; сезон: рейтинг по приросту", async () => {
  const { call } = await makeEnv();
  const inv = {}; for (let i = 0; i < 12; i++) inv[i] = 1;
  await call(A, "save", { rev: 0, state: baseState({ inv, gems: 0 }) });
  const ci = await call(A, "coll_info", {}); assert.equal(ci.n, 12); assert.equal(ci.claimed.length, 0);
  assert.match((await call(A, "coll_claim", { i: 1 })).error, /ещё/);
  const r = await call(A, "coll_claim", { i: 0 }); assert.equal(r.gems, 5); assert.equal(r.state.gems, 5);
  assert.match((await call(A, "coll_claim", { i: 0 })).error, /Уже/);
  await call(B, "save", { rev: 0, state: baseState({ total: 1e6, pts: 1e6 }) });
  const s1 = await call(A, "season_top", {}); assert.ok(Array.isArray(s1.rows)); assert.ok(s1.ends > Date.now() / 1000);
  assert.equal(s1.myScore, 0);
  const g = await call(B, "save", { rev: 1, state: baseState({ total: 3e6, pts: 3e6 }) });
  const s2 = await call(B, "season_top", {}); assert.equal(s2.rows[0].id, 1002); assert.equal(s2.rank, 1);
});

test("защита: мусор в inv и массивах вычищается", async () => {
  const { call } = await makeEnv();
  const bad = baseState({ inv: { "5": 3, "x": 9, "9999": 1, "7": -4, "8": 1e30 }, ach: new Array(1000).fill(1), click: 1e9, perks: { a: 1e9 } });
  await call(A, "save", { rev: 0, state: bad });
  const st = (await call(A, "auth", {})).state;
  assert.deepEqual(Object.keys(st.inv).sort(), ["5", "8"]); assert.equal(st.inv["5"], 3); assert.equal(st.inv["8"], 1e6);
  assert.equal(st.ach.length, 300); assert.equal(st.click, 2000); assert.equal(st.perks.a, 2000);
});

test("мировой арбуз: полив, кулдаун, созревание и награды", async () => {
  const { call, env } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ total: 5e6, run: 5e6, pts: 5e6 }) });
  await call(B, "save", { rev: 0, state: baseState({ pts: 5000, total: 5000 }) });
  const i0 = await call(A, "wm_info", {}); assert.equal(i0.r, 1); assert.equal(i0.p, 0); assert.equal(i0.goal, 3500);
  assert.match((await call(A, "wm_water", { amt: 10 })).error, /Минимум/);
  const w1 = await call(B, "wm_water", { amt: 1000 }); assert.equal(w1.ml, 9); assert.equal(w1.state.pts, 4000); assert.equal(w1.info.my, 9);
  assert.match((await call(B, "wm_water", { amt: 1000 })).error, /впитывает/);
  assert.match((await call(A, "wm_water", { amt: 9e9 })).error, /Не хватает/);
  await env.DB.prepare("UPDATE kv SET v='3490' WHERE k='wp'").run();
  const w2 = await call(A, "wm_water", { amt: 1e6 }); assert.equal(w2.ml, 36); assert.equal(w2.harvest, true); assert.equal(w2.info.r, 2);
  assert.deepEqual((await call(A, "poll", {})).grants.map(x => x.a), [40]);
  assert.deepEqual((await call(B, "poll", {})).grants.map(x => x.a), [30]);
  assert.equal((await call(B, "poll", {})).evt.mult, 1.5);
  assert.equal((await call(A, "wm_info", {})).last.r, 1);
});

test("шахматы: ставка, законность хода, ответ бота, сдача без выплаты, часы", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "auth");
  assert.match((await call(A, "ch_start", { bet: 50 })).error || "", /Неверная/);
  const r = await call(A, "ch_start", { bet: 100 });
  assert.equal(r.s.t, 1); assert.equal(r.pm, 300000);
  assert.equal((await call(A, "ch_start", { bet: 100 })).resume, true, "повторный старт возвращает ту же партию");
  const bad = await call(A, "ch_move", { f: 52, t: 20 });     // пешка e2 не может прыгнуть на 3 клетки
  assert.equal(bad.bad, true);
  const mv = await call(A, "ch_move", { f: 52, t: 36 });      // e2-e4
  assert.ok(!mv.error); assert.equal(mv.s.t, 1, "бот уже ответил"); assert.equal(mv.s.b[36], 1); assert.ok(mv.lm);
  assert.equal((await call(A, "ch_move", { f: 8, t: 16 })).bad, true, "чужой фигурой ходить нельзя");
  const s = await call(A, "ch_resign", {});
  assert.equal(s.done, "loss"); assert.equal(s.pay, 0);
  assert.equal((await call(A, "ch_state", {})).none, true);
  // истечение часов
  await call(A, "ch_start", { bet: 100 });
  const g = JSON.parse(sq.prepare("SELECT v FROM kv WHERE k='ch1001'").get().v); g.last -= 301000; sq.prepare("UPDATE kv SET v=? WHERE k='ch1001'").run(JSON.stringify(g));
  const t = await call(A, "ch_state", {}); assert.equal(t.done, "loss"); assert.equal(t.why, "time");
});

test("шахматы: детский мат выигрывает ×1.9, пат и ничья возвращают ставку", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "auth");
  await call(A, "ch_start", { bet: 1000 });
  const put = async fn => { const g = JSON.parse(sq.prepare("SELECT v FROM kv WHERE k='ch1001'").get().v); fn(g); sq.prepare("UPDATE kv SET v=? WHERE k='ch1001'").run(JSON.stringify(g)); };
  // позиция: чёрный король h8, белые: король f6... мат ферзём g7 (ферзь с g1 -> g7, король f6 защищает)
  await put(g => { const b = Array(64).fill(0); b[7] = -6; b[21] = 6; b[62] = 5; g.s = { b, t: 1, c: [0, 0, 0, 0], ep: -1, hm: 0, n: 30 }; });
  const w = await call(A, "ch_move", { f: 62, t: 14 });
  assert.equal(w.done, "win"); assert.equal(w.pay, 1900);
  await call(A, "ch_start", { bet: 1000 });
  // пат: чёрный король a8, белый король c7, ферзь b6 — ход ферзём в b6 ... ставим ферзя на c5 -> b6 даёт пат
  await put(g => { const b = Array(64).fill(0); b[0] = -6; b[10] = 6; b[41] = 5; g.s = { b, t: 1, c: [0, 0, 0, 0], ep: -1, hm: 0, n: 30 }; });
  const d = await call(A, "ch_move", { f: 41, t: 17 });
  assert.equal(d.done, "draw"); assert.equal(d.why, "stalemate"); assert.equal(d.pay, 1000);
});

test("шахматы вдвоём: столик, очерёдность, часы, сдача, банк −5%, возврат при отмене", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "auth"); await call(B, "auth");
  assert.match((await call(A, "chg_create", { stake: 5 })).error || "", /Неверная/);
  const c = await call(A, "chg_create", { stake: 1000 }); assert.ok(c.id);
  assert.match((await call(A, "chg_create", { stake: 1000 })).error || "", /активный/);
  assert.match((await call(A, "chg_join", { id: c.id })).error || "", /твой/);
  assert.equal((await call(B, "chg_list", {})).rows.length, 1);
  const j = await call(B, "chg_join", { id: c.id }); assert.equal(j.stake, 1000);
  const va = await call(A, "chg_state", { id: c.id }), vb = await call(B, "chg_state", { id: c.id });
  assert.equal(va.me, -vb.me); assert.ok(va.pm > 295000 && va.pm <= 300000);
  const [W, Bl, wid, bid] = va.me === 1 ? [A, B, "A", "B"] : [B, A, "B", "A"];
  assert.match((await call(Bl, "chg_move", { id: c.id, f: 12, t: 28 })).error || "", /не твой/);
  assert.match((await call(W, "chg_move", { id: c.id, f: 52, t: 20 })).error || "", /нельзя/);
  const m1 = await call(W, "chg_move", { id: c.id, f: 52, t: 36 }); assert.ok(!m1.error); assert.equal(m1.s.t, -1);
  const m2 = await call(Bl, "chg_move", { id: c.id, f: 12, t: 28 }); assert.ok(!m2.error); assert.equal(m2.s.t, 1);
  // сдаётся белый: чёрный получает 1900
  const rs = await call(W, "chg_resign", { id: c.id }); assert.equal(rs.status, "done"); assert.equal(rs.winner, 2);
  assert.equal((await call(Bl, "chg_state", { id: c.id })).pay, 1900);
  assert.equal((await call(Bl, "chg_claim", { id: c.id })).amount, 1900);
  assert.equal((await call(Bl, "chg_claim", { id: c.id })).amount, 0, "второй раз не платит");
  assert.equal((await call(W, "chg_claim", { id: c.id })).amount, 0);
  // флажок: у игрока на ходу кончилось время
  const c2 = await call(A, "chg_create", { stake: 500 }); await call(B, "chg_join", { id: c2.id });
  const g = sq.prepare("SELECT * FROM chg WHERE id=?").get(c2.id); sq.prepare("UPDATE chg SET last=? WHERE id=?").run(Date.now() - 301000, c2.id);
  const t = await call(A, "chg_state", { id: c2.id }); assert.equal(t.status, "done"); assert.equal(t.why, "time");
  assert.equal(t.winner, g.w === 1 ? 2 : 1, "выигрывает тот, чей ход не на часах");
  // отмена своего столика возвращает ставку
  const c3 = await call(A, "chg_create", { stake: 300 }); assert.equal((await call(A, "chg_cancel", { id: c3.id })).ok, true);
  assert.equal((await call(A, "chg_claim", { id: c3.id })).amount, 300);
});

test("шахматы: рейтинг Elo растёт у победителя, таблица лидеров, статистика против бота", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "auth"); await call(B, "auth");
  const c = await call(A, "chg_create", { stake: 100 }); await call(B, "chg_join", { id: c.id });
  const va = await call(A, "chg_state", { id: c.id });
  const [W, Bl] = va.me === 1 ? [A, B] : [B, A];
  await call(Bl, "chg_resign", { id: c.id });
  const t = await call(A, "chg_top", {});
  assert.equal(t.top.length, 2);
  const win = t.top[0], lose = t.top[1];
  assert.equal(win.elo, 1020); assert.equal(lose.elo, 980);   // K=40, равные рейтинги: ±20
  assert.equal(win.w, 1); assert.equal(lose.l, 1);
  const me = (await call(W, "chg_top", {})).me; assert.equal(me.rank, 1); assert.equal(me.elo, 1020);
  assert.equal((await call(Bl, "chg_top", {})).me.rank, 2);
  // второй вызов сдачи не меняет рейтинг
  await call(Bl, "chg_resign", { id: c.id });
  assert.equal((await call(A, "chg_top", {})).top.find(x => x.uid === 1001).elo + (await call(A, "chg_top", {})).top.find(x => x.uid === 1002).elo, 2000);
  // против бота: считается отдельно, Elo не трогает
  await call(A, "ch_start", { bet: 1000 }); await call(A, "ch_resign", {});
  const m2 = (await call(A, "chg_top", {})).me; assert.equal(m2.bl, 1);
  assert.ok(m2.elo === 1020 || m2.elo === 980);
});

test("кот-призрак: отправка, возвращение через 6 часов, табличка у хозяина живёт неделю", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "auth"); await call(B, "auth");
  await call(A, "save", { rev: 0, state: baseState({ pts: 500, total: 1e9, inv: { "5": 1 } }) });
  await call(B, "save", { rev: 0, state: baseState({ pts: 500, total: 100, inv: { "7": 1 } }) });
  sq.prepare("UPDATE users SET seen=?").run(Math.floor(Date.now() / 1000));
  assert.match((await call(A, "gh_send", { cat: 9, rar: 3 })).error || "", /нет такого/);
  const s = await call(A, "gh_send", { cat: 5, rar: 3 }); assert.equal(s.ok, true); assert.equal(s.tname.length > 0, true);
  assert.match((await call(A, "gh_send", { cat: 5, rar: 3 })).error || "", /уже в пути/);
  assert.match((await call(A, "gh_claim", {})).error || "", /в пути/);
  const tr = await call(B, "gh_state", {}); assert.equal(tr.traces.length, 1); assert.ok(tr.traces[0].left > 6 * 86400);
  const tk = await call(B, "gh_take", { id: tr.traces[0].id }); assert.equal(tk.gems, 1);
  assert.match((await call(B, "gh_take", { id: tr.traces[0].id })).error || "", /забран/);
  // кот возвращается
  sq.prepare("UPDATE ghost SET ret=?").run(Math.floor(Date.now() / 1000) - 5);
  const cl = await call(A, "gh_claim", {}); assert.ok(cl.pts >= 5000); assert.equal(cl.gems, 2);
  assert.match((await call(A, "gh_claim", {})).error || "", /никуда/);
  // табличка исчезает через неделю
  sq.prepare("UPDATE ghost SET ts=?").run(Math.floor(Date.now() / 1000) - 8 * 86400);
  assert.equal((await call(B, "gh_state", {})).traces.length, 0);
});

test("Вознесение: сервер не даёт уровень выше, чем позволяет накопленное", async () => {
  const { call } = await makeEnv();
  await call(A, "auth");
  await call(A, "save", { rev: 0, state: baseState({ pts: 10, total: 10 }) });
  const r = await call(A, "save", { rev: 1, state: baseState({ pts: 10, total: 10, pl: 5 }) });
  assert.ok(!r.error);
  const st = (await call(A, "profile", { uid: 1001 })); assert.equal(st.pl, 0);
});

const human = n => { const t = []; let x = 0; for (let i = 0; i < n; i++) { x += 110 + ((i * 37) % 90); t.push(x); } return t; };
const robot = n => Array.from({ length: n }, (_, i) => 80 + i * 70);

test("дуэли тапов: человек выигрывает ×1.9, автокликер проигрывает и банится", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 1e6, total: 1e6 }) }); await call(B, "save", { rev: 0, state: baseState({ pts: 1e6, total: 1e6 }) });
  const c = await call(A, "td_create", { stake: 1000 }); assert.ok(c.ok);
  assert.match((await call(A, "td_end", { id: c.id, taps: human(60) })).error || "", /Рано/);
  sq.prepare("UPDATE td SET s1=?").run(Date.now() - 20500);
  assert.equal((await call(A, "td_end", { id: c.id, taps: human(100) })).score, 100);
  const j = await call(B, "td_join", { id: c.id }); assert.ok(j.ok);
  sq.prepare("UPDATE td SET s2=?").run(Date.now() - 20500);
  const r = await call(B, "td_end", { id: c.id, taps: human(60) }); assert.equal(r.st, "done"); assert.equal(r.winner, 2);
  const w = await call(A, "td_claim", { id: c.id }); assert.equal(w.amount, 1900);
  // автокликер
  const c2 = await call(B, "td_create", { stake: 500 }); sq.prepare("UPDATE td SET s1=? WHERE id=?").run(Date.now() - 20500, c2.id);
  const bad = await call(B, "td_end", { id: c2.id, taps: robot(200) }); assert.equal(bad.cheat, true);
  for (let i = 0; i < 2; i++) { const c3 = await call(B, "td_create", { stake: 500 }); if (c3.error) break; sq.prepare("UPDATE td SET s1=? WHERE id=?").run(Date.now() - 20500, c3.id); await call(B, "td_end", { id: c3.id, taps: robot(200) }); }
  assert.match((await call(B, "td_create", { stake: 500 })).error || "", /автокликер/);
});

test("события на поле: выдаются раз в несколько минут, дождь проверяет ритм", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 1e6, total: 1e9 }) });
  const r = await call(A, "fe_roll", {}); assert.ok(r.ev);
  assert.equal((await call(A, "fe_roll", {})).ev.type, r.ev.type);
  assert.match((await call(A, "fe_claim", { taps: [], pick: 0 })).error || "x", /Рано/);
  sq.prepare("UPDATE kv SET v=json_set(v,'$.ts',?,'$.type','rain') WHERE k='fe1001'").run(Date.now() - 12500);
  const bad = await call(A, "fe_claim", { taps: robot(40) }); assert.match(bad.error || "", /ритм/);
  assert.equal((await call(A, "fe_roll", {})).none, 1);
});

test("клановые рейды: дежурство, рейд, щит и казна", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ total: 2e6, run: 2e6, pts: 2e6 }) }); await call(B, "save", { rev: 0, state: baseState({ total: 2e6, run: 2e6, pts: 2e6 }) });
  const ca = await call(A, "clan_create", { name: "Альфа" }), cb = await call(B, "clan_create", { name: "Бета" }); assert.ok(ca.ok && cb.ok);
  sq.prepare("UPDATE clans SET bank=1000000 WHERE id=?").run(cb.id);
  const st = await call(A, "cr_state", {}); assert.equal(st.tg.length, 1);
  const s = await call(A, "cr_start", { kind: "raid", target: cb.id }); assert.ok(s.ok);
  sq.prepare("UPDATE kv SET v=json_set(v,'$.s',?) WHERE k='crr1001'").run(Date.now() - 20500);
  const e = await call(A, "cr_end", { taps: human(80) }); assert.equal(e.win, true); assert.equal(e.loot, 50000);
  assert.equal(sq.prepare("SELECT bank FROM clans WHERE id=?").get(ca.id).bank, 50000);
  sq.prepare("UPDATE kv SET v='{\"until\":0}' WHERE k='crt1001'").run();
  assert.match((await call(A, "cr_start", { kind: "raid", target: cb.id })).error || "", /защитой/);
});

test("защита от автокликера: быстрый ритм тремя пальцами с разбросом проходит, строго одинаковый нет", async () => {
  const { call, sq } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({ pts: 1e6, total: 1e6 }) });
  let x = 0; const fast = Array.from({ length: 280 }, (_, i) => (x += 20 + ((i * 53) % 37)));
  const c = await call(A, "td_create", { stake: 1000 }); sq.prepare("UPDATE td SET s1=?").run(Date.now() - 20500);
  assert.equal((await call(A, "td_end", { id: c.id, taps: fast })).score, 280);
  sq.prepare("UPDATE td SET st='cancel'").run();
  const c2 = await call(A, "td_create", { stake: 1000 }); sq.prepare("UPDATE td SET s1=? WHERE id=?").run(Date.now() - 20500, c2.id);
  assert.equal((await call(A, "td_end", { id: c2.id, taps: Array.from({ length: 300 }, (_, i) => 50 + i * 20) })).cheat, true);
});

test("помощник админа: урезанные права, назначить и забрать", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({}) }); await call(B, "save", { rev: 0, state: baseState({}) });
  assert.equal((await call(A, "auth", {})).mod, false);
  assert.equal((await call(A, "adm_mod", { uid: 1001, on: true })).error, "Нет доступа");
  assert.ok((await call(ADMIN, "adm_mod", { uid: 1001, on: true })).ok);
  assert.equal((await call(A, "auth", {})).mod, true);
  assert.deepEqual((await call(ADMIN, "adm_mods", {})).rows.map(x => x.id), [1001]);
  assert.ok((await call(A, "adm_ban", { uid: 1002, on: true })).ok);
  assert.equal((await call(A, "adm_ban", { uid: ADMIN_ID, on: true })).error, "Нельзя");
  assert.equal((await call(A, "adm_give", { uid: 1002, kind: "pts", a: 5 })).error, "Нет доступа");
  assert.equal((await call(A, "adm_resetall", {})).error, "Нет доступа");
  assert.equal((await call(A, "adm_mod", { uid: 1002, on: true })).error, "Нет доступа");
  assert.ok((await call(ADMIN, "adm_mod", { uid: 1001, on: false })).ok);
  assert.equal((await call(A, "auth", {})).mod, false);
  assert.equal((await call(A, "adm_ban", { uid: 1002, on: false })).error, "Нет доступа");
});

test("ведущий модератор: выдаёт только себе монеты и котов, делает рассылки", async () => {
  const { call } = await makeEnv();
  await call(A, "save", { rev: 0, state: baseState({}) }); await call(B, "save", { rev: 0, state: baseState({}) });
  await call(ADMIN, "adm_mod", { uid: 1001, on: true });
  assert.equal((await call(A, "adm_give", { kind: "pts", a: 5 })).error, "Нет доступа");
  await call(ADMIN, "adm_mod", { uid: 1001, on: true, senior: true });
  assert.equal((await call(A, "auth", {})).smod, true);
  assert.ok((await call(A, "adm_give", { kind: "pts", a: 5 })).ok);
  assert.ok((await call(A, "adm_give", { kind: "cat", a: 3, b: 1 })).ok);
  assert.equal((await call(A, "adm_give", { kind: "pts", a: 5, target: 1002 })).error, "Ведущий модератор выдаёт только себе");
  assert.equal((await call(A, "adm_give", { kind: "gems", a: 5 })).error, "Недоступно");
  assert.equal((await call(A, "adm_give", { kind: "takepts", a: 5 })).error, "Недоступно");
  assert.ok((await call(A, "adm_bcast", { text: "привет" })).ok);
  assert.equal((await call(A, "adm_resetall", {})).error, "Нет доступа");
  await call(ADMIN, "adm_mod", { uid: 1001, on: true });
  assert.equal((await call(A, "adm_bcast", { text: "привет" })).error, "Нет доступа");
});
