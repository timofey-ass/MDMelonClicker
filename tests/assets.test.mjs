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

test("каждая картинка, которую клиент собирает по имени, есть в public/", () => {
  const src = ["app.js", "part3.js"].map(f => readFileSync(join(root, "bot", f), "utf8")).join("\n");
  const need = new Set(["mascot.png", "bank_logo.png", "collector.png", "black_market.png", "joske.jpg", "mdcats2.jpg", "admin/0.jpg"]);
  for (const m of src.matchAll(/"((?:bc|new2?|tech)\/)"? *\+/g)) need.add(m[1] + "0.jpg");
  for (const d of ["bc", "new", "new2", "tech"]) { assert.ok(existsSync(join(root, "public", d, "0.jpg")), d + "/0.jpg"); }
  for (const f of need) assert.ok(existsSync(join(root, "public", f)), "нет public/" + f);
  // число файлов в каталогах совпадает с оригиналами в корне репозитория
  const { readdirSync } = await_import_fs();
  for (const d of ["bc", "new", "new2", "tech", "admin"]) assert.equal(readdirSync(join(root, "public", d)).length, readdirSync(join(root, d)).length, d);
});
function await_import_fs() { return { readdirSync: (p) => process.getBuiltinModule("node:fs").readdirSync(p) }; }

test("manifest для установки: иконки на месте, страница ссылается на manifest, есть sw.js и страница скачивания", () => {
  const m = JSON.parse(readFileSync(join(root, "public", "manifest.webmanifest"), "utf8"));
  assert.equal(m.start_url, "/"); assert.equal(m.display, "standalone");
  for (const i of m.icons) assert.ok(existsSync(join(root, "public", i.src.slice(1))), i.src);
  assert.ok(m.icons.some(i => i.purpose === "maskable") && m.icons.some(i => i.sizes === "512x512" && i.purpose === "any"));
  assert.match(readFileSync(join(root, "public", "game.html"), "utf8"), /rel="manifest" href="\/manifest\.webmanifest"/);
  for (const f of ["sw.js", "download.html"]) assert.ok(existsSync(join(root, "public", f)), f);
});
