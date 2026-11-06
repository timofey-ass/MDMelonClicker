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
async function getHtml() {
  const r = await fetch(HTML_URL, {cf: {cacheTtl: 30, cacheEverything: true}});
  if (!r.ok) throw new Error("html " + r.status);
  return r.text();
}''').replace('return new Response(HTML, {','return new Response(await getHtml(), {').replace('new Response(HTML.replace(','new Response((await getHtml()).replace(')
open('worker_small.js','w').write(sm)
