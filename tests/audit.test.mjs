import test from "node:test";
import assert from "node:assert/strict";
import { makeEnv, U, ADMIN, baseState } from "./helpers.mjs";

const P = U(2001, "Игрок"), M = U(2002, "Модер");

test("журнал: действия админа и модератора пишутся, читать может только админ", async () => {
  const { call, sq } = await makeEnv();
  await call(P, "auth"); await call(P, "save", { rev: 0, state: baseState() });
  await call(M, "auth");
  assert.equal((await call(ADMIN, "adm_mod", { uid: 2002, on: 1 })).ok, true);
  assert.equal((await call(ADMIN, "adm_fban", { uid: 2001, on: 1 })).ok, true);
  assert.equal((await call(ADMIN, "adm_fban", { uid: 2001, on: 0 })).ok, true);
  assert.equal((await call(M, "adm_ban", { uid: 2001, on: 1 })).ok, true);
  // отказ по правам не попадает в журнал
  assert.equal((await call(M, "adm_fban", { uid: 2001, on: 1 }))._status, 403);
  // чтение журнала: модератору нельзя
  assert.equal((await call(M, "adm_log", {}))._status, 403);
  assert.equal((await call(P, "adm_log", {}))._status, 403);
  const r = await call(ADMIN, "adm_log", {});
  assert.equal(r.rows.length, 4);
  assert.equal(r.rows[0].act, "мут в чате"); assert.equal(r.rows[0].role, "mod"); assert.equal(r.rows[0].an, "Модер"); assert.equal(r.rows[0].tn, "Игрок");
  assert.equal(r.rows[1].act, "снял бан"); assert.equal(r.rows[2].act, "ЗАБАНИЛ игрока"); assert.equal(r.rows[3].act, "назначил помощником");
  assert.equal(r.rows[3].role, "admin");
  assert.ok(r.actors.length === 2);
  // фильтр по человеку
  const f = await call(ADMIN, "adm_log", { actor: 2002 }); assert.equal(f.rows.length, 1);
  // чтение журнала само не пишется
  assert.equal((await call(ADMIN, "adm_log", {})).rows.length, 4);
  assert.equal(sq.prepare("SELECT COUNT(*) c FROM alog").get().c, 4);
});

test("журнал: хранит не больше 1000 записей и листается", async () => {
  const { call, sq } = await makeEnv();
  await call(P, "auth");
  for (let i = 0; i < 1005; i++) sq.prepare("INSERT INTO alog (ts,actor,an,role,act) VALUES (?,?,?,?,?)").run(i, 1, "x", "admin", "тест");
  await call(ADMIN, "adm_maint", { on: 0, text: "" });
  assert.ok(sq.prepare("SELECT COUNT(*) c FROM alog").get().c <= 1001);
  const r1 = await call(ADMIN, "adm_log", {}); assert.equal(r1.rows.length, 40); assert.equal(r1.more, true);
  const r2 = await call(ADMIN, "adm_log", { off: 40 }); assert.equal(r2.rows.length, 40);
});
