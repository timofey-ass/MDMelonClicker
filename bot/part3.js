// ============ PART 3: админка, промокоды, чат, профили, значки, MD3-формы ============
let isAdm = false, myId = 0, myBadges = "", lastBc = 0, onlineN = 0;
const _api0 = api;
api = async function (path, body) {
  const r = await _api0(path, body);
  if (path === "auth" && r && !r.error) { isAdm = !!r.admin; myId = r.id || 0; myBadges = r.badges || ""; }
  if (r && typeof r === "object") for (const k of ["rows", "friends", "members", "inc"]) if (Array.isArray(r[k])) r[k].forEach(x => { if (x && x.ph) PH[x.id !== undefined ? x.id : x.uid] = x.ph; });
  return r;
};
const PH = {};

// ---------- форма «печенька» для кружков (MD3)
(function () {
  const p = []; for (let i = 0; i < 120; i++) { const a = 2 * Math.PI * i / 120, r = 49 * (1 + .055 * Math.cos(9 * a)) / 1.055; p.push((50 + r * Math.cos(a)).toFixed(2) + "% " + (50 + r * Math.sin(a)).toFixed(2) + "%"); }
  document.head.insertAdjacentHTML("beforeend", `<style>.circ,.av{border-radius:0!important;clip-path:polygon(${p.join(",")})}</style>`);
})();

// ---------- значки
const BADGES = {
  c: ["Создатель MDMC", "#ffd54f", `<path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`],
  t: ["Тестер", "#69f0ae", `<path d="M9 9a3 3 0 016 0v7a3 3 0 01-6 0zM12 9v10M5 11h4M15 11h4M5 17h4M15 17h4M9 6L7 4M15 6l2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`],
  g: ["Гений", "#b388ff", `<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`],
  s: ["Поддержал оплату лимитов на Клауд и создателя игры", "#ff8fb1", `<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.4A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`],
  l: ["Продержался 3 дня на 1 месте в лидерах", "#ffd54f", `<path d="M8 4h8v5a4 4 0 01-8 0zM6 5H4v2a3 3 0 003 3M18 5h2v2a3 3 0 01-3 3M12 13v4M8 20h8M10 17h4v3h-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`],
};
const bdg = (s, sz) => String(s || "").split("").filter(c => BADGES[c]).map(c => `<svg class="bdg" title="${BADGES[c][0]}" viewBox="0 0 24 24" width="${sz || 15}" height="${sz || 15}" style="color:${BADGES[c][1]}">${BADGES[c][2]}</svg>`).join("");
const CBADGES = {
  v: ["Подтверждённый клан", "#40c4ff", `<path d="M12 2l2.4 2 3.1-.3 1 3 2.6 1.8-1 3 1 3-2.6 1.8-1 3-3.1-.3L12 22l-2.4-2-3.1.3-1-3L2.9 15.5l1-3-1-3L5.5 7.7l1-3 3.1.3z" fill="currentColor"/><path d="M8 12l3 3 5-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`],
  o: ["Официальный клан", "#ffd54f", `<path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`],
  t: ["Лучший клан", "#ff8a65", `<path d="M8 4h8v5a4 4 0 01-8 0zM6 5H4v2a3 3 0 003 3M18 5h2v2a3 3 0 01-3 3M12 13v4M8 20h8M10 17h4v3h-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`],
  p: ["Партнёр", "#69f0ae", `<path d="M3 12l5-5 4 3 4-3 5 5-9 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`],
  f: ["Огонь", "#ff7043", `<path d="M12 22c4 0 7-2.7 7-6.5 0-3-2-5-3-7-1 1.5-2 2-3 2 0-3-1-6-3-8 0 4-5 6-5 12 0 4 3 7.5 7 7.5z" fill="currentColor"/>`]
};
const cbdg = (s, sz) => String(s || "").split("").filter(c => CBADGES[c]).map(c => `<svg class="bdg" title="${CBADGES[c][0]}" viewBox="0 0 24 24" width="${sz || 16}" height="${sz || 16}" style="color:${CBADGES[c][1]};vertical-align:-3px;margin-left:3px">${CBADGES[c][2]}</svg>`).join("");
const NS_G = {G1: ["Закат", "linear-gradient(90deg,#ff7e5f,#feb47b)", 20], G2: ["Океан", "linear-gradient(90deg,#2193b0,#6dd5ed)", 20], G3: ["Мята", "linear-gradient(90deg,#11998e,#38ef7d)", 30], G4: ["Арбуз", "linear-gradient(90deg,#ff4b5c,#7bd957)", 40], G5: ["Неон", "linear-gradient(90deg,#f953c6,#46c6ff)", 60], G7: ["Радуга", "linear-gradient(90deg,#ff5252,#ffd740,#69f0ae,#40c4ff,#b388ff,#ff5252)", 120, 1], G8: ["Лава", "linear-gradient(90deg,#ff1e00,#ff9100,#ffea00,#ff9100,#ff1e00)", 150, 1], G9: ["Космос", "linear-gradient(90deg,#7b2ff7,#2f80ed,#56ccf2,#bb6bd9,#7b2ff7)", 200, 1], GA: ["Золотой градиент", "linear-gradient(90deg,#8a5a00,#ffb300,#fff3b0,#ffd700,#c98a00,#ffb300,#8a5a00)", 99e6, 1, "filter:drop-shadow(0 0 5px rgba(255,190,0,.65));"]};
const NS_F = {F1: ["Моно", "ui-monospace,Menlo,Consolas,monospace", 15, "font-weight:700"], F2: ["Курсив", "Georgia,serif", 15, "font-style:italic;font-weight:700"], F3: ["Жирный", "Impact,'Arial Black',sans-serif", 25, "letter-spacing:.04em"], F4: ["Рукописный", "'Comic Sans MS','Segoe Print',cursive", 40, "font-weight:700"], F5: ["Строгий", "'Times New Roman',serif", 30, "font-weight:900;letter-spacing:.03em"], F6: ["Широкий", "Verdana,sans-serif", 35, "font-weight:800;letter-spacing:.12em"]};
const nsCss = b => { const m = /~(G\w)?(F\d)?/.exec(b || ""); if (!m) return ""; const g = NS_G[m[1]], f = NS_F[m[2]]; return (g ? `background:${g[1]};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-weight:800;${g[3] ? "background-size:300% 100%;animation:nsa 4s linear infinite;" : ""}${g[4] || ""}` : "") + (f ? `font-family:${f[1]};${f[3]}` : ""); };
const nm = (name, b) => `<span class="nm"><span style="${nsCss(b)}">${esc(name || "Игрок")}</span>${bdg(b)}</span>`;
(function () { const st = document.createElement("style"); st.textContent = `@keyframes nsa{to{background-position:300% 0}}@keyframes cmIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes cmSheet{from{transform:translateY(60px);opacity:.4}to{transform:none;opacity:1}}@keyframes updin{from{opacity:0}to{opacity:1}}@keyframes cmPop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}@keyframes cmSlide{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}.cmv>.card,.cmv>.sec,.cmv>.ocard{animation:cmIn .38s ease both}.cmv>:nth-child(2){animation-delay:.04s}.cmv>:nth-child(3){animation-delay:.08s}.cmv>:nth-child(4){animation-delay:.12s}.cmv>:nth-child(5){animation-delay:.16s}.cmv>:nth-child(6){animation-delay:.2s}.cmv>:nth-child(n+7){animation-delay:.24s}.cmv .seg{animation:none}.cmv .seg button{transition:background .25s,color .25s,transform .15s}.cmv .seg button:active{transform:scale(.94)}.pfc{text-align:center}.pfc .nm{justify-content:center}.pfc .btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.pfav{width:96px;height:96px;border-radius:50%;margin:-48px auto 8px;border:4px solid var(--sur,#1b1b1b);background:#222;overflow:hidden;position:relative;box-shadow:0 4px 16px #0006;animation:cmPop .5s .1s cubic-bezier(.2,1.3,.4,1) both}.pfav img{width:100%;height:100%;object-fit:cover;display:block}.pfeq{position:absolute;right:-2px;bottom:-2px}`; document.head.appendChild(st); })();
const av = (name, id, sz) => { const h = (id * 47) % 360, ph = id === me.id ? ((tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.photo_url) || PH[id]) : PH[id]; return `<div class="av" data-a="prof" data-i="${id}" style="position:relative;overflow:hidden;width:${sz}px;height:${sz}px;background:${hsv(h, .45, .45)};color:${hsv(h, .15, 1)};font-size:${Math.round(sz * .45)}px">${esc((name || "?").trim().charAt(0).toUpperCase())}${ph ? `<img src="${esc(ph)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.remove()">` : ""}</div>`; };

// ---------- модалка
function modal(html) {
  closeModal(); const o = document.createElement("div"); o.className = "mdl"; o.style.animation = "updin .22s ease both"; o.innerHTML = `<div class="mdc" style="animation:cmSheet .34s cubic-bezier(.2,1,.3,1) both">${html}</div>`; o.addEventListener("click", e => { if (e.target === o) closeModal(); }); document.body.appendChild(o); document.body.classList.add("mdo"); return o;
}
function closeModal() { document.querySelectorAll(".mdl").forEach(m => m.remove()); document.body.classList.remove("mdo"); }
A.mclose = function () { document.body.classList.remove("mdo"); document.querySelectorAll(".mdl").forEach(m => { m.style.transition = "opacity .2s"; m.style.opacity = 0; const c = m.firstChild; if (c) { c.style.transition = "transform .22s"; c.style.transform = "translateY(40px)"; } setTimeout(() => m.remove(), 210); }); };

// ---------- опрос сервера: выдачи, объявления, онлайн
function applyReward(kind, a, b) {
  if (!S) return;
  if (kind === "pts") { S.pts += a; S.run += a; S.total += a; }
  else if (kind === "gems") S.gems += a;
  else if (kind === "cat") { const i = Math.max(0, Math.min(ITEMS.length - 1, Math.floor(a))); for (let k = 0; k < (b || 1); k++) grant(i, false); }
  else if (kind === "allcats") { const q = Math.max(1, b || 1); for (let i = 0; i < ITEMS.length; i++) if (!ITEMS[i][7]) S.inv[i] = (S.inv[i] || 0) + q; }
  else if (kind === "takepts") { const t = a < 0 ? S.pts : b === 2 ? S.pts * Math.min(a, 100) / 100 : Math.min(S.pts, a); S.pts = Math.max(0, S.pts - t); }
  else if (kind === "takegems") { const t = a < 0 ? S.gems : Math.min(S.gems, a); S.gems -= t; }
  else if (kind === "takecat") { const k = String(Math.floor(a)); if (k in S.inv) { S.inv[k] -= (b || 1); if (S.inv[k] <= 0) { delete S.inv[k]; S.holo = S.holo.filter(x => x !== +k); if (+S.eq === +k) S.eq = -1; } } }
  checkAch(); mark(); save(true);
}
const rewTxt = (kind, a, b) => kind === "allcats" ? "все коты ×" + (b || 1) : kind === "takegems" ? "−" + (a < 0 ? "все самоцветы" : fmt(a) + " самоцветов") : kind === "takepts" ? "−" + (a < 0 ? "все монеты" : b === 2 ? a + "% монет" : fmt(a) + " монет") : kind === "takecat" ? "отобран кот " + (ITEMS[Math.floor(a)] ? ITEMS[Math.floor(a)][1] : "") + " ×" + (b || 1) : kind === "pts" ? "+" + fmt(a) + " монет" : kind === "gems" ? "+" + fmt(a) + " самоцветов" : ITEMS[Math.floor(a)] ? ITEMS[Math.floor(a)][1] + " ×" + (b || 1) : "награда";
function announce(text) {
  const o = document.createElement("div"); o.className = "ann"; o.innerHTML = `<div class="anc"><div class="t1" style="color:var(--pri);display:flex;align-items:center;gap:8px">${ic("sparkle", 18)}Сообщение</div><div style="margin:10px 0 14px;font-size:15px;white-space:pre-wrap">${esc(text)}</div>${btn("Понятно", "annx")}</div>`;
  document.body.appendChild(o); jingle(1); buzz(1);
}
A.annx = function () { document.querySelectorAll(".ann").forEach(x => x.remove()); };
let polling = false, maintA = null, maintArm = false;
async function pollNow() {
  if (!S || polling) return; polling = true;
  try {
    const r = await api("poll", {bc: lastBc});
    if (r && !r.error) {
      EVT = r.evt || null; CLB = r.clb || 0; evtBar();
      maintA = r.maintA || null;       onlineN = r.online || 0; if (r.uc !== undefined && r.uc !== ucN) { try { await loadUcats(); } catch (e) {} } if (r.badges !== undefined) myBadges = r.badges;
      if (r.rev && r.rev > rev && !saving && !(r.grants && r.grants.length)) { dirty = true; save(true); }
      for (const g of r.grants || []) {
        if (g.kind === "reset") { S = defState(); snap = {inv: {}}; rev = r.rev; dirty = true; fever = frenzy = 0; mark(); save(true); toast("Прогресс сброшен администратором"); render(); if (g.b === 2) announce("Из-за баланса игры нам пришлось сбросить прогресс всем игрокам. В качестве утешительного приза ты получаешь кота «Королевский арбуз»: он увеличивает заработок за каждый тап в 40 раз. Его также можно выбить в Особом кейсе (шанс 2%). Прости и удачной игры!"); continue; }
        if (g.kind === "gemset") { S.gems = Math.max(0, +g.a || 0); mark(); save(true); render(); announce("Из-за баланса кристаллов мы сбросили их у всех игроков. Твой баланс: 💎 " + S.gems + ". Мы выдаём тебе " + S.gems + " самоцветов на раскрутку."); continue; }
        applyReward(g.kind, g.a, g.b); toast((g.kind[0] === "t" && g.kind.startsWith("take") ? "Администратор забрал: " : "Тебе выдали: ") + rewTxt(g.kind, g.a, g.b));
      }
      if (r.grants && r.grants.length && tab !== 0) render();
      if (r.bc) { lastBc = r.bc.id; announce(r.bc.text); } else lastBc = Math.max(lastBc, r.maxbc || 0);
    }
  } catch (e) {}
  polling = false;
}
setInterval(() => { if (!document.hidden) pollNow(); }, 7000);
setTimeout(pollNow, 2500);

// ---------- чат
let chatRows = [], chatSig = "";
function chatHtml() {
  if (!chatRows.length) return `<div class="t2" style="text-align:center;margin:30px">Пока тихо. Напиши первым!</div>`;
  return chatRows.map(m => {
    const mine = m.uid === me.id, t = new Date(m.ts * 1000);
    return `<div class="msg ${mine ? "me" : ""}">${av(m.name, m.uid, 36)}<div class="mb"><div class="mh">${nm(m.name, m.badges)}<span class="t2" style="margin:0 0 0 6px;font-size:11px">${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}</span>${isAdm ? `<button class="mx" data-a="cdel" data-i="${m.id}">${ic("close", 14)}</button>` : ""}</div><div class="mt">${esc(m.text)}</div></div></div>`;
  }).join("");
}
async function chatLoad() {
  if (tab !== 4 || sub !== 2) return;
  const r = await api("chat", {since: 0}); if (!r.rows) return;
  const sig = r.rows.map(x => x.id).join(",") + "|" + isAdm; if (sig === chatSig) return; chatSig = sig; chatRows = r.rows;
  const l = $("#chatlist"); if (!l) return; const near = l.scrollHeight - l.scrollTop - l.clientHeight < 80;
  l.innerHTML = chatHtml(); if (near) l.scrollTop = l.scrollHeight;
}
setInterval(() => { if (!document.hidden) chatLoad(); }, 2500);
A.csend = async function () {
  const i = $("#chatin"); if (!i) return; const text = i.value.trim(); if (!text) return;
  i.value = ""; KEEP.chat = ""; const r = await api("chat_send", {text}); if (r.error) { toast(r.error); i.value = text; KEEP.chat = text; return; }
  chatSig = ""; chatLoad();
};
A.cdel = async function (e) { const r = await api("adm_del", {id: +e.dataset.i}); if (r.error) toast(r.error); chatSig = ""; chatLoad(); };
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "chatin") A.csend(); });

// ---------- профиль
let myPf = {}, pfSel = [];
const agoS = t => { if (!t) return "давно"; const m = Math.max(1, Math.round((Date.now() / 1000 - t) / 60)); return m < 60 ? m + " мин назад" : m < 1440 ? Math.round(m / 60) + " ч назад" : Math.round(m / 1440) + " дн назад"; };
A.prof = async function (e) {
  const uid = +e.dataset.i; const r = await api("profile", {uid}); if (r.error) return toast(r.error);
  if (uid === me.id) myPf = r.pf || {};
  const rows = [["Накоплено", fmt(r.total)], ["Тапов", fmt(r.taps)], ["Котов собрано", r.cats + " / " + ITEMS.length], ["Голограмм", r.holo], ["Достижений", r.ach], ["Кейсов открыто", r.opened], ["Перерождений", r.prest], ["Звёзд поймано", fmt(r.stars || 0)], ["Лихорадок", fmt(r.fevers || 0)], ["Самоцветов заработано", fmt(r.gt || 0)]].concat(r.clan ? [["Клан", esc(r.clan)]] : [], (() => { const ks = Object.keys(r.inv || {}).filter(k => ITEMS[k]).sort((a, b) => ITEMS[b][2] - ITEMS[a][2]); return ks.length ? [["Самый редкий кот", `<span class="rar${ITEMS[ks[0]][2]}">${ITEMS[ks[0]][1]}</span>`]] : []; })());
  const bl = String(r.badges || "").split("").filter(c => BADGES[c]).map(c => `<div style="display:flex;align-items:center;gap:8px;font-size:13px;margin-top:4px">${bdg(c, 18)}<span>${BADGES[c][0]}</span></div>`).join("");
  let adm = "";
  if (isAdm) adm = `<div class="sec" style="margin:14px 0 6px">Админ</div><div style="display:flex;gap:6px;flex-wrap:wrap">${uid !== me.id ? (r.ban === 2 ? "" : btn(r.banned ? "Размутить в чате" : "Мут в чате", "pban", `data-i="${uid}" data-on="${r.banned ? 0 : 1}"`, "o")) + btn(r.ban === 2 ? ic("check", 16) + " Снять бан" : ic("ban", 16) + " Забанить полностью", "pfban", `data-i="${uid}" data-on="${r.ban === 2 ? 0 : 1}"`, "o") + btn("Выдать", "pgive", `data-i="${uid}"`, "o") : ""}${btn("Сбросить прогресс", "preset", `data-i="${uid}"`, "o")}</div><div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${Object.keys(BADGES).map(c => `<button class="chip ${String(r.badges).includes(c) ? "p" : ""}" style="border:0;font-family:inherit" data-a="pbadge" data-i="${uid}" data-c="${c}" data-cur="${r.badges}">${BADGES[c][0].split(" ")[0]}</button>`).join("")}</div>`;
  const own = uid === me.id, bn = own && Number.isInteger(S.bn) ? S.bn : (r.bn || 0), now0 = Date.now() / 1000;
  const eq = r.eq >= 0 ? catEl(r.eq, 96, {}) : catEl("coin", 96, {});
  const tgp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.photo_url) || "";
  const photo = own ? (tgp || r.photo) : r.photo;
  const bg = r.bnimg ? `url(${r.bnimg}) center/cover` : BNR[bn % BNR.length];
  const bnr = `<div style="height:120px;margin:-20px -18px 0;background:${bg};border-radius:28px 28px 0 0"></div>`;
  const avh = `<div style="position:relative;width:96px;margin:-48px auto 8px"><div class="pfav" style="margin:0">${eq}${photo ? `<img src="${esc(photo)}" style="position:absolute;inset:0" onerror="this.remove()">` : ""}</div>${photo && r.eq >= 0 ? `<div title="Текущий кот" style="position:absolute;right:-8px;bottom:-4px;width:46px;height:46px;border-radius:50%;overflow:hidden;border:3px solid var(--surf);background:#222;box-shadow:0 2px 8px #0008">${catEl(r.eq, 46, {})}</div>` : ""}</div>`;
  const bnc = own ? `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center;margin:4px 0 10px">${BNR.map((g, k) => `<div data-a="setbn" data-k="${k}" style="width:30px;height:22px;border-radius:8px;background:${g};cursor:pointer;${!r.bnimg && k === bn ? "outline:2px solid var(--pri);outline-offset:2px" : ""}"></div>`).join("")}<button class="chip" style="border:0;font-family:inherit" data-a="bnup">${ic("image", 16)} Своё фото</button>${r.bnimg ? `<button class="chip" style="border:0;font-family:inherit" data-a="bndel">${ic("close", 14)}</button>` : ""}</div>` : "";
  const bch = String(r.badges || "").split("~")[0].split("").filter(c => BADGES[c]).map(c => `<span class="chip" style="display:inline-flex;gap:5px;align-items:center;font-size:12px">${bdg(c, 16)}${BADGES[c][0]}</span>`).join("");
  const tr = (r.offers || []).length ? `<div class="sec" style="margin:16px 0 6px;text-align:center">Активные обмены</div>${r.offers.map(o => `<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:3px 0">${catEl(o.give, 36, {})}<span style="color:var(--onv)">${ic("arrow", 18)}</span>${catEl(o.want, 36, {})}<span class="t2" style="font-size:12px;margin:0"><span class="rar${ITEMS[o.give][2]}">${ITEMS[o.give][1]}</span> за <span class="rar${ITEMS[o.want][2]}">${ITEMS[o.want][1]}</span></span></div>`).join("")}` : "";
  const frb = own ? `<div class="btns" style="margin-top:14px">${btn(ic("edit", 16) + " Профиль", "pfed", "", "o")}${btn(ic("palette", 16) + " Стиль ника", "nsop", "", "o")}</div>` : `<div class="btns" style="margin-top:14px">${r.fr === 0 ? btn(ic("userplus", 18) + " В друзья", "frad", `data-i="${uid}"`, "o") : r.fr === 1 ? btn(ic("box", 16) + " Кот", "frgp", `data-i="${uid}"`, "o") + btn(ic("coin", 16) + " Монеты", "frcp", `data-i="${uid}"`, "o") + btn("Удалить из друзей", "frdl", `data-i="${uid}"`, "o") : r.fr === 2 ? `<span class="t2" style="margin:0">Заявка отправлена</span>` : btn("Принять заявку", "frok", `data-i="${uid}"`, "o")}</div>`;
  const ik = Object.keys(r.inv || {}).filter(k => ITEMS[k]).sort((a, b) => ITEMS[b][2] - ITEMS[a][2] || a - b);
  const invh = ik.length ? `<details style="margin-top:14px"><summary class="sec" style="cursor:pointer;margin:0;text-align:center;list-style:none">Инвентарь · ${ik.length} ▾</summary><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px;max-height:220px;overflow-y:auto">${ik.map(k => `<div style="position:relative;width:46px;height:46px" title="${esc(ITEMS[k][1])}">${catEl(+k, 46, {})}${r.inv[k] > 1 ? `<span style="position:absolute;right:-2px;bottom:-2px;background:var(--prc);color:var(--onprc);font-size:10px;font-weight:700;border-radius:8px;padding:0 5px">${r.inv[k]}</span>` : ""}</div>`).join("")}</div></details>` : "";
  const pf = r.pf || {}, fav = (pf.fav || []).filter(k => ITEMS[k]), on = r.online;
  const stt = `<div class="t2" style="margin:2px 0 0;font-size:12px;color:${on ? "var(--good)" : "var(--out)"}">${on ? "● в игре сейчас" : (r.seen ? "был(а) " + agoS(r.seen) : "не в сети")}${r.ban === 2 ? ' · <span style="color:#ff5252">забанен</span>' : r.banned ? ' · <span style="color:#ff5252">мут в чате</span>' : ""}</div>`;
  const ex = (pf.bio ? `<div class="t2" style="margin:10px 8px 0;font-style:italic;color:var(--on)">«${esc(pf.bio)}»</div>` : "") + (fav.length ? `<div class="sec" style="margin:16px 0 8px;text-align:center">Витрина</div><div style="display:flex;gap:12px;justify-content:center">${fav.map(k => catEl(+k, 68, {})).join("")}</div>` : "") + ((r.achs || []).length ? `<div class="sec" style="margin:16px 0 8px;text-align:center">Достижения · ${r.achs.length}</div><div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center">${r.achs.map(id => { const a = ACH.find(x => x[0] === id); return a ? `<span style="font-size:11px;background:var(--sch);border-radius:10px;padding:3px 8px" title="${esc(a[2])}">${ic("cup", 12)} ${esc(a[1])}</span>` : ""; }).join("")}</div>` : "");
  const grid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">${rows.map(x => `<div style="background:var(--sch);border-radius:16px;padding:10px 6px;text-align:center"><div style="font-size:16px;font-weight:800">${x[1]}</div><div class="t2" style="font-size:11px;margin:2px 0 0">${x[0]}</div></div>`).join("")}</div>`;
  const adm2 = isAdm && r.bnimg ? `<div style="margin-top:8px">${btn("Убрать баннер игрока", "admbn", `data-i="${uid}"`, "o")}</div>` : "";
  modal(bnr + `<div class="pfc">${avh}<div class="t1" style="font-size:22px">${nm(r.name, r.badges)}</div><div class="t2" style="margin:2px 0 0">ID ${r.id}${isAdm ? " · " + (r.un ? `<a href="https://t.me/${r.un}" target="_blank" style="color:var(--pri)">@${esc(r.un)}</a>` : "без юзернейма") : ""}${r.clan ? ` · <span ${r.clanid ? `data-a="clview" data-i="${r.clanid}" style="cursor:pointer;color:var(--pri)"` : ""}><span style="${nsCss("~" + (r.clanst || ""))}">${esc(r.clan)}</span>${cbdg(r.clanb, 13)}</span>` : ""}</div>${stt}${r.eq >= 0 ? `<div class="t2" style="margin:6px 0 0;font-size:12px">Сейчас с котом: <span class="rar${ITEMS[r.eq][2]}">${esc(ITEMS[r.eq][1])}</span></div>` : ""}${bnc}<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px">${bch}</div>${ex}${tr}${frb}${invh}${grid}${adm2}${adm}<div style="margin-top:16px;text-align:center">${btn("Закрыть", "mclose", "", "t")}</div></div>`);
};
const BNR = ["linear-gradient(135deg,#ff9a3c,#ff3d6e)", "linear-gradient(135deg,#43e97b,#38f9d7)", "linear-gradient(135deg,#4facfe,#7b5cff)", "linear-gradient(135deg,#f6d365,#fda085)", "linear-gradient(135deg,#a18cd1,#fbc2eb)", "linear-gradient(135deg,#232526,#5a5f66)", "linear-gradient(135deg,#00c6ff,#0072ff)", "linear-gradient(135deg,#f953c6,#b91d73)"];
A.setbn = async function (e) { S.bn = +e.dataset.k; mark(); save(true); await api("bn_set", {img: ""}); A.prof({dataset: {i: me.id}}); };
A.bnup = function () {
  const f = document.createElement("input"); f.type = "file"; f.accept = "image/*";
  f.onchange = () => {
    const file = f.files && f.files[0]; if (!file) return; const img = new Image(), url = URL.createObjectURL(file);
    img.onload = async () => {
      const W = 640, H = 240, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"), k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
      x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); URL.revokeObjectURL(url);
      let q = .78, d = c.toDataURL("image/jpeg", q); while (d.length > 85000 && q > .3) { q -= .1; d = c.toDataURL("image/jpeg", q); }
      const r = await api("bn_set", {img: d}); if (r.error) return toast(r.error); toast("Баннер обновлён"); A.prof({dataset: {i: me.id}});
    };
    img.onerror = () => toast("Не удалось открыть картинку"); img.src = url;
  };
  f.click();
};
A.bndel = async function () { await api("bn_set", {img: ""}); toast("Фото убрано"); A.prof({dataset: {i: me.id}}); };
A.admbn = async function (e) { await api("adm_bn_del", {uid: +e.dataset.i}); toast("Баннер убран"); A.prof({dataset: {i: +e.dataset.i}}); };
let nsSt = null;
A.nsop = async function () {
  const r = await api("ns_list", {}); if (r.error) return toast(r.error); nsSt = r; nsShow();
};
function nsShow() {
  const r = nsSt, ow = r.owned, act = r.active || "", ag = (/G\w/.exec(act) || [""])[0], af = (/F\d/.exec(act) || [""])[0];
  const card = (id, nmx, price, sty, sel) => `<div data-a="nsx" data-i="${id}" style="padding:10px 6px;border-radius:14px;background:var(--sch);text-align:center;cursor:pointer;border:2px solid ${sel ? "var(--pri)" : "transparent"};transition:transform .15s" ><div style="font-size:17px;${sty}">${esc(me.name || "Ник")}</div><div class="t2" style="margin:3px 0 0;font-size:11px">${nmx} · ${ow.includes(id) ? (sel ? "выбран" : "куплен") : fmt(price) + " " + ic("gem", 12)}</div></div>`;
  modal(`<div class="pfc"><div class="t1" style="font-size:20px">Стиль ника</div><div class="t2">У тебя ${S.gems} ${ic("gem", 14)}. Выбери цвет и шрифт, они видны всем игрокам.</div><div class="sec" style="text-align:center;margin:12px 0 6px">Цвет</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${card("G0", "Обычный", 0, "", !ag).replace(/ · [^<]*</, " · по умолчанию<").replace('data-i="G0"', 'data-i="G0"')}${Object.keys(NS_G).map(id => card(id, NS_G[id][0], NS_G[id][2], nsCss("~" + id), ag === id)).join("")}</div><div class="sec" style="text-align:center;margin:14px 0 6px">Шрифт</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${card("F0", "Обычный", 0, "", !af).replace(/ · [^<]*</, " · по умолчанию<")}${Object.keys(NS_F).map(id => card(id, NS_F[id][0], NS_F[id][2], nsCss("~" + id), af === id)).join("")}</div><div style="margin-top:16px">${btn("Готово", "mclose", "", "t")}</div></div>`);
}
A.nsx = async function (e) {
  const id = e.dataset.i, r = nsSt, ow = r.owned, act = r.active || "";
  let g = (/G\w/.exec(act) || [""])[0], f = (/F\d/.exec(act) || [""])[0];
  const price = id[1] === "0" ? 0 : (id[0] === "G" ? NS_G[id][2] : NS_F[id][2]);
  if (price && !ow.includes(id)) { if (!confirm("Купить за " + price + " кристаллов?")) return; await save(true); const b = await api("ns_buy", {id}); if (b.error) return toast(b.error); adopt(b); r.owned = b.owned; toast("Куплено"); }
  if (id[0] === "G") g = id[1] === "0" ? "" : id; else f = id[1] === "0" ? "" : id;
  const x = await api("ns_set", {g, f}); if (x.error) return toast(x.error);
  myBadges = x.badges; lbData = null; chatSig = ""; r.active = (g || f) ? g + f : ""; nsShow(); render();
};
A.admbn_ = null;
A.pban = async function (e) { const r = await api("adm_ban", {uid: +e.dataset.i, on: +e.dataset.on}); toast(r.error || (+e.dataset.on ? "Заблокирован" : "Разблокирован")); closeModal(); chatSig = ""; chatLoad(); };
let fbArm = 0;
A.pfban = async function (e) {
  const on = +e.dataset.on, uid = +e.dataset.i;
  if (on && fbArm !== uid) { fbArm = uid; e.textContent = "Точно? Нажми ещё раз"; setTimeout(() => { fbArm = 0; }, 4000); return; }
  fbArm = 0; const r = await api("adm_fban", {uid, on}); if (r.error) return toast(r.error);
  toast(on ? "Игрок забанен, прогресс удалится через 7 дней" : "Бан снят"); closeModal(); chatSig = ""; lbData = null; banList = null; if (tab === 4 || tab === 5) render();
};
A.fbid = function () {
  const v = Number(String(KEEP.admid || "").trim()); if (!v) return toast("Введи ID игрока в поле выше");
  A.pfban({dataset: {i: v, on: 1}, textContent: ""}); if (fbArm === v) { toast("Нажми «Забанить по ID» ещё раз"); }
};
A.fbun = async function (e) { const r = await api("adm_fban", {uid: +e.dataset.i, on: 0}); if (r.error) return toast(r.error); toast("Бан снят"); banList = null; render(); };
let banList = null;
async function loadBans() { const r = await api("adm_banlist", {}); banList = r && r.rows ? r : { rows: [], days: 7 }; if (tab === 5 && moreSub === 3) render(); }
function banCard() {
  if (!banList) { setTimeout(loadBans, 30); return `<div class="card col"><div class="t1" style="color:#ff5252">Баны</div><div class="t2">Загрузка…</div></div>`; }
  const nowS = Math.floor(Date.now() / 1000), D = banList.days || 7;
  const row = x => { const st = x.st === "ban" ? (nowS - x.at > D * 86400 ? "прогресс удалён" : "удалится через " + Math.max(0, Math.ceil((x.at + D * 86400 - nowS) / 86400)) + " дн.") : x.st === "purged" ? "прогресс удалён" : "разбанен"; const dt = new Date(x.at * 1000); const ds = dt.toLocaleDateString("ru-RU", {day: "2-digit", month: "2-digit"}) + " " + dt.toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit"});
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.07)"><div class="grow" data-a="prof" data-i="${x.id}" style="cursor:pointer;min-width:0"><div class="t1" style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.name || "Без имени")}${x.un ? ' <span style="color:var(--onv);font-weight:400">@' + esc(x.un) + "</span>" : ""}</div><div class="t2" style="font-size:11px;margin:0;color:${x.st === "unban" ? "var(--good)" : "#ff8a80"}">ID ${x.id} · ${ds} · ${st}</div></div>${x.st === "ban" || x.st === "purged" ? btn("Разбан", "fbun", `data-i="${x.id}"`, "o") : ""}</div>`; };
  return `<div class="card col"><div class="t1" style="color:#ff5252;display:flex;align-items:center;gap:6px">${ic("ban", 16)} Баны</div><div class="t2" style="font-size:12px;margin:0">Полный бан: не пускает в игру и бота, убирает из лидеров. Прогресс стирается через ${D} дн., до этого бан можно снять. Введи ID в поле «Выдать» выше или нажми «Забанить полностью» в профиле игрока.</div>${btn("Забанить по ID", "fbid", 'style="width:100%;justify-content:center;margin:8px 0 4px"', "o")}<div class="t2" style="font-size:12px;margin:6px 0 0;font-weight:700">Последние баны</div>${banList.rows.length ? banList.rows.map(row).join("") : '<div class="t2" style="font-size:12px">Пока никого</div>'}</div>`;
}
A.pbadge = async function (e) {
  const c = e.dataset.c, cur = e.dataset.cur || ""; const nb = cur.includes(c) ? cur.split(c).join("") : cur + c;
  const r = await api("adm_badges", {uid: +e.dataset.i, badges: nb}); toast(r.error || "Значки обновлены"); closeModal(); chatSig = ""; lbData = null; if (tab === 4) render();
};
let rstArm = 0;
A.preset = async function (e) {
  if (rstArm !== e.dataset.i) { rstArm = e.dataset.i; e.textContent = "Точно сбросить? Нажми ещё раз"; setTimeout(() => { rstArm = 0; }, 4000); return; }
  rstArm = 0; const r = await api("adm_reset", {uid: +e.dataset.i}); if (r.error) return toast(r.error);
  toast("Прогресс сброшен: " + (r.name || "")); closeModal(); lbData = null; chatSig = ""; pollNow(); if (tab === 4) render();
};
A.wk = function (e) { const i = +e.dataset.i, t = WKT[i], W = wkEnsure(); if (W.done.includes(i)) return; if (t[3]() - W.base[i] < t[1]) return toast("Ещё не выполнено"); W.done.push(i); S.gems += t[2]; toast("Задание выполнено: +" + t[2] + " самоцв."); mark(); save(true); render(); };
let rstAll = 0;
let gsAll = 0;
A.admgemset = async function (e) {
  if (!gsAll) { gsAll = 1; e.textContent = "ТОЧНО? Всем кристаллы станут 1000. Нажми ещё раз"; setTimeout(() => { gsAll = 0; render(); }, 5000); return; }
  gsAll = 0; const r = await api("adm_gemset", {gems: 1000}); if (r.error) return toast(r.error);
  toast("Кристаллы сброшены до 1000 у игроков: " + r.count); pollNow();
};
A.admresetall = async function (e) {
  if (!rstAll) { rstAll = 1; e.textContent = "ТОЧНО сбросить ВСЕМ? Нажми ещё раз"; setTimeout(() => { rstAll = 0; render(); }, 5000); return; }
  rstAll = 0; const r = await api("adm_resetall", {}); if (r.error) return toast(r.error);
  toast("Сброшено игроков: " + r.count); lbData = null; chatSig = ""; pollNow();
};
A.pgive = function (e) { KEEP.admid = e.dataset.i; closeModal(); tab = 5; moreSub = 3; render(); $("#view").scrollTop = 0; };

// ---------- Топ: лидеры, обмен, чат
const lbHeld = hd => Math.max(0, (lbData.now || now()) + Math.floor((Date.now() - (lbData.at || Date.now())) / 1000) - hd.since);
const lbDur = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h >= 24 ? Math.floor(h / 24) + " д " + (h % 24) + " ч" : h > 0 ? h + " ч " + m + " мин" : m + " мин"; };
function lbPrize() {
  const need = lbData.need || 259200, h1 = (lbData.hold || []).find(x => x.rank === 1), row1 = lbData.rows[0], held = h1 ? lbHeld(h1) : 0, f = Math.min(1, held / need), mineLead = h1 && h1.uid === me.id, got = String(myBadges || "").includes("l");
  const img = ADM_IMG.replace("admin/0.jpg", "bc/9.jpg?v=1");
  const st = got ? `<div style="color:var(--good);font-weight:700;font-size:12px">${ic("check", 14)} Награда получена</div>` : mineLead ? `<div style="font-weight:700;font-size:12px;color:var(--gold)">Ты лидер ${lbDur(held)} · осталось ${lbDur(Math.max(0, need - held))}</div>` : h1 && row1 ? `<div class="t2" style="margin:0;font-size:11px">1 место: <b>${esc(row1.name)}</b> · ${lbDur(held)} из 3 д</div>` : `<div class="t2" style="margin:0;font-size:12px">Первое место свободно. Займи его!</div>`;
  return `<div class="card col lbprize"><i class="lbsp" style="left:46%;top:10px"></i><i class="lbsp" style="left:72%;top:44px;animation-delay:.7s"></i><i class="lbsp" style="left:90%;top:12px;animation-delay:1.3s"></i><i class="lbsp" style="left:30%;top:58px;animation-delay:1.9s"></i><div style="display:flex;gap:10px;align-items:center"><div class="lbpimg" style="background-image:url(${img})"></div><div class="grow"><div class="lbtt">Золотой лидер ${bdg("l", 14)}</div><div class="t2" style="margin:1px 0 3px;font-size:11px;line-height:1.25">3 дня на 1 месте = Золотой кот и значок</div>${st}</div></div>${bar(Math.max(0, Math.min(1, f)))}</div>`;
}
tTop = function () {
  let h = `<div class="seg"><button class="${sub === 0 ? "on" : ""}" data-a="sub" data-i="0">Лидеры</button><button class="${sub === 1 ? "on" : ""}" data-a="sub" data-i="1">Обмен</button><button class="${sub === 2 ? "on" : ""}" data-a="sub" data-i="2">Чат</button><button class="${sub === 3 ? "on" : ""}" data-a="sub" data-i="3">Друзья</button><button class="${sub === 4 ? "on" : ""}" data-a="sub" data-i="4">Кланы</button></div>`;
  if (sub >= 3) { if (!soc.at || Date.now() - soc.at > 20000) socLoad(); return h + tSocial(); }
  if (sub === 2) {
    return h + `<div class="t2" style="margin:0 4px 6px;display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:var(--good)"></span>Общий чат · в игре ${onlineN || 1}</div><div id="chatlist" class="chatlist">${chatHtml()}</div><div style="display:flex;gap:8px;margin-top:8px"><input id="chatin" data-keep="chat" maxlength="200" placeholder="Сообщение" autocomplete="off">${btn(ic("up", 18), "csend", 'style="width:48px;padding:0;justify-content:center"')}</div><div class="card tgc" data-a="tgchat" style="margin-top:12px;cursor:pointer"><div class="circ" style="width:42px;height:42px;color:var(--pri)">${ic("tg", 22)}</div><div class="grow"><div class="t1">Заходи в ТГ чат</div><div class="t2" style="margin:0">Общаемся, делимся находками и новостями</div></div>${btn("Открыть", "tgchat", "", "o")}</div>`;
  }
  if (sub === 0) {
    h += `<div class="card"><div class="grow"><div class="t1" style="display:flex;align-items:center;gap:8px">${ic("medal", 18)}Таблица лидеров</div><div class="t2">Монеты на данный момент, траты в казино тоже считаются</div></div>${btn("Обновить", "reloadtop")}</div>`;
    if (!lbData) return h + `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
    h += lbPrize();
    h += `<div class="card" style="background:var(--sch)"><div class="t1 grow" style="color:var(--onprc)">Ты: ${nm(me.name, myBadges)}${lbData.rank ? " · место " + lbData.rank : ""}</div></div>`;
    lbData.rows.forEach((r, i) => { const hd = i < 3 ? (lbData.hold || []).find(x => x.rank === i + 1 && x.uid === r.id) : null; h += `<div class="card ${r.id === me.id ? "p" : ""}"><div class="circ" style="width:38px;height:38px;font-size:15px;font-weight:700"><span style="color:${["#ffd54f", "#cfd8dc", "#d7966a"][i] || "inherit"}">${i + 1}</span></div>${av(r.name, r.id, 40)}<div class="grow"><div class="t1">${nm(r.name, r.badges)}</div>${hd ? `<div class="t2" style="margin:0;font-size:12px">⏱ на этом месте ${lbDur(lbHeld(hd))}</div>` : ""}</div><div class="t1">${fmt(r.total)}</div></div>`; });
    return h;
  }
  h += `<div class="card"><div class="grow"><div class="t1" style="display:flex;align-items:center;gap:8px">${ic("swap", 18)}Обмен котами</div><div class="t2">Меняй дубликаты с другими игроками. Предложенный кот уходит в залог и возвращается при отмене.</div></div></div><div style="display:flex;gap:8px;margin-bottom:10px">${btn("Создать предложение", "newoffer")}${btn("Обновить", "reloadoff", "", "t")}</div>`;
  if (!offData) return h + `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
  const mine = offData.filter(o => o.seller === me.id), oth = offData.filter(o => o.seller !== me.id);
  if (mine.length) { h += `<div class="sec">Мои предложения</div>`; mine.forEach(o => h += offerCard(o, true)); }
  h += `<div class="sec">Все предложения</div>`;
  h += oth.length ? oth.map(o => offerCard(o, false)).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока нет предложений</div>`;
  return h;
};
offerCard = function (o, mineF) {
  const can = (S.inv[o.want + ""] || 0) >= 1;
  return `<div class="card">${catEl(o.give, 52, {})}<div style="color:var(--onv)">${ic("arrow", 22)}</div>${catEl(o.want, 52, {})}<div class="grow"><div class="t1" style="font-size:13px"><span class="rar${ITEMS[o.give][2]}">${ITEMS[o.give][1]}</span> за <span class="rar${ITEMS[o.want][2]}">${ITEMS[o.want][1]}</span></div><div class="t2">${mineF ? "Твоё предложение" : nm(o.sname, o.badges)}</div></div>${mineF ? btn("Отмена", "canceloff", `data-i="${o.id}"`, "o") : btn("Обменять", "accept", `data-i="${o.id}"`, can ? "" : "dis")}</div>`;
};

// ---------- ввод, который переживает перерисовку
const KEEP = {};
document.addEventListener("input", e => { const k = e.target && e.target.dataset && e.target.dataset.keep; if (k) KEEP[k] = e.target.value; });

// ---------- админ-панель
let admIdx = 0, admQty = 1, admKind = "pts", promoList = null;
const admCard = () => {
  const it = ITEMS[admIdx], rc = RC[it[2]];
  const chips3 = (arr, a) => `<div class="buyrow3">${arr.map(x => btn(x[0], a, `data-v="${x[1]}"`, "o")).join("")}</div>`;
  const chips = (arr, a) => `<div class="buyrow4">${arr.map(x => btn(x[0], a, `data-v="${x[1]}"`, "o")).join("")}</div>`;
  let h = `<div class="card col"><div class="t1" style="color:var(--pri);display:flex;align-items:center;gap:8px">${ic("tune", 18)}Админ-панель</div><div class="t2">Выдача приходит игроку в течение нескольких секунд, если у него открыта игра. Пусто в поле ID = себе.</div><input data-keep="admid" inputmode="numeric" placeholder="ID игрока">`;
  h += `<div style="display:flex;align-items:center;gap:10px;margin-top:6px">${catEl(admIdx, 46, {})}<div class="grow t1" style="color:${rc};font-size:14px">${it[1]} · ${RARS[it[2]][0]} ×${admQty}</div></div>`;
  h += chips3([["−", -1], ["+", 1], ["+5", 5]], "admidx") + chips3([["×1", 1], ["×5", 5], ["×10", 10]], "admqty");
  h += btn("Выдать котика", "admcat", 'style="width:100%;justify-content:center"');
  h += btn("Выдать ВСЕХ котов ×" + admQty, "admallcats", 'style="width:100%;justify-content:center"', "o");
  h += chips3([["+1M", 1e6], ["+1B", 1e9], ["+1T", 1e12]], "admpts");
  h += `<div class="buyrow">${btn(ic("gem", 14) + "+10", "admgem", 'data-v="10"', "o")}${btn(ic("gem", 14) + "+100", "admgem", 'data-v="100"', "o")}</div>`;
  h += `<div class="t1" style="color:var(--err,#ff5252);margin-top:10px">Забрать у игрока</div><div class="t2">Нужен ID игрока в поле выше (себе тоже можно)</div>`;
  h += btn("Отобрать кота: " + it[1] + " ×" + admQty, "admtakecat", 'style="width:100%;justify-content:center"', "o");
  h += `<div class="buyrow3">${[10, 50, 99].map(x => btn("−" + x + "%", "admtakepct", `data-v="${x}"`, "o")).join("")}</div><input data-keep="admamt" placeholder="Своя сумма, например 5e25" style="margin-top:6px">` + btn("Забрать эту сумму", "admtakeamt", 'style="width:100%;justify-content:center"', "o") + btn("Забрать все монеты", "admtakeall", 'style="width:100%;justify-content:center"', "o") + `` + btn("Забрать все самоцветы", "admtakegem", 'data-v="-1" style="width:100%;justify-content:center"', "o") + `</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Банк (тест)</div><div class="t2" style="font-size:12px;margin:0">Пропускает час твоего долга: коллекторы придут сразу.</div>${btn("⏩ Пропустить час долга", "admskip", 'style="width:100%;justify-content:center"', "o")}</div>`;
  if (KEEP.tgc === undefined) KEEP.tgc = "Вышло обновление v" + CHANGES[0][0] + " «" + CHANGES[0][2] + "»:\n" + CHANGES[0][1].map(x => "• " + x).join("\n");
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Сообщение во все чаты бота</div><div class="t2" style="font-size:12px;margin:0">Придёт каждому игроку в личку от бота, с кнопкой «Играть». Уходит порциями, пока игроки заходят в игру.</div><textarea data-keep="tgc" rows="3" maxlength="1000" placeholder="Текст сообщения"></textarea><div id="tgst" class="t2" style="font-size:12px;margin:0">${tgStat ? tgStat : ""}</div>${btn("Отправить в чаты", "admtg", 'style="width:100%;justify-content:center"', "o")}</div>`;
  if (!tgStat) setTimeout(tgRefresh, 50);
  h += banCard();
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Технический перерыв</div><div class="t2" style="font-size:12px;margin:0">Закрывает игру у всех игроков сразу, без перезагрузки страницы. Ты (админ) играть можешь. Когда выключишь, игра откроется сама.</div>${maintA ? `<div class="t2" style="color:var(--err,#ff5252);font-weight:700;margin:0">Сейчас игра закрыта: ${esc(maintA)}</div>` : ""}<textarea data-keep="mt" rows="2" placeholder="Что написать игрокам (необязательно)"></textarea>${btn(maintA ? "✅ Открыть игру" : "🛠 Закрыть на перерыв", "admmaint", 'style="width:100%;justify-content:center"', maintA ? "" : "o")}</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Событие (множитель дохода)</div><input data-keep="evn" placeholder="Название, напр. Арбузная лихорадка"><input data-keep="evm" inputmode="decimal" placeholder="Множитель, напр. 2"><input data-keep="evt" inputmode="numeric" placeholder="Минут, напр. 60"><input data-keep="evc" inputmode="numeric" placeholder="ID кота-подарка (необязательно)">${btn("Запустить", "admev")}${btn("Остановить", "admevs")}</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Сообщение всем в игре</div><textarea data-keep="bc" rows="2" placeholder="Текст сообщения"></textarea>${btn("Показать всем", "admbc")}</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Промокоды</div><input data-keep="pcode" placeholder="Код, например NEWYEAR" style="text-transform:uppercase"><div class="buyrow4">${[["Монеты", "pts"], ["Самоцветы", "gems"], ["Кот", "cat"]].map(x => `<button class="chip ${admKind === x[1] ? "p" : ""}" style="border:0;font-family:inherit;justify-content:center" data-a="admkind" data-v="${x[1]}">${x[0]}</button>`).join("")}</div><input data-keep="pa" inputmode="decimal" placeholder="${admKind === "cat" ? "Номер кота 0–62" : "Сколько"}">${admKind === "cat" ? `<input data-keep="pb" inputmode="numeric" placeholder="Сколько котов (1)">` : ""}<input data-keep="pmx" inputmode="numeric" placeholder="Сколько человек смогут ввести (0 = без лимита)">${btn("Создать промокод", "admpromo")}`;
  if (promoList) h += promoList.map(p => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)"><div class="grow"><div class="t1" style="font-size:14px">${esc(p.code)}</div><div class="t2" style="font-size:11px">${rewTxt(p.kind, p.a, p.b)} · использовано ${p.used}${p.mx ? "/" + p.mx : ""}</div></div>${btn(ic("close", 16), "admpdel", `data-v="${esc(p.code)}"`, "t")}</div>`).join("");
  h += `<div class="t1" style="color:#ff5252;margin-top:12px">Опасная зона</div>` + btn("Сбросить прогресс ВСЕМ игрокам", "admresetall", 'style="width:100%;justify-content:center"', "o") + btn("Сбросить кристаллы ВСЕМ до 1000", "admgemset", 'style="width:100%;justify-content:center;margin-top:6px"', "o");
  return h + `</div>`;
};
async function admTarget() { const v = (KEEP.admid || "").trim(); return v ? +v : 0; }
async function admGive(kind, a, b) {
  const t = await admTarget(); if (t && !/^\d+$/.test(String(t))) return toast("Неверный ID");
  const r = await api("adm_give", {target: t, kind, a, b}); if (r.error) return toast(r.error);
  toast(kind.startsWith("take") ? "Отобрано у " + (r.name || "себя") + (r.now ? ": монеты " + fmt(r.was.pts) + " → " + fmt(r.now.pts) + ", самоцветы " + fmt(r.was.gems) + " → " + fmt(r.now.gems) : " (сервер старый!)") : "Выдано: " + (r.name || "себе")); pollNow();
}
A.admidx = function (e) { admIdx = ((admIdx + +e.dataset.v) % ITEMS.length + ITEMS.length) % ITEMS.length; render(); };
A.admqty = function (e) { admQty = +e.dataset.v; render(); };
let allCatsArm = 0;
A.admallcats = function (e) {
  if (!allCatsArm) { allCatsArm = 1; e.textContent = "Точно выдать всех? Нажми ещё раз"; setTimeout(() => { allCatsArm = 0; if (tab === 5) render(); }, 4000); return; }
  allCatsArm = 0; admGive("allcats", 0, admQty);
};
A.admcat = function () { admGive("cat", admIdx, admQty); };
A.admpts = function (e) { admGive("pts", +e.dataset.v, 1); };
A.admtakecat = function () { admGive("takecat", admIdx, admQty); };
A.admtakepts = function (e) { admGive("takepts", +e.dataset.v, 1); };
A.admtakegem = function (e) { admGive("takegems", +e.dataset.v, 1); };
A.admtakepct = function (e) { admGive("takepts", +e.dataset.v, 2); };
A.admtakeamt = function () { const v = Number(String(KEEP.admamt || "").replace(",", ".")); if (!isFinite(v) || v <= 0) return toast("Введи сумму"); admGive("takepts", v, 1); };
A.admtakeall = function () { admGive("takepts", -1, 1); };
A.admgem = function (e) { admGive("gems", +e.dataset.v, 1); };
A.admev = async function () { const r = await api("adm_evt", {name: KEEP.evn, mult: KEEP.evm, mins: KEEP.evt, cat: KEEP.evc}); if (r.error) return toast(r.error); toast("Событие запущено"); pollNow(); };
A.admevs = async function () { await api("adm_evt_stop", {}); toast("Событие остановлено"); EVT = null; evtBar(); pollNow(); };
A.evtc = async function () { const r = await api("evt_claim", {}); if (r.error) return toast(r.error); toast("Подарок скоро придёт"); pollNow(); };
function evtBar() {
  let el = document.getElementById("evtbar");
  if (!EVT || now() >= EVT.until) { if (el) el.remove(); document.body.classList.remove("evton"); return; }
  if (!el) { el = document.createElement("div"); el.id = "evtbar"; el.style.cssText = "position:fixed;left:12px;right:12px;z-index:60;background:linear-gradient(90deg,#ffb300,#ff7043);color:#2b1400;font-weight:800;font-size:14px;padding:9px 14px;border-radius:18px;display:flex;gap:10px;align-items:center;justify-content:center;box-shadow:0 2px 12px #0007"; document.body.appendChild(el); }
  const nv = document.getElementById("nav"); el.style.bottom = ((nv ? nv.offsetHeight : 76) + 8) + "px"; document.body.classList.add("evton");
  const m = Math.max(0, Math.ceil((EVT.until - now()) / 60)), gift = EVT.cat !== undefined && !EVT.auto ? `<span data-a="evtc" style="background:#2b1400;color:#ffd54f;padding:2px 8px;border-radius:10px">🎁 забрать</span>` : "";
  el.innerHTML = `⚡ ${esc(EVT.name)} ×${EVT.mult} · ${m >= 60 ? Math.floor(m / 60) + " ч " + (m % 60) + " м" : m + " мин"}${gift}`;
}
setInterval(() => { try { evtBar(); } catch (e) {} }, 20000);
A.admbc = async function () { const r = await api("adm_bcast", {text: KEEP.bc || ""}); if (r.error) return toast(r.error); KEEP.bc = ""; toast("Отправлено всем"); render(); pollNow(); };
A.admkind = function (e) { admKind = e.dataset.v; render(); };
A.admpromo = async function () {
  const r = await api("adm_promo_new", {code: KEEP.pcode || "", kind: admKind, a: +(KEEP.pa || 0), b: +(KEEP.pb || 1), mx: +(KEEP.pmx || 0)});
  if (r.error) return toast(r.error); toast("Промокод " + r.code + " создан"); KEEP.pcode = KEEP.pa = KEEP.pb = KEEP.pmx = ""; loadPromos();
};
A.admpdel = async function (e) { await api("adm_promo_del", {code: e.dataset.v}); loadPromos(); };
async function loadPromos() { const r = await api("adm_promo_list", {}); promoList = r.rows || []; if (tab === 5) render(); }

// ---------- вкладка «Ещё»
A.promo = async function () {
  const code = (KEEP.promo || "").trim(); if (!code) return toast("Введи промокод");
  const r = await api("promo_use", {code}); if (r.error) return toast(r.error);
  applyReward(r.kind, r.a, r.b); KEEP.promo = ""; toast("Промокод активирован: " + rewTxt(r.kind, r.a, r.b)); jingle(2); buzz(2); render();
};
const _tMore2 = tMore;
tMore = function () {
  let h = _tMore2();
  h = h.replace(/<div class="card col"><div class="t1" style="color:var\(--pri\)">Перенос из плагина<\/div>[\s\S]*?<\/textarea>[\s\S]*?<\/button><\/div>/, "");
  const head = `<div class="card"><div class="grow"><div class="t1">${nm(me.name, myBadges)}</div><div class="t2">ID ${me.id}</div></div></div>`;
  h = h.replace(/^<div class="card"><div class="grow"><div class="t1">[\s\S]*?<\/div><div class="t2">ID \d+<\/div><\/div><\/div>/, head + (isAdm ? admCard() : ""));
  const promo = `<div class="card col"><div class="t1" style="color:var(--pri)">Промокод</div><div style="display:flex;gap:8px"><input data-keep="promo" placeholder="Введи промокод" style="text-transform:uppercase">${btn("Ок", "promo")}</div></div>`;
  h = h.replace('<button class="btn t" data-a="reset"', promo + '<button class="btn t" data-a="reset"');
  if (isAdm && !promoList) loadPromos();
  return h;
};

// ---------- общий рендер: восстановление ввода, запуск чата
const _render3 = render;
render = function () {
  const ae = document.activeElement, keepFocus = ae && ae.dataset && ae.dataset.keep, pos = keepFocus ? ae.selectionStart : 0;
  _render3();
  document.querySelectorAll("[data-keep]").forEach(el => { const v = KEEP[el.dataset.keep]; if (v !== undefined) el.value = v; });
  if (keepFocus) { const e2 = document.querySelector(`[data-keep="${keepFocus}"]`); if (e2) { e2.focus(); try { e2.setSelectionRange(pos, pos); } catch (x) {} } }
  if (tab === 4 && sub === 2) { chatSig = ""; chatLoad(); const l = $("#chatlist"); if (l) l.scrollTop = l.scrollHeight; }
};

// ---------- эффекты
const PCOL = ["#ffd54f", "#fff", "#ffb300", "#ffe082"];
let lastPt = {x: innerWidth / 2, y: innerHeight / 2};
document.addEventListener("pointerdown", e => { lastPt = {x: e.clientX, y: e.clientY}; }, true);
let _fxc = -9999, _fxv = 1;
const fxOn = () => { const n = performance.now(); if (n - _fxc > 1500) { _fxv = LS("fxt", 1); _fxc = n; } return _fxv; };
const FX = {cv: null, cx: null, p: [], raf: 0, d: 1, last: 0}, FX_MAX = 260;
function fxSize() { if (!FX.cv) return; FX.d = Math.min(devicePixelRatio || 1, 2); FX.cv.width = Math.round(innerWidth * FX.d); FX.cv.height = Math.round(innerHeight * FX.d); }
function fxAdd(o, delay) {
  if (!fxOn()) return;
  if (!FX.cv) { const c = document.createElement("canvas"); c.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:61"; document.body.appendChild(c); FX.cv = c; FX.cx = c.getContext("2d"); fxSize(); addEventListener("resize", fxSize); }
  o.t = -(delay || 0) / 1000; if (FX.p.length >= FX_MAX) FX.p.splice(0, FX.p.length - FX_MAX + 1); FX.p.push(o);
  if (!FX.raf) { FX.last = performance.now(); FX.raf = requestAnimationFrame(fxLoop); }
}
function fxShape(cx, sh, r) {
  cx.beginPath();
  if (sh === "o") cx.arc(0, 0, r, 0, 6.2832);
  else if (sh === "s") cx.rect(-r, -r * .6, r * 2, r * 1.2);
  else if (sh === "t") { cx.moveTo(0, -r); cx.lineTo(r, r * .8); cx.lineTo(-r, r * .8); cx.closePath(); }
  else if (sh === "d") { cx.moveTo(0, -r); cx.lineTo(r * .7, 0); cx.lineTo(0, r); cx.lineTo(-r * .7, 0); cx.closePath(); }
  else { const n = sh === "5" ? 5 : 4; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, q = i % 2 ? r * .4 : r; i ? cx.lineTo(Math.cos(a) * q, Math.sin(a) * q) : cx.moveTo(Math.cos(a) * q, Math.sin(a) * q); } cx.closePath(); }
  cx.fill();
}
function fxLoop(t) {
  const dt = Math.min(.05, (t - FX.last) / 1000); FX.last = t; const cx = FX.cx, d = FX.d, a = FX.p; let n = 0;
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, FX.cv.width, FX.cv.height);
  for (let i = 0; i < a.length; i++) {
    const p = a[i]; p.t += dt; if (p.t < 0) { a[n++] = p; continue; } const k = p.t / p.d; if (k >= 1) continue; a[n++] = p;
    const e = 1 - Math.pow(1 - k, 3); let x, y, sc, al, rot = (p.rot || 0) * k * .01745;
    if (p.k === "c") { x = p.x + p.dx * k + Math.sin(k * 9 + p.ph) * 16; y = p.y + p.dy * Math.pow(k, 1.15); sc = 1; al = k < .8 ? 1 : 1 - (k - .8) / .2; }
    else if (p.k === "f") { x = p.x + p.dx * e; y = p.y - p.rise * e; sc = k < .2 ? .5 + 3.25 * k : 1.15 - .25 * (k - .2) / .8; al = k < .2 ? k / .2 : 1 - (k - .2) / .8; }
    else if (p.k === "r") { cx.setTransform(d, 0, 0, d, 0, 0); cx.globalAlpha = Math.max(0, p.a0 * (1 - k)); cx.strokeStyle = p.col; cx.lineWidth = 3; cx.beginPath(); cx.arc(p.x, p.y, p.r * (.2 + 1.4 * e), 0, 6.2832); cx.stroke(); continue; }
    else { x = p.x + p.dx * e; y = p.y + p.dy * e + (p.g || 0) * k * k; sc = k < .45 ? .4 + 1.55 * k : 1.1 - .8 * (k - .45) / .55; al = k < .45 ? 1 : 1 - (k - .45) / .55; }
    cx.globalAlpha = Math.max(0, al); cx.setTransform(d * Math.cos(rot) * sc, d * Math.sin(rot) * sc, -d * Math.sin(rot) * sc, d * Math.cos(rot) * sc, x * d, y * d);
    if (p.k === "f") { cx.font = `800 ${p.sz}px system-ui,-apple-system,sans-serif`; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.lineWidth = 4; cx.lineJoin = "round"; cx.strokeStyle = "rgba(0,0,0,.55)"; cx.strokeText(p.txt, 0, 0); cx.fillStyle = p.col; cx.fillText(p.txt, 0, 0); }
    else { cx.fillStyle = p.col; fxShape(cx, p.sh, p.sz * .5); }
  }
  a.length = n; cx.globalAlpha = 1;
  if (n) FX.raf = requestAnimationFrame(fxLoop); else { FX.raf = 0; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, FX.cv.width, FX.cv.height); }
}
const FXS = {"■": "s", "●": "o", "▲": "t", "◆": "d", "✦": "4", "✧": "4", "★": "5"};
function fxPart(x, y, txt, col, size, dx, dy, dur, rot, grav) { fxAdd({k: "p", sh: FXS[txt] || "o", col, sz: size, x, y, dx, dy, d: dur / 1000, rot, g: grav}); }
function fxRing(x, y, col, size, dur) { fxAdd({k: "r", col, x, y, r: size / 2, d: (dur || 480) / 1000, a0: .9}); }
function fxBurst(x, y, n, cols, spd) {
  for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), r = rnd(.5, 1) * (spd || 90); fxPart(x, y, ["✦", "●", "★", "◆", "✧"][rint(0, 4)], cols[rint(0, cols.length - 1)], rint(9, 20), Math.cos(a) * r, Math.sin(a) * r - 20, rint(420, 800), rint(-260, 260), rint(20, 60)); }
}
function fxConfetti(n) {
  const cs = ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#fff"]; n = Math.min(n, 130);
  for (let i = 0; i < n; i++) fxAdd({k: "c", sh: ["s", "o", "t", "4"][rint(0, 3)], col: cs[rint(0, 5)], sz: rint(10, 18), x: rnd(0, innerWidth), y: -12, dx: rint(-60, 60), dy: (innerHeight + 30) * rnd(.6, 1), d: rnd(1.5, 2.6), rot: rint(-500, 500), ph: rnd(0, 6.28)}, i * 12);
}
function fxFloat(txt, x, y, col, size) { let c = 0; for (const p of FX.p) if (p.k === "f") c++; if (c >= 7) return; fxAdd({k: "f", txt, col, sz: size, x, y, dx: rint(-30, 30), rise: size * 2.6, d: .9}); }
let fxNoFl = 0; const _floatTxt = floatTxt; floatTxt = function () { if (fxNoFl) return; return _floatTxt.apply(this, arguments); };
const _tap0 = tap;
tap = function () {
  const before = S.pts, c0 = S.crit, tt0 = S.total, rr0 = S.run; fxNoFl = fxOn() ? 1 : 0; try { _tap0(); } finally { fxNoFl = 0; }
  if (("71" in S.inv) && S.pts > before) { const g0 = S.pts - before; S.pts = Math.max(0, before - g0); S.total = tt0; S.run = rr0; const {x, y} = lastPt; fxRing(x, y, "#ff1744", 110, 500); fxBurst(x, y, 8, ["#ff1744", "#ff5252", "#fff"], 100); fxFloat("−" + fmt(g0), x, y - 30, "#ff5252", 24); return; }
  if (!fxOn()) return;
  const g = S.pts - before, crit = g > tapValue() * 3, fe = now() < fever, f = now() < frenzy, heavy = FX.p.length > 140;
  const {x, y} = lastPt, cols = fe ? ["#ff6d00", "#ffab00", "#ffff00", "#fff"] : f ? ["#e040fb", "#ffd740", "#fff"] : PCOL;
  if (!heavy) fxRing(x, y, crit ? "#fff" : cols[0], crit ? 130 : 80, crit ? 560 : 420);
  fxBurst(x, y, heavy ? 2 : crit ? 14 : fe ? 8 : 5, cols, crit ? 130 : 90);
  fxFloat((crit ? "КРИТ +" : "+") + fmt(g), x, y - 30, crit ? "#fff" : fe ? "#ffab00" : "#ffd54f", crit ? 30 : 21);
  if (crit) { const v = $("#view"); if (v) { v.classList.remove("shk"); void v.offsetWidth; v.classList.add("shk"); setTimeout(() => v.classList.remove("shk"), 300); } if (!heavy) fxRing(x, y, "#ffd54f", 200, 650); }
  if (S.taps % 25 === 0) fxConfetti(10);
};
// ripple на кнопках
document.addEventListener("pointerdown", e => {
  const b = e.target.closest && e.target.closest(".btn,.chip,button,.card.click,.cell"); if (!b || b.id === "coin") return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, p = document.createElement("span"); p.className = "rpl"; p.style.width = p.style.height = s + "px"; p.style.left = e.clientX - r.left - s / 2 + "px"; p.style.top = e.clientY - r.top - s / 2 + "px";
  if (getComputedStyle(b).position === "static") b.style.position = "relative"; b.style.overflow = b.style.overflow || "hidden"; b.appendChild(p); setTimeout(() => p.remove(), 600);
}, true);
// плавное появление вкладок
let _lastTab = -1, _lastSub = -1;
const _render4 = render;
render = function () {
  _render4();
  if (tab !== _lastTab) { _lastTab = tab; _lastSub = sub; const v = $("#view"); if (v) { v.classList.remove("vin"); void v.offsetWidth; v.classList.add("vin"); clearTimeout(v._vt); v._vt = setTimeout(() => v.classList.remove("vin"), 650); } }
};
// эффекты на события
const _toast0 = toast;
toast = function (t) {
  _toast0(t);
  try {
    const s = String(t);
    if (s.startsWith("🏆") || s.startsWith("Сет")) { fxConfetti(60); fxRing(innerWidth / 2, innerHeight - 100, "#ffd54f", 220, 700); }
    else if (s.startsWith("⭐ Уровень")) { fxBurst(innerWidth / 2, 90, 26, ["#ffd54f", "#fff", "#40c4ff"], 150); fxRing(innerWidth / 2, 90, "#ffd54f", 160, 600); }
    else if (s.startsWith("🔥")) { fxBurst(innerWidth / 2, innerHeight / 2, 30, ["#ff6d00", "#ffab00", "#ffff00"], 180); }
    else if (s.startsWith("Тебе выдали")) { fxConfetti(40); }
  } catch (e) {}
};
const _fl0 = floatTxt;
floatTxt = function (txt, color, size, x, y) { if (x === undefined) return; _fl0(txt, color, size, x, y); };

// ---------- арбуз-талисман с подсказками
const MAS_URL = ADM_IMG.replace("admin/0.jpg", "mascot.png?v=1");
const MAS_TIPS = [
  "Генераторы приносят монеты сами. Лови золотые звёзды!",
  "Накопив миллион за забег, делай перерождение за самоцветы.",
  "Тапай монету подряд — комбо включает лихорадку и удваивает тапы!",
  "Лови золотые звёзды, они дают хороший бонус.",
  "Генераторы приносят монеты сами, даже когда ты не в игре.",
  "Каждые 25 самоцветов дают +10% ко всему навсегда.",
  "Ненужные дубли можно продать или обменять с другими игроками.",
  "Собери целый набор котов — получишь +5% ко всему.",
  "Заходи каждый день: ежедневный бонус растёт с серией.",
  "В «Наградах» есть недельные задания — там самоцветы.",
  "Анимации можно отключить в «Ещё» → «Игра».",
  "Перерождение: 1 000 000 за забег = 1 самоцвет.",
  "В профиле игрока можно выбрать баннер и посмотреть его обмены.",
  "Налоги растут вместе с богатством: чем больше монет, тем выше ставка. Тратить выгоднее, чем копить."
];
let masEl = null, masT = 0, masSide = 0, masBag = [], masQ = [], masRun = 0;
const masBlocked = () => (tab === 6 && cz.sub >= 2) || OVL || document.hidden || document.querySelector(".mdl,.coll,.kick");
function masClose() { const e = masEl; if (!e) return; masEl = null; masRun++; const sp = e.querySelector(".msp"); if (sp) sp.style.backgroundPositionX = "-192px"; e.querySelector(".mbub").style.opacity = 0; e.style.transform = "translateX(" + (e.dataset.s === "0" ? "-130%" : "130%") + ")"; setTimeout(() => e.remove(), 700); }
function masNext(ms) { clearTimeout(masT); masT = setTimeout(masShow, ms); }
function masPush(t) { if (typeof t !== "string" || !t || t.length > 140 || masQ.includes(t)) return; masQ.push(t); if (masQ.length > 6) masQ.shift(); if (!masEl) masNext(400); }
function masTip() {
  let tips = MAS_TIPS.slice(); try { if (pendingGems() >= 1) tips.push("Можно переродиться: получишь " + pendingGems() + " самоцв."); } catch (e) {}
  if (!masBag.length) { masBag = tips.map((x, i) => i); for (let i = masBag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [masBag[i], masBag[j]] = [masBag[j], masBag[i]]; } }
  return tips[masBag.pop()] || tips[0];
}
function masShow() {
  if (masEl) return;
  if (masBlocked()) return masNext(4000);
  const s = masSide = 1 - masSide, el = document.createElement("div"); el.id = "mas"; el.dataset.s = s;
  el.style.cssText = "position:fixed;bottom:calc(76px + env(safe-area-inset-bottom));" + (s ? "right:6px;flex-direction:row-reverse;" : "left:6px;") + "z-index:30;display:flex;align-items:flex-end;gap:6px;transition:transform .6s cubic-bezier(.2,.9,.3,1.2);transform:translateX(" + (s ? "130%" : "-130%") + ");max-width:92vw";
  el.innerHTML = `<div class="msp" style="flex:none;width:96px;height:102px;background:url(${MAS_URL}) 0 0/384px 102px no-repeat;background-position-x:-192px"></div><div class="mbub" style="background:var(--on);color:var(--surf);font-size:13px;font-weight:600;line-height:1.3;padding:9px 12px;border-radius:14px ${s ? "14px 4px 14px" : "14px 14px 4px"};max-width:210px;margin-bottom:34px;opacity:0;transition:opacity .25s"></div>`;
  el.onclick = () => { masQ = []; masClose(); masNext(20000); };
  document.body.appendChild(el); masEl = el; const run = ++masRun;
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = "translateX(0)"; }));
  const sp = el.querySelector(".msp"), bub = el.querySelector(".mbub"), fr = n => { sp.style.backgroundPositionX = (-96 * n) + "px"; }, alive = () => masEl === el && masRun === run;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    await wait(650);
    let first = true;
    while (alive()) {
      const msg = masQ.length ? masQ.shift() : masTip(), isTip = !masQ.length && !first && false;
      if (!first) { bub.style.opacity = 0; await wait(280); if (!alive()) return; }
      bub.textContent = noemo(msg); bub.style.opacity = 1; first = false;
      let f = 1; fr(1); const end = Date.now() + 1300 + msg.length * 50;
      while (alive() && Date.now() < end) { await wait(230 + Math.random() * 60); if (alive()) fr(f = f === 1 ? 2 : 1); }
      if (!alive()) return; fr(2);
      for (const [d, n] of [[200, 0], [150, 2], [160, 0], [300, 2]]) { await wait(d); if (!alive()) return; fr(n); }
      await wait(500); if (!alive()) return;
      if (!masQ.length) { masClose(); masNext(90000 + Math.random() * 60000); return; }
    }
  })();
}
setInterval(() => { if (masEl && masBlocked()) { masClose(); masNext(5000); } }, 600);
(function () { const t0 = toast; toast = function (t) { const r = t0.apply(this, arguments); if (typeof t === "string" && t.length <= 140 && !masBlocked()) { masPush(t); const e = $("#toast"); clearTimeout(tt); e.classList.remove("s"); } return r; }; })();
masNext(20000);

// ---------- «Ещё»: меню из пяти кнопок
let moreSub = 0;
const mbtn = (icon, label, k, cls) => `<button class="mbtn ${cls || ""}" data-a="mnu" data-k="${k}">${ic(icon, 24)}<span class="grow">${label}</span>${ic("arrow", 20)}</button>`;
const mback = `<button class="btn t bkb" data-a="mnu" data-k="back">← Назад</button>`;
A.mnu = function (e) {
  const k = e.dataset.k;
  if (k === "back") { moreSub = 0; tab = 0; }
  else if (k === "com" || k === "lead" || k === "trade" || k === "chat") { tab = 4; sub = k === "trade" ? 1 : k === "chat" ? 2 : 0; }
  else { tab = 5; moreSub = {set: 1, info: 2, adm: 3, ws: 4}[k]; if (k === "ws") wsLoad(); if (k === "info") loanCheck(); }
  render(); $("#view").scrollTop = 0;
};
const _tTopOld = tTop; tTop = function () { return mback + _tTopOld(); };
const _tab0 = A.tab; A.tab = function (e) { moreSub = 0; return _tab0(e); };
tMore = function () {
  const head = `<div class="card"><div class="grow"><div class="t1">${nm(me.name, myBadges)}</div><div class="t2">ID ${me.id}</div></div></div>`;
  if (moreSub === 0) return head + `<div class="t2" style="margin:12px 4px 0;font-weight:700">Сообщество</div>` + mbtn("podium", "Сообщество", "com") + mbtn("cube", "Мастерская", "ws") + `<div style="height:10px"></div>` + mbtn("tune", "Настройки", "set") + mbtn("check", "Информация", "info") + (isAdm ? mbtn("crown", "Админка", "adm", "adm") : "");
  if (moreSub === 4) return mback + tWorkshop();
  if (moreSub === 3 && isAdm) { if (!promoList) loadPromos(); return mback + admCard(); }
  if (moreSub === 2) {
    const st = [["Всего тапов", fmt(S.taps)], ["Накоплено за всё время", fmt(S.total)], ["За текущий забег", fmt(S.run)], ["Генераторов", owned()], ["Самоцветов", S.gems], ["Перерождений", S.prest], ["Звёзд поймано", S.stars], ["Лихорадок", S.fevers], ["Общий множитель", "x" + baseMult().toFixed(2)]];
    return mback + `<div class="card col" style="gap:0">${st.map(r => `<div style="display:flex;padding:3px 0"><span class="t2 grow" style="font-size:14px;margin:0">${r[0]}</span><span style="font-size:14px;font-weight:700">${r[1]}</span></div>`).join("")}</div>` +
      refCard() + burnCard() + `<div class="card col"><div class="t1" style="color:var(--pri)">Как играть</div><div class="t2" style="font-size:13px">${TIPS}</div></div>` +
      `<div class="card col"><div class="t1" style="color:var(--pri)">Что нового</div>${CHANGES.map(c => `<div style="font-size:13px;font-weight:700;margin-top:8px">v${c[0]}</div>${c[1].map(x => `<div class="t2" style="font-size:12px;margin-top:2px">• ${x}</div>`).join("")}`).join("")}</div>`;
  }
  const fn = ["Нет", "Снежинки", "Тыквы"], fv = [0, 1, 2]; SETS.forEach((x, i) => { if (S.sets.includes(x[0])) { fn.push(x[1]); fv.push(3 + i); } });
  return mback + `<div class="card col"><div class="t1" style="color:var(--pri)">Оформление</div><div class="card click" style="margin:4px 0 0;padding:8px 0;background:none;border:0" data-a="ltheme"><div class="t1 grow" style="font-size:14px">Светлая тема</div><div class="sw ${LS("lt", 0) ? "on" : ""}"></div></div>${optRow("Цвет", THEMES.map(t => t[0]), "th", THEMES.map((_, i) => i), LS("th", 0))}${optRow("Падающий фон", fn, "fall", fv, LS("fall", 0))}</div>` +
    langCard() + `<div class="card col"><div class="t1" style="color:var(--pri)">Игра</div>${tog("Вибрация", "hap", LS("hap", 1))}${tog("Звуки кейсов", "snd", LS("snd", 1))}${tog("Звуки игры (клики, покупки)", "sgm", LS("sgm", 1))}${tog("Анимации клика", "fxt", LS("fxt", 1))}${tog("Анимации открытия кейсов", "fxc", LS("fxc", 1))}<div class="card click" style="margin:4px 0 0;padding:8px 0;background:none;border:0" data-a="rfl"><div class="t1 grow" style="font-size:14px">Меньше вспышек</div><div class="sw ${LS("rfl", 0) ? "on" : ""}"></div></div></div>` +
    `<div class="card col"><div class="t1" style="color:var(--pri)">Промокод</div><div style="display:flex;gap:8px"><input data-keep="promo" placeholder="Введи промокод" style="text-transform:uppercase">${btn("Ок", "promo")}</div></div>` +
    `<button class="btn t" data-a="reset" style="width:100%;justify-content:center;margin-top:4px">Сбросить весь прогресс</button>`;
};

// ---------- пользовательские коты и мастерская
const BASE_N = ITEMS.length; let ucN = 0;
async function loadUcats() {
  const r = await api("ucats", {}); if (!r || !r.rows) return;
  ITEMS.length = BASE_N;
  r.rows.forEach(x => { ITEMS[x.idx] = ["", x.name, x.rar, x.uid, x.uname, x.id, x.bc || 0]; });
  for (const x of r.del || []) { while (ITEMS.length <= x) ITEMS.push(null); ITEMS[x] = ["", "Удалён", 0, 0, "", 0, 0, 1]; }
  for (let i = BASE_N; i < ITEMS.length; i++) if (!ITEMS[i]) ITEMS[i] = ["", "?", 0, 0, "", 0];
  ucN = r.sig;
  if (S && r.del && r.del.length) { let ch = 0; for (const x of r.del) { if (S.inv[x + ""]) { delete S.inv[x + ""]; ch = 1; } const hi = S.holo.indexOf(x); if (hi >= 0) { S.holo.splice(hi, 1); ch = 1; } if (+S.eq === x) { S.eq = -1; ch = 1; } } if (ch) { try { mark(); save(true); } catch (e) {} } }
}
const _catEl1 = catEl;
catEl = function (idx, size, extra) {
  const h = _catEl1(idx, size, extra);
  if (typeof idx === "number" && idx >= BASE_N && ITEMS[idx] && ITEMS[idx][6]) return h.replace(/background-image:url\([^)]*\)/, `background-image:url(${ADM_IMG.replace("admin/0.jpg", "bc/" + (ITEMS[idx][6] - 1) + ".jpg?v=1")})`);
  if (typeof idx === "number" && idx >= BASE_N && ITEMS[idx]) return h.replace(/background-image:url\([^)]*\)/, `background-image:url(/ucat/${ITEMS[idx][5]}.jpg)`);
  return h;
};
A.catinfo = function (e) {
  const i = +e.dataset.i, it = ITEMS[i]; if (!it) return; const o = S.inv[i + ""] || 0, ho = S.holo.includes(i), r = it[2];
  const bonus = r === 8 ? "×40 к тапу" : r === 7 ? "×1 секстилион к одному тапу" : "+" + RARS[r][2] + "% ко всему за предмет" + (ho ? " (×1.5 голограмма)" : "");
  const cr = i >= BASE_N && !it[6] ? `<span data-a="prof" data-i="${it[3]}" style="color:var(--pri);text-decoration:underline;font-weight:700">${esc(it[4] || "Игрок")}</span>` : `<span style="font-weight:700">MDMelon</span>`;
  const row = (k, v) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0"><span class="t2" style="margin:0;font-size:14px">${k}</span><span style="font-size:14px;text-align:right">${v}</span></div>`;
  const mo = modal(`<div style="text-align:center"><div class="t1" style="font-size:22px;color:${RC[r]}">${ho ? "★ " : ""}${esc(it[1])}</div><div style="margin:14px auto;width:220px;max-width:70vw">${catEl(i, 220, {holo: ho})}</div></div>` +
    row("Редкость", `<span style="color:${RC[r]};font-weight:700">${RARS[r][0]}</span>`) + row("Бонус", bonus) + row("У тебя", o ? "×" + o + (ho ? " · голограмма" : "") : "нет") + row("Создатель", cr) +
    (isAdm && i >= BASE_N ? `<div class="t2" style="margin:10px 0 0;font-size:12px">Админ: изменить редкость</div>${wsRarChips(r, "ucrar", i)}<button class="btn o" style="width:100%;justify-content:center;color:#ff5252" data-a="ucdel" data-i="${i}">🗑 Удалить кота из игры</button>` : "") +
    `<div style="display:flex;gap:10px;margin-top:14px">${btn("Закрыть", "mclose", "", "t")}${o ? btn(+S.eq === i ? "Снять с монеты" : "На монету", "catequip", `data-i="${i}"`) : ""}</div>`);
  mo.style.alignItems = "center"; const c = mo.firstChild; c.style.borderRadius = "28px"; c.style.width = "calc(100% - 32px)"; c.style.padding = "20px 18px"; c.style.animation = "catpop .25s ease-out";
};
A.catequip = function (e) { closeModal(); A.equip(e); };

let wsSub = 0, wsRar = 0, wsImg = "", wsMine = null, wsPend = null, ideaData = null; const wsAR = {};
let wsLk = {cat: {}, idea: {}}, wsMyLk = {cat: {}, idea: {}};
async function wsLoad() {
  const m = await api("uc_mine", {}); wsMine = m.rows || [];
  if (isAdm) { const q = await api("uc_pending", {}); wsPend = q.rows || []; (wsPend).forEach(x => { if (KEEP["wn" + x.id] === undefined) KEEP["wn" + x.id] = x.name; if (KEEP["wg" + x.id] === undefined) KEEP["wg" + x.id] = String(x.ask || 0); }); }
  ideaData = await api("idea_list", {});
  const l = await api("ws_likes", {}); if (l && l.rows) { wsLk = {cat: {}, idea: {}}; wsMyLk = {cat: {}, idea: {}}; l.rows.forEach(x => { if (wsLk[x.k]) wsLk[x.k][x.cid] = x.n; }); (l.mine || []).forEach(x => { if (wsMyLk[x.k]) wsMyLk[x.k][x.cid] = 1; }); }
  if (tab === 5 && moreSub === 4) render();
}
const wsRarChips = (cur, act, id) => `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${RARS.slice(0, act === "wsadr" || act === "ucrar" ? 10 : 7).map((R, r) => `<button class="chip ${cur === r ? "p" : ""}" style="border:0;font-family:inherit;color:${cur === r ? "" : RC[r]}" data-a="${act}" data-v="${r}" data-i="${id}">${R[0]}</button>`).join("")}</div>`;
const STT = {new: "На проверке", ok: "Одобрено", rej: "Отклонено"};
const wsLike = (k, id) => `<button class="chip ${wsMyLk[k][id] ? "p" : ""}" style="border:0;font-family:inherit" data-a="wslike" data-k="${k}" data-i="${id}">${wsMyLk[k][id] ? "♥" : "♡"} ${wsLk[k][id] || 0}</button>`;
function tWorkshop() {
  const nP = isAdm ? (wsPend ? wsPend.length : 0) + (ideaData && ideaData.pend ? ideaData.pend.length : 0) : 0;
  const tabs = [["Коты", 0], ["Идеи", 1], ["Создать", 2]]; if (isAdm) tabs.push(["Заявки" + (nP ? " · " + nP : ""), 3]);
  if (wsSub === 3 && !isAdm) wsSub = 0;
  let h = `<div class="seg">${tabs.map(t => `<button class="${wsSub === t[1] ? "on" : ""}" data-a="wssub" data-i="${t[1]}">${t[0]}</button>`).join("")}</div>`;
  if (wsSub === 0) {
    const ucs = ITEMS.map((it, i) => i >= BASE_N && !it[7] && (isAdm || !it[6]) ? i : -1).filter(i => i >= 0).sort((a, b) => (wsLk.cat[ITEMS[b][5]] || 0) - (wsLk.cat[ITEMS[a][5]] || 0) || b - a);
    h += `<div class="t2" style="font-size:12px;margin:2px 4px 8px">Коты, которых придумали игроки. Ставь ♥ понравившимся: самые любимые поднимаются вверх.</div>`;
    h += ucs.length ? `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">${ucs.map((i, n) => { const it = ITEMS[i], lk = it[6] ? "" : (it[3] === myId ? `<span class="chip" style="border:0">♥ ${wsLk.cat[it[5]] || 0}</span>` : wsLike("cat", it[5])); return `<div class="card col" style="align-items:center;gap:6px;padding:12px 8px"><div data-a="catinfo" data-i="${i}" style="position:relative">${catEl(i, 110, {})}${n < 3 && (wsLk.cat[it[5]] || 0) > 0 ? `<span style="position:absolute;top:-4px;left:-4px;background:var(--pri);color:#000;border-radius:10px;padding:1px 7px;font-size:11px;font-weight:700">#${n + 1}</span>` : ""}</div><div class="t1" style="font-size:14px;text-align:center;color:${RC[it[2]]}">${esc(it[1])}</div><div class="t2" style="margin:0;font-size:11px">${it[6] ? "MDMelon" : esc(it[4] || "Игрок")}</div>${lk}</div>`; }).join("")}</div>` : `<div class="t2" style="text-align:center;margin:20px">Пока нет котов от игроков. Будь первым: вкладка «Создать».</div>`;
  } else if (wsSub === 1) {
    const d = ideaData; h += `<div class="t2" style="font-size:12px;margin:2px 4px 8px">Идеи, которые добавили в игру. Ставь ♥ лучшим.</div>`;
    if (!d) return h + `<div class="t2" style="text-align:center;margin:12px">Загружаю…</div>`;
    const ok = (d.ok || []).slice().sort((a, b) => (wsLk.idea[b.id] || 0) - (wsLk.idea[a.id] || 0) || b.id - a.id);
    h += ok.length ? ok.map(x => `<div class="card">${bdg("g", 20)}<div class="grow"><div style="font-size:14px;white-space:pre-wrap">${esc(x.text)}</div><div class="t2" style="margin:2px 0 0;font-size:11px">${esc(x.uname)}</div></div>${x.uid === myId ? "" : wsLike("idea", x.id)}</div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока ни одной добавленной идеи.</div>`;
  } else if (wsSub === 2) {
    h += `<div class="card col" style="border:1px solid rgba(255,82,82,.35)"><div class="t1" style="color:#ff8a80">Правила мастерской</div><div class="t2" style="font-size:12px;margin:0">Принимаем только то, что <b>по теме игры</b>: коты (в стиле игры) и идеи про MDMelonClicker.<br>Не одобряю: 18+, оскорбления, политику, чужие логотипы и рисунки, пустые или случайные картинки, спам.<br>Не по теме — отклоню.</div></div>`;
    h += `<div class="card col"><div class="t1" style="color:var(--pri)">Новый кот</div><input data-keep="wsname" placeholder="Название кота" maxlength="24"><div class="t2" style="margin:2px 0 0;font-size:12px">Редкость (админ может изменить)</div>${wsRarChips(wsRar, "wsrar", 0)}<div class="t2" style="margin:2px 0 0;font-size:12px">Сколько 💎 хочешь за кота (0–500, админ может изменить)</div><input data-keep="wsask" inputmode="numeric" placeholder="Например 50" maxlength="3"><div style="display:flex;align-items:center;gap:10px"><label class="btn o" for="wsfile">${wsImg ? "Другая картинка" : "Выбрать картинку"}</label><input type="file" id="wsfile" accept="image/*" hidden>${wsImg ? `<img src="${wsImg}" style="width:72px;height:72px;border-radius:14px;object-fit:cover">` : ""}</div>${btn("Отправить на проверку", "wssend")}</div>`;
    h += `<div class="card col"><div class="t1" style="color:var(--pri)">Новая идея</div><div class="t2" style="font-size:12px;margin:0">Если админ добавит идею в игру, получишь значок «Гений».</div><textarea data-keep="idea" rows="3" maxlength="300" placeholder="Что добавить в игру?"></textarea>${btn("Отправить идею", "ideasend")}</div>`;
    const my = [].concat((wsMine || []).map(x => `<div class="card"><div class="grow"><div class="t1" style="font-size:14px">🐱 ${esc(x.name)}</div><div class="t2" style="font-size:12px;margin:0">${RARS[x.rar][0]}${x.status === "ok" ? (x.reward ? " · награда 💎" + x.reward : "") : x.ask ? " · просишь 💎" + x.ask : ""}</div></div><span class="chip ${x.status === "ok" ? "p" : ""}">${STT[x.status] || x.status}</span></div>`), ((ideaData && ideaData.mine) || []).map(x => `<div class="card"><div class="grow t2" style="margin:0;font-size:13px;white-space:pre-wrap">💡 ${esc(x.text)}</div><span class="chip">${STT[x.status] || x.status}</span></div>`));
    if (my.length) h += `<div class="sec">Мои заявки</div>` + my.join("");
  } else {
    h += `<div class="sec">Коты на проверке${wsPend ? " · " + wsPend.length : ""}</div>`;
    if (!wsPend) h += `<div class="t2" style="text-align:center;margin:12px">Загружаю…</div>`;
    else if (!wsPend.length) h += `<div class="t2" style="text-align:center;margin:12px">Заявок нет</div>`;
    else wsPend.forEach(x => { const cr = wsAR[x.id] !== undefined ? wsAR[x.id] : x.rar; h += `<div class="card col"><div style="display:flex;gap:12px;align-items:center"><img src="/ucat/${x.id}.jpg" style="width:84px;height:84px;border-radius:16px;object-fit:cover;flex:none"><div class="grow"><div class="t2" style="margin:0;font-size:12px">от <b>${esc(x.uname)}</b></div><div class="t2" style="margin:2px 0 0;font-size:12px">${esc(x.name)} · <span style="color:${RC[x.rar]}">${RARS[x.rar][0]}</span> · просит 💎${x.ask || 0}</div></div></div><input data-keep="wn${x.id}" placeholder="Название" maxlength="24">${wsRarChips(cr, "wsadr", x.id)}<div class="t2" style="margin:0;font-size:12px">Награда в 💎</div><input data-keep="wg${x.id}" inputmode="numeric" placeholder="0" maxlength="5"><div style="display:flex;gap:8px">${btn("Отклонить", "ucno", `data-i="${x.id}"`, "o")}${btn("Одобрить", "ucok", `data-i="${x.id}"`)}</div></div>`; });
    const d = ideaData; h += `<div class="sec">Идеи на проверке${d && d.pend ? " · " + d.pend.length : ""}</div>`;
    h += d && d.pend && d.pend.length ? d.pend.map(x => `<div class="card col"><div class="t2" style="margin:0;font-size:12px">от <b>${esc(x.uname)}</b></div><div style="font-size:14px;white-space:pre-wrap">${esc(x.text)}</div><div style="display:flex;gap:8px">${btn("Отклонить", "ideano", `data-i="${x.id}"`, "o")}${btn("Добавить · Гений", "ideaok", `data-i="${x.id}"`)}</div></div>`).join("") : `<div class="t2" style="text-align:center;margin:12px">Идей нет</div>`;
  }
  return h;
}
A.wslike = async function (e) {
  const k = e.dataset.k, id = +e.dataset.i; const r = await api("ws_like", {k, id}); if (!r || r.error) return toast((r && r.error) || "Нет связи");
  if (r.liked) wsMyLk[k][id] = 1; else delete wsMyLk[k][id]; wsLk[k][id] = r.n; render();
};
A.wssub = function (e) { wsSub = +e.dataset.i; render(); };
A.wsrar = function (e) { wsRar = +e.dataset.v; render(); };
A.wsadr = function (e) { wsAR[+e.dataset.i] = +e.dataset.v; render(); };
A.wssend = function () {
  if (ldOn) return; if (!wsImg) return toast("Выбери картинку");
  return withLoad("Создание идеи или запроса на добавление кота", async () => {
  const r = await api("uc_submit", {name: KEEP.wsname || "", rar: wsRar, img: wsImg, ask: parseInt(KEEP.wsask) || 0}); if (r.error) return toast(r.error);
  toast("Заявка отправлена на проверку"); wsImg = ""; KEEP.wsname = ""; KEEP.wsask = ""; wsLoad(); render();
  });
};
A.ucok = async function (e) {
  const id = +e.dataset.i, x = (wsPend || []).find(q => q.id === id); if (!x) return;
  const r = await api("uc_approve", {id, name: KEEP["wn" + id] || x.name, rar: wsAR[id] !== undefined ? wsAR[id] : x.rar, gems: parseInt(KEEP["wg" + id]) || 0}); if (r.error) return toast(r.error);
  toast("Кот одобрен"); await wsLoad(); await loadUcats(); render();
};
A.ucno = async function (e) { const r = await api("uc_reject", {id: +e.dataset.i}); if (r.error) return toast(r.error); toast("Заявка отклонена"); wsLoad(); };
A.ideasend = function () { if (ldOn) return; return withLoad("Создание идеи или запроса на добавление кота", async () => { const r = await api("idea_submit", {text: KEEP.idea || ""}); if (r.error) return toast(r.error); toast("Идея отправлена"); KEEP.idea = ""; wsLoad(); render(); }); };
A.ideaok = async function (e) { const r = await api("idea_ok", {id: +e.dataset.i}); if (r.error) return toast(r.error); toast("Идея добавлена, игроку выдан значок Гений"); wsLoad(); };
A.ideano = async function (e) { const r = await api("idea_rej", {id: +e.dataset.i}); if (r.error) return toast(r.error); toast("Идея отклонена"); wsLoad(); };
function wsCrop(im, done) {
  const V = 280, o = document.createElement("div"); o.className = "crpo";
  o.innerHTML = `<div class="crpc"><div class="t1" style="text-align:center">Обрежь картинку</div><div class="t2" style="text-align:center;font-size:12px;margin:0">Двигай пальцем, масштаб — ползунком</div><canvas id="crpv" width="${V}" height="${V}"></canvas><input type="range" id="crpz" min="100" max="400" value="100"><div style="display:flex;gap:8px"><button class="btn o grow" id="crpx" style="justify-content:center">Отмена</button><button class="btn grow" id="crpok" style="justify-content:center">Готово</button></div></div>`;
  document.body.appendChild(o);
  const cv = o.querySelector("#crpv"), g = cv.getContext("2d"), zs = o.querySelector("#crpz"), base = V / Math.min(im.width, im.height);
  let z = 1, ox = (V - im.width * base) / 2, oy = (V - im.height * base) / 2;
  const clamp = () => { const w = im.width * base * z, h = im.height * base * z; ox = Math.min(0, Math.max(V - w, ox)); oy = Math.min(0, Math.max(V - h, oy)); };
  const draw = () => { clamp(); g.fillStyle = "#111"; g.fillRect(0, 0, V, V); g.drawImage(im, ox, oy, im.width * base * z, im.height * base * z); };
  const setZ = nz => { const cx = V / 2, cy = V / 2, k = nz / z; ox = cx - (cx - ox) * k; oy = cy - (cy - oy) * k; z = nz; draw(); };
  zs.oninput = () => setZ(zs.value / 100);
  let drag = null; cv.style.touchAction = "none";
  cv.onpointerdown = e => { drag = [e.clientX, e.clientY, ox, oy]; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drag) return; ox = drag[2] + e.clientX - drag[0]; oy = drag[3] + e.clientY - drag[1]; draw(); };
  cv.onpointerup = cv.onpointercancel = () => { drag = null; };
  cv.onwheel = e => { e.preventDefault(); const nz = Math.min(4, Math.max(1, z * (e.deltaY < 0 ? 1.08 : .93))); zs.value = nz * 100; setZ(nz); };
  o.querySelector("#crpx").onclick = () => o.remove();
  o.querySelector("#crpok").onclick = () => {
    const c = document.createElement("canvas"); c.width = c.height = 320; const x = c.getContext("2d"), k = 320 / V;
    x.drawImage(im, ox * k, oy * k, im.width * base * z * k, im.height * base * z * k);
    let q = .85, d = c.toDataURL("image/jpeg", q); while (d.length > 150000 && q > .3) { q -= .1; d = c.toDataURL("image/jpeg", q); }
    o.remove(); done(d);
  };
  draw();
}
document.addEventListener("change", e => {
  const f = e.target; if (!f || f.id !== "wsfile" || !f.files || !f.files[0]) return;
  const url = URL.createObjectURL(f.files[0]), im = new Image();
  im.onload = () => { wsCrop(im, d => { URL.revokeObjectURL(url); wsImg = d; render(); }); };
  im.onerror = () => toast("Не удалось открыть картинку"); im.src = url; f.value = "";
});

// ---------- Обмен: новый интерфейс
let tradeF = 0;
const SWP = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg>`;
const otile = (idx, label, extra) => { const it = ITEMS[idx] || ["", "?", 0]; return `<div class="otile"><div class="olab">${label}</div>${catEl(idx, 76, {})}<div class="onm" style="color:${RC[it[2]]}">${esc(it[1])}</div>${extra || ""}</div>`; };
offerCard = function (o, mineF) {
  if (!ITEMS[o.give] || !ITEMS[o.want]) return "";
  const have = S.inv[o.want + ""] || 0, can = have >= 1;
  const left = mineF ? otile(o.give, "Отдаёшь") : otile(o.give, "Получишь");
  const right = mineF ? otile(o.want, "Хочешь") : otile(o.want, "Отдашь", `<div class="ohv ${can ? "ok" : "no"}">${can ? "У тебя ×" + have : "У тебя нет"}</div>`);
  return `<div class="ocard${mineF ? " mine" : ""}"><div class="orow">${left}<div class="oswap">${SWP}</div>${right}</div><div class="ofoot"><div class="grow t2" style="margin:0;font-size:12px">${mineF ? "Твоё предложение" : "от " + nm(o.sname, o.badges)}</div>${mineF ? btn("Снять", "canceloff", `data-i="${o.id}"`, "o") : btn("Обменять", "accept", `data-i="${o.id}"`, can ? "" : "dis")}</div></div>`;
};
const _tTopT = tTop;
tTop = function () {
  if (sub !== 1) return _tTopT();
  const seg = `<div class="seg"><button data-a="sub" data-i="0">Лидеры</button><button class="on" data-a="sub" data-i="1">Обмен</button><button data-a="sub" data-i="2">Чат</button><button data-a="sub" data-i="3">Друзья</button><button data-a="sub" data-i="4">Кланы</button></div>`;
  let h = mback + seg;
  if (!offData) return h + `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
  const mine = offData.filter(o => o.seller === me.id), oth = offData.filter(o => o.seller !== me.id), canL = oth.filter(o => (S.inv[o.want + ""] || 0) >= 1);
  h += `<button class="btn" data-a="newoffer" style="width:100%;height:54px;justify-content:center;font-size:16px;margin-bottom:10px">＋ Создать обмен <span style="opacity:.7;font-weight:500;margin-left:6px">${mine.length}/5</span></button>`;
  h += `<div style="display:flex;gap:6px;margin-bottom:10px">${[["Все", oth.length + mine.length], ["Могу принять", canL.length], ["Мои", mine.length]].map((x, i) => `<button class="chip ${tradeF === i ? "p" : ""}" style="border:0;font-family:inherit" data-a="tradef" data-i="${i}">${x[0]} · ${x[1]}</button>`).join("")}</div>`;
  const list = tradeF === 0 ? mine.map(o => [o, true]).concat(oth.map(o => [o, false])) : tradeF === 1 ? canL.map(o => [o, false]) : mine.map(o => [o, true]);
  h += list.length ? list.map(([o, m]) => offerCard(o, m)).join("") : `<div class="t2" style="text-align:center;margin:24px 8px">${tradeF === 1 ? "Сейчас нет предложений, которые ты можешь принять" : tradeF === 2 ? "У тебя нет активных обменов. Нажми «Создать обмен»" : "Пока нет предложений. Создай первое!"}</div>`;
  h += `<div class="t2" style="margin:10px 6px;font-size:12px">Кот, которого ты предлагаешь, уходит в залог и вернётся, если снять предложение. Меняться можно любыми котами.</div>`;
  return h;
};
A.tradef = function (e) { tradeF = +e.dataset.i; render(); };

function startOffer() {
  const mineAll = Object.keys(S.inv).filter(k => S.inv[k] >= 1 && +k !== 70 && +k !== 71).map(Number);
  if (!mineAll.length) return toast("У тебя нет котов для обмена");
  offer = {give: null, want: null};
  const o = ov(""); o.style.background = "var(--surf)"; let rf = -1, q = "";
  const slot = (kind, title) => { const i = offer[kind]; const it = i === null ? null : ITEMS[i]; return `<div class="oslot${it ? " f" : ""}" data-open="${kind}"><div class="olab">${title}</div>${it ? `<div class="pop">${catEl(i, 92, {})}</div><div class="onm" style="color:${RC[it[2]]}">${esc(it[1])}</div>${kind === "give" ? `<div class="ohv ${S.inv[i + ""] === 1 ? "no" : "ok"}">${S.inv[i + ""] === 1 ? "Последний кот!" : "У тебя ×" + S.inv[i + ""]}</div>` : ""}` : `<div class="oplus">+</div><div class="t2" style="margin:0;font-size:12px">Выбрать</div>`}</div>`; };
  const main = () => {
    const ok = offer.give !== null && offer.want !== null && offer.give !== offer.want;
    o.innerHTML = `<h2 style="margin:0 0 4px">Новый обмен</h2><div class="t2" style="margin:0 0 18px;text-align:center">Выбери, что отдаёшь и что хочешь получить</div><div class="slots">${slot("give", "Ты отдаёшь")}<div class="oswap big">${SWP}</div>${slot("want", "Хочешь получить")}</div><div style="margin-top:auto;padding-top:20px;width:100%;display:flex;gap:10px">${btn("Отмена", "close", "", "t")}<button class="btn grow ${ok ? "" : "dis"}" data-a="mkoffer" style="justify-content:center">Предложить</button></div>`;
    o.querySelectorAll("[data-open]").forEach(e => e.onclick = () => pick(e.dataset.open));
  };
  const pick = kind => {
    let ids = kind === "give" ? mineAll.slice() : ITEMS.map((it, i) => i).filter(i => i !== 70 && i !== 71 && i !== offer.give);
    ids.sort((a, b) => ITEMS[b][2] - ITEMS[a][2] || a - b);
    o.innerHTML = `<div style="width:100%;display:flex;align-items:center;gap:10px"><button class="btn t" id="pback">←</button><h2 style="margin:0">${kind === "give" ? "Что отдаёшь" : "Что хочешь получить"}</h2></div><input id="psearch" placeholder="Поиск по названию" style="width:100%;margin:12px 0 8px"><div style="display:flex;gap:6px;flex-wrap:wrap;width:100%"><button class="chip" data-rf="-1">Все</button>${RARS.slice(0, 7).map((R, r) => `<button class="chip" data-rf="${r}" style="color:${RC[r]}">${R[0]}</button>`).join("")}</div><div class="rgrid" id="pgrid"></div>`;
    const grid = o.querySelector("#pgrid"), chips = [...o.querySelectorAll("[data-rf]")];
    const draw = () => {
      chips.forEach(c => c.classList.toggle("p", +c.dataset.rf === rf));
      const l = ids.filter(i => (rf < 0 || ITEMS[i][2] === rf) && ITEMS[i][1].toLowerCase().includes(q));
      grid.innerHTML = l.length ? l.map(i => `<div class="cell tcell" data-i="${i}" style="${offer[kind] === i ? "box-shadow:inset 0 0 0 2px var(--pri)" : ""}">${S.inv[i + ""] > 1 && kind === "give" ? `<i class="tcnt">×${S.inv[i + ""]}</i>` : ""}${catEl(i, 76, {})}<span style="color:${RC[ITEMS[i][2]]}">${esc(ITEMS[i][1])}</span></div>`).join("") : `<div class="t2" style="grid-column:1/-1;text-align:center;margin:20px">Ничего не найдено</div>`;
      grid.querySelectorAll("[data-i]").forEach(e => e.onclick = () => { offer[kind] = +e.dataset.i; if (kind === "give" && offer.want === offer.give) offer.want = null; main(); });
    };
    o.querySelector("#pback").onclick = main; o.querySelector("#psearch").oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
    chips.forEach(c => c.onclick = () => { rf = +c.dataset.rf; draw(); });
    draw();
  };
  main();
}
function tradeFx(gaveIdx, gotIdx) {
  const o = document.createElement("div"); o.className = "tfx";
  o.innerHTML = `<div class="tfc" id="tfa">${catEl(gaveIdx, 110, {})}</div><div class="tfc" id="tfb">${catEl(gotIdx, 110, {})}</div><div class="tft"><div class="t1" style="font-size:22px;color:var(--pri)">Обмен состоялся!</div><div class="t2" style="margin-top:4px;text-align:center">Получен: <b style="color:${RC[ITEMS[gotIdx][2]]}">${esc(ITEMS[gotIdx][1])}</b></div></div>`;
  document.body.appendChild(o); try { jingle(2); } catch (e) {} try { hap("ok"); } catch (e) {}
  const W = innerWidth, a = o.querySelector("#tfa"), b = o.querySelector("#tfb"), x0 = W * .22 - 55, x1 = W * .78 - 55, Y = innerHeight * .38;
  a.style.cssText = `left:${x0}px;top:${Y}px`; b.style.cssText = `left:${x1}px;top:${Y}px`;
  const opt = {duration: 900, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards"};
  a.animate([{transform: "translate(0,0) scale(1)"}, {transform: `translate(${(x1 - x0) / 2}px,-70px) scale(.8)`, offset: .5}, {transform: `translate(${x1 - x0}px,0) scale(1)`}], opt);
  b.animate([{transform: "translate(0,0) scale(1)"}, {transform: `translate(${(x0 - x1) / 2}px,70px) scale(.8)`, offset: .5}, {transform: `translate(${x0 - x1}px,0) scale(1.15)`}], opt);
  setTimeout(() => { try { fxConfetti(40); } catch (e) {} }, 800);
  o.onclick = () => o.remove(); setTimeout(() => { o.style.opacity = 0; setTimeout(() => o.remove(), 400); }, 2600);
}
A.accept = async function (e) {
  const id = +e.dataset.i, o = offData && offData.find(x => x.id === id); if (!o) return;
  if ((S.inv[o.want + ""] || 0) < 1) return toast("У тебя нет кота: " + ITEMS[o.want][1]);
  await save(true); const r = await api("accept", {id}); if (r.error) { toast(r.error); offData = null; render(); return; }
  adopt(r); checkAch(); mark(); offData = null; render(); tradeFx(o.want, o.give);
};

// ---------- Казино: рулетка с джекпотом и простой покер
const cz = {sub: 0, bet: 100, pick: "r", busy: false, hist: [], jp: null, last: null, jpAt: 0, rot: 0, phase: 0, hand: [], hold: [false, false, false, false, false], pbet: 0, res: null};
const ZN = 26, ZS = 360 / ZN, secCol = i => i === 0 ? "g" : i === 13 ? "j" : (i % 2 === 1 ? "r" : "b");
const gm = (emo, title, desc, k1, k2) => `<div class="gmc"><div class="gmh"><div class="circ">${ic(emo, 26)}</div><span class="grow"><b>${title}</b><div class="t2" style="margin:2px 0 0;font-size:12px;font-weight:500">${desc}</div></span></div><div class="gmb"><button data-a="czgo" data-k="${k1}">В одиночку</button><button data-a="czgo" data-k="${k2}">Вдвоём</button></div></div>`;
const ZC = {r: "#e53935", b: "#263238", g: "#2e7d32", j: "#ffc107"};
const RK = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "В", "Д", "К", "Т"], SU = ["♠", "♥", "♦", "♣"];
function pkEvalC(h) {
  const r = h.map(c => c % 13).sort((a, b) => a - b), cnt = {}; r.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
  const cv = Object.values(cnt).sort((a, b) => b - a), flush = h.every(c => Math.floor(c / 13) === Math.floor(h[0] / 13));
  const uniq = Object.keys(cnt).length === 5, straight = uniq && (r[4] - r[0] === 4 || (r[0] === 0 && r[1] === 1 && r[2] === 2 && r[3] === 3 && r[4] === 12));
  if (straight && flush) return r[0] === 8 ? "Роял-флеш" : "Стрит-флеш"; if (cv[0] === 4) return "Каре"; if (cv[0] === 3 && cv[1] === 2) return "Фулл-хаус";
  if (flush) return "Флеш"; if (straight) return "Стрит"; if (cv[0] === 3) return "Тройка"; if (cv[0] === 2 && cv[1] === 2) return "Две пары";
  if (cv[0] === 2 && Object.keys(cnt).some(k => cnt[k] === 2 && +k >= 9)) return "Пара валетов или выше"; return "Пока ничего";
}
const PKT = [["Роял-флеш", 250], ["Стрит-флеш", 50], ["Каре", 25], ["Фулл-хаус", 9], ["Флеш", 6], ["Стрит", 4], ["Тройка", 3], ["Две пары", 2], ["Пара В+", 1]];
function pkAuto(h) {
  const ev = pkEvalC(h), hold = [0, 0, 0, 0, 0].map(() => false);
  if (["Роял-флеш", "Стрит-флеш", "Фулл-хаус", "Флеш", "Стрит"].includes(ev)) return hold.map(() => true);
  const cnt = {}; h.forEach(c => cnt[c % 13] = (cnt[c % 13] || 0) + 1);
  if (Object.values(cnt).some(v => v >= 2)) return h.map(c => cnt[c % 13] >= 2);
  const bySuit = {}; h.forEach(c => { const s = Math.floor(c / 13); bySuit[s] = (bySuit[s] || 0) + 1; });
  const fs = Object.keys(bySuit).find(s => bySuit[s] >= 4); if (fs !== undefined) return h.map(c => Math.floor(c / 13) === +fs);
  return h.map(c => c % 13 >= 9);
}
const pkCard = (c, back) => `<div class="pk3${back ? " back" : ""}"><div class="pkf face ${Math.floor(c / 13) % 3 === 1 ? "red" : ""}${Math.floor(c / 13) === 2 ? " red" : ""}"><b>${RK[c % 13]}</b><i>${SU[Math.floor(c / 13)]}</i></div><div class="pkf bk"></div></div>`;
const czBet = () => { const mx = Math.max(0, Math.floor(S.pts)); cz.bet = Math.max(100, Math.min(cz.bet, mx >= 100 ? mx : 100)); return cz.bet; };
function czUpd() {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set("czbal", fmt(S.pts)); set("czbetv", fmt(czBet())); document.querySelectorAll(".czjp").forEach(e => e.textContent = cz.jp === null ? "…" : fmt(cz.jp));
  const l = document.getElementById("czlast"); if (l) l.textContent = cz.last ? "Последний джекпот: " + cz.last.n + " — " + fmt(cz.last.a) : "Джекпот ещё никто не срывал";
}
async function czInfo() { try { const r = await api("cz_info", {}); if (r && !r.error) { cz.jp = r.jp; cz.last = r.last; cz.jpAt = Date.now(); czUpd(); } } catch (e) {} }
setInterval(() => { if (tab === 6 && !document.hidden && !cz.busy) czInfo(); }, 6000);
const czBetUi = () => `<div class="czbet"><button class="btn t" data-a="czbet" data-v="half">÷2</button><div class="czbv"><div class="t2" style="margin:0;font-size:11px">СТАВКА</div><div id="czbetv" style="font-size:20px;font-weight:800">${fmt(czBet())}</div></div><button class="btn t" data-a="czbet" data-v="dbl">×2</button></div><div class="czchips">${[["Мин", "min"], ["1%", "1"], ["10%", "10"], ["25%", "25"], ["50%", "50"], ["Всё", "all"]].map(c => `<button class="chip" style="border:0;font-family:inherit" data-a="czbet" data-v="${c[1]}">${c[0]}</button>`).join("")}</div>`;
A.czbet = function (e) {
  if (cz.busy) return; const v = e.dataset.v, mx = Math.floor(S.pts);
  if (v === "half") cz.bet = Math.floor(cz.bet / 2); else if (v === "dbl") cz.bet = cz.bet * 2; else if (v === "min") cz.bet = 100; else if (v === "all") cz.bet = mx; else cz.bet = Math.floor(mx * (+v) / 100);
  czUpd();
};
A.czgo = async function (e) {
  if (cz.busy) return; cz.sub = +e.dataset.k;
  if (cz.sub === 3) { cz.t = null; cz.tid = 0; cz.lobby = null; render(); p2Lobby(); return; }
  if (cz.sub === 2 && cz.phase !== 1) { const r = await api("cz_pk_state", {}); if (r && r.hand) { cz.phase = 1; cz.hand = r.hand; cz.pbet = r.bet; cz.hold = [false, false, false, false, false]; cz.res = null; toast("Продолжаем начатую раздачу"); } else { cz.phase = 0; cz.res = null; } }
  render(); czInfo(); $("#view").scrollTop = 0;
};
tCasino = function () {
  const back = `<button class="btn t bkb" data-a="czgo" data-k="0">← Казино</button>`;
  const jp = jpRow();
  const bal = `<div class="card" style="padding:10px 16px"><span class="t2 grow" style="margin:0">Баланс</span><b id="czbal" style="font-size:18px">${fmt(S.pts)}</b></div>`;
  if (cz.sub === 0) return jp + `<div class="gml"><button class="mbtn" data-a="czgo" data-k="1"><div class="circ">${ic("roulette", 26)}</div><span class="grow">Рулетка<div class="t2" style="margin:0;font-size:12px;font-weight:500">Красное и чёрное ×2, зелёное ×24 и сектор с джекпотом</div></span>${ic("arrow", 20)}</button>${gm("cards", "Покер", "5 карт, одна замена. В одиночку раздаёт арбуз, вдвоём победитель забирает банк", 2, 3)}${gm("dice", "Кости-блеф", "Спрятанные кубики: заявляй, блефуй или скажи «Не верю!»", 8, 6)}</div><div class="t2" style="margin:14px 6px;font-size:12px">Играть можно только на монеты. Выигрыш не идёт в таблицу лидеров и не считается за забег. Играй осторожно!</div>`;
  if (cz.sub === 1) {
    const stops = Array.from({length: ZN}, (_, i) => `${ZC[secCol(i)]} ${i * ZS}deg ${(i + 1) * ZS}deg`).join(",");
    const lab = (i, t) => `<span class="rlab" style="transform:rotate(${(i + .5) * ZS}deg) translateY(-104px)">${t}</span>`;
    return back + jp + bal + `<div class="rwrap" id="rwrap">${Array.from({length: ZN}, (_, i) => `<i class="rl" style="transform:rotate(${i * ZS}deg) translateY(-139px)"></i>`).join("")}<div class="rptr" id="rptr">▼</div><div id="rwheel" class="rwheel" style="background:repeating-conic-gradient(rgba(0,0,0,.45) 0 .5deg,transparent .5deg ${ZS}deg),conic-gradient(${stops});transform:rotate(${cz.rot}deg)">${lab(0, "0")}${lab(13, "★")}<span class="rhub" id="rhub">🍉</span></div><div class="rball" id="rball" style="${cz.lsec === undefined ? "opacity:0" : `transform:rotate(${(cz.lsec + .5) * ZS + cz.rot}deg) translateY(-86px)`}"></div></div><div class="rhist" id="rhist">${cz.hist.map(c => `<i style="background:${ZC[c]}"></i>`).join("")}</div><div class="rpicks">${[["r", "Красное ×2"], ["b", "Чёрное ×2"], ["g", "Зелёное ×24"]].map(x => `<button class="rpick${cz.pick === x[0] ? " on" : ""}" data-a="czpick" data-v="${x[0]}" style="--c:${ZC[x[0]]}">${x[1]}</button>`).join("")}</div>${czBetUi()}<div id="czres" class="czres"></div><button id="rspin" class="btn rspinb" data-a="czspin" style="width:100%;height:54px;justify-content:center;font-size:17px;margin-top:10px">Крутить</button><div class="t2" style="margin:12px 6px;font-size:12px">5% каждой ставки идёт в джекпот. Выпал сектор ★ — забираешь весь джекпот, на какой бы цвет ни ставил.</div>`;
  }
  const h = cz.hand, p = cz.phase;
  const slots = [0, 1, 2, 3, 4].map(i => `<div class="pks${cz.hold[i] ? " h" : ""}" data-a="czhold" data-i="${i}">${p ? `<div class="pkw">${pkCard(h[i], cz.dealing)}</div>` : `<div class="pkw"><div class="pk3 back"><div class="pkf bk"></div><div class="pkf bk"></div></div></div>`}<div class="pkh">ДЕРЖУ</div></div>`).join("");
  const ctl = p === 0 ? czBetUi() + `<button class="btn" data-a="czdeal" style="width:100%;height:54px;justify-content:center;font-size:17px;margin-top:10px">Раздать карты</button>` : p === 1 ? `<div style="display:flex;gap:8px;margin-top:6px"><button class="btn o" data-a="czauto" style="flex:1;justify-content:center">Авто-выбор</button><button class="btn" data-a="czdraw" style="flex:1.4;justify-content:center">Сменить карты</button></div><div class="t2" style="text-align:center;margin-top:8px;font-size:12px">Нажми на карты, которые хочешь оставить. Ставка: ${fmt(cz.pbet)}</div>` : `<div class="czres" id="czres">${cz.res || ""}</div><button class="btn" data-a="czagain" style="width:100%;height:54px;justify-content:center;font-size:17px;margin-top:10px">Ещё раз</button>`;
  return back + bal + `<div class="pkt"><div id="pkm" class="pkm" style="background-image:url(${MAS_URL})"></div><div id="pkb" class="pkb">${p === 0 ? "Сыграем? Ставь монеты!" : p === 1 ? "Что оставим?" : ""}</div></div><div class="pkrow" id="pkrow">${slots}</div><div id="pkev" class="pkev">${p === 1 || p === 2 ? pkEvalC(h) : "Покер: 5 карт, одна замена"}</div>${ctl}<div class="pkpay">${PKT.map(x => `<div><span>${x[0]}</span><b>×${x[1]}</b></div>`).join("")}</div>`;
};
A.czpick = function (e) { if (cz.busy) return; cz.pick = e.dataset.v; document.querySelectorAll(".rpick").forEach(b => b.classList.toggle("on", b.dataset.v === cz.pick)); };
A.czspin = async function () {
  if (cz.busy) return; const bet = czBet(); if (S.pts < bet || bet < 100) return toast("Не хватает монет");
  cz.busy = true; S.pts -= bet; mark(); czUpd(); const btn0 = $("#rspin"); if (btn0) btn0.classList.add("dis"); const rs = $("#czres"); if (rs) { rs.textContent = ""; rs.className = "czres"; }
  const hub0 = $("#rhub"); if (hub0) hub0.textContent = "🍉"; const old = document.querySelector(".rwin"); if (old) old.remove();
  const r = await api("cz_roulette", {bet, pick: cz.pick});
  if (!r || r.error) { S.pts += bet; cz.busy = false; mark(); czUpd(); if (btn0) btn0.classList.remove("dis"); return toast((r && r.error) || "Нет связи"); }
  const w = $("#rwheel"), wrap = $("#rwrap"), ptr = $("#rptr"), ball = $("#rball"), lights = [...document.querySelectorAll(".rl")], sec0 = r.sector;
  const start = cz.rot, target = (Math.floor(cz.rot / 360) + 7) * 360 - (sec0 + .5) * ZS + (Math.random() - .5) * ZS * .6; cz.rot = target; cz.lsec = sec0;
  if (w && wrap) {
    wrap.classList.remove("win", "jp"); wrap.classList.add("spin"); try { tone(180, 260, .08, "sawtooth"); hap("medium"); } catch (e) {}
    const T = 5.2, TW = .4, t0 = performance.now(); let lastSec = -1, lastTk = 0, lastL = -1;
    await new Promise(done => {
      const step = nowT => {
        if (!w.isConnected) return done(); const t = (nowT - t0) / 1000; let rot;
        if (t < TW) { const k = t / TW; rot = start - 12 * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); }
        else { const m = Math.min(1, (t - TW) / (T - TW)); rot = (start - 12) + (target - (start - 12)) * (1 - Math.pow(1 - m, 4.2)); }
        w.style.transform = `rotate(${rot}deg)`;
        const sec = Math.floor((((-rot) % 360) + 360) % 360 / ZS);
        if (sec !== lastSec) { if (lastSec >= 0 && nowT - lastTk > 55) { lastTk = nowT; try { ptr.animate([{transform: "translateX(-50%) rotate(-28deg)"}, {transform: "translateX(-50%) rotate(0deg)"}], {duration: 120, easing: "ease-out"}); tone(900, 16, .035, "square"); tickHap(); } catch (e) {} } lastSec = sec; }
        const li = Math.floor(t * 20) % ZN; if (li !== lastL) { if (lastL >= 0) lights[lastL].classList.remove("on"); lights[li].classList.add("on"); lastL = li; }
        const D = -1900 * Math.pow(1 - Math.min(1, t / 4.4), 3), pocket = (sec0 + .5) * ZS + rot, fall = Math.min(1, Math.max(0, (t - 3.5) / .9)), bnc = fall < 1 ? 1 - Math.pow(1 - fall, 2) * Math.cos(fall * 9) : 1;
        ball.style.opacity = 1; ball.style.transform = `rotate(${pocket + D}deg) translateY(${-(124 - 38 * bnc)}px)`;
        if (t < T) requestAnimationFrame(step); else done();
      }; requestAnimationFrame(step);
    });
    if (lastL !== undefined) lights.forEach(l => l.classList.remove("on")); wrap.classList.remove("spin");
    if (w.isConnected) { w.style.transform = `rotate(${target}deg)`; const win = document.createElement("div"); win.className = "rwin"; win.style.background = `conic-gradient(from ${sec0 * ZS}deg,rgba(255,255,255,.7) 0deg ${ZS}deg,transparent ${ZS}deg)`; w.appendChild(win); }
  } else await sleep(4400);
  S.pts += r.payout; mark(); if (r.payout > bet) save(true); cz.jp = r.jp; cz.last = r.last; const col = secCol(r.sector); cz.hist.push(col); if (cz.hist.length > 14) cz.hist.shift(); cz.busy = false; czUpd();
  const hi = $("#rhist"); if (hi) hi.innerHTML = cz.hist.map(c => `<i style="background:${ZC[c]}"></i>`).join("");
  const rs2 = $("#czres"), b2 = $("#rspin"), hub = $("#rhub"); if (b2) b2.classList.remove("dis");
  const wr = w && w.isConnected ? w.getBoundingClientRect() : null, cx = wr ? wr.x + wr.width / 2 : innerWidth / 2, cy = wr ? wr.y + wr.height / 2 : 300;
  const hubSet = (e) => { if (hub) { hub.textContent = e; hub.classList.remove("pop"); void hub.offsetWidth; hub.classList.add("pop"); setTimeout(() => { if (hub.isConnected) { hub.textContent = "🍉"; hub.classList.remove("pop"); } }, 2400); } };
  if (r.jackpot) { if (rs2) { rs2.className = "czres win jp"; rs2.textContent = "ДЖЕКПОТ! +" + fmt(r.payout - bet); } if (wrap) { wrap.classList.add("jp"); setTimeout(() => wrap.classList.remove("jp"), 3200); } hubSet("👑"); try { fxConfetti(160); fxRing(cx, cy, "#ffd54f", 300, 800); fxBurst(cx, cy, 30, ["#ffd54f", "#fff", "#ff5252"], 170); fxFloat("ДЖЕКПОТ!", cx, cy - 20, "#ffd54f", 38); jingle(3); hap("ok"); const v = $("#view"); if (v) { v.classList.remove("shk"); void v.offsetWidth; v.classList.add("shk"); setTimeout(() => v.classList.remove("shk"), 300); } } catch (e) {} }
  else if (r.payout > 0) { if (rs2) { rs2.className = "czres win"; rs2.textContent = "Выигрыш +" + fmt(r.payout - bet); } if (wrap) { wrap.classList.add("win"); setTimeout(() => wrap.classList.remove("win"), 2200); } hubSet("😎"); try { fxConfetti(40); fxRing(cx, cy, "#69f0ae", 220, 650); fxBurst(cx, cy, 16, ["#ffd54f", "#69f0ae", "#fff"], 130); fxFloat("+" + fmt(r.payout - bet), cx, cy - 20, "#69f0ae", 30); jingle(1); hap("ok"); } catch (e) {} }
  else { S.burnC = (S.burnC || 0) + bet; if (rs2) { rs2.className = "czres lose"; rs2.textContent = "Проигрыш −" + fmt(bet); } hubSet("🫠"); try { fxFloat("−" + fmt(bet), cx, cy - 20, "#ff6e6e", 24); } catch (e) {} }
  if (tab === 6) czUpd();
};
// --- покер
let pkTalk = 0;
function pkFr(n) { const m = $("#pkm"); if (m) m.style.backgroundPositionX = (-96 * n) + "px"; }
function pkSay(t, ms) {
  const b = $("#pkb"); if (b) b.textContent = t; const id = ++pkTalk; let f = 1; const end = Date.now() + (ms || 900);
  const tk = setInterval(() => { if (id !== pkTalk || Date.now() > end) { clearInterval(tk); if (id === pkTalk) pkFr(2); return; } pkFr(f = f === 1 ? 2 : 1); }, 220);
}
function pkFly(i, delay, row) {
  const slot = document.querySelectorAll((row || "#pkrow") + " .pks")[i], m = $("#pkm"); if (!slot || !m) return;
  const w = slot.querySelector(".pkw"), mr = m.getBoundingClientRect(), sr = slot.getBoundingClientRect();
  const dx = mr.left + mr.width / 2 - (sr.left + sr.width / 2), dy = mr.top + mr.height * .7 - (sr.top + sr.height / 2);
  w.animate([{transform: `translate(${dx}px,${dy}px) scale(.4) rotate(-260deg)`, opacity: 0}, {opacity: 1, offset: .2}, {transform: "none", opacity: 1}], {duration: 580, delay, easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards"});
  m.animate([{transform: "none"}, {transform: "translateX(" + (i % 2 ? -8 : 8) + "px) rotate(" + (i % 2 ? -7 : 7) + "deg) scale(1.06)"}, {transform: "none"}], {duration: 240, delay});
}
async function pkReveal(idxs) {
  const slots = document.querySelectorAll("#pkrow .pks");
  for (const i of idxs) { const c = slots[i] && slots[i].querySelector(".pk3"); if (c) c.classList.remove("back"); await sleep(130); }
  await sleep(450);
}
function burnCard() {
  const c = S.burnC || 0, t = S.burnT || 0;
  return `<div class="card col" style="margin:10px 0;gap:6px;background:linear-gradient(135deg,rgba(255,87,34,.16),rgba(255,193,7,.08))"><div class="t1" style="font-size:15px">🔥 Сожжено монет</div><div style="display:flex;justify-content:space-between"><span class="t2" style="margin:0">Проиграно в казино</span><b>${fmt(c)}</b></div><div style="display:flex;justify-content:space-between"><span class="t2" style="margin:0">Налог на богатство</span><b>${fmt(t)}</b></div><div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.12);padding-top:6px"><span class="t2" style="margin:0">Всего</span><b style="color:#ff8a50">${fmt(c + t)}</b></div><div class="t2" style="margin:2px 0 0;font-size:12px;line-height:1.4"><b style="color:var(--on)">Как работают налоги</b><br>Чем больше монет на руках, тем выше налог: ставка растёт плавно, а не одной ступенькой. Работает только самый высокий налог.<br>• <b>От 1 трлн</b>: клик даёт на 40% меньше (+5.5% за каждый ×10 богатства, максимум 92%). Пока тебя нет в игре, каждые 2 часа сгорает 5% монет (+1% за каждый ×10, максимум 20%).<br>• <b>От 1 Qa</b>: вместо офлайн-налога каждый час сгорает 25% монет (+5% за каждый ×10, максимум 60%). Клик тоже режется по той же формуле: около 57% на 1 Qa и около 71% на 500 Qa.<br>Потратил или вложил монеты и упал ниже порога: налог пропадает.</div></div></div>`;
}
A.czdeal = async function () {
  if (cz.busy) return; const bet = czBet(); if (S.pts < bet || bet < 100) return toast("Не хватает монет");
  cz.busy = true; S.pts -= bet; mark(); czUpd();
  const r = await api("cz_pk_deal", {bet});
  if (!r || r.error) { S.pts += bet; cz.busy = false; mark(); czUpd(); return toast((r && r.error) || "Нет связи"); }
  if (r.resume) { S.pts += bet; mark(); toast("Была начатая раздача — продолжаем"); }
  cz.phase = 1; cz.hand = r.hand; cz.pbet = r.bet; cz.hold = [false, false, false, false, false]; cz.res = null; cz.dealing = true;
  cz.busy = false; render(); cz.busy = true;
  await sleep(60); pkSay("Раздаю!", 1300); [0, 1, 2, 3, 4].forEach(i => pkFly(i, i * 170));
  await sleep(4 * 170 + 640); await pkReveal([0, 1, 2, 3, 4]); cz.dealing = false;
  pkSay("Что оставим?", 900); const ev = $("#pkev"); if (ev) ev.textContent = pkEvalC(cz.hand); cz.busy = false; czUpd();
};
A.czhold = function (e) {
  if (cz.phase !== 1 || cz.busy) return; const i = +e.dataset.i; cz.hold[i] = !cz.hold[i]; e.classList.toggle("h", cz.hold[i]); try { hap("tick"); } catch (x) {}
};
A.czauto = function () { if (cz.phase !== 1 || cz.busy) return; cz.hold = pkAuto(cz.hand); document.querySelectorAll("#pkrow .pks").forEach((s, i) => s.classList.toggle("h", cz.hold[i])); pkSay("Я бы оставил эти!", 900); };
A.czdraw = async function () {
  if (cz.phase !== 1 || cz.busy) return; cz.busy = true;
  const r = await api("cz_pk_draw", {hold: cz.hold});
  if (!r || r.error) { cz.busy = false; cz.phase = 0; toast((r && r.error) || "Нет связи"); render(); return; }
  const slots = document.querySelectorAll("#pkrow .pks"), ch = [];
  r.hand.forEach((c, i) => { if (!cz.hold[i]) { ch.push(i); const w = slots[i].querySelector(".pkw"); w.innerHTML = pkCard(c, true); } });
  pkSay("Меняю!", 1000); ch.forEach((i, k) => pkFly(i, k * 170));
  await sleep((ch.length ? (ch.length - 1) * 170 : 0) + 640); await pkReveal(ch);
  cz.hand = r.hand; S.pts += r.payout; mark(); if (r.payout > cz.pbet) save(true); if (r.mult === 0) S.burnC = (S.burnC || 0) + cz.pbet;
  const ev = $("#pkev"); if (ev) ev.textContent = r.name;
  const win = r.payout - r.pbet || 0, prof = r.payout - cz.pbet;
  cz.res = r.mult > 0 ? `${r.name}: +${fmt(prof)}${r.mult === 1 ? " (ставка возвращена)" : ""}` : `Ничего — −${fmt(cz.pbet)}`;
  cz.phase = 2; cz.busy = false; render(); czUpd();
  const sl = $("#pkrow"); if (sl) sl.querySelectorAll(".pk3").forEach(c => c.classList.remove("back"));
  const rs = $("#czres"); if (rs) rs.className = "czres " + (r.mult > 1 ? "win" : r.mult === 1 ? "" : "lose");
  pkSay(r.mult >= 6 ? "Вот это да!!!" : r.mult >= 2 ? "Отлично, ты в плюсе!" : r.mult === 1 ? "Хоть ставку вернул!" : "Не повезло… ещё разок?", 1400);
  try { pkFinish(r, prof); } catch (x) {}
};
A.czagain = function () { if (cz.busy) return; cz.phase = 0; cz.res = null; cz.hand = []; render(); };
const _r6 = render;
render = function () {
  if (tab === 6 && cz.busy) return;
  _r6();
  if (tab === 6) { if (Date.now() - cz.jpAt > 4000) czInfo(); if (cz.sub === 2) { pkFr(2); } }
};
setInterval(() => { if (tab === 6 && !document.hidden) { const e = document.getElementById("czbal"); if (e) e.textContent = fmt(S.pts); } }, 700);

// ---------- покер на двоих
cz.tid = 0; cz.t = null; cz.lobby = null; cz.sig = ""; cz.shown = 0; cz.fin = 0;
const P2PH = ["Ставлю душу своей матери!", "Ну давай, удиви меня", "Я блефую… или нет?", "У меня каре, зуб даю", "Не торопись, я подожду", "Ничего личного, просто покер", "Ох, повезло тебе!", "Реванш?", "Красиво сыграл", "Арбуз всё видит"];
const p2bub = (m, cls) => m && (Date.now() - m.at) < 6000 ? `<div class="p2bub ${cls}" data-n="${m.n}">${esc(P2PH[m.code] || "")}</div>` : "";
const _tCas = tCasino;
tCasino = function () {
  if (cz.sub < 3) return _tCas();
  const act4 = cz.sub === 4 && (!cz.t || cz.t.status === "wait" || cz.t.status === "play");
  const back = act4 ? "" : `<button class="btn t bkb" data-a="czgo" data-k="${cz.sub === 4 ? 3 : 0}" >← ${cz.sub === 4 ? "К столикам" : "Казино"}</button>`;
  const bal = `<div class="card" style="padding:10px 16px"><span class="t2 grow" style="margin:0">Баланс</span><b id="czbal" style="font-size:18px">${fmt(S.pts)}</b></div>`;
  if (cz.sub === 3) {
    const L = cz.lobby;
    let h = back + bal + `<div class="card col"><div class="t1" style="color:var(--pri)">Создать столик</div><div class="t2" style="font-size:12px;margin:0">У каждого игрока одинаковая ставка. Каждому по 5 карт, одна замена, у кого комбинация старше — забирает банк (5% банка уходит в джекпот).</div>${czBetUi()}<button class="btn" data-a="p2create" style="width:100%;height:50px;justify-content:center">Создать и ждать соперника</button></div><div class="sec">Открытые столики${L ? " · " + L.rows.length : ""}</div>`;
    if (!L) return h + `<div class="t2" style="text-align:center;margin:20px">Загружаю…</div>`;
    h += L.rows.length ? L.rows.map(x => `<div class="card"><span style="font-size:24px">🃏</span><div class="grow"><div class="t1" style="font-size:15px">${esc(x.n1)}</div><div class="t2" style="margin:0;font-size:12px">Ставка ${fmt(x.stake)}</div></div>${btn("Сесть", "p2join", `data-i="${x.id}" data-s="${x.stake}"`, S.pts >= x.stake ? "" : "dis")}</div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока нет столиков. Создай первый и подожди соперника!</div>`;
    return h;
  }
  const t = cz.t; if (!t) return back + `<div class="t2" style="text-align:center;margin:30px">Загружаю столик…</div>`;
  const opp = t.status === "wait" ? "Ждём соперника…" : esc(t.seat === 1 ? t.n2 : t.n1), done = t.status === "done", showOpp = done && !cz.hideOpp;
  const slotsOpp = [0, 1, 2, 3, 4].map(i => `<div class="pks${t.status === "wait" ? " ph" : ""}">${t.status === "wait" ? "" : `<div class="pkw">${showOpp ? pkCard(t.oppHand[i], false) : `<div class="pk3 back"><div class="pkf bk"></div><div class="pkf bk"></div></div>`}</div>`}</div>`).join("");
  const my = t.hand, slotsMy = [0, 1, 2, 3, 4].map(i => `<div class="pks${cz.hold[i] && t.status === "play" && !t.myDone ? " h" : ""}" ${t.status === "play" && !t.myDone ? `data-a="p2hold" data-i="${i}"` : ""}>${my ? `<div class="pkw">${pkCard(my[i], cz.dealing)}</div>` : ""}<div class="pkh">ДЕРЖУ</div></div>`).join("");
  let ctl = "", st = "";
  if (t.status === "wait") { ctl = `<div class="t2" style="text-align:center;margin:14px">Ставка ${fmt(t.stake)}. Столик увидят все игроки, как только кто-то сядет, мы вас сообщим.</div><button class="btn o" data-a="p2cancel" style="width:100%;justify-content:center">Отменить столик</button>`; st = "Ждём, пока кто-нибудь сядет…"; }
  else if (t.status === "play") { if (!t.myDone) { ctl = `<div style="display:flex;gap:8px;margin-top:6px"><button class="btn o" data-a="p2auto" style="flex:1;justify-content:center">Авто-выбор</button><button class="btn" data-a="p2draw" style="flex:1.4;justify-content:center">Сменить карты</button></div><div class="t2" style="text-align:center;margin-top:8px;font-size:12px">Нажми на карты, которые хочешь оставить. Осталось <b id="p2t">${t.left}</b> с</div>`; st = my ? pkEvalC(my) : ""; } else { ctl = `<div class="t2" style="text-align:center;margin:14px">Ждём ход соперника… <b id="p2t">${t.left}</b> с</div>`; st = my ? pkEvalC(my) : ""; } }
  else if (done) { const w = t.winner; const txt = w === 1 ? `Победа! ${t.myEv} против ${t.oppEv}: +${fmt(t.pay - t.stake)}` : w === 0 ? `Ничья (${t.myEv}): ставки возвращены` : `Поражение: ${t.oppEv} против ${t.myEv}: −${fmt(t.stake)}`; ctl = `<div id="czres" class="czres ${w === 1 ? "win" : w === 2 ? "lose" : ""}">${cz.hideOpp ? "" : txt}</div><button class="btn" data-a="czgo" data-k="3" style="width:100%;height:54px;justify-content:center;font-size:17px;margin-top:10px">К столикам</button>`; st = ""; }
  else { ctl = `<div class="t2" style="text-align:center;margin:14px">Столик закрыт.</div><button class="btn" data-a="czgo" data-k="3" style="width:100%;justify-content:center">К столикам</button>`; }
  const phr = t.status === "wait" || t.solo ? "" : `<div class="p2ph">${P2PH.map((x, i) => `<button class="p2chip" data-a="p2say" data-i="${i}">${esc(x)}</button>`).join("")}</div>`;
  return back + bal + `<div class="p2n">${opp}</div>${p2bub(t.oppMsg, "o")}<div class="pkrow p2r" id="pkrow2">${slotsOpp}</div><div class="pkt" style="min-height:96px"><div id="pkm" class="pkm" style="background-image:url(${MAS_URL})"></div><div id="pkb" class="pkb">${t.status === "wait" ? "Подождём гостя!" : t.status === "play" ? "Игра пошла!" : ""}</div></div><div class="pkrow" id="pkrow">${slotsMy}</div><div class="p2n" style="color:var(--pri)">Ты · ${esc(me.name)}</div>${p2bub(t.myMsg, "m")}<div id="pkev" class="pkev">${st}</div>${ctl}${phr}`;
};
async function p2Lobby() {
  const r = await api("p2_list", {}); if (!r || r.error) return; cz.lobby = r;
  for (const id of r.claims || []) { const c = await api("p2_claim", {id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); toast("Возврат/выигрыш из покера: +" + fmt(c.amount)); } }
  if (r.mine && cz.sub === 3 && !cz.tid) { cz.tid = r.mine; cz.sub = 4; cz.t = null; cz.shown = 0; render(); p2Poll(); return; }
  if (cz.sub === 3 && !cz.busy) render();
}
A.p2create = async function () {
  if (cz.busy) return; const bet = czBet(); if (S.pts < bet || bet < 100) return toast("Не хватает монет");
  cz.busy = true; S.pts -= bet; mark(); czUpd(); const r = await api("p2_create", {stake: bet}); cz.busy = false;
  if (!r || r.error) { S.pts += bet; mark(); czUpd(); return toast((r && r.error) || "Нет связи"); }
  cz.tid = r.id; cz.sub = 4; cz.t = null; cz.shown = 0; cz.fin = 0; cz.hold = [false, false, false, false, false]; render(); p2Poll();
};
A.p2join = async function (e) {
  if (cz.busy) return; const id = +e.dataset.i, stake = +e.dataset.s; if (S.pts < stake) return toast("Не хватает монет");
  cz.busy = true; const r = await api("p2_join", {id}); cz.busy = false;
  if (!r || r.error) { toast((r && r.error) || "Нет связи"); p2Lobby(); return; }
  S.pts -= r.stake; mark(); cz.tid = id; cz.sub = 4; cz.t = null; cz.shown = 0; cz.fin = 0; cz.hold = [false, false, false, false, false]; render(); p2Poll();
};
let p2SayAt = 0;
A.p2say = async function (e) {
  if (!cz.tid || Date.now() - p2SayAt < 2000) return; p2SayAt = Date.now(); const code = +e.dataset.i;
  if (cz.t) { cz.t.myMsg = {code, n: ((cz.t.myMsg && cz.t.myMsg.n) || 0) + 1, at: Date.now()}; if (!cz.busy) render(); }
  const r = await api("p2_say", {id: cz.tid, code}); if (r && r.error) toast(r.error); else setTimeout(() => { if (cz.sub === 4 && !cz.busy) render(); }, 6100);
};
A.p2cancel = async function () { const r = await api("p2_cancel", {id: cz.tid}); if (r && r.error) return toast(r.error); p2Poll(); };
A.p2hold = function (e) { const i = +e.dataset.i; if (!cz.t || cz.t.myDone || cz.busy) return; cz.hold[i] = !cz.hold[i]; e.classList.toggle("h", cz.hold[i]); try { hap("tick"); } catch (x) {} };
A.p2auto = function () { if (!cz.t || !cz.t.hand || cz.t.myDone || cz.busy) return; cz.hold = pkAuto(cz.t.hand); document.querySelectorAll("#pkrow .pks").forEach((s, i) => s.classList.toggle("h", cz.hold[i])); pkSay("Я бы оставил эти!", 900); };
A.p2draw = async function () {
  if (!cz.t || cz.t.myDone || cz.busy) return; cz.busy = true; const old = cz.t.hand.slice(), hold = cz.hold.slice();
  const r = await api("p2_draw", {id: cz.tid, hold});
  if (!r || r.error) { cz.busy = false; return toast((r && r.error) || "Нет связи"); }
  const slots = document.querySelectorAll("#pkrow .pks"), ch = [];
  r.hand.forEach((c, i) => { if (!hold[i]) { ch.push(i); const w = slots[i].querySelector(".pkw"); if (w) w.innerHTML = pkCard(c, true); } });
  pkSay("Меняю!", 1000); ch.forEach((i, k) => pkFly(i, k * 170));
  await sleep((ch.length ? (ch.length - 1) * 170 : 0) + 640); await pkReveal(ch);
  cz.hold = [false, false, false, false, false]; cz.busy = false; await p2Apply(r);
};
let p2Busy = false;
async function p2Poll() {
  if (p2Busy || cz.sub !== 4 || !cz.tid) return; p2Busy = true;
  try { const r = await api("p2_state", {id: cz.tid}); if (r && r.error) { toast(r.error); cz.tid = 0; cz.sub = 3; render(); p2Lobby(); } else if (r && !cz.busy) await p2Apply(r); } catch (e) {}
  p2Busy = false;
}
async function p2Apply(r) {
  for (const k of ["oppMsg", "myMsg"]) if (r[k]) { r[k].at = Date.now() - r[k].ago * 1000; if (r[k].ago < 6) setTimeout(() => { if (cz.sub === 4 && !cz.busy) render(); }, 6100 - r[k].ago * 1000); }
  const prev = cz.t, sig = [r.status, r.myDone, r.oppDone, (r.hand || []).join(), r.winner, r.oppMsg ? r.oppMsg.n : 0, r.myMsg ? r.myMsg.n : 0].join("|"); cz.t = r;
  if (sig === cz.sig) { const e = document.getElementById("p2t"); if (e) e.textContent = r.left; return; } cz.sig = sig;
  if (r.status === "play" && !cz.shown) {
    cz.shown = 1; const fresh = !prev || prev.status === "wait";
    if (fresh && !r.myDone) {
      cz.dealing = true; cz.busy = false; render(); cz.busy = true; await sleep(60); pkSay("Раздаю!", 1500);
      for (let i = 0; i < 5; i++) { pkFly(i, i * 170, "#pkrow"); pkFly(i, i * 170 + 85, "#pkrow2"); }
      await sleep(4 * 170 + 85 + 640); await pkReveal([0, 1, 2, 3, 4]); cz.dealing = false; cz.busy = false; pkSay("Что оставим?", 900); const ev = $("#pkev"); if (ev) ev.textContent = pkEvalC(r.hand); return;
    }
  }
  if (r.status === "done" && !cz.fin) {
    cz.fin = 1; cz.hideOpp = true; cz.busy = false; render(); cz.busy = true; await sleep(700);
    const row = document.querySelectorAll("#pkrow2 .pks"); const oh = r.oppHand;
    row.forEach((s, i) => { const w = s.querySelector(".pkw"); if (w) w.innerHTML = pkCard(oh[i], true); });
    await sleep(60); await pkReveal([0, 1, 2, 3, 4].map(i => i)); const rows2 = document.querySelectorAll("#pkrow2 .pk3"); rows2.forEach(c => c.classList.remove("back"));
    cz.hideOpp = false; cz.busy = false; render();
    const c = await api("p2_claim", {id: r.id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); if (c.amount > r.stake) save(true); czUpd(); }
    pkSay(r.winner === 1 ? "Ты выиграл! Браво!" : r.winner === 0 ? "Ничья, бывает!" : "Не повезло, реванш?", 1500);
    try { dcEndFx(r); } catch (x) {}
    return;
  }
  if (r.status === "cancel") { if (!r.claimed) { const c = await api("p2_claim", {id: r.id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); toast("Ставка возвращена: +" + fmt(c.amount)); } } cz.tid = 0; cz.sub = 3; cz.t = null; render(); p2Lobby(); return; }
  if (!cz.busy) render();
}
setInterval(() => { if (tab === 6 && !document.hidden) { if (cz.sub === 4) p2Poll(); } }, 1500);
setInterval(() => { if (tab === 6 && !document.hidden && cz.sub === 3 && !cz.busy) p2Lobby(); }, 3500);

// ---------- банк и коллекторы
const BANK_LOGO = MAS_URL.replace("mascot.png?v=1", "bank_logo.png?v=1");
const bankLogo = `<img src="${BANK_LOGO}" alt="" style="display:block;margin:0 auto;height:56px;width:auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))">`;
const COLL_URL = MAS_URL.replace("mascot.png?v=1", "collector.png?v=2");
cz.loan = null; cz.lmax = 0; cz.lpct = 50; cz.ban = 0; let collBusy = false, lnSig = "";
const lnAmt = () => Math.max(1000, Math.min(cz.lmax, Math.floor(cz.lmax * cz.lpct / 100)));
const fmtT = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
const lnLeft = () => cz.loan ? Math.max(0, Math.ceil((cz.loan.at - Date.now()) / 1000)) : 0;
const jpLast = () => cz.last ? "Последний джекпот: " + cz.last.n + " — " + fmt(cz.last.a) : "Джекпот ещё никто не срывал";
function jpReels() {
  if (cz.jp === null) return "…";
  const str = fmt(cz.jp);
  return [...str].map(c => /\d/.test(c) ? `<span class="jr"><span class="jrs" data-d="${c}" style="transform:translateY(-${(20 + +c) * 1.1}em)">${"0123456789".repeat(3).split("").map(x => `<i>${x}</i>`).join("")}</span></span>` : `<span class="jc">${esc(c)}</span>`).join("");
}
function jpRow() {
  const L = cz.loan;
  return `<div class="czrow"><button class="czbk${L ? " debt" : ""}" data-a="bankop"><i class="cn" style="left:10%;animation-delay:0s">🪙</i><i class="cn" style="left:46%;animation-delay:1.3s">💰</i><i class="cn" style="left:78%;animation-delay:2.4s">🪙</i><div class="bkl"><img src="${BANK_LOGO}" alt=""></div><b>Банк</b><span>${L ? "⚠ Долг: " + fmt(L.amount) : "Взять в долг"}</span></button><div class="czjpc"><div class="czjt">★ ДЖЕКПОТ ★</div><div class="czjv jrw">${jpReels()}</div><div id="czlast" class="czjs">${esc(jpLast())}</div></div></div>`;
}
A.bankop = function () { modal(`<div id="bkm">${bankHtml()}</div>`); };
let jpPend = true, jpPrevTab = -1;
function jpSpin() {
  const strips = document.querySelectorAll(".czjpc .jrs"), tile = document.querySelector(".czjpc"); if (!strips.length) return;
  strips.forEach((el, i) => { const d = +el.dataset.d, fin = -(20 + d) * 1.1; try { el.animate([{transform: "translateY(0em)"}, {transform: `translateY(${fin}em)`}], {duration: 900 + i * 520, easing: "cubic-bezier(.15,.7,.2,1)", fill: "backwards"}); } catch (e) {} });
  document.querySelectorAll(".czjpc .jc").forEach(el => { try { el.animate([{opacity: 0}, {opacity: 0, offset: .85}, {opacity: 1}], {duration: 900 + strips.length * 520}); } catch (e) {} });
}
{ const _r1 = render; render = function () { _r1(); if (tab === 6 && cz.sub === 0) { if (jpPrevTab !== 6) jpPend = true; if (jpPend && cz.jp !== null && document.querySelector(".jrs")) { jpPend = false; requestAnimationFrame(jpSpin); } } if (tab !== 6) jpPend = true; jpPrevTab = tab; const b = document.getElementById("bkm"); if (b) b.innerHTML = bankHtml(); }; }
function bankHtml() {
  const L = cz.loan, minus = S.pts < 0 ? `<div class="t2" style="font-size:12px;margin:0;text-align:center;background:rgba(0,0,0,.25);border-radius:12px;padding:8px">Ты в минусе. Можно объявить банкротство: долг пропадёт, но прогресс забега (монеты, генераторы, улучшения) сбросится, коты и самоцветы останутся. После этого банк закрыт на 3 дня.</div>${btn("Объявить банкротство", "lnbk", 'style="width:100%;justify-content:center"', "o")}` : "";
  if (!L) return `<div class="card col czbank${L ? " debt" : ""}"><i class="cn" style="left:8%;animation-delay:0s">🪙</i><i class="cn" style="left:30%;animation-delay:1.1s">💰</i><i class="cn" style="left:62%;animation-delay:2.2s">🪙</i><i class="cn" style="left:88%;animation-delay:.6s">💰</i>${bankLogo}<div class="t1" style="text-align:center;font-size:20px">Банк</div><div class="t2" style="font-size:12px;margin:0;text-align:center">Возьми монеты в долг и верни за 1 час без процентов. Не вернёшь — придут коты-коллекторы и заберут вдвое больше долга, баланс может уйти в минус. В минусе играть в казино нельзя.</div><div class="czchips">${[25, 50, 100].map(v => `<button class="chip${cz.lpct === v ? " on" : ""}" style="border:0;font-family:inherit" data-a="lnpct" data-v="${v}">${v}%</button>`).join("")}</div>${S.pts < 0 ? "" : cz.ban > 0 ? `<div class="t2" style="text-align:center;margin:0"><b>Банк закрыт ещё ${Math.ceil(cz.ban / 3600)} ч</b> после банкротства</div>` : `<button class="btn" data-a="lntake" style="width:100%;height:50px;justify-content:center"${cz.lmax < 1000 ? " disabled" : ""}>Взять ${fmt(lnAmt())} в долг</button>`}<div class="t2" style="font-size:11px;margin:0;text-align:center">Лимит: ${fmt(cz.lmax)} (30% от монет за забег)</div>${minus}</div>`;
  return `<div class="card col czbank${L ? " debt" : ""}"><i class="cn" style="left:8%;animation-delay:0s">🪙</i><i class="cn" style="left:30%;animation-delay:1.1s">💰</i><i class="cn" style="left:62%;animation-delay:2.2s">🪙</i><i class="cn" style="left:88%;animation-delay:.6s">💰</i>${bankLogo}<div class="t1" style="text-align:center;font-size:20px">Твой долг: ${fmt(L.amount)}</div><div class="t2" style="margin:0;text-align:center">Осталось <b id="lnleft" style="font-size:16px">${fmtT(lnLeft())}</b> до прихода коллекторов</div><button class="btn" data-a="lnpay" style="width:100%;height:50px;justify-content:center"${S.pts < L.amount ? " disabled" : ""}>Вернуть ${fmt(L.amount)}</button>${S.pts < L.amount ? `<div class="t2" style="font-size:11px;margin:0;text-align:center">Не хватает монет, заработай или выиграй</div>` : ""}${minus}</div>`;
}
const BM_LOGO = MAS_URL.replace("mascot.png?v=1", "black_market.png?v=1");
const bmLogo = `<img class="bmlogo" src="${BM_LOGO}" alt="Black Market">`;
const bmHtml = () => `<div class="bm"><div class="bmfloor"></div><div class="bmhole"><div class="bmlight"></div><div class="bmbars"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="bmeyes"><b></b><b></b></div>${bmLogo}<button class="bmdown" data-a="bmdive" aria-label="Спуститься вниз"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 8l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/></svg></button><div class="bmpsst">Тсс… каждый день новый товар, которого нет наверху</div></div></div>`;
const _tCas2 = tCasino;
tCasino = function () {
  let h = _tCas2();
  if (cz.sub === 0) h += bmHtml();
  return h;
};
async function loanCheck() {
  if (collBusy || !S) return; let r; try { r = await api("loan_info", {}); } catch (e) { return; } if (!r || r.error) return;
  cz.lmax = r.max; cz.loan = r.loan; cz.ban = r.ban || 0; if (r.loan) r.loan.at = Date.now() + r.loan.left * 1000;
  if (r.loan && r.loan.status === "overdue") return collect();
  const sig = r.loan ? r.loan.id + r.loan.status : "n" + r.max; if (sig !== lnSig) { lnSig = sig; if ((tab === 6 && cz.sub === 0 && !cz.busy) || (tab === 5 && moreSub === 2)) render(); }
}
setInterval(() => { if (!document.hidden) loanCheck(); }, 15000);
setTimeout(loanCheck, 3500);
setInterval(() => { const e = document.getElementById("lnleft"); if (e && cz.loan) { const l = lnLeft(); e.textContent = fmtT(l); if (l <= 0) loanCheck(); } }, 1000);
let bkArm = 0;
A.lnbk = async function (e) {
  if (S.pts >= 0) return;
  if (!bkArm) { bkArm = 1; e.textContent = "ТОЧНО? Прогресс забега сбросится. Нажми ещё раз"; setTimeout(() => { bkArm = 0; if (tab === 6) render(); }, 5000); return; }
  bkArm = 0; const r = await api("loan_bankrupt", {}); if (!r || r.error) return toast((r && r.error) || "Нет связи");
  Object.assign(S, {pts: 0, run: 0, click: 0, crit: 0, fev: 0, b: BUILDS.map(() => 0), boost: 0}); fever = frenzy = 0; mark(); save(true); cz.ban = r.ban; lnSig = ""; render();
  toast("Банкротство. Долг списан, начинай с нуля");
};
A.lnpct = function (e) { cz.lpct = +e.dataset.v; render(); };
A.lntake = async function () {
  if (cz.busy || cz.loan) return toast("Сначала верни прошлый долг"); if (S.pts < 0) return toast("Ты в минусе: сначала отработай долг"); const a = lnAmt(); const r = await api("loan_take", {amount: a});
  if (!r || r.error) return toast((r && r.error) || "Нет связи");
  S.pts += a; mark(); save(true); cz.loan = r.loan; cz.loan.at = Date.now() + r.loan.left * 1000; lnSig = r.loan.id + r.loan.status; render();
  toast("Получено в долг: " + fmt(a) + ". Верни за час!");
};
A.lnpay = async function () {
  if (cz.busy || !cz.loan) return; const a = cz.loan.amount; if (S.pts < a) return toast("Не хватает монет");
  const r = await api("loan_repay", {}); if (!r || r.error) { toast((r && r.error) || "Нет связи"); return loanCheck(); }
  S.pts -= r.amount; mark(); save(true); cz.loan = null; lnSig = ""; render(); toast("Долг возвращён. Коты-коллекторы разочарованы");
};
async function collect() {
  if (collBusy) return; collBusy = true;
  const r = await api("loan_settle", {}); if (!r || r.error) { collBusy = false; return; }
  const before = S.pts, after = before - r.fine, o = document.createElement("div"); o.className = "coll";
  o.innerHTML = `<div class="collt">Время платить!</div><div class="collrow">${[0, 1, 2].map(i => `<div class="collc c${i}" style="--d:${i * .3}s"><div class="collsp" style="background-image:url(${COLL_URL})"></div></div>`).join("")}</div><div class="collb">Долг ${fmt(r.amount)} ×2 = <b>${fmt(r.fine)}</b></div><div class="collbal">Баланс <b id="collv">${fmt(before)}</b></div>`;
  document.body.appendChild(o); try { hap("err"); } catch (e) {}
  await sleep(2100);
  for (let i = 0; i < 16; i++) { const c = document.createElement("span"); c.className = "collcoin"; c.textContent = "🪙"; c.style.setProperty("--dx", (Math.random() * 220 - 110) + "px"); c.style.setProperty("--dy", (-180 - Math.random() * 90) + "px"); c.style.animationDelay = i * 70 + "ms"; o.appendChild(c); }
  const t0 = performance.now(), D = 1500, ev = o.querySelector("#collv");
  await new Promise(res => { const f = t => { const k = Math.min(1, (t - t0) / D); ev.textContent = fmt(before + (after - before) * k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  S.pts = after; mark(); save(true); o.querySelector(".collt").textContent = "Спасибо за сотрудничество!"; o.classList.add("done");
  await sleep(1500); o.classList.add("out"); await sleep(450); o.remove(); collBusy = false; cz.loan = null; lnSig = ""; render(); loanCheck();
}
A.admskip = async function () { const r = await api("adm_skiploan", {}); if (!r || r.error) return toast((r && r.error) || "Нет связи"); toast("Час пропущен"); loanCheck(); };

// коллектор прогоняет из казино, если баланс в минусе
let kickOn = false;
function kickOut() {
  if (kickOn) return; kickOn = true;
  const o = document.createElement("div"); o.className = "kick";
  o.innerHTML = `<div class="kickc"><div class="kickb">Эй, должник! У тебя минус ${fmt(-S.pts)}. Играть нельзя, пока не отработаешь долг! В банке можно объявить банкротство.</div><div class="collsp" style="background-image:url(${COLL_URL})"></div></div>`;
  document.body.appendChild(o); try { hap("err"); } catch (e) {}
  const end = () => { if (!o.isConnected) return; o.classList.add("out"); setTimeout(() => { o.remove(); kickOn = false; }, 300); };
  o.addEventListener("click", end); setTimeout(end, 2800);
}
const _czgo2 = A.czgo;
A.czgo = function (e) { if (S.pts < 0 && +e.dataset.k >= 1) return kickOut(); return _czgo2.apply(this, arguments); };
for (const k of ["czdeal", "czspin", "p2create", "p2join"]) { const f = A[k]; A[k] = function () { if (S.pts < 0) return kickOut(); return f.apply(this, arguments); }; }

let tgStat = "", tgArm = 0;
async function tgRefresh() { const r = await api("adm_tgstat", {}); if (!r || r.error) return; tgStat = r.active ? "Рассылка идёт: " + r.sent + " из " + r.total : r.sent ? "Последняя рассылка: доставлено " + r.sent + " из " + r.total : ""; const e = document.getElementById("tgst"); if (e) e.textContent = tgStat; if (r.active) setTimeout(() => { if (tab === 5 && moreSub === 3) tgRefresh(); }, 4000); }
A.admtg = async function (e) {
  const text = (KEEP.tgc || "").trim(); if (text.length < 3) return toast("Напиши текст сообщения");
  if (!tgArm) { tgArm = 1; e.textContent = "ТОЧНО отправить ВСЕМ? Нажми ещё раз"; setTimeout(() => { tgArm = 0; if (tab === 5) render(); }, 5000); return; }
  tgArm = 0; const r = await api("adm_tgcast", {text}); if (!r || r.error) return toast((r && r.error) || "Нет связи");
  KEEP.tgc = ""; toast("Рассылка запущена: " + r.total + " чатов"); tgStat = "Рассылка идёт: 0 из " + r.total; render(); pollNow(); setTimeout(tgRefresh, 4000);
};

// ---------- чёрный рынок
const BM_PRICE = {2: 30, 3: 90, 4: 250, 5: 600};
function bmOffers(day) {
  let s = (day * 2654435761) >>> 0; const R = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  return [2, 3, 4, 5].map((r, slot) => { const c = []; for (let i = 0; i < BASE_N; i++) if (ITEMS[i][2] === r && i !== 70 && i !== 71) c.push(i); const idx = c[Math.floor(R() * c.length)];
    return {slot, idx, rar: r, price: BM_PRICE[r]}; });
}
cz.bm = null;
const _tCas3 = tCasino;
const BC_PRICE = 25, BC_W = {2: 50, 3: 42, 4: 8};
const bcPool = () => ITEMS.map((it, i) => it[6] && it[6] !== 10 ? i : -1).filter(i => i >= 0);
function bcRoll() {
  const pool = bcPool(); if (!pool.length) return -1; const q = Math.random() * 100, r = q < BC_W[4] ? 4 : q < BC_W[4] + BC_W[3] ? 3 : 2;
  const l = pool.filter(i => ITEMS[i][2] === r), ll = l.length ? l : pool; return ll[Math.floor(Math.random() * ll.length)];
}
function bcCase() {
  const pool = bcPool().sort((a, b) => ITEMS[b][2] - ITEMS[a][2] || a - b), ok = pool.length > 0;
  const th = pool.map(i => `<div class="bcth" style="box-shadow:0 0 0 2px ${RC[ITEMS[i][2]]}">${catEl(i, 40, {})}</div>`).join("");
  const ch = `<span style="color:#9a8cff">80% · 💎 ${BC_G1}–${BC_G2}</span><br>20% · кот: ` + [4, 3, 2].map(r => `<span class="rar${r}">${RARS[r][0].slice(0, 5)}. ${BC_W[r]}%</span>`).join(" · ");
  return `<div class="card col bmcase"><div style="display:flex;align-items:center;gap:12px"><div class="bmcat" style="display:flex;align-items:center;justify-content:center;font-size:34px;background:#0c0508">📦</div><div class="grow"><div class="t1" style="font-size:17px">Чёрный кейс</div><div class="t2" style="margin:2px 0 0;font-size:12px">Эксклюзивные коты, которых нет больше нигде. Только за кристаллы.</div></div></div>` +
    (ok ? `<div class="bcths">${th}</div><div class="t2" style="font-size:11px;text-align:center;margin:0">${ch}</div><div class="buyrow">${btn("💎 " + BC_PRICE, "bcopen", 'data-n="1"', S.gems >= BC_PRICE ? "" : "dis")}${btn("×5 · 💎 " + BC_PRICE * 5, "bcopen", 'data-n="5"', S.gems >= BC_PRICE * 5 ? "o" : "o dis")}</div>` : `<div class="t2" style="text-align:center;margin:6px">Загружаю котов…</div>`) + `</div>`;
}
const BC_GEM_P = 0.8, BC_G1 = 4, BC_G2 = 15;
A.bcopen = function (e) {
  if (cz.busy) return; const n = +e.dataset.n === 5 ? 5 : 1, c = BC_PRICE * n;
  if (!bcPool().length) return toast("Коты ещё грузятся"); if (S.gems < c) return toast("Не хватает кристаллов");
  S.gems -= c; const wins = [];
  for (let k = 0; k < n; k++) {
    if (Math.random() < BC_GEM_P) { const g = BC_G1 + Math.floor(Math.random() * (BC_G2 - BC_G1 + 1)); S.gems += g; wins.push({g}); }
    else { const w = bcRoll(), kd = grant(w, Math.random() < .08); try { afterCraft(w); } catch (x) {} wins.push({w, kd}); }
  }
  mark(); save(true);
  const gemCell = g => `<div class="cell"><div style="color:var(--onv)">${ic("gem", 56)}</div><span style="color:#9a8cff;font-weight:700">+${g} 💎</span><span style="color:var(--onv);font-weight:500">Кристаллы</span></div>`;
  const best = Math.max(...wins.map(x => x.w === undefined ? 1 : ITEMS[x.w][2])), glowC = x => x >= 4 ? "#ff5252" : x >= 3 ? "#ffd54f" : x >= 2 ? "#b388ff" : "#9a8cff";
  const ttl = `<h2>Чёрный кейс${n > 1 ? " ×" + n : ""}</h2>`;
  const o = ov(`${ttl}<div class="bca" id="bca"><div class="bcrays"></div><div class="bcglow" id="bcglow"></div><div class="bcbox" id="bcbox">📦</div></div><div class="t2" id="bcsub" style="margin-top:18px">Открываем…</div>`); hap("medium");
  let st = 0; const tk = setInterval(() => { if (!document.body.contains(o)) return clearInterval(tk); st++; try { tone(120 + st * 38, 90, .06, "triangle"); hap("light"); } catch (x) {} }, 230);
  const box = o.querySelector("#bcbox"), gl = o.querySelector("#bcglow");
  setTimeout(() => { if (box) box.classList.add("bcs2"); if (gl) gl.style.background = `radial-gradient(circle,${glowC(best)},transparent 65%)`; }, 900);
  setTimeout(() => {
    clearInterval(tk); if (!document.body.contains(o)) return;
    const a = o.querySelector("#bca"), r = a ? a.getBoundingClientRect() : null, cx = r ? r.x + r.width / 2 : innerWidth / 2, cy = r ? r.y + r.height / 2 : 300;
    const fl = document.createElement("div"); fl.className = "bcflash"; o.appendChild(fl); hap("ok");
    try { fxRing(cx, cy, glowC(best), 320, 700); fxBurst(cx, cy, 26, [glowC(best), "#fff", "#ffd54f"], 170); if (best >= 3) { fxConfetti(best >= 4 ? 120 : 60); jingle(2); } else jingle(1); } catch (x) {}
    setTimeout(() => {
      if (!document.body.contains(o)) return;
      const body = n === 1 ? (wins[0].w !== undefined ? rvHtml(wins[0].w, wins[0].kd) : `<div class="rv"><div style="color:var(--onv);filter:drop-shadow(0 0 24px #9a8cff);transform:scale(0);animation:pop .45s .05s forwards">${ic("gem", 120)}</div><div style="font-size:26px;font-weight:700;color:#9a8cff">+${wins[0].g} 💎</div><div class="t2">Кристаллы</div></div>`)
        : `<div class="rgrid">${wins.map((x, k) => (x.w === undefined ? gemCell(x.g) : `<div class="cell">${catEl(x.w, 64, {holo: S.holo.includes(x.w)})}<span class="rar${ITEMS[x.w][2]}">${ITEMS[x.w][1]}</span><span style="color:var(--onv);font-weight:500">${KIND[x.kd]}</span></div>`).replace('class="cell"', `class="cell" style="animation:pop .4s ${k * .12}s backwards"`)).join("")}</div>`;
      o.innerHTML = `${ttl}${body}<div style="margin-top:20px;display:flex;gap:10px">${btn("Закрыть", "close")}</div>`; render();
    }, 350);
  }, 2000);
  render();
};
tCasino = function () {
  if (cz.sub !== 5) return _tCas3();
  const B = cz.bm, back = `<button class="btn t bkb" data-a="czgo" data-k="0">← Казино</button>`;
  let h = `<div class="bmpage${cz.bmFx ? " bmfx" : ""}">${back}${bmLogo}<div class="bmtalk"><div class="bmeyes2"><b></b><b></b></div>Псст… Кристаллы есть? Товар редкий, берут быстро. Завтра будет другой.</div>`;
  if (!B) return h + `<div class="t2" style="text-align:center;margin:30px">Спускаюсь…</div></div>`;
  h += `<div class="card" style="padding:10px 16px;background:#1a0d12"><span class="t2 grow" style="margin:0">Баланс</span><b style="font-size:18px">💎 ${fmt(S.gems)}</b></div>`;
  h += B.offers.map(o => { const got = B.bought.includes(o.slot), can = S.gems >= o.price; return `<div class="card bmoffer"><div class="bmcat">${catEl(o.idx, 64, {})}</div><div class="grow"><div class="t1" style="font-size:16px">${ITEMS[o.idx][1]}</div><div class="rar${o.rar}" style="font-size:12px;font-weight:700">${RARS[o.rar][0]}</div><div class="t2" style="margin:2px 0 0;font-size:12px">${got ? "Продано" : "Цена 💎 " + o.price}</div></div>${got ? `<div class="bmsold">✓</div>` : btn("Купить", "bmbuy", `data-s="${o.slot}"`, can ? "" : "dis")}</div>`; }).join("");
  h += `<div class="t2" style="text-align:center;margin:12px;font-size:12px">Обновление через <b id="bmleft">${fmtT2(B.left - Math.floor((Date.now() - B.at) / 1000))}</b>. Платить надо кристаллами.</div>${bcCase()}</div>`;
  return h;
};
const fmtT2 = s => { s = Math.max(0, s); return Math.floor(s / 3600) + ":" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
async function bmLoad() {
  const r = await api("bm_info", {}); if (!r || r.error) return; cz.bm = {day: r.day, left: r.left, at: Date.now(), bought: r.bought, offers: bmOffers(r.day)};
  if (tab === 6 && cz.sub === 5 && !cz.busy) render();
}
const _czgo3 = A.czgo;
A.czgo = function (e) { if (+e.dataset.k === 5) { cz.sub = 5; cz.bm = null; render(); bmLoad(); return; } return _czgo3.apply(this, arguments); };
A.bmdive = async function () {
  if (cz.busy) return; cz.busy = true; try { hap("tick"); } catch (x) {}
  const app = document.getElementById("app"), ov = document.createElement("div"); ov.className = "bmov"; document.body.appendChild(ov);
  void ov.offsetWidth; app.classList.add("bmup"); ov.classList.add("on"); await sleep(1350);
  cz.sub = 5; cz.bm = null; cz.bmFx = true; setTimeout(() => { cz.bmFx = false; }, 2600); document.body.classList.add("bmdark"); app.classList.remove("bmup"); cz.busy = false; render(); bmLoad();
  const v = document.getElementById("view"); v.scrollTop = 0; app.classList.add("bmin"); await sleep(60); ov.classList.add("off"); await sleep(1000); ov.remove(); app.classList.remove("bmin");
};
const _r7 = render;
render = function () { _r7(); document.body.classList.toggle("bmdark", tab === 6 && cz.sub === 5); };
A.bmbuy = async function (e) {
  if (cz.busy || !cz.bm) return; const o = cz.bm.offers[+e.dataset.s]; if (!o || cz.bm.bought.includes(o.slot)) return;
  if (S.gems < o.price) return toast("Не хватает кристаллов");
  cz.busy = true; const r = await api("bm_buy", {slot: o.slot}); cz.busy = false; if (!r || r.error) { toast((r && r.error) || "Нет связи"); return bmLoad(); }
  S.gems -= o.price; const k = grant(o.idx, false); cz.bm.bought.push(o.slot); mark(); save(true); try { afterCraft(o.idx); } catch (x) {} showResult("gem", [o.idx, k], "Чёрный рынок"); render();
};
setInterval(() => { const e = document.getElementById("bmleft"); if (e && cz.bm) { const l = cz.bm.left - Math.floor((Date.now() - cz.bm.at) / 1000); e.textContent = fmtT2(l); if (l <= 0) bmLoad(); } }, 1000);

A.admmaint = async function () {
  const on = !maintA; if (on && !maintArm) { maintArm = true; toast("Нажми ещё раз: игра закроется для ВСЕХ игроков"); setTimeout(() => { maintArm = false; }, 4000); return; } maintArm = false;
  const r = await api("adm_maint", {on, text: KEEP.mt || ""}); if (!r || r.error) return toast((r && r.error) || "Нет связи");
  maintA = r.on ? r.text : null; toast(r.on ? "Игра закрыта для игроков" : "Игра открыта"); render();
};

A.ucrar = async function (e) {
  const i = +e.dataset.i, it = ITEMS[i]; if (!it || !it[5]) return;
  const r = await api("uc_setrar", {id: it[5], rar: +e.dataset.v}); if (!r || r.error) return toast((r && r.error) || "Нет связи");
  toast("Редкость изменена: " + RARS[+e.dataset.v][0]); closeModal(); await loadUcats(); render();
};
let ucDelArm = -1;
A.ucdel = async function (e) {
  const i = +e.dataset.i, it = ITEMS[i]; if (!it || !it[5]) return;
  if (ucDelArm !== i) { ucDelArm = i; e.currentTarget && 0; e.target.textContent = "ТОЧНО удалить? Нажми ещё раз"; setTimeout(() => { if (ucDelArm === i) ucDelArm = -1; }, 5000); return; }
  ucDelArm = -1; const r = await api("uc_del", {id: it[5]}); if (!r || r.error) return toast((r && r.error) || "Нет связи");
  toast("Кот удалён из игры"); closeModal(); await loadUcats(); render();
};


// ===== Кости-блеф (дуэль) =====
const DCPH = ["Я не блефую… наверное", "Не верю ни одному твоему слову", "Ставлю душу своей матери!", "Ну давай, удиви меня", "У меня тут три шестёрки, зуб даю", "Ты точно это видел?", "Ох, повезло тебе!", "Реванш?", "Красиво сыграл", "Арбуз всё видит"];
const DPIPS = [[], [5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]];
const dieH = (n, cls) => `<div class="dcd ${cls || ""}">${n ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<i${DPIPS[n].includes(i) ? ' class="p"' : ""}></i>`).join("") : '<b>?</b>'}</div>`;
const dcbub = (m, cls) => m && (Date.now() - m.at) < 6000 ? `<div class="p2bub ${cls}" data-n="${m.n}">${esc(DCPH[m.code] || "")}</div>` : "";
function dcNext(cur) { return cur ? (cur[1] < 6 ? [cur[0], cur[1] + 1] : [Math.min(10, cur[0] + 1), 1]) : [2, 3]; }
const dcValid = (q, f, cur) => q >= 1 && q <= 10 && f >= 1 && f <= 6 && (!cur || q > cur[0] || (q === cur[0] && f > cur[1]));
const _tCasD = tCasino;
tCasino = function () {
  if (cz.sub !== 6 && cz.sub !== 7 && cz.sub !== 8) return _tCasD();
  const act7 = cz.sub === 7 && (!cz.dc || cz.dc.status === "wait" || cz.dc.status === "play");
  const back = act7 ? "" : `<button class="btn t bkb" data-a="czgo" data-k="${cz.sub === 7 ? (cz.dc && cz.dc.solo ? 8 : 6) : 0}" >← ${cz.sub === 7 ? (cz.dc && cz.dc.solo ? "Назад" : "К столикам") : "Казино"}</button>`;
  const bal = `<div class="card" style="padding:10px 16px"><span class="t2 grow" style="margin:0">Баланс</span><b id="czbal" style="font-size:18px">${fmt(S.pts)}</b></div>`;
  if (cz.sub === 8) return back + bal + `<div class="card col"><div class="t1" style="color:var(--pri)">Кости-блеф · в одиночку</div><div class="t2" style="font-size:12px;margin:0">Играешь против Арбуза-бота. У каждого по 5 спрятанных кубиков. Заявляй «не меньше N кубиков с цифрой X» среди всех 10 кубиков, каждая следующая заявка выше. Не веришь, жми «Не верю!»: кубики откроются, и кто был неправ, проигрывает. Победа даёт выигрыш ×1.9 (5% банка идёт в джекпот).</div>${czBetUi()}<button class="btn" data-a="dcsolo" style="width:100%;height:52px;justify-content:center;font-size:16px">🎲 Играть против арбуза</button></div>`;
  if (cz.sub === 6) {
    const L = cz.dlobby;
    let h = back + bal + `<div class="card col"><div class="t1" style="color:var(--pri)">Создать столик · Кости-блеф</div><div class="t2" style="font-size:12px;margin:0">У каждого по 5 спрятанных кубиков. По очереди заявляйте «не меньше N кубиков с цифрой X» среди всех кубиков на столе (каждая следующая заявка выше). Не веришь, нажми «Не верю!»: кубики откроются, и кто был неправ, проигрывает банк. На ход 45 секунд. 5% банка идёт в джекпот.</div>${czBetUi()}<button class="btn" data-a="dccreate" style="width:100%;height:50px;justify-content:center">Создать и ждать соперника</button></div><div class="sec">Открытые столики${L ? " · " + L.rows.length : ""}</div>`;
    if (!L) return h + `<div class="t2" style="text-align:center;margin:20px">Загружаю…</div>`;
    return h + (L.rows.length ? L.rows.map(x => `<div class="card"><span style="font-size:24px">🎲</span><div class="grow"><div class="t1" style="font-size:15px">${esc(x.n1)}</div><div class="t2" style="margin:0;font-size:12px">Ставка ${fmt(x.stake)}</div></div>${btn("Сесть", "dcjoin", `data-i="${x.id}" data-s="${x.stake}"`, S.pts >= x.stake ? "" : "dis")}</div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока нет столиков. Создай первый и подожди соперника!</div>`);
  }
  const t = cz.dc; if (!t) return back + `<div class="t2" style="text-align:center;margin:30px">Загружаю столик…</div>`;
  const done = t.status === "done", opp = t.status === "wait" ? "Ждём соперника…" : esc(t.seat === 1 ? t.n2 : t.n1), hit = done ? t.rf : 0;
  const oppRow = [0, 1, 2, 3, 4].map(i => t.status === "wait" ? `<div class="dcd ph"></div>` : done && !cz.dHide ? dieH(t.oppDice[i], t.oppDice[i] === hit ? "hit" : "") : dieH(0, "cup")).join("");
  const myRow = [0, 1, 2, 3, 4].map(i => t.dice ? dieH(t.dice[i], (cz.droll ? "roll " : "") + (done && t.dice[i] === hit ? "hit" : "")) : `<div class="dcd ph"></div>`).join("");
  const cur = t.bid, who = cur ? (t.bseat === t.seat ? "Ты" : esc(t.bseat === 1 ? t.n1 : t.n2)) : "";
  let mid = "", ctl = "";
  if (t.status === "wait") { mid = `<div class="t2" style="text-align:center">Ставка ${fmt(t.stake)}. Как только кто-то сядет, мы тебе сообщим.</div>`; ctl = `<button class="btn o" data-a="dccancel" style="width:100%;justify-content:center;margin-top:10px">Отменить столик</button>`; }
  else if (t.status === "play" || done) {
    mid = cur ? `<div class="dcbid${cz.dnb ? " new" : ""}"><span class="t2" style="margin:0;font-size:11px">ЗАЯВКА · ${who}</span><div class="dcbv"><b>${cur[0]}</b> × ${dieH(cur[1], "s")}</div></div>` : `<div class="dcbid"><span class="t2" style="margin:0">Заявок пока нет. ${t.turn === t.seat ? "Ты начинаешь!" : "Начинает соперник."}</span></div>`;
    if (t.status === "play") {
      if (t.turn === t.seat) {
        const q = cz.dq, f = cz.df, ok = dcValid(q, f, cur);
        ctl = `<div class="dcctl"><div class="dcq"><button class="btn t" data-a="dcq" data-v="-1">−</button><div class="dcqv"><span class="t2" style="margin:0;font-size:11px">СКОЛЬКО</span><b>${q}</b></div><button class="btn t" data-a="dcq" data-v="1">+</button></div><div class="dcf">${[1, 2, 3, 4, 5, 6].map(n => `<button class="dcfb${f === n ? " on" : ""}" data-a="dcf" data-v="${n}">${dieH(n, "s")}</button>`).join("")}</div><button class="btn${ok ? "" : " dis"}" data-a="dcbid" style="width:100%;height:50px;justify-content:center;font-size:16px">Заявить: ${q} × цифра ${f}</button>${cur ? `<button class="btn o" data-a="dccall" style="width:100%;height:46px;justify-content:center;margin-top:8px;color:#ff8a80">Не верю! 🤥</button>` : ""}<div class="t2" style="text-align:center;margin:8px 0 0;font-size:12px">Твой ход, осталось <b id="dct">${t.left}</b> с</div></div>`;
      } else ctl = `<div class="t2" style="text-align:center;margin:14px">Ход соперника… <b id="dct">${t.left}</b> с</div>`;
    } else {
      const w = t.winner === 1, why = t.reason === "time" ? (w ? "Время соперника вышло" : "Твоё время вышло") : `Заявка ${t.rq}×${t.rf}: на столе ${t.cnt}. ${w ? "Соперник ошибся" : "Заявка оказалась верной"}`;
      ctl = `<div id="czres" class="czres ${w ? "win" : "lose"}">${cz.dHide ? "" : (w ? "Победа! " : "Поражение. ") + why + ": " + (w ? "+" + fmt(t.pay - t.stake) : "−" + fmt(t.stake))}</div><button class="btn" data-a="czgo" data-k="${t.solo ? 8 : 6}" style="width:100%;height:54px;justify-content:center;font-size:17px;margin-top:10px">${t.solo ? "Сыграть ещё" : "К столикам"}</button>`;
    }
  } else { mid = ""; ctl = `<div class="t2" style="text-align:center;margin:14px">Столик закрыт.</div><button class="btn" data-a="czgo" data-k="6" style="width:100%;justify-content:center">К столикам</button>`; }
  const hist = t.hist && t.hist.length ? `<div class="dchist">${t.hist.slice().reverse().map(x => `<span>${x[0] === t.seat ? "Ты" : "Он"}: ${x[1]}×${x[2]}</span>`).join("")}</div>` : "";
  const phr = t.status === "wait" ? "" : `<div class="p2ph">${DCPH.map((x, i) => `<button class="p2chip" data-a="dcsay" data-i="${i}">${esc(x)}</button>`).join("")}</div>`;
  return back + bal + `<div class="p2n">${opp}</div>${dcbub(t.oppMsg, "o")}<div class="dcrow${cz.dRv ? " dcrv" : ""}">${oppRow}</div>${mid}${hist}<div class="dcrow">${myRow}</div><div class="p2n" style="color:var(--pri)">Ты · ${esc(me.name)}</div>${dcbub(t.myMsg, "m")}${ctl}${phr}`;
};
const _czgoD = A.czgo;
A.czgo = function (e) {
  if (+e.dataset.k === 8 && !(S.pts < 0)) { if (cz.busy) return; cz.sub = 8; cz.dc = null; cz.dtid = 0; cz.dRv = false; render(); dcLobby(); return; }
  if (+e.dataset.k === 6 && !(S.pts < 0)) { if (cz.busy) return; cz.sub = 6; cz.dc = null; cz.dtid = 0; cz.dlobby = null; render(); dcLobby(); return; }
  return _czgoD.apply(this, arguments);
};
async function dcLobby() {
  const r = await api("dc_list", {}); if (!r || r.error) return; cz.dlobby = r;
  for (const id of r.claims || []) { const c = await api("dc_claim", {id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); save(true); toast("Кости: +" + fmt(c.amount)); } }
  if (r.mine && (cz.sub === 6 || cz.sub === 8) && !cz.dtid) { cz.dtid = r.mine; cz.sub = 7; cz.dc = null; cz.dfin = 0; cz.dshown = 0; render(); dcPoll(); return; }
  if (cz.sub === 6 && !cz.busy) render();
}
A.dccreate = async function () {
  if (cz.busy) return; const bet = czBet(); if (S.pts < bet || bet < 100) return toast("Не хватает монет");
  cz.busy = true; S.pts -= bet; mark(); czUpd(); const r = await api("dc_create", {stake: bet}); cz.busy = false;
  if (!r || r.error) { S.pts += bet; mark(); czUpd(); return toast((r && r.error) || "Нет связи"); }
  cz.dtid = r.id; cz.sub = 7; cz.dc = null; cz.dfin = 0; cz.dshown = 0; render(); dcPoll();
};
A.dcjoin = async function (e) {
  if (cz.busy) return; const id = +e.dataset.i, stake = +e.dataset.s; if (S.pts < stake) return toast("Не хватает монет");
  cz.busy = true; const r = await api("dc_join", {id}); cz.busy = false;
  if (!r || r.error) { toast((r && r.error) || "Нет связи"); dcLobby(); return; }
  S.pts -= r.stake; mark(); cz.dtid = id; cz.sub = 7; cz.dc = null; cz.dfin = 0; cz.dshown = 0; render(); dcPoll();
};
A.dcsolo = async function () {
  if (cz.busy) return; const bet = czBet(); if (S.pts < bet || bet < 100) return toast("Не хватает монет");
  cz.busy = true; S.pts -= bet; mark(); czUpd(); const r = await api("dc_solo", {stake: bet}); cz.busy = false;
  if (!r || r.error) { S.pts += bet; mark(); czUpd(); toast((r && r.error) || "Нет связи"); if (r && r.error) dcLobby(); return; }
  cz.dtid = r.id; cz.sub = 7; cz.dc = null; cz.dfin = 0; cz.dshown = 0; cz.dRv = false; render(); dcPoll();
};
A.dccancel = async function () { const r = await api("dc_cancel", {id: cz.dtid}); if (r && r.error) return toast(r.error); dcPoll(); };
A.dcq = function (e) { const t = cz.dc; if (!t) return; cz.dq = Math.max(1, Math.min(10, cz.dq + +e.dataset.v)); render(); };
A.dcf = function (e) { cz.df = +e.dataset.v; render(); };
A.dcbid = async function () {
  const t = cz.dc; if (!t || t.turn !== t.seat || cz.dsend) return; if (!dcValid(cz.dq, cz.df, t.bid)) return toast("Заявка должна быть выше предыдущей");
  cz.dsend = 1; const r = await api("dc_bid", {id: cz.dtid, q: cz.dq, f: cz.df}); cz.dsend = 0;
  if (!r || r.error) { toast((r && r.error) || "Нет связи"); dcPoll(); return; } try { hap("tick"); tone(660, 70, .05, "triangle"); } catch (x) {}
  if (r.solo && cz.dc) { const q = cz.dq, f = cz.df; cz.dc = Object.assign({}, cz.dc, {turn: 2, bid: [q, f], bseat: cz.dc.seat, hist: (cz.dc.hist || []).concat([[cz.dc.seat, q, f]]), left: 45}); cz.dsig = ""; render(); await sleep(700 + Math.random() * 700); }
  await dcApply(r);
};
A.dccall = async function () {
  const t = cz.dc; if (!t || t.turn !== t.seat || !t.bid || cz.dsend) return; cz.dsend = 1; const r = await api("dc_call", {id: cz.dtid}); cz.dsend = 0;
  if (!r || r.error) { toast((r && r.error) || "Нет связи"); dcPoll(); return; } await dcApply(r);
};
let dcSayAt = 0;
A.dcsay = async function (e) {
  if (!cz.dtid || Date.now() - dcSayAt < 2000) return; dcSayAt = Date.now(); const code = +e.dataset.i;
  if (cz.dc) { cz.dc.myMsg = {code, n: ((cz.dc.myMsg && cz.dc.myMsg.n) || 0) + 1, at: Date.now()}; render(); }
  const r = await api("dc_say", {id: cz.dtid, code}); if (r && r.error) toast(r.error); else setTimeout(() => { if (cz.sub === 7) render(); }, 6100);
};
let dcBusy = false;
async function dcPoll() {
  if (dcBusy || cz.sub !== 7 || !cz.dtid) return; dcBusy = true;
  try { const r = await api("dc_state", {id: cz.dtid}); if (r && r.error) { toast(r.error); cz.dtid = 0; cz.sub = 6; render(); dcLobby(); } else if (r) await dcApply(r); } catch (e) {}
  dcBusy = false;
}
async function dcApply(r) {
  for (const k of ["oppMsg", "myMsg"]) if (r[k]) { r[k].at = Date.now() - r[k].ago * 1000; if (r[k].ago < 6) setTimeout(() => { if (cz.sub === 7) render(); }, 6100 - r[k].ago * 1000); }
  const prev = cz.dc, sig = [r.status, r.turn, r.bid ? r.bid.join("-") : "", (r.hist || []).length, r.winner, r.oppMsg ? r.oppMsg.n : 0, r.myMsg ? r.myMsg.n : 0].join("|"); cz.dc = r;
  if (sig === cz.dsig) { const e = document.getElementById("dct"); if (e) e.textContent = r.left; return; } cz.dsig = sig;
  if (r.status === "play") {
    const nx = dcNext(r.bid); if (!prev || prev.turn !== r.turn || (prev.bid && prev.bid.join() !== (r.bid || []).join()) || !prev.bid !== !r.bid || cz.dq === undefined) { cz.dq = nx[0]; cz.df = nx[1]; }
    if (prev && prev.hist && r.hist.length > prev.hist.length && r.hist[r.hist.length - 1][0] !== r.seat) { cz.dnb = true; setTimeout(() => { cz.dnb = false; }, 800); try { tone(520, 90, .06, "triangle"); setTimeout(() => tone(700, 110, .06, "triangle"), 90); hap("light"); } catch (x) {} }
    if (!cz.dshown) { cz.dshown = 1; cz.droll = true; try { hap("medium"); dcRattle(); } catch (x) {} setTimeout(() => { cz.droll = false; if (cz.sub === 7) render(); }, 800); }
  }
  if (r.status === "done" && !cz.dfin) {
    cz.dfin = 1; cz.dHide = true; render(); dcCallFx(r); await sleep(1400); cz.dHide = false; cz.dRv = true; render(); await dcRevealFx(r);
    const c = await api("dc_claim", {id: r.id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); if (c.amount > r.stake) save(true); czUpd(); }
    if (r.winner === 1) { try { fxConfetti(90); jingle(2); hap("ok"); } catch (x) {} }
    return;
  }
  if (r.status === "cancel") { if (!r.claimed) { const c = await api("dc_claim", {id: r.id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); toast("Ставка возвращена: +" + fmt(c.amount)); } } cz.dtid = 0; cz.sub = 6; cz.dc = null; render(); dcLobby(); return; }
  render();
}
setInterval(() => { if (tab === 6 && !document.hidden && cz.sub === 7) dcPoll(); }, 1500);
setInterval(() => { if (tab === 6 && !document.hidden && cz.sub === 6 && !cz.busy) dcLobby(); }, 3500);
for (const k of ["dccreate", "dcjoin", "dcsolo"]) { const f = A[k]; A[k] = function () { if (S.pts < 0) return kickOut(); return f.apply(this, arguments); }; }

const _czgoG = A.czgo;
A.czgo = function (e) {
  const k = +e.dataset.k, a4 = cz.sub === 4 && (!cz.t || cz.t.status === "wait" || cz.t.status === "play"), a7 = cz.sub === 7 && (!cz.dc || cz.dc.status === "wait" || cz.dc.status === "play");
  if ((a4 && k !== 4) || (a7 && k !== 7)) return toast("Сначала закрой свой столик");
  return _czgoG.apply(this, arguments);
};


// ---------- 6.0.0: интерфейс
IC.menu = '<path d="M4 7h16M4 12h16M4 17h16"/>'; IC.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'; IC.moon = '<path d="M20 14.5A8 8 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>';
const _stL = setTheme;
setTheme = function (i) {
  _stL(i); if (!LS("lt", 0)) { document.documentElement.style.colorScheme = "dark"; return; }
  const h = THEMES[i][1] === null ? 28 : THEMES[i][1], r = document.documentElement.style;
  const m = {"--surf": hsv(h, .05, .98), "--sc": hsv(h, .09, .95), "--sch": hsv(h, .14, .90), "--pri": hsv(h, .82, .56), "--onpri": "#ffffff", "--prc": hsv(h, .30, .96), "--onprc": hsv(h, .9, .22), "--on": hsv(h, .30, .12), "--onv": hsv(h, .22, .30), "--out": hsv(h, .14, .46)};
  m["--g1"] = mix(m["--surf"], m["--pri"], .18); m["--g2"] = mix(m["--surf"], m["--pri"], .06);
  for (const k in m) r.setProperty(k, m[k]); r.colorScheme = "light";
  try { tg && (tg.setHeaderColor(m["--surf"]), tg.setBackgroundColor(m["--surf"])); } catch (e) {}
};
A.ltheme = function () { LSset("lt", LS("lt", 0) ? 0 : 1); setTheme(LS("th", 0)); drwFill(); render(); };
buildNav = function () { $("#nav").innerHTML = NAVT.map(i => NAV[i]).map((n, k) => k === NAVT.length - 1 ? `<button data-a="drw"><span class="pill">${ic("menu", 24)}</span>Меню</button>` : `<button data-a="tab" data-i="${NAVT[k]}"><span class="pill">${ic(n[1], 24)}</span>${n[0]}</button>`).join(""); };
buildNav();
// боковая панель
let drwEl = null;
function drwFill() {
  if (!drwEl) return; const u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {}, lt = LS("lt", 0);
  const av = u.photo_url ? `<img src="${esc(u.photo_url)}" style="width:100%;height:100%;object-fit:cover" onerror="this.remove()">` : esc((me.name || "?").trim().charAt(0).toUpperCase());
  const it = (icon, label, k) => `<button class="dri" data-a="drwgo" data-k="${k}">${ic(icon, 26)}<span>${label}</span></button>`;
  drwEl.querySelector(".drp").innerHTML = `<div class="drh"><div class="dra">${av}</div><button class="drt" data-a="ltheme" aria-label="Тема">${ic(lt ? "moon" : "sun", 26)}</button></div>
    <div class="drn">${nm(me.name, myBadges)}</div><div class="dru">${u.username ? "@" + esc(u.username) : "ID " + me.id}</div>
    <div class="drl"><button class="dri" data-a="dlyopen">${ic("box", 26)}<span>Ежедневная награда</span>${DLY && DLY.can ? '<i class="dtd"></i>' : ""}</button>${it("podium", "Сообщество", "com")}${it("cube", "Мастерская", "ws")}<div class="drd"></div>${it("tune", "Настройки", "set")}${it("check", "Информация", "info")}${isAdm ? it("crown", "Админка", "adm") : ""}</div>
    ${isApp() ? "" : `<button class="adc" data-a="adweb"><div class="adm"></div><div><b>Скачай приложение</b><span>Играй без Telegram, на весь экран</span></div></button>`}
    <div class="drv">MDMelonClicker v${CHANGES[0][0]}</div>`;
}
function drwOpen(on) {
  if (!drwEl) { drwEl = document.createElement("div"); drwEl.className = "drw"; drwEl.innerHTML = `<div class="drs" data-a="drw"></div><div class="drp"></div>`; document.body.appendChild(drwEl); let sx = 0; drwEl.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, {passive: true}); drwEl.addEventListener("touchend", e => { if (e.changedTouches[0].clientX - sx > 60) drwOpen(false); }, {passive: true}); }
  if (on) drwFill(); void drwEl.offsetWidth; drwEl.classList.toggle("o", on); document.body.classList.toggle("drwo", on); hap("light");
}
const isApp = () => { try { return matchMedia("(display-mode: standalone)").matches || !!navigator.standalone || (document.referrer || "").startsWith("android-app://"); } catch (e) { return false; } };
A.adweb = function () { const u = location.origin + "/download.html"; drwOpen(false); try { if (tg && tg.openLink) tg.openLink(u); else window.open(u, "_blank") || (location.href = u); } catch (e) { location.href = u; } };
A.drw = function () { drwOpen(!(drwEl && drwEl.classList.contains("o"))); };
A.drwgo = function (e) { drwOpen(false); A.mnu(e); };
function navBackSync() {
  const nv = $("#nav"), vw = $("#view"), has = !!vw.querySelector(".bkb"), cur = nv.querySelector(".nbk");
  if (has && !cur) nv.insertAdjacentHTML("afterbegin", `<button class="nbk" data-a="navback"><span class="pill"><span style="display:flex;transform:rotate(180deg)">${ic("arrow", 24)}</span></span>Назад</button>`);
  else if (!has && cur) cur.remove();
  nv.classList.toggle("bk", has);
}
A.navback = function () { const b = $("#view .bkb"); if (b) b.click(); };
const _setNavB = setNav; setNav = function () { const c = $("#nav .nbk"); if (c) c.remove(); _setNavB(); navBackSync(); };
(function () { const vw = $("#view"); new MutationObserver(() => { const all = vw.querySelectorAll(".bkb"); for (let k = 1; k < all.length; k++) all[k].remove(); navBackSync(); }).observe(vw, {childList: true, subtree: true}); })();

// ---------- налог 2 уровня (от 1 Qa)
function taxTick() {
  if (!S || $("#load")) return;
  if (S.pts < TAX2_AT) { if (S.tx2) { S.tx2 = 0; mark(); } return; }
  if (!S.tx2) { S.tx2 = now(); mark(); return; }
  let k = Math.min(48, Math.floor((now() - S.tx2) / 3600)); if (k < 1) return;
  S.tx2 += k * 3600; let burned = 0;
  for (; k > 0 && S.pts >= TAX2_AT; k--) { const b = S.pts * taxHr(S.pts); S.pts -= b; burned += b; }
  if (S.pts < TAX2_AT) S.tx2 = 0;
  S.burnT = (S.burnT || 0) + burned; mark(); toast("🏛 Часовой налог: −" + fmt(burned)); try { hap("heavy"); } catch (e) {}
}
setInterval(taxTick, 20000); setTimeout(taxTick, 4000);

// ---------- 6.4.0: сочные эффекты казино
function fxCoins(n) {
  if (!fxOn()) return; const cs = ["#ffd54f", "#ffca28", "#ffb300", "#fff176"]; n = Math.min(n, 90);
  for (let i = 0; i < n; i++) fxAdd({k: "c", sh: "o", col: cs[rint(0, 3)], sz: rint(12, 22), x: rnd(0, innerWidth), y: -16, dx: rint(-40, 40), dy: (innerHeight + 40) * rnd(.7, 1), d: rnd(1.1, 2), rot: rint(-300, 300), ph: rnd(0, 6.28)}, i * 14);
}
function ccFlash(col) { const d = document.createElement("div"); d.className = "ccf"; d.style.setProperty("--cc", col); document.body.appendChild(d); setTimeout(() => d.remove(), 520); }
function ccBanner(text, col, sub, ms) { const d = document.createElement("div"); d.className = "ccb"; d.style.setProperty("--cc", col); d.style.animationDuration = (ms || 1600) + "ms"; d.innerHTML = `<b>${esc(text)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}`; document.body.appendChild(d); setTimeout(() => d.remove(), (ms || 1600) + 100); }
function ccShake() { const v = $("#view"); if (!v) return; v.classList.remove("shk"); void v.offsetWidth; v.classList.add("shk"); setTimeout(() => v.classList.remove("shk"), 320); }
const _pkF = pkFly; pkFly = function (i, delay, row) { _pkF(i, delay, row); setTimeout(() => { try { tone(300 + i * 35, 60, .05, "triangle"); } catch (e) {} }, (delay || 0) + 80); };
pkReveal = async function (idxs) {
  const slots = document.querySelectorAll("#pkrow .pks"); let n = 0;
  for (const i of idxs) { const c = slots[i] && slots[i].querySelector(".pk3"); if (c) { c.classList.remove("back"); try { tone(420 + n * 70, 70, .05, "sine"); tickHap(); } catch (e) {} n++; } await sleep(130); }
  await sleep(450);
};
const _czh = A.czhold; A.czhold = function (e) { _czh.apply(this, arguments); try { tone(e.classList.contains("h") ? 760 : 480, 60, .05, "square"); } catch (x) {} };
function pkHot(h) {
  const cnt = {}; h.forEach(c => { const k = c % 13; cnt[k] = (cnt[k] || 0) + 1; }); const nm = pkEvalC(h);
  if (["Роял-флеш", "Стрит-флеш", "Фулл-хаус", "Флеш", "Стрит"].includes(nm)) return [0, 1, 2, 3, 4];
  return h.map((c, i) => cnt[c % 13] >= 2 ? i : -1).filter(i => i >= 0);
}
function pkFinish(r, prof) {
  const slots = [...document.querySelectorAll("#pkrow .pks")], m = r.mult; cz.pkStreak = m >= 2 ? (cz.pkStreak || 0) + 1 : 0;
  const rc = slots.length ? slots[2].getBoundingClientRect() : null, cx = rc ? rc.x + rc.width / 2 : innerWidth / 2, cy = rc ? rc.y + rc.height / 2 : 300;
  if (m >= 2) {
    pkHot(cz.hand).forEach(i => slots[i] && slots[i].classList.add("hot")); const col = m >= 9 ? "#ffd54f" : m >= 6 ? "#ffb74d" : "#69f0ae";
    ccBanner(r.name.toUpperCase() + "!", col, "+" + fmt(prof) + (cz.pkStreak > 1 ? " · серия ×" + cz.pkStreak + " 🔥" : ""), 1800); ccFlash(col);
    fxCoins(14 + m * 7); fxConfetti(m >= 9 ? 120 : m >= 6 ? 70 : 30); fxRing(cx, cy, col, 280, 700); fxBurst(cx, cy, 22, [col, "#fff", "#ffd54f"], 150); jingle(m >= 6 ? 3 : 2); hap("ok"); if (m >= 6) ccShake();
  } else if (m === 1) { try { tone(520, 130, .05, "triangle"); setTimeout(() => tone(660, 160, .05, "triangle"), 110); } catch (e) {} }
  else { slots.forEach(s => s.classList.add("lost")); try { tone(220, 260, .07, "sawtooth"); setTimeout(() => tone(150, 340, .07, "sawtooth"), 170); hap("heavy"); } catch (e) {} ccShake(); }
}
function dcRattle() { for (let i = 0; i < 7; i++) setTimeout(() => { try { tone(180 + Math.random() * 220, 40, .04, "square"); } catch (e) {} }, i * 110 + Math.random() * 50); }
function dcCallFx(r) {
  const hist = r.hist || [], last = hist.length ? hist[hist.length - 1] : null;
  if (r.reason === "time") { ccBanner("ВРЕМЯ ВЫШЛО", "#ff8a50", "", 1300); return; }
  const mine = last && last[0] !== r.seat; ccBanner(mine ? "НЕ ВЕРЮ!" : (r.solo ? "АРБУЗ: НЕ ВЕРЮ!" : "СОПЕРНИК: НЕ ВЕРЮ!"), "#ff5252", last ? "Заявка " + last[1] + " × " + last[2] : "", 1400); ccFlash("#ff1744"); ccShake();
  try { tone(300, 140, .08, "sawtooth"); setTimeout(() => tone(200, 200, .08, "sawtooth"), 130); hap("heavy"); } catch (e) {}
}
async function dcRevealFx(r) {
  const row = document.querySelector(".dcrow");
  if (row) { const ds = [...row.querySelectorAll(".dcd")]; for (let i = 0; i < ds.length; i++) { await sleep(170); try { tone(380 + i * 60, 60, .05, "sine"); } catch (e) {} if (ds[i].classList.contains("hit")) { const b = ds[i].getBoundingClientRect(); try { fxBurst(b.x + b.width / 2, b.y + b.height / 2, 8, ["#ffd54f", "#fff"], 70); hap("tick"); } catch (e) {} } } }
  await sleep(500);
}
function dcEndFx(r) {
  const prof = (r.pay || 0) - r.stake;
  if (r.winner === 1) { ccBanner("ПОБЕДА!", "#69f0ae", "+" + fmt(prof), 1800); ccFlash("#69f0ae"); fxCoins(60); fxConfetti(70); jingle(2); hap("ok"); }
  else { ccBanner("ПОРАЖЕНИЕ", "#ff6e6e", "−" + fmt(r.stake), 1500); ccShake(); try { tone(220, 260, .07, "sawtooth"); setTimeout(() => tone(150, 340, .07, "sawtooth"), 170); hap("heavy"); } catch (e) {} }
}
// ---------- 6.5.0: ещё больше эффектов в покере и костях
const _rF = render;
render = function () {
  _rF(); const b = document.body.classList;
  b.toggle("dctbl", tab === 6 && cz.sub === 7); b.toggle("pktbl", tab === 6 && (cz.sub === 2 || cz.sub === 4));
  if (tab !== 6) { const e = document.getElementById("ccst"); if (e) e.remove(); }
};
function ccStreak(n) {
  let e = document.getElementById("ccst");
  if (!n || n < 2) { if (e) e.remove(); return; }
  if (!e) { e = document.createElement("div"); e.id = "ccst"; e.className = "ccst"; document.body.appendChild(e); }
  e.textContent = "🔥 серия ×" + n; e.classList.remove("pop"); void e.offsetWidth; e.classList.add("pop");
}
function ccDim(ms) { const d = document.createElement("div"); d.className = "ccd"; d.style.animationDuration = ms + "ms"; document.body.appendChild(d); setTimeout(() => d.remove(), ms + 50); }
function ccCount(val) {
  const s = [...document.querySelectorAll(".ccb span")].pop(); if (!s || !(val > 0)) return;
  const m = s.textContent.match(/^([+−])(\S+)([^]*)$/); if (!m) return; const t0 = performance.now(), D = 900;
  const st = () => { const k = Math.min(1, (performance.now() - t0) / D), e = 1 - Math.pow(1 - k, 3); s.textContent = m[1] + fmt(val * e) + m[3]; if (k < 1 && s.isConnected) requestAnimationFrame(st); };
  st();
}
const _pkFin = pkFinish;
pkFinish = function (r, prof) {
  _pkFin(r, prof); ccStreak(cz.pkStreak);
  if (r.mult >= 2) ccCount(prof);
  document.querySelectorAll(".pkpay div").forEach(d => { const s = d.querySelector("span"); if (s && s.textContent === r.name) d.classList.add("hit"); });
};
const _pkRv = pkReveal;
pkReveal = async function (idxs) {
  if (idxs.length <= 2) { ccDim(1200); for (let k = 0; k < 2; k++) { try { tone(95, 120, .1, "sine"); hap("tick"); } catch (e) {} await sleep(250); try { tone(80, 120, .09, "sine"); } catch (e) {} await sleep(320); } }
  return _pkRv(idxs);
};
const _dEnd = dcEndFx;
dcEndFx = function (r) {
  _dEnd(r); cz.dcStreak = r.winner === 1 ? (cz.dcStreak || 0) + 1 : 0; ccStreak(cz.dcStreak);
  if (r.winner === 1) { ccCount((r.pay || 0) - r.stake); setTimeout(() => fxCoins(40), 500); }
};
const BOT_BID = ["Ставлю арбуз на это 🍉", "Хм… ну ладно", "Дрожишь?", "Это точно правда!", "Корочка треснет, если я вру", "Попробуй не поверить", "Я чую блеф…"];
const BOT_WIN = ["Арбуз сладок! 😎", "Легко и сочно", "Ещё партийку?"];
const BOT_LOSE = ["Ну ты и хитрый…", "Я просто дал тебе выиграть 🍉", "Реванш!"];
const botPick = a => a[rint(0, a.length - 1)];
function botSay(txt) { cz.dBot = {txt, at: Date.now()}; setTimeout(() => { if (cz.sub === 7) render(); }, 3700); }
const _dA = dcApply;
dcApply = async function (r) {
  r._at = Date.now(); const prev = cz.dc;
  if (r.solo && r.status === "play" && prev && prev.hist && r.hist && r.hist.length > prev.hist.length && r.hist[r.hist.length - 1][0] !== r.seat) botSay(botPick(BOT_BID));
  if (r.solo && r.status === "done" && !cz.dfin) botSay(r.winner === 1 ? botPick(BOT_LOSE) : botPick(BOT_WIN));
  if (prev && prev.status === "play" && r.status === "play" && prev.turn !== r.turn && r.turn === r.seat && !r.solo) { ccBanner("ТВОЙ ХОД", "#ffd54f", "", 900); try { tone(740, 90, .06, "triangle"); hap("tick"); } catch (e) {} }
  return _dA(r);
};
const C5 = [1, 5, 10, 10, 5, 1];
const _tC8 = tCasino;
tCasino = function () {
  let h = _tC8(); if (cz.sub !== 7 || !cz.dc) return h; const t = cz.dc;
  if (t.status === "play" && t.dice) {
    const mine = f => t.dice.filter(x => x === f).length;
    const pr = (q, f) => { const need = q - mine(f); if (need <= 0) return 1; let s = 0; for (let k = need; k <= 5; k++) s += C5[k] * Math.pow(1 / 6, k) * Math.pow(5 / 6, 5 - k); return s; };
    const col = p => `hsl(${Math.round(p * 120)},80%,55%)`;
    const g = (lab, p) => `<div class="dcg"><span>${lab}</span><div class="dcgb"><i style="width:${Math.round(p * 100)}%;background:${col(p)}"></i></div><b>${Math.round(p * 100)}%</b></div>`;
    let gs = "";
    if (t.bid) gs += g("Заявка верна", pr(t.bid[0], t.bid[1]));
    if (t.turn === t.seat && cz.dq && cz.df) gs += g("Твоя заявка", pr(cz.dq, cz.df));
    const left = Math.max(0, (t.left || 0) - (Date.now() - (t._at || Date.now())) / 1000);
    gs += `<div class="dctm${left < 10 ? " urg" : ""}"><i style="width:${Math.min(100, left / 45 * 100)}%"></i></div>`;
    const k = h.lastIndexOf('<div class="dcrow'); if (k > 0) h = h.slice(0, k) + gs + h.slice(k);
  }
  if (t.solo && cz.dBot && Date.now() - cz.dBot.at < 3600) h = h.replace(/(<div class="p2n">[^]*?<\/div>)/, `$1<div class="p2bub o" data-n="${cz.dBot.at}">${esc(cz.dBot.txt)}</div>`);
  return h;
};
setInterval(() => {
  if (tab !== 6 || cz.sub !== 7 || !cz.dc || cz.dc.status !== "play" || document.hidden) return;
  const t = cz.dc, left = Math.max(0, t.left - (Date.now() - (t._at || Date.now())) / 1000), bar = document.querySelector(".dctm i");
  if (bar) { bar.style.width = Math.min(100, left / 45 * 100) + "%"; bar.parentNode.classList.toggle("urg", left < 10); }
  if (t.turn === t.seat && left < 8) { const s = Math.ceil(left); if (cz._tk !== s) { cz._tk = s; try { tone(s < 4 ? 900 : 600, 80, .06, "square"); hap("tick"); } catch (e) {} } }
}, 400);

// ---------- звезда перед карточкой редкого выпадения: тёмный фон, растущая звезда, разгон названий редкостей, вспышка
const STAR_MIN = 2;   // с какой редкости (2 = Эпический) показывать звезду
A.rfl = function () { LSset("rfl", LS("rfl", 0) ? 0 : 1); render(); };
function starScene(ov, win, done) {
  const ri = ITEMS[win][2], soft = LS("rfl", 0), col = RC[ri], T = ri >= 5 ? 2600 : ri === 4 ? 2100 : ri === 3 ? 1500 : 900;
  ov.onclick = null; ov.innerHTML = `<div class="ov2t">${ov.dataset.t || ""}</div>`; ov.style.setProperty("--rc", col);
  if (ri >= 3 && !LS("flw", 0)) { LSset("flw", 1); toast("Редкие выпадения со вспышками. Отключить: Настройки → «Меньше вспышек»"); }
  const mk = (cls, html) => { const e = document.createElement("div"); e.className = cls; if (html !== undefined) e.innerHTML = html; ov.appendChild(e); return e; };
  const bg = mk("rsb"), star = mk("rss", ic("sparkle", 260)), cap = ri >= 3 ? mk("rsl", "Ты нашёл…") : null, tz = ri >= 3 ? mk("rst") : null;
  if (star.firstChild) star.firstChild.style.filter = `drop-shadow(0 0 22px ${col})`;
  const t0 = performance.now(); let lastR = -1, dead = false;
  const end = () => { dead = true; ov.classList.remove("rgl"); if (OVL !== ov) return; done(); if (OVL !== ov) return; const fl = document.createElement("div"); fl.className = "rsf"; fl.style.background = soft ? col : "#fff"; fl.style.opacity = soft ? .45 : 1; ov.appendChild(fl); requestAnimationFrame(() => requestAnimationFrame(() => { fl.style.opacity = 0; })); setTimeout(() => fl.remove(), 700); sfx("boom"); };
  const step = now => {
    if (OVL !== ov || dead) return;
    const k = Math.max(0, Math.min(1, (now - t0) / T)), e = k * k * (3 - 2 * k);
    bg.style.opacity = Math.min(1, k * 5); star.style.opacity = Math.min(1, k * 4);
    star.style.transform = `translate(-50%,-50%) scale(${.05 + e * (1.1 + ri * .22)}) rotate(${soft ? 0 : k * 160}deg)`;
    if (cap) cap.style.opacity = k > .12 ? 1 : 0;
    if (tz) { const r = Math.min(ri, Math.floor(Math.pow(Math.min(1, k / .7), 1.35) * (ri + 1))); if (r !== lastR) { lastR = r; tz.textContent = RARS[r][0].toUpperCase(); tz.style.color = RC[r]; tz.classList.add("p"); setTimeout(() => tz.classList.remove("p"), 110); tickHap(); sfx("up", r * 2); } }
    if (!soft && ri >= 5 && k > .6) ov.classList.add("rgl");
    if (k < 1) requestAnimationFrame(safe); else end();
  };
  const safe = now => { try { step(now); } catch (e) { if (!dead) end(); } };
  requestAnimationFrame(safe);
}
const _revealStar = reveal;
reveal = function (ov, wk, againFn, fail) {
  if (fail || !wk || wk[0] === null || wk[1] === "coins" || ov._star || OVL !== ov || !LS("fxc", 1) || ITEMS[wk[0]][2] < STAR_MIN) return _revealStar(ov, wk, againFn, fail);
  ov._star = true; starScene(ov, wk[0], () => _revealStar(ov, wk, againFn, false));
};

/* ===== окно обновления ===== */
(function () { const st = document.createElement("style"); st.textContent = `.updw{animation:updin .35s ease both}.updw .anc{animation:updpop .45s cubic-bezier(.2,1.3,.4,1) both}.updw.out{animation:updout .38s ease forwards;pointer-events:none}.updw.out .anc{animation:updpopout .38s ease forwards}.updp{position:fixed;z-index:200;font-size:26px;pointer-events:none;animation:updpf 1s ease-out forwards}@keyframes updin{from{opacity:0}to{opacity:1}}@keyframes updout{to{opacity:0}}@keyframes updpop{from{transform:scale(.7) translateY(30px);opacity:0}to{transform:none;opacity:1}}@keyframes updpopout{to{transform:scale(.8) translateY(-40px);opacity:0}}@keyframes updpf{0%{transform:translate(0,0) scale(.4);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--dr)) scale(1);opacity:0}}`; document.head.appendChild(st); })();
function showUpd() {
  if (document.querySelector(".updw")) return;
  const c = CHANGES[0];
  const o = document.createElement("div"); o.className = "ann updw";
  o.innerHTML = `<div class="anc" style="padding:0;overflow:hidden;max-height:90vh;display:flex;flex-direction:column"><img src="/update.jpg" alt="" style="width:100%;display:block"><div style="padding:16px 18px 18px;overflow-y:auto"><div class="t1" style="color:var(--pri)">${esc(c[2] || "Обновление")} · v${c[0]}</div><div style="margin:8px 0 16px">${c[1].map(x => `<div style="font-size:14px;margin-top:5px">• ${x}</div>`).join("")}</div><div style="display:flex;justify-content:center">${btn("Круто!", "updx")}</div></div></div>`;
  document.body.appendChild(o);
}
A.updx = function (e) {
  const w = document.querySelector(".updw"); if (!w || w.classList.contains("out")) return;
  const r = e && e.getBoundingClientRect ? e.getBoundingClientRect() : {left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0}, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let k = 0; k < 16; k++) { const p = document.createElement("div"); p.className = "updp"; p.textContent = ["🍉", "✨", "⭐", "🎉"][k % 4]; const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 120; p.style.cssText += `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 60}px;--dr:${Math.round(Math.random() * 360 - 180)}deg`; document.body.appendChild(p); setTimeout(() => p.remove(), 1000); }
  try { hap("ok"); } catch (x) {}
  w.classList.add("out"); setTimeout(() => w.remove(), 400);
};
(function updWatch() {
  const iv = setInterval(() => {
    if (typeof S === "undefined" || !S) return;
    clearInterval(iv);
    const v = CHANGES[0][0], seen = LS("seenver", null);
    if (seen === v) return;
    LSset("seenver", v);
    if (seen === null && !(S.total > 1000)) return;
    setTimeout(() => showUpd(), 1200);
  }, 500);
})();



A.pfed = function () {
  pfSel = (myPf.fav || []).slice(); KEEP.pfb = myPf.bio || "";
  const ks = Object.keys(S.inv).filter(k => ITEMS[k]).sort((a, b) => ITEMS[b][2] - ITEMS[a][2] || a - b);
  closeModal();
  modal(`<div class="t1">Мой профиль</div><div class="t2">О себе (до 80 символов)</div><input data-keep="pfb" maxlength="80" placeholder="Расскажи о себе" value="${esc(KEEP.pfb)}" style="width:100%;margin-bottom:10px"><div class="t2">Витрина: до 3 любимых котов</div><div id="pfg" style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;max-height:240px;overflow-y:auto">${ks.map(k => `<div data-a="pfsel" data-c="${k}" style="cursor:pointer;border-radius:12px;padding:2px;border:2px solid ${pfSel.includes(+k) ? "var(--pri)" : "transparent"}">${catEl(+k, 48, {})}</div>`).join("")}</div>${btn("Сохранить", "pfsv")}`);
};
A.pfsel = function (e) { const k = +e.dataset.c, i = pfSel.indexOf(k); if (i >= 0) pfSel.splice(i, 1); else if (pfSel.length < 3) pfSel.push(k); else return toast("Не больше 3"); e.style.borderColor = pfSel.includes(k) ? "var(--pri)" : "transparent"; };
A.pfsv = async function () { const r = await api("pf_set", {bio: KEEP.pfb || "", fav: pfSel}); if (r.error) return toast(r.error); myPf = {bio: r.bio, fav: r.fav}; closeModal(); toast("Профиль сохранён"); };

/* ===== друзья и кланы ===== */
const soc = {fr: null, cl: null, clan: null, found: null, cs: 0, at: 0, ei: null};
const CL_ICONS = [..."🛡⚔🔥🍉🐱👑🌟🚀💎🦁🐉🌈"], CL_LV = [1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15];
let clNewIcon = "🛡";
async function socLoad() {
  soc.at = Date.now();
  const [a, b] = await Promise.all([api("fr_list", {}), api("clan_list", {})]);
  if (a && !a.error) soc.fr = a;
  if (b && !b.error) { soc.cl = b; soc.clan = await api("clan_info", {}); if (soc.clan && !soc.clan.clan) soc.clan = {clan: null, myreq: soc.clan.myreq || 0, inv: soc.clan.inv || null}; }
  if (tab === 4 && sub >= 3) render();
}
const roleIc = r => r === 2 ? ic("crown", 15, "var(--gold)") : r === 1 ? ic("star", 15, "var(--gold)") : "";
const clIco = (c, sz) => c.img ? `<img src="${c.img}" alt="" style="width:${sz}px;height:${sz}px;border-radius:26%;object-fit:cover;vertical-align:middle;flex:none">` : `<span style="font-size:${Math.round(sz * .85)}px;line-height:1">${esc(c.icon || "🛡")}</span>`;
const clNm = c => c.style && NS_G[c.style] ? `<span style="${nsCss("~" + c.style)}">${esc(c.name)}</span>` : esc(c.name);
let clNewImg = "";
function pickImg(W, H, lim, cb) {
  const f = document.createElement("input"); f.type = "file"; f.accept = "image/*";
  f.onchange = () => {
    const file = f.files && f.files[0]; if (!file) return; const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"), k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
      x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); URL.revokeObjectURL(url);
      let q = .8, d = c.toDataURL("image/jpeg", q); while (d.length > lim && q > .3) { q -= .1; d = c.toDataURL("image/jpeg", q); }
      cb(d);
    };
    img.onerror = () => toast("Не удалось открыть картинку"); img.src = url;
  };
  f.click();
}
const iconPick = (cur, act) => `<div style="display:flex;flex-wrap:wrap;gap:6px">${CL_ICONS.map(x => `<span data-a="${act}" data-i="${x}" style="font-size:22px;padding:4px 7px;border-radius:12px;cursor:pointer;background:${x === cur ? "var(--prc)" : "var(--sch)"}">${x}</span>`).join("")}</div>`;
const rowBtn = (t, a, i, extra) => `<button class="btn o" data-a="${a}" data-i="${i}" ${extra || ""} style="padding:6px 10px;min-height:0;font-size:13px">${t}</button>`;
function tSocial() { return sub === 3 ? tFriends() : tClans(); }
function tFriends() {
  let h = `<div class="card col"><div class="t1">Найти игрока</div><div class="t2" style="margin:0">По имени или по ID (ID виден в профиле)</div><div style="display:flex;gap:8px"><input data-keep="frq" placeholder="Имя или ID" style="flex:1">${btn("Найти", "frfind")}</div></div>`;
  if (soc.found) h += `<div class="sec">Результаты</div>` + (soc.found.length ? soc.found.map(x => `<div class="card">${av(x.name, x.id, 40)}<div class="grow"><div class="t1">${esc(x.name)}</div><div class="t2">${fmt(x.total)}</div></div>${rowBtn(ic("userplus", 20), "frad", x.id)}</div>`).join("") : `<div class="t2" style="text-align:center;margin:12px">Никого не нашли</div>`);
  if (!soc.fr) return h + `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
  if (soc.fr.inc.length) { h += `<div class="sec">Заявки в друзья</div>`; soc.fr.inc.forEach(x => h += `<div class="card">${av(x.name, x.id, 40)}<div class="grow"><div class="t1">${esc(x.name)}</div></div>${rowBtn("Принять", "frok", x.id)}${rowBtn("✕", "frdl", x.id)}</div>`); }
  const fr = soc.fr.friends.slice().sort((a, b) => (b.online - a.online) || b.seen - a.seen);
  h += `<div class="sec">Друзья · ${fr.length} (в игре ${fr.filter(x => x.online).length})</div>`;
  h += fr.length ? fr.map(x => `<div class="card">${av(x.name, x.id, 40)}<div class="grow"><div class="t1">${nm(x.name, x.badges)}</div><div class="t2" style="color:${x.online ? "var(--good)" : "var(--out)"}">${x.online ? "в игре" : "был(а) " + agoS(x.seen)} · ${fmt(x.cur)}</div></div>${rowBtn(ic("box", 20), "frgp", x.id)}${rowBtn(ic("coin", 20), "frcp", x.id)}</div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока никого. Найди игрока выше или нажми на аватар в топе или чате</div>`;
  return h;
}
const clLv = bank => CL_LV.filter(x => bank >= x).length;
function tClans() {
  if (!soc.cl) return `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
  const ci = soc.clan && soc.clan.clan;
  if (ci) return tMyClan(soc.clan);
  let h = "";
  if (soc.clan && soc.clan.inv) h += `<div class="card col" style="border:1px solid var(--pri)"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("mail", 18)} Приглашение в клан</div><div class="t2" style="margin:0">Тебя зовут в клан <b>${esc(soc.clan.inv.name)}</b></div><div style="display:flex;gap:8px">${btn("Принять", "clinv", 'data-y="1"')}${btn("Отклонить", "clinv", 'data-y="0"', "o")}</div></div>`;
  if (soc.clan && soc.clan.myreq) { const c = soc.cl.rows.find(x => x.id === soc.clan.myreq); h += `<div class="card"><div class="grow"><div class="t1">Заявка отправлена</div><div class="t2">${c ? esc(c.icon + " " + c.name) : "клан"}, ждём ответа главы</div></div>${rowBtn("Отменить", "clunreq", 0)}</div>`; }
  h += `<div class="card col"><div class="t1">Создать клан</div><div class="t2" style="margin:0">Нужно накопить 1 000 000 монет. До 30 участников. Общая казна даёт всем бонус к доходу.</div><div style="display:flex;align-items:center;gap:12px">${clIco({img: clNewImg, icon: "🛡"}, 56)}${btn(ic("image", 16) + (clNewImg ? " Другая картинка" : " Выбрать картинку"), "clnic", "", "o")}</div><input data-keep="cln" maxlength="20" placeholder="Название клана"><div>${btn("Создать", "clnew")}</div></div>`;
  h += `<div class="sec">Таблица кланов</div>` + (soc.cl.rows.length ? soc.cl.rows.map((c, i) => `<div class="card" data-a="clview" data-i="${c.id}"><div class="circ" style="width:38px;height:38px;font-weight:700">${i + 1}</div><div class="grow"><div class="t1">${clIco(c, 24)} ${clNm(c)}${cbdg(c.badges)} · ур. ${c.level}</div><div class="t2">${fmt(c.score)} · ${c.n}/${soc.cl.max}${c.mode ? " · по заявке" : ""}${c.descr ? "<br>" + esc(c.descr) : ""}</div></div>${rowBtn(c.mode ? "Заявка" : "Вступить", "cljoin", c.id, c.n >= soc.cl.max ? "disabled" : 'data-stop="1"')}</div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Кланов пока нет. Создай первый!</div>`);
  return h;
}
function tMyClan(d) {
  const c = d.clan, role = d.myrole, mgr = role >= 1, lv = c.level || 0, bonus = lv, nx = c.next, pct = nx ? Math.min(100, (c.bank - (CL_LV[lv - 1] || 0)) / (nx - (CL_LV[lv - 1] || 0)) * 100) : 100;
  let h = `<div class="card col">${clBanner(c)}<div style="display:flex;gap:12px;align-items:center">${clIco(c, 56)}<div class="grow"><div class="t1" style="font-size:19px;color:var(--pri)">${clNm(c)}${cbdg(c.badges, 18)}</div><div class="t2" style="margin:0">Уровень ${lv} · бонус +${bonus}% к доходу всем участникам</div></div></div>${c.descr ? `<div class="t2" style="margin:0">${esc(c.descr)}</div>` : ""}<div class="t2" style="margin:0">Очки (накопления участников): <b>${fmt(c.score)}</b></div><div class="t2" style="margin:0">Казна: <b>${fmt(c.bank)}</b>${nx ? " / " + fmt(nx) + " до ур. " + (lv + 1) : " · максимальный уровень"}</div><div style="height:8px;border-radius:6px;background:var(--sch);overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#ffb300,#ff7043)"></i></div><div style="display:flex;gap:8px"><input data-keep="cldn" inputmode="numeric" placeholder="Сколько внести в казну" style="flex:1">${btn("Внести", "cldon")}</div></div>`;
  const tabs = [["Участники", 0]]; if (mgr) tabs.push(["Заявки" + (d.reqs.length ? " " + d.reqs.length : ""), 2]); if (role >= 2) tabs.push(["Клан", 3]); tabs.push(["Все кланы", 4]);
  h += ctCard(d);
  h += `<div class="seg">${tabs.map(t => `<button class="${soc.cs === t[1] ? "on" : ""}" data-a="clcs" data-i="${t[1]}">${t[0]}</button>`).join("")}</div>`;
  if (soc.cs === 2 && mgr) return h + (d.reqs.length ? d.reqs.map(x => `<div class="card">${av(x.name, x.id, 40)}<div class="grow"><div class="t1">${esc(x.name)}</div><div class="t2">${fmt(x.total)}</div></div>${rowBtn(ic("check", 18), "clrq", x.id, 'data-y="1"')}${rowBtn(ic("close", 16), "clrq", x.id, 'data-y="0"')}</div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Заявок нет</div>`);
  if (soc.cs === 4) return h + `<div class="sec">Все кланы</div>` + soc.cl.rows.map((x, i) => `<div class="card" data-a="clview" data-i="${x.id}"><div class="circ" style="width:38px;height:38px;font-weight:700">${i + 1}</div><div class="grow"><div class="t1">${clIco(x, 24)} ${clNm(x)}${cbdg(x.badges)} · ур. ${x.level}</div><div class="t2">${fmt(x.score)} · ${x.n}/${soc.cl.max}${x.id === c.id ? " · твой клан" : ""}</div></div></div>`).join("");
  if (soc.cs === 3 && role >= 2) {
    if (soc.ei === null) { soc.ei = {icon: c.icon || "🛡", mode: c.mode}; KEEP.cld = c.descr || ""; KEEP.cln2 = c.name; }
    const sec = (icn, t, body, hint) => `<div class="card col clset"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic(icn, 18)}${t}</div>${hint ? `<div class="t2" style="margin:-4px 0 0;font-size:12px">${hint}</div>` : ""}${body}</div>`;
    const ghave = id => id === "G0" || (d.owned || []).includes(id) || (id === "GA" && isAdm);
    const bnPrev = c.bnimg ? `<div style="height:84px;border-radius:14px;background:url(${c.bnimg}) center/cover"></div>` : `<div style="height:84px;border-radius:14px;background:var(--sch);display:flex;align-items:center;justify-content:center;color:var(--out);font-size:13px">Заставка не задана</div>`;
    return h + sec("palette", "Внешний вид", `${bnPrev}<div style="display:flex;gap:8px;flex-wrap:wrap">${btn(ic("image", 16) + " Заставка", "clbn", "", "o")}${c.bnimg ? btn(ic("trash", 16), "clbnd", 'title="Убрать"', "o") : ""}</div><div style="display:flex;align-items:center;gap:12px;margin-top:4px">${clIco(c, 56)}<div class="grow"><div class="t2" style="margin:0 0 6px">Картинка клана</div><div style="display:flex;gap:8px">${btn(ic("image", 16) + " Выбрать", "clim", "", "o")}${c.img ? btn(ic("trash", 16), "climd", 'title="Убрать"', "o") : ""}</div></div></div>`, "Заставка и картинка применяются сразу")
      + sec("text", "Название и описание", `<input data-keep="cln2" maxlength="20" placeholder="Название клана" value="${esc(KEEP.cln2 || "")}"><input data-keep="cld" maxlength="120" placeholder="Описание клана" value="${esc(KEEP.cld || "")}"><div class="t2" style="margin:4px 0 0">Вступление</div><div class="seg" style="margin:0"><button class="${soc.ei.mode ? "" : "on"}" data-a="clmd" data-i="0">Свободное</button><button class="${soc.ei.mode ? "on" : ""}" data-a="clmd" data-i="1">По заявкам</button></div><div>${btn(ic("check", 16) + " Сохранить", "clsave")}</div>`)
      + sec("gem", "Градиент названия", `<div class="t2" style="margin:0">У тебя ${S.gems} ${ic("gem", 14)}. Купленное остаётся навсегда.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${["G0"].concat(Object.keys(NS_G)).map(id => { const ow = ghave(id), cur = (c.style || "G0") === id, pr = id === "G0" ? 0 : NS_G[id][2]; return `<div data-a="clst" data-i="${id}" style="padding:10px 6px;border-radius:14px;background:var(--sch);text-align:center;cursor:pointer;border:2px solid ${cur ? "var(--pri)" : "transparent"}"><div style="font-size:16px;${id === "G0" ? "" : nsCss("~" + id)}">${esc(c.name)}</div><div class="t2" style="margin:3px 0 0;font-size:11px;display:flex;align-items:center;justify-content:center;gap:3px">${id === "G0" ? "обычный" : NS_G[id][0]} · ${cur ? "выбран" : ow ? "куплен" : fmt(pr) + ic("gem", 12)}</div></div>`; }).join("")}</div>`)
      + `<div class="card col clset" style="border:1px solid rgba(255,82,82,.35)"><div class="t1" style="display:flex;align-items:center;gap:8px;color:#ff8a80">${ic("ban", 18)}Опасная зона</div><div style="display:flex;gap:8px;flex-wrap:wrap">${btn("Выйти из клана", "clleave", "", "o")}${btn(ic("trash", 16) + " Распустить", "cldis", "", "o")}</div></div>`;
  }
  if (mgr) h += `<div class="card col clset"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("mail", 18)} Пригласить игрока</div><div style="display:flex;gap:8px"><input data-keep="clinvq" placeholder="Имя или ID" style="flex:1">${btn("Позвать", "clinvite", "")}</div></div>`;
  h += `<div class="sec">Участники · ${d.members.length}/${d.max}</div>` + d.members.map(x => {
    const canKick = mgr && x.id !== me.id && x.role < 2 && (role >= 2 || x.role < 1);
    return `<div class="card" data-a="prof" data-i="${x.id}">${av(x.name, x.id, 40)}<div class="grow"><div class="t1">${nm(x.name, x.badges)} ${roleIc(x.role)}</div><div class="t2" style="color:${x.online ? "var(--good)" : "var(--out)"}">${x.online ? "в игре" : "не в сети"} · ${fmt(x.total)}${x.don ? " · вклад " + fmt(x.don) : ""}</div></div>${role >= 2 && x.id !== me.id ? rowBtn((x.role === 1 ? "−" : "+") + ic("star", 16), "clrole", x.id, `data-r="${x.role === 1 ? 0 : 1}" data-stop="1"`) + rowBtn(ic("crown", 16), "cltr", x.id) : ""}${canKick ? rowBtn(ic("close", 16), "clkick", x.id) : ""}</div>`;
  }).join("");
  if (role < 2) h += `<div style="margin-top:10px">${btn("Выйти из клана", "clleave", "", "o")}</div>`;
  return h;
}
const clBanner = c => c.bnimg ? `<div style="height:110px;margin:-14px -16px 0;background:url(${c.bnimg}) center/cover"></div>` : "";
A.clview = async function (e) {
  const id = +e.dataset.i; if (!id) return;
  const r = await api("clan_info", {id}); if (r.error || !r.clan) return toast(r.error || "Клан не найден");
  const c = r.clan, own = soc.clan && soc.clan.clan && soc.clan.clan.id === c.id, full = c.id && soc.cl && soc.cl.rows.find(x => x.id === c.id);
  const adm = isAdm ? `<div class="card col" style="margin-top:10px;border:1px solid var(--out)"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("shield", 18)}Админ</div><div class="t2" style="margin:0">Значки клана</div><div style="display:flex;gap:6px;flex-wrap:wrap">${Object.keys(CBADGES).map(k => `<span data-a="clbd" data-i="${c.id}" data-k="${k}" style="cursor:pointer;padding:4px 8px;border-radius:12px;background:${c.badges.includes(k) ? "var(--prc)" : "var(--sch)"}">${cbdg(k, 18).replace("margin-left:3px", "")}</span>`).join("")}</div><div class="t2" style="margin:4px 0 0">Пригласить игрока (имя или ID)</div><div style="display:flex;gap:8px"><input data-keep="cinv" placeholder="Имя или ID" style="flex:1">${btn(ic("mail", 16) + " Позвать", "clainv", `data-i="${c.id}"`)}</div>${btn(ic("trash", 16) + " Удалить клан и выгнать всех", "cladel", `data-i="${c.id}"`, "o")}</div>` : "";
  modal(`<div class="card col" style="padding-top:0">${clBanner(c)}<div style="display:flex;gap:12px;align-items:center;margin-top:12px">${clIco(c, 56)}<div class="grow"><div class="t1" style="font-size:19px;color:var(--pri)">${clNm(c)}${cbdg(c.badges, 18)}</div><div class="t2" style="margin:0">Уровень ${c.level} · ${r.members.length}/${r.max}</div></div></div>${c.descr ? `<div class="t2" style="margin:0">${esc(c.descr)}</div>` : ""}<div class="t2" style="margin:0">Очки: <b>${fmt(c.score)}</b> · Казна: <b>${fmt(c.bank)}</b></div></div><div style="max-height:260px;overflow-y:auto">${r.members.map(x => `<div class="card" data-a="prof" data-i="${x.id}">${av(x.name, x.id, 36)}<div class="grow"><div class="t1">${nm(x.name, x.badges)} ${roleIc(x.role)}</div><div class="t2">${fmt(x.total)}</div></div></div>`).join("")}</div>${adm}<div style="margin-top:12px;display:flex;gap:8px;justify-content:center">${!r.mine && full ? btn(c.mode ? "Подать заявку" : "Вступить", "cljoin2", `data-i="${c.id}"`) : ""}${btn("Закрыть", "mclose", "", "t")}</div>`);
};
A.cljoin2 = async function (e) { closeModal(); return A.cljoin(e); };
A.clbd = async function (e) {
  const k = e.dataset.k, id = +e.dataset.i, r0 = await api("clan_info", {id}); if (!r0.clan) return;
  const cur = r0.clan.badges, nb = cur.includes(k) ? cur.replace(k, "") : cur + k;
  const r = await api("adm_clan_badge", {cid: id, badges: nb}); if (r.error) return toast(r.error);
  toast("Значки обновлены"); soc.at = 0; await socLoad(); A.clview({dataset: {i: id}});
};
A.clbn = function () {
  const f = document.createElement("input"); f.type = "file"; f.accept = "image/*";
  f.onchange = () => {
    const file = f.files && f.files[0]; if (!file) return; const img = new Image(), url = URL.createObjectURL(file);
    img.onload = async () => {
      const W = 640, H = 240, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"), k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
      x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); URL.revokeObjectURL(url);
      let q = .78, d = c.toDataURL("image/jpeg", q); while (d.length > 85000 && q > .3) { q -= .1; d = c.toDataURL("image/jpeg", q); }
      const r = await api("clan_bn", {img: d}); if (r.error) return toast(r.error); toast("Заставка обновлена"); soc.ei = null; await socLoad();
    };
    img.onerror = () => toast("Не удалось открыть картинку"); img.src = url;
  };
  f.click();
};
A.clbnd = async function () { await api("clan_bn", {img: ""}); toast("Заставка убрана"); soc.ei = null; await socLoad(); };
const CT_NAME = ["Наполнить казну", "Командная работа", "Крупный вклад"];
const CT_DESC = (t, i) => i === 0 ? "всем кланом внести " + fmt(t.goal) : i === 1 ? t.goal + " игрока вносят вклад" : "одно пожертвование от " + fmt(t.goal);
function ctCard(d) {
  if (!d.ct) return "";
  const left = Math.max(0, d.ct.ends - Math.floor(Date.now() / 1000)), dd = Math.floor(left / 86400), hh = Math.floor(left % 86400 / 3600);
  return `<div class="card col clset"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("cup", 18)} Задания недели<span class="t2" style="margin:0 0 0 auto;font-size:12px">ещё ${dd} д ${hh} ч</span></div>${d.ct.tasks.map((t, i) => `<div><div style="display:flex;align-items:center;gap:6px"><div class="t1 grow" style="font-size:14px">${CT_NAME[i]}</div><div class="t2" style="margin:0;display:flex;align-items:center;gap:2px">${t.done ? ic("check", 14) : "+" + t.rew + ic("gem", 12)}</div></div><div class="t2" style="margin:0;font-size:12px">${CT_DESC(t, i)} · ${fmt(Math.min(t.cur, t.goal))} / ${fmt(t.goal)}</div>${bar(Math.min(1, t.cur / t.goal))}</div>`).join("")}<div class="t2" style="margin:0;font-size:12px">Награда выдаётся каждому участнику клана</div></div>`;
}
A.clinvite = async function () { const q = (KEEP.clinvq || "").trim(); if (!q) return toast("Введи имя или ID"); const r = await api("clan_invite", {q}); if (r.error) return toast(r.error); KEEP.clinvq = ""; toast("Приглашение отправлено: " + r.name); render(); };
A.clainv = async function (e) { const q = (KEEP.cinv || "").trim(); if (!q) return toast("Введи имя или ID"); const r = await api("adm_clan_invite", {cid: +e.dataset.i, q}); if (r.error) return toast(r.error); KEEP.cinv = ""; toast("Приглашение отправлено: " + r.name); };
A.cladel = async function (e) { if (!confirm("Удалить клан и выгнать всех участников?")) return; const r = await api("adm_clan_del", {cid: +e.dataset.i}); if (r.error) return toast(r.error); closeModal(); toast("Клан удалён"); soc.ei = null; await socLoad(); };
A.clinv = function (e) { return socDo(e.dataset.y === "1" ? "clan_inv_ok" : "clan_inv_no", {}, e.dataset.y === "1" ? "Ты в клане" : "Отклонено"); };
A.tgchat = function () { const u = "https://t.me/+UmaFZTi1RcY3Yzky"; try { if (tg && tg.openTelegramLink) return tg.openTelegramLink(u); } catch (x) {} window.open(u, "_blank"); };
const socStop = e => { try { event.stopPropagation(); } catch (x) {} };
A.frfind = async function () {
  const q = (KEEP.frq || "").trim(); if (!q) return toast("Введи имя или ID");
  if (/^\d+$/.test(q)) { const r = await api("fr_add", {uid: +q}); toast(r.error || (r.friend ? "Теперь вы друзья" : "Заявка отправлена")); if (!r.error) socLoad(); return; }
  const r = await api("fr_find", {q}); if (r.error) return toast(r.error); soc.found = r.rows; render();
};
A.frad = async function (e) { socStop(); const r = await api("fr_add", {uid: +e.dataset.i}); toast(r.error || (r.friend ? "Теперь вы друзья" : "Заявка отправлена")); closeModal(); soc.found = null; socLoad(); };
A.frok = async function (e) { const r = await api("fr_ok", {uid: +e.dataset.i}); toast(r.error || "Теперь вы друзья"); closeModal(); socLoad(); };
A.frdl = async function (e) { await api("fr_del", {uid: +e.dataset.i}); toast("Готово"); closeModal(); socLoad(); };
A.frgp = function (e) {
  socStop(); const u = +e.dataset.i, ks = Object.keys(S.inv).filter(k => ITEMS[k]).sort((a, b) => ITEMS[b][2] - ITEMS[a][2] || a - b);
  closeModal(); if (!ks.length) return toast("У тебя нет котов");
  modal(`<div class="t1">Какого кота подарить?</div><div class="t2">Кот уйдёт насовсем. Не больше 5 подарков в день (котов и монет вместе).</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;max-height:300px;overflow-y:auto">${ks.map(k => `<div data-a="frgo" data-i="${u}" data-c="${k}" style="position:relative;cursor:pointer">${catEl(+k, 52, {})}<span style="position:absolute;right:-2px;bottom:-2px;background:var(--prc);color:var(--onprc);font-size:10px;font-weight:700;border-radius:8px;padding:0 5px">${S.inv[k]}</span></div>`).join("")}</div>`);
};
A.frgo = async function (e) { await save(true); const r = await api("fr_gift", {uid: +e.dataset.i, cat: +e.dataset.c}); if (r.error) return toast(r.error); adopt(r); closeModal(); toast("Подарок отправлен"); render(); };
A.frcp = function (e) { socStop(); KEEP.frcn = ""; closeModal(); modal(`<div class="t1">Подарить монеты</div><div class="t2">У тебя ${fmt(S.pts)}. Не больше 5 подарков в день.</div><input data-keep="frcn" inputmode="numeric" placeholder="Сколько монет" style="width:100%;margin:8px 0">${btn("Отправить", "frcg", `data-i="${e.dataset.i}"`)}`); };
A.frcg = async function (e) { const a = Math.floor(Number(KEEP.frcn)); if (!(a >= 100)) return toast("Минимум 100"); await save(true); const r = await api("fr_coins", {uid: +e.dataset.i, amount: a}); if (r.error) return toast(r.error); adopt(r); closeModal(); toast("Монеты отправлены"); render(); };
A.clnic = function () { pickImg(96, 96, 14000, d => { clNewImg = d; render(); }); };
A.clim = function () { pickImg(96, 96, 14000, async d => { const r = await api("clan_img", {img: d}); if (r.error) return toast(r.error); toast("Картинка обновлена"); await socLoad(); }); };
A.climd = async function () { await api("clan_img", {img: ""}); toast("Картинка убрана"); await socLoad(); };
A.clst = async function (e) {
  const id = e.dataset.i, d = soc.clan, c = d.clan, ow = id === "G0" || (d.owned || []).includes(id) || (id === "GA" && isAdm);
  if (!ow) { const pr = NS_G[id][2]; if (!confirm("Купить градиент для клана за " + fmt(pr) + " кристаллов?")) return; await save(true); }
  const r = await api("clan_style", {id: id === "G0" ? "" : id}); if (r.error) return toast(r.error);
  if (r.state) adopt(r); toast("Готово"); const ei = soc.ei; await socLoad(); soc.ei = ei; render();
};
A.clmd = function (e) { soc.ei.mode = +e.dataset.i ? 1 : 0; render(); };
const socDo = async (path, body, msg) => { const r = await api(path, body); if (r.error) { toast(r.error); return r; } if (msg) toast(msg); soc.ei = null; await socLoad(); return r; };
A.clnew = function () { return socDo("clan_create", {name: KEEP.cln, img: clNewImg}, "Клан создан"); };
A.cljoin = async function (e) { const r = await socDo("clan_join", {id: +e.dataset.i}); if (!r.error) toast(r.requested ? "Заявка отправлена" : "Ты в клане"); };
A.clunreq = function () { return socDo("clan_unreq", {}, "Заявка отменена"); };
A.clleave = function () { if (!confirm("Выйти из клана?")) return; return socDo("clan_leave", {}, "Ты вышел из клана"); };
A.cldis = function () { if (!confirm("Распустить клан насовсем?")) return; return socDo("clan_disband", {}, "Клан распущен"); };
A.clkick = function (e) { socStop(); if (!confirm("Исключить игрока?")) return; return socDo("clan_kick", {uid: +e.dataset.i}, "Исключён"); };
A.clrole = function (e) { socStop(); return socDo("clan_role", {uid: +e.dataset.i, role: +e.dataset.r}, "Готово"); };
A.cltr = function (e) { socStop(); if (!confirm("Передать клан этому игроку?")) return; return socDo("clan_transfer", {uid: +e.dataset.i}, "Клан передан"); };
A.clrq = function (e) { return socDo(e.dataset.y === "1" ? "clan_req_ok" : "clan_req_no", {uid: +e.dataset.i}, e.dataset.y === "1" ? "Принят" : "Отклонена"); };
A.clcs = function (e) { soc.cs = +e.dataset.i; if (soc.cs === 3) soc.ei = null; render(); };
A.cldon = async function () { const a = Math.floor(Number(KEEP.cldn)); if (!(a >= 1000)) return toast("Минимум 1 000"); await save(true); const r = await api("clan_donate", {amount: a}); if (r.error) return toast(r.error); adopt(r); KEEP.cldn = ""; toast("Спасибо, казна пополнена"); await socLoad(); };
A.clsave = function () { return socDo("clan_edit", {name: KEEP.cln2, descr: KEEP.cld || "", mode: soc.ei.mode ? 1 : 0, icon: soc.ei.icon}, "Сохранено"); };

{ let _ck = "", _n = 0, _t = 0;
  const _r0 = render;
  const pop = (els, from) => els.forEach((el, i) => { if (i < from || !el.animate) return; try { el.animate([{opacity: 0, transform: "translateY(16px)"}, {opacity: 1, transform: "none"}], {duration: 380, delay: Math.min(i - from, 7) * 50, easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards"}); } catch (e) {} });
  render = function () {
    _r0();
    const v = $("#view"); if (!v) return;
    if (tab !== 4) { _ck = ""; return; }
    v.classList.remove("vin");
    const k = sub + ":" + (typeof soc !== "undefined" ? soc.cs : 0), kids = Array.from(v.children);
    if (k !== _ck) { _ck = k; _n = kids.length; _t = Date.now(); pop(kids, 0); }
    else if (Date.now() - _t < 2500 && kids.length > _n) { pop(kids, _n); _n = kids.length; }
  };
}

// ---------- ежедневный вход и рефералы
let DLY = null, REF = null, dlyShown = false;
const REFLINK = () => "https://t.me/mdmelonbot?startapp=ref_" + me.id;
async function dlyLoad() { try { const r = await api("daily_info", {}); if (r && !r.error && r.rewards) DLY = r; } catch (e) {} try { const r = await api("ref_info", {}); if (r && !r.error && r.bonus) REF = r; } catch (e) {} }
function dlyCard() {
  if (!DLY) return "";
  const idx = DLY.streak % 7;
  const tiles = DLY.rewards.map((g, i) => { const cur = DLY.can ? i === idx : false; const ok = DLY.can ? i < idx : (idx === 0 ? DLY.streak > 0 : i < idx); return `<div style="flex:1;min-width:0;padding:8px 2px;border-radius:12px;text-align:center;background:${cur ? "var(--prc)" : "var(--sch)"};border:2px solid ${cur ? "var(--pri)" : "transparent"};opacity:${ok ? .55 : 1}"><div class="t2" style="margin:0;font-size:11px">${ok ? ic("check", 12) : "день " + (i + 1)}</div><div style="font-weight:800;font-size:14px;margin-top:2px;display:flex;align-items:center;justify-content:center;gap:2px">${g}${ic("gem", 12)}</div></div>`; }).join("");
  return `<div class="card col"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("box", 18)} Ежедневный вход<span class="t2" style="margin:0 0 0 auto;font-size:12px">Серия: ${DLY.streak}</span></div><div style="display:flex;gap:4px">${tiles}</div>${DLY.can ? btn("Забрать " + DLY.rewards[idx] + " ", "dlyget", "", "") .replace("</button>", ic("gem", 14) + "</button>") : `<div class="t2" style="margin:0;text-align:center">Приходи завтра: серия растёт, награда тоже</div>`}</div>`;
}
function refCard() {
  const n = REF ? REF.count : 0, b = REF ? REF.bonus : 25, w = REF ? REF.welcome : 10;
  return `<div class="card col"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("userplus", 18)} Пригласи друзей</div><div class="t2" style="margin:0">За каждого нового игрока тебе +${b} ${ic("gem", 13)}, ему +${w} ${ic("gem", 13)}. Приглашено: <b>${n}</b></div><div style="display:flex;gap:8px;flex-wrap:wrap">${btn(ic("tg", 16) + " Отправить другу", "refshare", "", "")}${btn("Копировать ссылку", "refcopy", "", "o")}</div></div>`;
}
const _tAch1 = tAch;
tAch = function () { if (!WM || Date.now() - WM.at > 30000) wmLoad(); return wmCard() + _tAch1(); };
A.dlyget = async function () {
  await save(true); const r = await api("daily_claim", {}); if (r.error) { toast(r.error); await dlyLoad(); return render(); }
  adopt(r); DLY.can = false; DLY.streak = r.streak; toast("Награда за вход: +" + r.gems + " кристаллов"); try { hap("ok"); gsfx("win"); } catch (e) {} closeModal(); dlyDot(); render();
};
A.refshare = function () { const u = "https://t.me/share/url?url=" + encodeURIComponent(REFLINK()) + "&text=" + encodeURIComponent("Играю в MDMelonClicker, заходи: коты, кейсы и кланы"); try { if (tg && tg.openTelegramLink) return tg.openTelegramLink(u); } catch (e) {} window.open(u, "_blank"); };
A.refcopy = async function () { try { await navigator.clipboard.writeText(REFLINK()); toast("Ссылка скопирована"); } catch (e) { const t = document.createElement("textarea"); t.value = REFLINK(); document.body.appendChild(t); t.select(); try { document.execCommand("copy"); toast("Ссылка скопирована"); } catch (x) { toast(REFLINK()); } t.remove(); } };
setTimeout(async () => { await dlyLoad(); dlyDot(); }, 2500);
function dlyDot() { const b = document.querySelector('#nav [data-a="drw"]'); if (b) b.classList.toggle("dd", !!(DLY && DLY.can)); }
A.dlyopen = async function () { drwOpen(false); await dlyLoad(); dlyDot(); if (!DLY) return toast("Нет связи"); modal(dlyCard()); };

// ---------- коллекция котов: награды за прогресс
let COLL = null;
async function collLoad() { try { const r = await api("coll_info", {}); if (r && !r.error && r.ms) { COLL = r; if (tab === 2) render(); } } catch (e) {} }
function collCard() {
  if (!COLL) return "";
  const TOT = 101, mx = COLL.ms[COLL.ms.length - 1][0];
  return `<div class="card col clset"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("star", 18)} Прогресс коллекции<span class="t2" style="margin:0 0 0 auto">${COLL.n} / ${TOT}</span></div>${bar(COLL.n / TOT)}${COLL.ms.map((m, i) => { const ok = COLL.n >= m[0], got = COLL.claimed.includes(i); return `<div style="display:flex;align-items:center;gap:8px"><div class="t2 grow" style="margin:0;font-size:13px">${m[0]} котов</div><div class="t2" style="margin:0;display:flex;align-items:center;gap:2px">+${m[1]}${ic("gem", 12)}</div>${got ? `<span class="chip">${ic("check", 12)}</span>` : ok ? btn("Забрать", "collget", `data-i="${i}"`) : `<span class="t2" style="margin:0;font-size:12px;min-width:56px;text-align:right">ещё ${m[0] - COLL.n}</span>`}</div>`; }).join("")}</div>`;
}
const _tCases2 = tCases;
tCases = function () { if (!COLL) collLoad(); const h = _tCases2(); return COLL ? h.replace('<div class="sec">Коллекция ·', collCard() + '<div class="sec">Коллекция ·') : h; };
A.collget = async function (e) {
  await save(true); const r = await api("coll_claim", {i: +e.dataset.i}); if (r.error) return toast(r.error);
  adopt(r); COLL = {n: r.n, claimed: r.claimed, ms: r.ms}; toast("Награда за коллекцию: +" + r.gems + " кристаллов"); gsfx("win"); hap("ok"); render();
};

// ---------- сезоны: месячный рейтинг
let lbMode = 0, SEAS = null;
async function seasLoad() { try { const r = await api("season_top", {}); if (r && !r.error && r.rows) { SEAS = r; if (tab === 4 && sub === 0 && lbMode === 1) render(); } } catch (e) {} }
function seasHtml() {
  if (!SEAS) return `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
  const left = Math.max(0, SEAS.ends - Math.floor(Date.now() / 1000)), dd = Math.floor(left / 86400), hh = Math.floor(left % 86400 / 3600);
  let h = `<div class="card col clset"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("cup", 18)} Сезон месяца<span class="t2" style="margin:0 0 0 auto;font-size:12px">ещё ${dd} д ${hh} ч</span></div><div class="t2" style="margin:0">Считается всё, что ты заработал за месяц. Топ-3 в конце получают кристаллы: ${SEAS.rew.map(x => x + ic("gem", 12)).join(" · ")}. Сезон начинается заново для всех.</div></div>`;
  h += `<div class="card" style="background:var(--sch)"><div class="t1 grow" style="color:var(--onprc)">Ты: ${fmt(SEAS.myScore)}${SEAS.rank ? " · место " + SEAS.rank : ""}</div></div>`;
  if (SEAS.prev && SEAS.prev.top.length) h += `<div class="card col"><div class="t2" style="margin:0;font-weight:700">Победители прошлого сезона</div>${SEAS.prev.top.map((r, i) => `<div class="t2" style="margin:0;font-size:13px">${i + 1}. ${esc(r.name)} · ${fmt(r.score)}</div>`).join("")}</div>`;
  h += SEAS.rows.length ? SEAS.rows.map((r, i) => `<div class="card ${r.id === me.id ? "p" : ""}" data-a="prof" data-i="${r.id}"><div class="circ" style="width:38px;height:38px;font-size:15px;font-weight:700"><span style="color:${["#ffd54f", "#cfd8dc", "#ffab91"][i] || "inherit"}">${i + 1}</span></div>${av(r.name, r.id, 40)}<div class="grow"><div class="t1">${nm(r.name, r.badges)}</div></div><div class="t1" style="font-size:15px">${fmt(r.score)}</div></div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока никто не набрал очков</div>`;
  return h;
}
const _tTopS = tTop;
tTop = function () {
  if (sub !== 0) return _tTopS();
  const seg = `<div class="seg" style="margin-top:0"><button class="${lbMode ? "" : "on"}" data-a="lbm" data-i="0">Сейчас</button><button class="${lbMode ? "on" : ""}" data-a="lbm" data-i="1">Сезон</button></div>`;
  if (!lbMode) return injectSeg(_tTopS(), seg);
  if (!SEAS) seasLoad();
  const base = _tTopS(), k = base.indexOf('<div class="card">');
  return base.slice(0, k) + seg + seasHtml();
};
function injectSeg(h, seg) { const k = h.indexOf('<div class="card">'); return k < 0 ? h : h.slice(0, k) + seg + h.slice(k); }
A.lbm = function (e) { lbMode = +e.dataset.i; if (lbMode) { SEAS = null; seasLoad(); } render(); };

// ---------- шахматы в казино: 5 минут, с ботом (sub 9), лобби (sub 10) и игра вдвоём (sub 11)
/*CHESS*/
const CHG = ["", "♟", "♞", "♝", "♜", "♛", "♚"], chClk = ms => { const t = Math.ceil(Math.max(0, ms) / 1000); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
const chWhy = {mate: "Мат", time: "Время вышло", resign: "Сдача", stalemate: "Пат", draw: "Ничья по правилам"};
const chCaps = (b, col) => { const have = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}, full = {1: 8, 2: 2, 3: 2, 4: 2, 5: 1}; for (const v of b) if (v * col > 0 && Math.abs(v) < 6) have[Math.abs(v)]++; let s = ""; for (const p of [5, 4, 3, 2, 1]) s += CHG[p].repeat(Math.max(0, full[p] - have[p])); return s; };
function chApplyView(r, pvp) {
  const old = cz.ch && !cz.ch.none ? cz.ch : {}, mine = r.s && (pvp ? r.s.t === r.me : r.s.t === 1);
  const C = Object.assign(old, {pvp, id: r.id, status: r.status || "play", s: r.s, bet: r.bet || r.stake, me: pvp ? r.me : 1, opp: pvp ? r.opp : "Арбуз-бот", pm: r.pm, om: r.om, lm: r.lm, chk: r.chk, at: Date.now(), sel: null, mv: [], busy: false, tout: 0, v: r.v});
  if (old.s && r.s && old.s.n !== r.s.n && mine && pvp) { try { hap("light"); tone(520, 80, .05, "triangle"); } catch (e) {} }
  cz.ch = C; return C;
}
function chPayout(C, done, why, pay, bet) {
  if (C.paid) return; C.paid = 1; C.done = done; C.why = why; C.pay = pay; S.pts += pay; mark(); if (pay > bet) save(true);
  if (done === "loss") S.burnC = (S.burnC || 0) + bet;
  if (done === "win") { try { fxConfetti(120); hap("ok"); } catch (e) {} }
  czUpd();
}
function chAdopt(r) {
  if (!r) { toast("Нет связи"); return chLoad(); }
  if (r.none) { cz.ch = {none: true}; return render(); }
  if (r.error && !r.s) { toast(r.error); return chLoad(); }
  if (r.error) toast(r.error);
  const C = chApplyView(r, false); if (r.done) chPayout(C, r.done, r.why, r.pay, r.bet);
  render();
}
async function chLoad() { const r = await api("ch_state", {}); if (r && r.error) { cz.ch = {none: true}; return render(); } chAdopt(r); }
async function chgAdopt(r) {
  if (!r) { toast("Нет связи"); return; }
  if (r.error && !r.status) { toast(r.error); cz.chid = 0; cz.sub = 10; cz.ch = null; render(); chgLobby(); return; }
  if (r.error) toast(r.error);
  if (r.status === "wait") { cz.ch = Object.assign(cz.ch && !cz.ch.none ? cz.ch : {}, {pvp: true, id: r.id, status: "wait", bet: r.stake}); cz.chsig = "wait"; render(); return; }
  if (r.status === "cancel") { if (!r.claimed) { const c = await api("chg_claim", {id: r.id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); save(true); czUpd(); } } cz.chid = 0; cz.ch = null; cz.sub = 10; render(); chgLobby(); return; }
  const C = chApplyView(r, true); cz.chsig = r.v + "|" + r.status;
  if (r.status === "done" && !C.paid) { const c = r.claimed ? {amount: 0} : await api("chg_claim", {id: r.id}); chPayout(C, r.winner === 1 ? "win" : r.winner === 2 ? "loss" : "draw", r.why, c && c.amount || 0, r.stake); }
  render();
}
function chBoard(C) {
  const mvs = new Set((C.mv || []).map(m => m[1])), kq = C.chk ? chKing(C.s.b, C.s.t) : -1, fl = C.me === -1; let h = "";
  for (let ri = 0; ri < 8; ri++) for (let ci = 0; ci < 8; ci++) {
    const i = fl ? (7 - ri) * 8 + (7 - ci) : ri * 8 + ci, v = C.s.b[i], cls = ["chs", (ri + ci) & 1 ? "d" : "l"];
    if (C.lm && (C.lm[0] === i || C.lm[1] === i)) cls.push("lm"); if (C.sel === i) cls.push("sel"); if (mvs.has(i)) cls.push(v ? "cap" : "tg"); if (i === kq) cls.push("ck");
    const co = (ci === 0 ? `<i class="chr">${fl ? ri + 1 : 8 - ri}</i>` : "") + (ri === 7 ? `<i class="chf">${(fl ? "hgfedcba" : "abcdefgh")[ci]}</i>` : "");
    h += `<div class="${cls.join(" ")}" data-a="chsq" data-i="${i}">${co}${v ? `<span class="chp ${v > 0 ? "w" : "b"}">${CHG[Math.abs(v)]}︎</span>` : ""}</div>`;
  }
  return `<div class="chb">${h}</div>`;
}
function chPanel(C, mineSide) {
  const live = !C.done && C.status !== "wait", mover = C.s ? (C.s.t === C.me) : false, active = live && (mineSide ? mover : !mover);
  const ms = mineSide ? (C.done || !mover ? C.pm : C.pm - (Date.now() - C.at)) : (C.done || mover ? C.om : C.om - (Date.now() - C.at));
  const nm = mineSide ? "Ты" : esc(C.opp || ""), cap = chCaps(C.s.b, mineSide ? -C.me : C.me);
  return `<div class="chpl"><div class="chav${mineSide ? "" : " o"}">${ic(mineSide ? "user" : C.pvp ? "user" : "bolt", 18)}</div><div class="grow" style="min-width:0"><div class="t1" style="margin:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nm}</div><div class="chcap">${cap || "&nbsp;"}</div></div><span class="chclk${active ? " on" : ""}${active && ms < 30000 ? " low" : ""}" id="${mineSide ? "chpm" : "chom"}">${chClk(ms)}</span></div>`;
}
function chGame(C, back) {
  const mover = C.s.t === C.me;
  const st = C.done ? `<div class="card col chres ${C.done}"><div class="chic">${ic(C.done === "win" ? "cup" : C.done === "loss" ? "flag" : "swap", 30)}</div><div class="t1" style="font-size:22px;margin:0">${C.done === "win" ? "Победа!" : C.done === "loss" ? "Поражение" : "Ничья"}</div><div class="t2" style="margin:0">${chWhy[C.why] || ""} · ${C.done === "win" ? "+" + fmt(C.pay - C.bet) : C.done === "loss" ? "−" + fmt(C.bet) : "ставка возвращена"}</div><button class="btn" data-a="${C.pvp ? "chgback" : "chnew"}" style="width:100%;height:48px;justify-content:center">${C.pvp ? "К столикам" : "Новая партия"}</button></div>`
    : `<div class="chst${C.chk && mover ? " chk" : ""}" id="chst"><i></i>${C.busy ? (C.pvp ? "Отправляю ход…" : "Арбуз-бот думает…") : !mover ? "Ход соперника" : C.chk ? "Тебе шах!" : "Твой ход"}</div><button class="btn o" data-a="chres" style="width:100%;height:46px;justify-content:center;margin-top:10px">${ic("flag", 16)} Сдаться</button>`;
  return back + `<div class="chw">${chPanel(C, false)}${chBoard(C)}${chPanel(C, true)}</div><div class="t2" style="margin:8px 6px 0;font-size:12px;text-align:center">Ставка ${fmt(C.bet)}${C.pvp ? " · банк " + fmt(C.bet * 2) + ", 5% в джекпот" : " · победа ×1.9"}</div>${st}`;
}
function chScreen() {
  const back = `<button class="btn t bkb" data-a="czgo" data-k="${cz.sub === 11 ? 10 : 0}">← ${cz.sub === 11 ? "К столикам" : "Казино"}</button>`, C = cz.ch;
  const bal = `<div class="card" style="padding:10px 16px"><span class="t2 grow" style="margin:0">Баланс</span><b id="czbal" style="font-size:18px">${fmt(S.pts)}</b></div>`;
  if (cz.sub === 10) {
    const L = cz.chlobby;
    let h = `<button class="btn t bkb" data-a="czgo" data-k="0">← Казино</button>` + bal + `<div class="card col"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("chess", 20)} Шахматы на двоих</div><div class="t2" style="font-size:12px;margin:0;line-height:1.4">Цвет фигур выпадает случайно. По 5 минут на каждого, часы идут на своём ходу. Победитель забирает банк без 5% (они уходят в джекпот), при ничьей каждый получает свою ставку. Закончилось время или сдался: проигрыш.</div>${czBetUi()}<button class="btn" data-a="chgcreate" style="width:100%;height:50px;justify-content:center">Создать и ждать соперника</button></div><div class="sec">Открытые столики${L ? " · " + L.rows.length : ""}</div>`;
    if (!L) return h + `<div class="t2" style="text-align:center;margin:20px">Загружаю…</div>`;
    return h + (L.rows.length ? L.rows.map(x => `<div class="card"><div class="chav">${ic("user", 18)}</div><div class="grow"><div class="t1" style="font-size:15px">${esc(x.n1)}</div><div class="t2" style="margin:0;font-size:12px">Ставка ${fmt(x.stake)}</div></div>${btn("Сесть", "chgjoin", `data-i="${x.id}" data-s="${x.stake}"`, S.pts >= x.stake ? "" : "dis")}</div>`).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока нет столиков. Создай первый и подожди соперника!</div>`);
  }
  if (cz.sub === 11) {
    if (!C || !C.status) return `<div class="card col"><div class="t2" style="margin:0">Загрузка…</div></div>`;
    if (C.status === "wait") return `<div class="card col" style="align-items:center;text-align:center;gap:10px;padding:28px 16px"><div class="chav" style="width:56px;height:56px">${ic("users", 28)}</div><div class="t1" style="font-size:18px;margin:0">Ждём соперника</div><div class="t2" style="margin:0">Ставка ${fmt(C.bet)}. Когда кто-то сядет за столик, партия начнётся сама.</div><button class="btn o" data-a="chgcancel" style="justify-content:center">Закрыть столик</button></div>`;
    return chGame(C, C.done ? back : "");
  }
  if (!C) return back + bal + `<div class="card col"><div class="t2" style="margin:0">Загрузка…</div></div>`;
  if (C.none) return back + bal + `<div class="card col"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("chess", 20)} Шахматы · 5 минут</div><div class="t2" style="margin:0;font-size:12px;line-height:1.4">Играешь белыми против Арбуз-бота. На партию 5 минут, часы идут только на твоих ходах. Победа: ставка ×1.9. Ничья: ставка возвращается. Время вышло или сдался: ставка проигрывается. Пешка, дошедшая до края, становится ферзём. Партия сохраняется, можно выйти и вернуться.</div></div>${czBetUi()}<button class="btn" data-a="chstart" style="width:100%;height:54px;justify-content:center;font-size:17px;margin-top:10px">Начать партию</button>`;
  return chGame(C, back);
}
const _tChC = tCasino;
tCasino = function () {
  if (cz.sub >= 9 && cz.sub <= 11) return chScreen();
  const h = _tChC(); if (cz.sub !== 0) return h;
  const card = `<div class="gmc"><div class="gmh"><div class="circ">${ic("chess", 26)}</div><span class="grow"><b>Шахматы · 5 минут</b><div class="t2" style="margin:2px 0 0;font-size:12px;font-weight:500">С Арбуз-ботом (победа ×1.9) или с другим игроком на банк</div></span></div><div class="gmb"><button data-a="czgo" data-k="9">В одиночку</button><button data-a="czgo" data-k="10">Вдвоём</button></div></div>`;
  let k = h.indexOf('<div class="t2" style="margin:14px 6px;font-size:12px">Играть можно'); if (k < 6 || h.slice(k - 6, k) !== "</div>") return h + card; k -= 6; return h.slice(0, k) + card + h.slice(k);
};
const _czgoCh = A.czgo;
A.czgo = function (e) {
  const k = +e.dataset.k;
  if (cz.sub === 11 && cz.ch && !cz.ch.done && cz.ch.status !== "cancel" && k !== 11) return toast(cz.ch.status === "wait" ? "Сначала закрой свой столик" : "Сначала доиграй партию");
  if (k === 9) { if (S.pts < 0) return kickOut(); cz.sub = 9; cz.ch = null; render(); chLoad(); $("#view").scrollTop = 0; return; }
  if (k === 10) { if (S.pts < 0) return kickOut(); cz.sub = 10; cz.ch = null; cz.chid = 0; cz.chlobby = null; render(); chgLobby(); $("#view").scrollTop = 0; return; }
  if (cz.sub === 11) { cz.ch = null; cz.chid = 0; }
  return _czgoCh.apply(this, arguments);
};
A.chstart = async function () {
  if (cz.busy) return; const bet = czBet(); if (S.pts < bet || bet < 100) return toast("Не хватает монет");
  cz.busy = true; S.pts -= bet; mark(); czUpd(); const r = await api("ch_start", {bet}); cz.busy = false;
  if (!r || r.error) { S.pts += bet; mark(); czUpd(); return toast((r && r.error) || "Нет связи"); }
  if (r.resume) { S.pts += bet; mark(); toast("Продолжаем начатую партию"); }
  cz.ch = null; chAdopt(r);
};
function chMove(C, i, send) {
  const f = C.sel, mv = chLegal(C.s).find(m => m[0] === f && m[1] === i); C.sel = null; C.mv = []; C.busy = true; C.pm -= Date.now() - C.at; C.at = Date.now();
  C.s = chApply(C.s, mv); C.lm = [f, i]; C.chk = false; hap("light"); render(); return send(f, i);
}
A.chsq = async function (e) {
  const C = cz.ch; if (!C || C.none || C.done || C.busy || C.status === "wait" || !C.s || C.s.t !== C.me) return; const i = +e.dataset.i, v = C.s.b[i];
  if (C.sel != null && C.mv.some(m => m[1] === i)) {
    if (C.pvp) return chMove(C, i, async (f, t) => chgAdopt(await api("chg_move", {id: C.id, f, t})));
    return chMove(C, i, async (f, t) => chAdopt(await api("ch_move", {f, t})));
  }
  if (v * C.me > 0) { C.sel = i; C.mv = chLegal(C.s).filter(m => m[0] === i); } else { C.sel = null; C.mv = []; }
  render();
};
A.chres = function () { if (!confirm("Сдаться? Ставка будет потеряна.")) return; const C = cz.ch; if (C && C.pvp) api("chg_resign", {id: C.id}).then(chgAdopt); else api("ch_resign", {}).then(chAdopt); };
A.chnew = function () { cz.ch = {none: true}; render(); };
A.chgback = function () { cz.ch = null; cz.chid = 0; cz.sub = 10; render(); chgLobby(); };
async function chgLobby() {
  const r = await api("chg_list", {}); if (!r || r.error) return; cz.chlobby = r;
  for (const id of r.claims || []) { const c = await api("chg_claim", {id}); if (c && c.amount > 0) { S.pts += c.amount; mark(); save(true); toast("Шахматы: +" + fmt(c.amount)); czUpd(); } }
  if (r.mine && cz.sub === 10 && !cz.chid) { cz.chid = r.mine; cz.sub = 11; cz.ch = null; render(); chgPoll(); return; }
  if (cz.sub === 10 && !cz.busy) render();
}
A.chgcreate = async function () {
  if (cz.busy) return; const bet = czBet(); if (S.pts < bet || bet < 100) return toast("Не хватает монет");
  cz.busy = true; S.pts -= bet; mark(); czUpd(); const r = await api("chg_create", {stake: bet}); cz.busy = false;
  if (!r || r.error) { S.pts += bet; mark(); czUpd(); return toast((r && r.error) || "Нет связи"); }
  cz.chid = r.id; cz.sub = 11; cz.ch = {pvp: true, id: r.id, status: "wait", bet}; render(); chgPoll();
};
A.chgjoin = async function (e) {
  if (cz.busy) return; const id = +e.dataset.i, stake = +e.dataset.s; if (S.pts < stake) return toast("Не хватает монет");
  cz.busy = true; const r = await api("chg_join", {id}); cz.busy = false;
  if (!r || r.error) { toast((r && r.error) || "Нет связи"); chgLobby(); return; }
  S.pts -= r.stake; mark(); cz.chid = id; cz.sub = 11; cz.ch = null; render(); chgPoll();
};
A.chgcancel = async function () { const r = await api("chg_cancel", {id: cz.chid}); if (r && r.error) toast(r.error); chgPoll(); };
let chgBusy = false;
async function chgPoll() {
  if (chgBusy || cz.sub !== 11 || !cz.chid) return; chgBusy = true;
  try { const C = cz.ch, r = await api("chg_state", {id: cz.chid}); if (r && cz.sub === 11) { const sig = r.status === "wait" ? "wait" : r.v + "|" + r.status; if (!C || sig !== cz.chsig || r.error || (C && !C.s && r.s)) await chgAdopt(r); } } catch (e) {}
  chgBusy = false;
}
setInterval(() => { if (tab === 6 && !document.hidden && cz.sub === 11 && cz.ch && !cz.ch.busy && !cz.ch.done) chgPoll(); }, 1500);
setInterval(() => { if (tab === 6 && !document.hidden && cz.sub === 10 && !cz.busy) chgLobby(); }, 3500);
setInterval(() => {
  const C = cz.ch; if (tab !== 6 || (cz.sub !== 9 && cz.sub !== 11) || !C || C.none || C.done || !C.s || C.status === "wait") return;
  const mover = C.s.t === C.me, set = (id, ms, on) => { const el = document.getElementById(id); if (el) { el.textContent = chClk(ms); el.classList.toggle("low", on && ms < 30000); } };
  const left = C.pm - (Date.now() - C.at), oleft = C.om - (Date.now() - C.at);
  if (mover && !C.busy) set("chpm", left, true); else if (!mover && C.pvp) set("chom", oleft, true);
  if (((mover && left <= 0) || (!mover && C.pvp && oleft <= 0)) && !C.tout && !C.busy) { C.tout = 1; if (C.pvp) chgPoll(); else chLoad(); }
}, 250);

// ---------- язык: русский / English (перевод интерфейса на лету)
const EN = {
"Игра":"Game","Магазин":"Shop","Кейсы":"Cases","Награды":"Rewards","Топ":"Top","Ещё":"More","Меню":"Menu","Казино":"Casino","Сообщество":"Community","Назад":"Back","← Назад":"← Back","← Казино":"← Casino",
"Лидеры":"Leaders","Обмен":"Trade","Чат":"Chat","Друзья":"Friends","Кланы":"Clans","Сейчас":"Now","Сезон":"Season","Участники":"Members","Заявки":"Requests","Клан":"Clan","Все кланы":"All clans",
"Улучшения":"Upgrades","Генераторы":"Generators","Настройки":"Settings","Информация":"Info","Оформление":"Appearance","Тема":"Theme","Цвет":"Color","Шрифт":"Font","Вибрация":"Vibration","Звуки кейсов":"Case sounds","Звуки игры (клики, покупки)":"Game sounds (taps, purchases)",
"Анимации клика":"Tap animations","Анимации открытия кейсов":"Case opening animations","Меньше вспышек":"Fewer flashes","Что нового":"What's new","Как играть":"How to play","Сбросить весь прогресс":"Reset all progress","Нажми ещё раз: всё пропадёт!":"Tap again: everything will be lost!",
"Всего тапов":"Total taps","Накоплено за всё время":"Earned all time","За текущий забег":"Current run","Самоцветов":"Gems","Перерождений":"Rebirths","Перерождение":"Rebirth","Достижений":"Achievements","Котов собрано":"Cats collected",
"Ежедневный вход":"Daily login","Серия:":"Streak:","Забрать":"Claim","Приходи завтра: серия растёт, награда тоже":"Come back tomorrow: the streak and the reward grow","день":"day",
"Пригласи друзей":"Invite friends","Отправить другу":"Send to a friend","Копировать ссылку":"Copy link","Ссылка скопирована":"Link copied","Приглашено:":"Invited:","Позже":"Later",
"Задания недели":"Weekly tasks","Награда выдаётся каждому участнику клана":"The reward goes to every clan member","Наполнить казну":"Fill the treasury","Командная работа":"Teamwork","Крупный вклад":"Big contribution",
"Прогресс коллекции":"Collection progress","Коллекция · нажми на кота, чтобы посмотреть инфо":"Collection · tap a cat to see info","Сеты котов · нажми, чтобы посмотреть":"Cat sets · tap to view","Последние выпадения":"Recent drops","Запас дубликатов":"Duplicates",
"Бесплатный кейс":"Free case","Открыть":"Open","Открыто":"Opened","Открываем…":"Opening…","Загружаю…":"Loading…","Загрузка…":"Loading…","Подключаюсь…":"Connecting…","Готово":"Done","Готово!":"Done!","Отмена":"Cancel","Закрыть":"Close","Сохранить":"Save","Сохранено":"Saved","Создать":"Create","Купить":"Buy","Куплено":"Bought","Продано":"Sold","Принять":"Accept","Отклонить":"Decline","Обновить":"Refresh",
"Золотой лидер":"Golden leader","Таблица лидеров":"Leaderboard","Монеты на данный момент, траты в казино тоже считаются":"Current coins; casino spending counts too","Ты:":"You:","место":"rank","Сезон месяца":"Monthly season","Победители прошлого сезона":"Last season's winners","Пока никто не набрал очков":"Nobody has scored yet",
"Найти игрока":"Find a player","Найти":"Search","Имя или ID":"Name or ID","По имени или по ID (ID виден в профиле)":"By name or ID (your ID is in your profile)","Результаты":"Results","Друзья ·":"Friends ·","Ничего не найдено":"Nothing found","Подарок отправлен":"Gift sent","Монеты отправлены":"Coins sent","Теперь вы друзья":"You are friends now",
"Создать клан":"Create clan","Название клана":"Clan name","Описание клана":"Clan description","Таблица кланов":"Clan table","Вступить":"Join","Заявка":"Apply","Вступление":"Joining","Свободное":"Open","По заявкам":"By request","Выйти из клана":"Leave clan","Распустить":"Disband","Опасная зона":"Danger zone",
"Внешний вид":"Appearance","Заставка":"Banner","Картинка клана":"Clan picture","Выбрать":"Choose","Выбрать картинку":"Choose picture","Другая картинка":"Another picture","Название и описание":"Name and description","Градиент названия":"Name gradient","обычный":"default","куплен":"owned","выбран":"selected",
"Заставка не задана":"No banner set","Заставка обновлена":"Banner updated","Картинка обновлена":"Picture updated","Приглашение в клан":"Clan invitation","Пригласить игрока":"Invite a player","Позвать":"Invite","Приглашение отправлено:":"Invitation sent:","Игрок не найден":"Player not found","Игрок уже в клане":"Player is already in a clan","Клан создан":"Clan created","Клан распущен":"Clan disbanded",
"Уровень":"Level","Казна:":"Treasury:","Сколько внести в казну":"Amount to donate","Внести":"Donate","Спасибо, казна пополнена":"Thanks, the treasury is topped up","Очки (накопления участников):":"Score (members' savings):",
"Админ":"Admin","Админка":"Admin","Админ-панель":"Admin panel","Значки клана":"Clan badges","Подтверждённый клан":"Verified clan","Официальный клан":"Official clan","Лучший клан":"Top clan","Партнёр":"Partner","Огонь":"Fire",
"Заходи в ТГ чат":"Join our Telegram chat","Общаемся, делимся находками и новостями":"Chat, share finds and news","Сообщение":"Message","Пока тихо. Напиши первым!":"It's quiet. Write first!",
"Профиль":"Profile","Мой профиль":"My profile","Стиль ника":"Nick style","Своё фото":"Own photo","Профиль сохранён":"Profile saved","Текущий кот":"Current cat","Витрина":"Showcase","Витрина: до 3 любимых котов":"Showcase: up to 3 favorite cats","Инвентарь ·":"Inventory ·","Достижения ·":"Achievements ·","Кот":"Cat","Монеты":"Coins","В друзья":"Add friend","Кристаллы":"Gems",
"Банк":"Bank","Долг":"Debt","Баланс":"Balance","Рулетка":"Roulette","Ставка":"Bet","СТАВКА":"BET","Крутить":"Spin","ПОБЕДА!":"WIN!","ПОРАЖЕНИЕ":"LOSS","ДЖЕКПОТ!":"JACKPOT!","Победа!":"Win!","Неудача":"Miss","Не повезло…":"Unlucky…","Выигрыш +":"Win +",
"Сделай 3000 тапов":"Make 3000 taps","Открой 20 кейсов":"Open 20 cases","Купи 50 генераторов":"Buy 50 generators","Награда получена":"Reward claimed","Получено":"Claimed","Ещё не выполнено":"Not completed yet",
"Обменять":"Trade","Обмен котами":"Cat trading","Мои предложения":"My offers","Все предложения":"All offers","Пока нет предложений":"No offers yet","Новый обмен":"New trade","Предложить":"Offer","Предложение создано":"Offer created","Обмен состоялся!":"Trade complete!","У тебя нет котов для обмена":"You have no cats to trade",
"Мастерская":"Workshop","Идеи":"Ideas","Коты":"Cats","Новая идея":"New idea","Идея отправлена":"Idea sent","Предлагай своих котов в мастерской.":"Suggest your own cats in the workshop.",
"Промокоды":"Promo codes","Промокод":"Promo code","Введи промокод":"Enter a promo code","Промокод активирован:":"Promo code activated:",
"Не хватает кристаллов":"Not enough gems","Не хватает самоцветов":"Not enough gems","Не хватает монет":"Not enough coins","Нет связи с сервером":"No connection to the server","Нет связи":"No connection","Не удалось загрузить":"Failed to load","Занято, попробуй ещё раз":"Busy, try again","Сегодня уже получено":"Already claimed today","Только глава":"Owner only","Игрок не найден":"Player not found","Клан не найден":"Clan not found","Такое название занято":"That name is taken","Название от 3 символов":"Name must be 3+ characters","Приглашения нет":"No invitation","Нужно собрать ещё":"Collect more first","Уже получено":"Already claimed","Картинка слишком большая":"Image is too large",
"Тебе выдали:":"You received:","Тебе выдали":"You received","Пока тебя не было: +":"While you were away: +","🏛 Часовой налог: −":"🏛 Hourly tax: −","🏛 Налог за офлайн: −":"🏛 Offline tax: −","Награда за вход: +":"Login reward: +","Награда за коллекцию: +":"Collection reward: +",
"Налог на богатство":"Wealth tax","Лихорадка":"Fever","Золотой градиент":"Golden gradient","Закат":"Sunset","Океан":"Ocean","Мята":"Mint","Арбуз":"Watermelon","Неон":"Neon","Радуга":"Rainbow","Лава":"Lava","Космос":"Space","Жирный":"Bold","Курсив":"Italic","Рукописный":"Handwritten","Строгий":"Strict","Широкий":"Wide","Звёзды":"Stars","Снежинки":"Snowflakes","Тыквы":"Pumpkins","Нет":"None","Светлая тема":"Light theme",
"Обычный":"Common","Редкий":"Rare","Эпический":"Epic","Легендарный":"Legendary","Мифический":"Mythic","Особый":"Special","Течкот":"Techcat","Королевский":"Royal","Секретный":"Secret","Админский":"Admin",
"Язык":"Language","Ежедневная награда":"Daily reward","Выбери язык":"Choose language","Загружаю котов…":"Loading cats…","Готовлю котов…":"Preparing cats…","Сообщение всем в игре":"Message to everyone in the game","Войти через Telegram":"Sign in with Telegram","Технический перерыв":"Maintenance break","Игра снова работает!":"The game is back!",
"Тапай подряд — включится лихорадка!":"Keep tapping to trigger fever!","Лови золотые звёзды: они дают бонус.":"Catch the golden stars for a bonus.","Налоги растут вместе с богатством: чем больше монет, тем выше ставка. Тратить выгоднее, чем копить.":"Taxes grow with your wealth: the more coins, the higher the rate. Spending beats hoarding.",
"За каждого нового игрока тебе +":"For each new player you get +","Заявок нет":"No requests","Заявок пока нет.":"No requests yet.","Кланов пока нет. Создай первый!":"No clans yet. Create the first one!","Ты в клане":"You are in a clan","Участники ·":"Members ·","Вы":"You","Тебя зовут в клан":"You are invited to the clan",
"всем кланом внести":"clan-wide donations of","игрока вносят вклад":"players contribute","одно пожертвование от":"a single donation of","монет":"coins","кристаллов":"gems","Серия":"Streak","ещё":"left","мин назад":"min ago","ч назад":"h ago","дн назад":"d ago","давно":"long ago","в игре":"online","не в сети":"offline","ур.":"lv.","Ур.":"Lv.","бонус":"bonus","Очки:":"Score:","Казна":"Treasury","Лимит:":"Limit:","Тестер":"Tester","Создатель":"Creator","Гений":"Genius"
};
const EN_LIST = Object.keys(EN).filter(k => k.length >= 4).sort((a, b) => b.length - a.length);
const CY = /[А-Яа-яЁё]/;
function trEn(s) {
  if (!CY.test(s)) return s;
  const t = s.trim(); if (EN[t] !== undefined) return s.replace(t, EN[t]);
  let r = s; for (const k of EN_LIST) if (r.includes(k)) r = r.split(k).join(EN[k]);
  return r.replace(/(\d+) д (\d+) ч/g, "$1d $2h").replace(/(\d+) ч (\d+) мин/g, "$1h $2m").replace(/(\d+) мин/g, "$1 min").replace(/(\d+) дн\./g, "$1 d").replace(/день (\d)/g, "day $1").replace(/(\d) из (\d)/g, "$1 of $2");
}
Object.assign(EN, {
"Котёнок":"Kitten","Лапки-помощники":"Helper paws","Молочная ферма":"Milk farm","Рыбный порт":"Fish port","Мурлыка-фабрика":"Purr factory","Портал Мяу":"Meow portal","Космокот":"Cosmocat","Сила клика":"Click power","+1 к каждому тапу":"+1 to every tap","Критический тап":"Critical tap","Шанс x5: 5% + 3% за уровень":"x5 chance: 5% + 3% per level","+1 с к длительности (6 с)":"+1 s duration (6 s)",
"Первые лапки":"First paws","100 тапов":"100 taps","Тыкатель":"Tapper","1 000 тапов":"1,000 taps","Мастер кликов":"Click master","10 000 тапов":"10,000 taps","Копилка":"Piggy bank","Накопить 1 000":"Save 1,000","Миллионер":"Millionaire","Накопить 1 000 000":"Save 1,000,000","Миллиардер":"Billionaire","Накопить 1 000 000 000":"Save 1,000,000,000",
"Команда":"Team","10 генераторов":"10 generators","Колония":"Colony","50 генераторов":"50 generators","Империя":"Empire","200 генераторов":"200 generators","Звёздочёт":"Stargazer","Поймать 5 звёзд":"Catch 5 stars","В огне":"On fire","3 лихорадки":"3 fevers","Новая жизнь":"New life","Первое перерождение":"First rebirth","Первый кейс":"First case","Открыть 10 кейсов":"Open 10 cases",
"Коллекционер":"Collector","Собрать 10 предметов":"Collect 10 items","Всё и сразу":"Everything at once","Собрать все предметы":"Collect all items","Пятьдесят тысяч":"Fifty thousand","50 000 тапов":"50,000 taps","Триллионер":"Trillionaire","Накопить 1 000 000 000 000":"Save 1,000,000,000,000","Мегаполис":"Megacity","100 генераторов":"100 generators","Ловец звёзд":"Star catcher","Поймать 50 звёзд":"Catch 50 stars",
"Жар-птица":"Firebird","25 лихорадок":"25 fevers","Бессмертный":"Immortal","5 перерождений":"5 rebirths","Кейсомания":"Case mania","Открыть 100 кейсов":"Open 100 cases","Обычный кейс":"Common case","Редкий кейс":"Rare case","Золотой кейс":"Golden case","Алмазный кейс":"Diamond case","Особый кейс":"Special case","Течкот-кейс":"Techcat case",
"Золотой палец":"Golden finger","+10% к тапам за уровень":"+10% to taps per level","Мурлыка":"Purrer","+10% к доходу за уровень":"+10% income per level","Звёздный магнит":"Star magnet","Золотые звёзды чаще на 50%":"Golden stars 50% more often","Быстрый кейс":"Fast case","Бесплатный кейс быстрее на 15%":"Free case 15% faster",
"Едоки":"Eaters","Напитки":"Drinks","Радиация":"Radiation","Течкоты":"Techcats","Булка":"Bun","Бургер":"Burger","Самса":"Samsa","Яблоко":"Apple","Дыня":"Melon","Тыква":"Pumpkin","Апельсин":"Orange","Клубника":"Strawberry","Банан":"Banana","Груша":"Pear","Вишня":"Cherry","Персик":"Peach","Хлеб":"Bread","Леденец":"Lollipop","Пепси":"Pepsi","Кола":"Cola","Реактор":"Reactor","Юпитер":"Jupiter","Земля":"Earth","Метеорит":"Meteorite",
"Мировой арбуз":"World watermelon","Раунд":"Round","Полить":"Water","Лучшие поливальщики":"Top waterers","Твой вклад:":"Your contribution:","Арбуз ещё впитывает воду, подожди":"The melon is still soaking, wait","Монеты тратятся на рост арбуза":"Coins are spent on growing the melon","Можно полить через":"You can water again in","Весь сервер поливает один арбуз. Созреет: каждому участнику кристаллы и ×1.5 к доходу всем на 30 минут.":"The whole server waters one melon. When it ripens, every participant gets gems and everyone gets x1.5 income for 30 minutes.","Мировой арбуз созрел":"World watermelon ripened","Минимум 1 000 монет":"Minimum 1,000 coins","мл":"ml","Тапов":"Taps","тапов":"taps","генераторов":"generators","ко всему":"to everything","ему +":"them +","Опыт":"XP","Открыто":"Opened","из":"of"
});
EN_LIST.length = 0; Object.keys(EN).filter(k => k.length >= 4).sort((a, b) => b.length - a.length).forEach(k => EN_LIST.push(k));
let langObs = null;
function trNode(n) {
  if (n.nodeType === 3) { const p = n.parentNode; if (!p || p.closest && p.closest("[data-nt], #chatlist, textarea, script, style")) return; const v = trEn(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
  if (n.nodeType !== 1 || (n.closest && n.closest("[data-nt], #chatlist"))) return;
  if (n.placeholder && CY.test(n.placeholder)) n.placeholder = trEn(n.placeholder);
  if (n.title && CY.test(n.title)) n.title = trEn(n.title);
  for (const c of n.childNodes) trNode(c);
}
function langApply() {
  const en = LS("lang", "ru") === "en";
  document.documentElement.lang = en ? "en" : "ru";
  if (langObs) { langObs.disconnect(); langObs = null; }
  if (!en) return;
  let q = new Set(), t = 0;
  const flush = () => { t = 0; langObs.disconnect(); q.forEach(n => { if (document.body.contains(n)) trNode(n); }); q.clear(); langObs.observe(document.body, {childList: true, subtree: true, characterData: true}); };
  langObs = new MutationObserver(ms => { for (const m of ms) { if (m.type === "characterData") q.add(m.target); else m.addedNodes.forEach(n => q.add(n)); } if (!t) t = requestAnimationFrame(flush); });
  trNode(document.body); langObs.observe(document.body, {childList: true, subtree: true, characterData: true});
}
function langSet(l) { LSset("lang", l); if (l === "ru") { location.reload(); return; } langApply(); try { render(); } catch (e) {} }
A.lang = function (e) { const l = e.dataset.i; closeModal(); if (l === "ru") { const was = LS("lang", "ru") === "en"; LSset("lang", "ru"); if (was) location.reload(); else langApply(); return; } langSet(l); };
function langCard() {
  const en = LS("lang", "ru") === "en";
  return `<div class="card col" data-nt="1"><div class="t1" style="color:var(--pri)">Язык / Language</div><div class="seg" style="margin:0"><button class="${en ? "" : "on"}" data-a="lang" data-i="ru">Русский</button><button class="${en ? "on" : ""}" data-a="lang" data-i="en">English</button></div></div>`;
}
setTimeout(() => {
  if (LS("lang", null) === null) {
    let guess = "ru"; try { const lc = (tg.initDataUnsafe.user.language_code || "").toLowerCase(); if (lc && !["ru", "uk", "be"].includes(lc)) guess = "en"; } catch (e) {}
    modal(`<div data-nt="1" style="text-align:center"><div class="t1" style="font-size:20px">Выбери язык · Choose language</div><div style="display:flex;gap:10px;justify-content:center;margin-top:14px"><button class="btn ${guess === "ru" ? "" : "o"}" data-a="lang" data-i="ru">Русский</button><button class="btn ${guess === "en" ? "" : "o"}" data-a="lang" data-i="en">English</button></div></div>`);
  } else langApply();
}, 1200);

// ---------- Мировой арбуз: общий арбуз всего сервера
let WM = null;
async function wmLoad() { if (WM) WM.at = Date.now(); try { const r = await api("wm_info", {}); if (r && !r.error && r.goal) { WM = r; WM.at = Date.now(); if (tab === 3) render(); } } catch (e) {} }
function wmCard() {
  if (!WM) return "";
  const f = Math.min(1, WM.p / WM.goal), sz = Math.round(70 + 60 * f), mine = WM.my;
  const melon = `<svg viewBox="0 0 100 100" width="${sz}" height="${sz}" style="flex:none;transition:all .6s"><defs><radialGradient id="wmg" cx="38%" cy="32%"><stop offset="0" stop-color="#7bd16a"/><stop offset="1" stop-color="#1f7a3a"/></radialGradient></defs><ellipse cx="50" cy="55" rx="42" ry="38" fill="url(#wmg)"/><g stroke="#14572a" stroke-width="4" stroke-linecap="round" fill="none" opacity=".55"><path d="M50 18v74"/><path d="M30 24c-8 18-8 48 0 64"/><path d="M70 24c8 18 8 48 0 64"/><path d="M14 40c-2 12-1 24 4 34"/><path d="M86 40c2 12 1 24-4 34"/></g><path d="M50 18c0-8 6-12 12-12" stroke="#2e7d32" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
  const amts = [[.01, "1%"], [.1, "10%"], [.5, "50%"]].map(([k, l]) => [Math.max(1000, Math.floor(S.pts * k)), l]);
  const can = WM.cd <= 0;
  const cdTxt = WM.cd > 0 ? `Можно полить через ${Math.ceil(WM.cd / 60)} мин` : "Монеты тратятся на рост арбуза";
  return `<div class="card col clset"><div class="t1" style="display:flex;align-items:center;gap:8px;color:var(--pri)">${ic("star", 18)} Мировой арбуз<span class="t2" style="margin:0 0 0 auto;font-size:12px">Раунд ${WM.r}</span></div>
<div style="display:flex;align-items:center;gap:14px"><div style="width:130px;height:130px;display:flex;align-items:center;justify-content:center">${melon}</div><div class="grow"><div class="t2" style="margin:0">Весь сервер поливает один арбуз. Созреет: каждому участнику кристаллы и ×1.5 к доходу всем на 30 минут.</div><div class="t1" style="font-size:15px;margin-top:6px">${fmt(Math.floor(WM.p))} / ${fmt(WM.goal)} мл</div></div></div>
${bar(f)}
<div class="t2" style="margin:0;font-size:12px">Твой вклад: <b>${mine} мл</b> · ${cdTxt}</div>
<div style="display:flex;gap:8px;flex-wrap:wrap">${amts.map(([a, l]) => btn(`Полить ${l} · ${fmt(a)}`, "wmw", `data-i="${a}"${can && S.pts >= a ? "" : " disabled"}`, "o")).join("")}</div>
${WM.top.length ? `<div class="t2" style="margin:0;font-weight:700">Лучшие поливальщики</div>${WM.top.map((t, i) => `<div class="t2" style="margin:0;font-size:13px">${i + 1}. ${esc(t.name)} · ${t.ml} мл</div>`).join("")}` : ""}
${WM.last ? `<div class="t2" style="margin:0;font-size:12px">Прошлый арбуз (раунд ${WM.last.r}) созрел: участников ${WM.last.n}${WM.last.top[0] ? ", лучший: " + esc(WM.last.top[0].name) : ""}</div>` : ""}</div>`;
}
A.wmw = async function (e) {
  const amt = +e.dataset.i; await save(true); const r = await api("wm_water", {amt}); if (r.error) { toast(r.error); return wmLoad(); }
  adopt(r); WM = r.info; WM.at = Date.now(); gsfx("buy"); hap("ok");
  toast(r.harvest ? "Арбуз созрел! Награды уже в пути, доход ×1.5 для всех" : "Арбуз вырос на " + r.ml + " мл"); render();
};
