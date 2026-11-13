# Браузерный тест анимаций кейсов (нужен Python Playwright): python3 tests/ui/cases_ui.py
import pathlib, json, subprocess, tempfile
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]; P = ROOT / "public"; S = tempfile.mkdtemp()
subprocess.run(["node", "-e", "import('file://'+process.argv[1]+'/bot/worker.js').then(async m=>{const r=await m.default.fetch(new Request('https://t.test/demo'),{},{});require('fs').writeFileSync(process.argv[2],await r.text())})", str(ROOT), S + "/demo.html"], check=True)
html = open(S + "/demo.html", encoding="utf-8").read(); errs = []; out = {}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 844})
    pg.on("pageerror", lambda e: errs.append(str(e) + " | " + (e.stack or "")[:300]))
    def route(r):
        u = urlparse(r.request.url)
        if u.hostname == "t.test":
            if u.path == "/": return r.fulfill(content_type="text/html", body=html)
            f = P / ("mdcats2.jpg" if u.path == "/atlas.jpg" else u.path.lstrip("/"))
            return r.fulfill(body=f.read_bytes()) if f.is_file() else r.fulfill(status=404, body="")
        r.abort()
    pg.route("**/*", route); pg.goto("https://t.test/"); pg.wait_for_timeout(3500)
    ev = pg.evaluate
    ev("S.pts=1e12;S.gems=500;tab=2;render();window._r0=roll;0")
    idx = ev("(()=>{const f=r=>ITEMS.findIndex((it,i)=>it[2]===r&&!it[6]&&!it[7]);return [0,1,2,3,4,6].map(f)})()")
    def run(name, i, ci, wait_star):
        ev(f"endOv(); window.roll=()=>{i}; S.pts=1e12; S.gems=500; openCase({ci},0,1)")
        pg.wait_for_selector(".strip", state="attached", timeout=3000); out[name + "_strip"] = True
        pg.wait_for_timeout(1500); ev("skipRoll=true")
        if wait_star:
            pg.wait_for_selector(".rss", state="attached", timeout=4000); pg.wait_for_timeout(500)
            pg.screenshot(path=S + f"/{name}_star.png")
        out[name + "_star"] = ev("!!document.querySelector('.rss')") if not wait_star else True
        pg.wait_for_selector(".rcard", timeout=9000); pg.wait_for_timeout(400)
        out[name + "_card"] = True; pg.screenshot(path=S + f"/{name}_card.png")
        out[name + "_glitch_seen"] = out.get(name + "_glitch_seen", False)
    run("common", idx[0], 0, False)
    out["common_has_star"] = ev("!!document.querySelector('.rss')")
    run("epic", idx[2], 2, True); run("legend", idx[3], 2, True)
    run("tech", idx[5], 2, True)
    # пачкой
    ev("endOv(); window.roll=window._r0; S.pts=1e12; openCase(0,0,5)")
    pg.wait_for_selector(".mbox", state="attached", timeout=4000); out["multi_box"] = True
    pg.wait_for_timeout(400); ev("document.querySelector('.ov2').dispatchEvent(new PointerEvent('pointerdown'));setTimeout(()=>document.querySelector('.ov2').dispatchEvent(new PointerEvent('pointerdown')),100)")
    pg.wait_for_selector("[data-a=ovclose]", timeout=9000); out["multi_done"] = ev("document.querySelectorAll('.mc').length"); pg.screenshot(path=S + "/multi.png")
    out["errors"] = errs[:5]; b.close()
print(json.dumps(out, ensure_ascii=False))
assert not out["errors"], out["errors"]
assert out["common_strip"] and out["common_card"] and not out["common_has_star"]
for n in ("epic", "legend", "tech"): assert out[n + "_strip"] and out[n + "_star"] and out[n + "_card"], n
assert out["multi_box"] and out["multi_done"] == 5
print("UI cases test OK; скриншоты:", S)
