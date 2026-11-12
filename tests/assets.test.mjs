import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { makeDB, BOT_TOKEN } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = async () => {
  const f = join(mkdtempSync(join(tmpdir(), "mds-")), "w.mjs");
  writeFileSync(f, readFileSync(join(root, "bot", "worker_small.js"), "utf8"));
  return (await import(pathToFileURL(f).href)).default;
};
const ctx = { waitUntil() {} };

test("страница и атлас отдаются из Static Assets, GitHub не нужен", async () => {
  const w = await load(), seen = [];
  const ASSETS = { fetch: async u => { seen.push(String(u)); return new Response(String(u).endsWith(".jpg") ? "JPG" : "<html>GAME</html>", { status: 200 }); } };
  const real = globalThis.fetch; globalThis.fetch = async u => { throw new Error("сеть не должна вызываться: " + u); };
  try {
    const env = { DB: makeDB(), BOT_TOKEN, ASSETS };
    assert.match(await (await w.fetch(new Request("https://t.test/"), env, ctx)).text(), /GAME/);
    assert.equal(await (await w.fetch(new Request("https://t.test/atlas.jpg"), env, ctx)).text(), "JPG");
    assert.deepEqual(seen, ["https://assets.local/game.html", "https://assets.local/mdcats2.jpg"]);
  } finally { globalThis.fetch = real; }
});

test("без ASSETS воркер откатывается на GitHub raw", async () => {
  const w = await load(), urls = [];
  const real = globalThis.fetch; globalThis.fetch = async u => { urls.push(String(u)); return new Response("<html>RAW</html>"); };
  try { assert.match(await (await w.fetch(new Request("https://t.test/"), { DB: makeDB(), BOT_TOKEN }, ctx)).text(), /RAW/); } finally { globalThis.fetch = real; }
  assert.match(urls[0], /raw\.githubusercontent\.com/);
});

test("public/ содержит страницу и все картинки, на которые ссылается клиент", () => {
  const html = readFileSync(join(root, "public", "game.html"), "utf8");
  assert.ok(!html.includes("raw.githubusercontent.com"), "в клиенте остались ссылки на GitHub raw");
  for (const f of ["game.html", "mdcats2.jpg", "joske.jpg", "admin/0.jpg"]) assert.ok(existsSync(join(root, "public", f)), f);
  const tech = [...html.matchAll(/\/tech\/\$\{i\}\.jpg/g)].length; assert.ok(tech >= 1 && existsSync(join(root, "public", "tech", "0.jpg")));
});
