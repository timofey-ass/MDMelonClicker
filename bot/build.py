import json
d=json.load(open('data.json'))
for k in ('FREE_EVERY',): d.pop(k,None)
head=open('app_head.html').read(); js=open('app.js').read().replace('/*PART3*/',open('part3.js').read())
ic=open("icons.json").read()
html=head+"<script>const D="+json.dumps(d,ensure_ascii=False)+";const IC="+ic+";\n"+js+"\n</script></body></html>\n"
open('index.html','w').write(html)
TPL=open('worker_tpl.js').read().replace('__ANN__',json.dumps([c for c in d['CHANGES'] if c[0]==d.get('ANNV',d['CHANGES'][0][0])][0],ensure_ascii=False))
w=TPL.replace('__HTML__',json.dumps(html,ensure_ascii=False).replace('</','<\\/'))
open('worker.js','w').write(w)
print(len(html),len(w))

sm=TPL.replace('const HTML = __HTML__;','''const HTML_URL = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/bot/src/index.html";
async function getHtml(env) {
  // основной путь: страница лежит в Workers Static Assets (public/game.html); запасной: GitHub raw
  if (env && env.ASSETS) { const r = await env.ASSETS.fetch("https://assets.local/game.html"); if (r.ok) return r.text(); }
  const r = await fetch(HTML_URL, {cf: {cacheTtl: 30, cacheEverything: true}});
  if (!r.ok) throw new Error("html " + r.status);
  return r.text();
}''').replace('return new Response(HTML, {','return new Response(await getHtml(env), {').replace('new Response(HTML.replace(','new Response((await getHtml(env)).replace(')
open('worker_small.js','w').write(sm)
import os
os.makedirs('../public',exist_ok=True)
open('../public/game.html','w').write(html)
