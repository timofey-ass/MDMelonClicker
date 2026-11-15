// Тестовый стенд: Cloudflare Worker + мок D1 на node:sqlite (без сети и без Cloudflare).
import { DatabaseSync } from "node:sqlite";
import { createHmac } from "node:crypto";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const BOT_TOKEN = "123456789:TEST_TOKEN_not_real_aaaaaaaaaaaaaaaaaaaa";
export const ADMIN_ID = 1796286471;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

class Stmt {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...a) { return new Stmt(this.db, this.sql, a.map(v => v === undefined ? null : typeof v === "boolean" ? +v : v)); }
  run() { const r = this.db.prepare(this.sql).run(...this.args); return Promise.resolve({ success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }); }
  first() { const r = this.db.prepare(this.sql).get(...this.args); return Promise.resolve(r ? { ...r } : null); }
  all() { return Promise.resolve({ results: this.db.prepare(this.sql).all(...this.args).map(r => ({ ...r })) }); }
}
export function makeDB() {
  const sq = new DatabaseSync(":memory:");
  const db = {
    sq,
    prepare: sql => new Stmt(sq, sql),
    async batch(list) { sq.exec("BEGIN"); try { const out = []; for (const s of list) out.push(await s.run()); sq.exec("COMMIT"); return out; } catch (e) { sq.exec("ROLLBACK"); throw e; } },
  };
  return db;
}

let wfile, nload = 0;
export function loadWorker() {
  // воркер собирается из исходников: python3 bot/build.py (кладёт bot/worker.js).
  // Каждый тест получает свежий экземпляр модуля: у воркера есть глобальный флаг ready.
  if (!wfile) {
    const dir = mkdtempSync(join(tmpdir(), "mdw-"));
    wfile = join(dir, "worker.mjs");
    writeFileSync(wfile, readFileSync(join(root, "bot", "worker.js"), "utf8"));
  }
  return import(pathToFileURL(wfile).href + "?n=" + (++nload));
}

export function initData(user, authDate = Math.floor(Date.now() / 1000), token = BOT_TOKEN) {
  const p = new URLSearchParams({ auth_date: String(authDate), user: JSON.stringify(user), query_id: "q" }); if (user.__sp) p.set("start_param", user.__sp);
  const dcs = [...p.entries()].map(([k, v]) => k + "=" + v).sort().join("\n");
  const key = createHmac("sha256", "WebAppData").update(token).digest();
  p.set("hash", createHmac("sha256", key).update(dcs).digest("hex"));
  return p.toString();
}

export async function makeEnv(extra = {}) {
  const w = (await loadWorker()).default;
  const env = { DB: makeDB(), BOT_TOKEN, ...extra };
  const tgCalls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u, o) => {
    if (String(u).startsWith("https://api.telegram.org/")) { tgCalls.push({ url: String(u), body: o && o.body ? JSON.parse(o.body) : null }); return new Response(JSON.stringify({ ok: true, result: {} }), { headers: { "content-type": "application/json" } }); }
    return realFetch(u, o);
  };
  const ctx = { waitUntil: () => {} };
  const call = async (user, path, body = {}, headers = {}) => {
    const h = { "content-type": "application/json", ...headers };
    if (user) h["x-init"] = initData(user);
    const r = await w.fetch(new Request("https://t.test/api/" + path, { method: "POST", headers: h, body: JSON.stringify(body) }), env, ctx);
    let j = null; try { j = await r.json(); } catch (e) {}
    return Object.assign(j || {}, { _status: r.status });
  };
  return { env, call, sq: env.DB.sq, tgCalls, worker: w, ctx };
}

export const U = (id, name = "P" + id) => ({ id, first_name: name, username: "u" + id });
export const ADMIN = U(ADMIN_ID, "Admin");
export function baseState(over = {}) {
  return { pts: 1000, run: 1000, total: 1000, taps: 0, click: 0, crit: 0, fev: 0, b: [0, 0, 0, 0, 0, 0, 0], gems: 0, ach: [], stars: 0, fevers: 0, prest: 0, ts: 0, daily: 0, boost: 0, inv: {}, eq: -1, opened: 0, pity: 0, freecase: 0, holo: [], xp: 0, fc: [0, 0, 0], hist: [], cv: 3, gt: 0, perks: {}, sets: [], ...over };
}
