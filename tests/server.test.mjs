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
  for (let i = 0; i < 80; i++) { const r = await call(A, "cz_roulette", { bet: 100, pick: "r" }); seen.add(r.payout === 0 ? "0" : r.jackpot ? "j" : String(r.payout)); }
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
