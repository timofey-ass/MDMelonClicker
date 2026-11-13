# Браузерный тест ролл-системы (нужен Python Playwright): python3 tests/ui/roll_ui.py
import pathlib, json
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import tempfile, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]; P=ROOT/"public"; S=tempfile.mkdtemp()
subprocess.run(["node","-e","import('file://'+process.argv[1]+'/bot/worker.js').then(async m=>{const r=await m.default.fetch(new Request('https://t.test/demo'),{},{});require('fs').writeFileSync(process.argv[2],await r.text())})",str(ROOT),S+"/demo.html"],check=True)
html=open(S+"/demo.html",encoding="utf-8").read(); errs=[]; out={}
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":390,"height":844})
    pg.on("pageerror", lambda e: errs.append(str(e)+" | "+(e.stack or "")[:400]))
    def route(r):
        u=urlparse(r.request.url)
        if u.hostname=="t.test":
            if u.path=="/": return r.fulfill(content_type="text/html",body=html)
            f=P/("mdcats2.jpg" if u.path=="/atlas.jpg" else u.path.lstrip("/"))
            return r.fulfill(body=f.read_bytes()) if f.is_file() else r.fulfill(status=404,body="")
        r.abort()
    pg.route("**/*", route); pg.goto("https://t.test/"); pg.wait_for_timeout(3500)
    ev=pg.evaluate
    ev("S.pts=1e12;S.gems=500;tab=2;render();window._r0=roll;0")
    idx=ev("(()=>{const f=r=>ITEMS.findIndex((it,i)=>it[2]===r&&!it[6]&&!it[7]);return [0,1,2,3,4,6].map(f)})()")
    out["idx"]=idx
    # 1) обычный кот: без анимации
    ev(f"window.roll=()=>{idx[0]}; openCase(0,0,1)")
    pg.wait_for_timeout(300)
    out["common_overlay"]=ev("!!document.querySelector('.ov2')"); out["common_toast"]=ev("document.querySelector('#toast').textContent")
    out["panel"]=ev("(()=>{const t=document.querySelector('#view').innerText;return [t.includes('Автокрутка'),t.includes('1 к'),t.includes('Последний ролл')]})()")
    pg.screenshot(path=S+"/roll_panel.png")
    # 2) сцены по редкостям
    for name,i,ci in [("epic",idx[2],2),("legend",idx[3],2),("myth",idx[4],3),("tech",idx[5],2)]:
        ev(f"window.roll=()=>{i}; endOv&&endOv(); S.pts=1e12; S.gems=500; openCase({ci},0,1)")
        pg.wait_for_timeout(1100 if name!="epic" else 450)
        out[name+"_scene"]=ev("!!document.querySelector('.rss')")
        pg.screenshot(path=S+f"/roll_{name}_mid.png")
        try:
            pg.wait_for_selector(".rcard", timeout=9000)
        except Exception as e:
            out[name+"_FAIL"]=ev("[!!OVL, busy, document.querySelector('.ov2')&&document.querySelector('.ov2').className, document.querySelector('.ov2')&&document.querySelector('.ov2').children.length]"); out["errs_so_far"]=errs[:3]; pg.screenshot(path=S+f"/roll_{name}_fail.png"); continue
        pg.wait_for_timeout(500)
        out[name+"_odds"]=ev("(document.querySelector('.rodd')||{}).textContent")
        pg.screenshot(path=S+f"/roll_{name}_card.png")
        ev("endOv()")
    # 3) скорость 10 — без разгона
    ev("S.perks.rspd=10; window.roll=()=>%d; S.pts=1e12; openCase(2,0,1)"%idx[3]); pg.wait_for_timeout(150)
    out["speed10_scene"]=ev("!!document.querySelector('.rss')"); out["speed10_card"]=ev("!!document.querySelector('.rcard')")
    ev("endOv()")
    # 4) порог анимации «Никогда»
    ev("S.perks.rspd=0; LSset('anr',7); window.roll=()=>%d; S.pts=1e12; openCase(2,0,1)"%idx[3]); pg.wait_for_timeout(200)
    out["never_overlay"]=ev("!!document.querySelector('.ov2')"); ev("LSset('anr',2)")
    # 5) покупка улучшения скорости
    ev("S.perks.rspd=0; S.gems=50; A.perk({dataset:{i:'rspd'}})"); out["perk_lv"]=ev("S.perks.rspd"); out["gems_after"]=ev("S.gems")
    # 6) автокрутка: крутит и останавливается
    ev("window.roll=window._r0; S.pts=1e12; S.perks.rspd=10; LSset('anr',7); LSset('arn',10); LSset('arc',0); tab=2; render(); const o0=S.opened; window._o0=o0; A.autotog()")
    pg.wait_for_timeout(2500)
    out["auto_opened"]=ev("S.opened-window._o0"); out["auto_on_after"]=ev("autoOn")
    pg.screenshot(path=S+"/roll_auto.png")
    out["errors"]=errs[:5]; b.close()
print(json.dumps(out,ensure_ascii=False,indent=1))
assert not out["errors"], out["errors"]
assert out["common_overlay"] is False and out["never_overlay"] is False
assert out["epic_scene"] and out["legend_scene"] and out["myth_scene"]
assert out["speed10_scene"] is False and out["speed10_card"] is True
assert out["perk_lv"] == 1 and out["auto_opened"] == 10 and out["auto_on_after"] is False
assert not [k for k in out if k.endswith("_FAIL")], "сцена не дошла до карточки"
print("UI roll test OK; скриншоты:", S)
