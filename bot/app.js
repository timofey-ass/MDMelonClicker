const tg = window.Telegram && Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor("#17110d"); tg.setBackgroundColor("#17110d"); tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (e) {} }
const $ = s => document.querySelector(s);
const {BUILDS, UPGR, ACH, RARS, ITEMS, CASES, SETS, PERKS, CAT_COST, SELL, UPCH, THEMES} = D;
const TECH_IMG = i => `https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/tech/${i}.jpg`;
const ADM_IMG = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/admin/0.jpg";
const JOSKE_IMG = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/main/joske.jpg";
const GEM_CASE = 3, FREE_EVERY = 4 * 3600;
const EMO = {"👆": "tap", "💥": "crit", "🔥": "fire", "🐱": "cat", "🐾": "paw", "🥛": "milk", "🐟": "fish", "🏭": "factory", "🌀": "portal", "🚀": "rocket", "📦": "cube", "🎁": "box", "👑": "crown", "⚡": "bolt", "💎": "gem", "🧾": "swap", "⭐": "star", "🎟": "ticket"};
const ic = (k, s, c) => `<svg class="ic" viewBox="0 0 24 24" width="${s || 20}" height="${s || 20}" fill="none" stroke="currentColor" stroke-width="2.04" stroke-linecap="round" stroke-linejoin="round"${c ? ` style="color:${c}"` : ""}>${IC[EMO[k] || k]}</svg>`;
const noemo = t => String(t).replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\u2B00-\u2BFF\uFE0F]+ ?/gu, "").trim();
const RC = ["#b0bec5", "#4fc3f7", "#ba68c8", "#ff5252", "#ffd740", "#1de9b6", "#ff1744", "#e040fb", "#ffd700"];
const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx"];
const now = () => Date.now() / 1000;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
function fmt(n) { n = +n; if (n < 1000) return (n >= 10 || n === Math.floor(n)) ? String(Math.floor(n)) : n.toFixed(1); if (n >= 1e24) return (n / 1e21).toExponential(2).replace("e+", "e") + "Sx"; const i = Math.min(Math.floor(Math.log10(n) / 3), 7); return (n / Math.pow(1000, i)).toFixed(2) + SUF[i]; }
function clock(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
function hap(k) { try { if (!tg || !tg.HapticFeedback || !LS("hap", 1)) return; if (k === "ok") tg.HapticFeedback.notificationOccurred("success"); else tg.HapticFeedback.impactOccurred(k || "light"); } catch (e) {} }
function LS(k, d) { try { const v = localStorage.getItem("md_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function LSset(k, v) { try { localStorage.setItem("md_" + k, JSON.stringify(v)); } catch (e) {} }
let tt = 0;
function toast(t) { const e = $("#toast"); e.textContent = noemo(t); e.classList.add("s"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("s"), 2200); }

// ---------- palette
function hsv(h, s, v) { h = (h % 360) / 60; const i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f)); const m = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]; return "#" + m.map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join(""); }
function setTheme(i) {
  const h = THEMES[i][1] === null ? 28 : THEMES[i][1]; const r = document.documentElement.style;
  const m = {"--surf": hsv(h, .34, .09), "--sc": hsv(h, .32, .14), "--sch": hsv(h, .30, .19), "--pri": hsv(h, .52, 1), "--onpri": hsv(h, .95, .22), "--prc": hsv(h, .68, .40), "--onprc": hsv(h, .20, 1), "--on": hsv(h, .07, .94), "--onv": hsv(h, .14, .80), "--out": hsv(h, .18, .60)};
  for (const k in m) r.setProperty(k, m[k]);
  try { tg && (tg.setHeaderColor(m["--surf"]), tg.setBackgroundColor(m["--surf"])); } catch (e) {}
}

// ---------- state
function defState() { return {pts: 0, run: 0, total: 0, taps: 0, click: 0, crit: 0, fev: 0, b: BUILDS.map(() => 0), gems: 0, ach: [], stars: 0, fevers: 0, prest: 0, ts: now(), daily: 0, boost: 0, inv: {}, eq: -1, opened: 0, pity: 0, freecase: 0, holo: [], xp: 0, fc: [0, 0, 0], hist: [], cv: 3, gt: 0, perks: {}, sets: []}; }
let S = null, rev = 0, snap = {inv: {}}, dirty = false, saving = false, me = {id: 0, name: ""};
let tab = 0, sub = 0, qty = 1, fever = 0, frenzy = 0, combo = 0, busy = false, armed = false, lbData = null, offData = null;
function fixState(s) { const d = defState(); for (const k in d) if (!(k in s) || s[k] === null || s[k] === undefined) s[k] = d[k]; if (s.b.length < BUILDS.length) s.b = s.b.concat(BUILDS.map(() => 0)).slice(0, BUILDS.length); if (!s.gt) s.gt = s.gems; return s; }
const cloneInv = () => ({inv: Object.assign({}, S.inv)});
const mark = () => { dirty = true; };

// ---------- economy (same formulas as the plugin)
const perk = k => +(S.perks[k] || 0);
const owned = () => S.b.reduce((a, b) => a + b, 0);
function collBonus() { let t = 0; for (const k in S.inv) { const i = +k; if (i < ITEMS.length) { const b = RARS[ITEMS[i][2]][2]; t += S.holo.includes(i) ? b * 1.5 : b; } } return Math.min(t, 900); }
function baseMult() { return 1 + .10 * Math.floor(S.gt / 25) + .02 * S.ach.length + collBonus() / 100 + SETS.filter(x => S.sets.includes(x[0])).reduce((a, x) => a + x[3], 0) / 100; }
function factor() { const t = now(); let f = baseMult(); if (t < S.boost) f *= 2; if (t < fever) f *= 2; if (t < frenzy) f *= 3; return f; }
const nerf = x => x <= 1e3 ? x : 1e3 * Math.pow(x / 1e3, .7);
function cpsRaw() { return BUILDS.reduce((a, b, i) => a + b[3] * S.b[i], 0) * factor() * (1 + .1 * perk("cps")); }
function cps() { return nerf(cpsRaw()); }
function tapValue() { return nerf((1 + S.click + .02 * cpsRaw() / Math.max(factor(), 1)) * factor() * (1 + .1 * perk("tap"))) * (("70" in S.inv) ? 1e21 : 1) * (("72" in S.inv) ? 40 : 1); }
const BGR = [1.15, 1.15, 1.15, 1.16, 1.17, 1.18, 1.18];
function bCost(i, n) { const g = BGR[i] || 1.15; return BUILDS[i][2] * Math.pow(g, S.b[i]) * (Math.pow(g, n) - 1) / (g - 1); }
function bCount(i) { if (qty === 1) return 1; if (qty === 10) return 10; let n = 0; while (n < 500 && bCost(i, n + 1) <= S.pts) n++; return Math.max(1, n); }
const UK = ["click", "crit", "fev"];
const uCost = i => Math.floor(UPGR[i][3] * Math.pow(UPGR[i][4], S[UK[i]]));
const freeEvery = () => FREE_EVERY * (1 - .15 * perk("case"));
const pendingGems = () => Math.floor(S.run / 1e6);
function level() { let xp = S.xp, lv = 1, need = 100; while (xp >= need && lv < 99) { xp -= need; lv++; need = 100 + 60 * lv; } return [lv, xp, need]; }
function addXp(n) { const b = level()[0]; S.xp += n; for (let lv = b + 1; lv <= level()[0]; lv++) { S.fc[0]++; if (lv % 5 === 0) S.fc[1]++; if (lv % 10 === 0) S.fc[2]++; toast("⭐ Уровень " + lv + "! Бесплатный кейс ждёт"); } }
const setIdx = key => { const s = SETS.find(x => x[0] === key); return ITEMS.map((it, i) => s[2].includes(it[1]) ? i : -1).filter(i => i >= 0); };
function stat(k) { if (k === "owned") return owned(); if (k === "items") return Object.keys(S.inv).length; return S[k] || 0; }
function checkAch() {
  for (const [key, nm, , bn] of SETS) if (!S.sets.includes(key) && setIdx(key).every(i => (i + "") in S.inv)) { S.sets.push(key); toast("Сет «" + nm + "» собран: +" + bn + "% ко всему"); hap("ok"); if (key === "tech") { LSset("fall", 3 + SETS.length - 1); toast("Течкоты собраны! Включён фон из нулей и единиц"); } try { fxConfetti(80); } catch (e) {} }
  for (const [id, title, , key, goal] of ACH) if (!S.ach.includes(id) && stat(key) >= goal) { S.ach.push(id); toast("🏆 " + title + ": +2% ко всему"); hap("ok"); }
}
const pickR = ri => { const l = ITEMS.map((it, i) => it[2] === ri ? i : -1).filter(i => i >= 0); return l[Math.floor(Math.random() * l.length)]; };
function rarR(w) { let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return 0; }
function roll(ci) { if (ci === 4) { const q = Math.random(); if (q < .02) return 72; if (q < .07) return 63; ci = 2; } let w = CASES[ci][3].slice(); if (S.pity >= 14) w = [0, 0].concat(w.slice(2)); return pickR(rarR(w)); }
function grant(idx, holo) { const k = idx + ""; const have = S.inv[k] || 0; S.inv[k] = have + 1; if (have === 0) { if (holo) { S.holo.push(idx); return "newholo"; } return "new"; } if (holo && !S.holo.includes(idx)) { S.holo.push(idx); return "holo"; } return "dup"; }
const dupCount = r => Object.keys(S.inv).reduce((a, k) => a + (ITEMS[+k][2] === r ? Math.max(0, S.inv[k] - 1) : 0), 0);
function takeDups(r, n) { for (const k of Object.keys(S.inv).sort((a, b) => S.inv[b] - S.inv[a])) { if (ITEMS[+k][2] !== r || n <= 0) continue; const t = Math.min(n, Math.max(0, S.inv[k] - 1)); S.inv[k] -= t; n -= t; } }
const sellVal = r => (1000 + cps() * 10) * SELL[r];
const SELLGEM = [0, 0, 0, 0, 0, 0, 0];

// ---------- ui helpers
const bar = f => `<div class="wb"><div class="tr"></div><div class="ac" style="width:${Math.max(0, Math.min(1, f)) * 100}%"><i></i></div></div>`;
const NAV = [["Игра", "game"], ["Магазин", "bag"], ["Кейсы", "box"], ["Награды", "cup"], ["Топ", "podium"], ["Ещё", "tune"]];
function buildNav() { $("#nav").innerHTML = NAV.map((n, i) => `<button data-a="tab" data-i="${i}"><span class="pill">${ic(n[1], 24)}</span>${n[0]}</button>`).join(""); }
function setNav() { document.querySelectorAll("#nav button").forEach((b, i) => b.classList.toggle("on", i === tab)); $("#ttl").textContent = ["MDMelonClicker", "Магазин", "Кейсы", "Награды", "Топ", "Ещё"][tab]; }
const btn = (txt, a, attrs, cls) => `<button class="btn ${cls || ""}" data-a="${a}" ${attrs || ""}>${txt}</button>`;
const cost = (c, cur) => `data-cost="${c}" data-cur="${cur || "pts"}"`;
const circ = (icon, sz) => `<div class="circ" style="${sz ? `width:${sz}px;height:${sz}px` : ""}">${ic(icon, Math.round((sz || 46) * .56))}</div>`;
function row(icon, t1, t2, rightHtml, click) { return `<div class="card ${click ? "click" : ""}" ${click || ""}>${circ(icon)}<div class="grow"><div class="t1">${t1}</div><div class="t2">${t2}</div></div>${rightHtml || ""}</div>`; }

// ---------- render
function render() {
  if (!S) return; setNav(); const v = $("#view"), st = v.scrollTop;
  v.innerHTML = [tGame, tShop, tCases, tAch, tTop, tMore][tab]();
  v.scrollTop = st; refresh(true);
  if (tab === 4) { if (sub === 0 && !lbData) loadTop(); if (sub === 1 && !offData) loadOffers(); }
}
function refresh(full) {
  $("#gemc").innerHTML = ic("gem", 14) + S.gems;
  const t = now();
  if (tab === 0) {
    const set = (id, h) => { const e = $("#" + id); if (e) e.textContent = h; };
    set("c-cps", fmt(cps()) + "/с"); const ct = $("#c-tap"); if (ct) ct.innerHTML = ic("tap", 14) + fmt(tapValue()); set("c-pts", fmt(S.pts));
    const b = []; if (t < S.boost) b.push("x2 " + Math.ceil(S.boost - t) + "с"); if (t < fever) b.push("🔥 " + Math.ceil(fever - t) + "с"); if (t < frenzy) b.push("x3 " + Math.ceil(frenzy - t) + "с");
    const e = $("#c-buff"); if (e) { e.innerHTML = b.join(" · ").replace("🔥", ic("fire", 14)); e.style.display = b.length ? "" : "none"; }
    const f = $("#combo"); if (f) f.style.width = (t < fever ? 100 : combo) + "%";
    const d = $("#daily"); if (d) d.style.display = t - S.daily >= 20 * 3600 ? "" : "none";
    const m = $("#c-mult"); if (m) m.textContent = "бонус x" + baseMult().toFixed(2);
  }
  document.querySelectorAll("[data-cost]").forEach(e => { const c = +e.dataset.cost, h = e.dataset.cur === "gems" ? S.gems : S.pts; e.classList.toggle("dis", h < c); });
  if (tab === 4 || tab === 1) { const p = $("#pres"); if (p) p.innerHTML = ic("gem", 16) + "+" + pendingGems(); }
  const fr = $("#freeT"); if (fr) { const l = freeEvery() - (t - S.freecase); fr.textContent = l <= 0 ? "Готов!" : (l < 3600 ? "Через " + clock(l) : "Через " + Math.floor(l / 3600) + " ч " + Math.floor(l % 3600 / 60) + " мин"); const b = $("#freeB"); if (b) b.classList.toggle("dis", l > 0); }
}
function tGame() {
  const eq = +S.eq; const coin = eq >= 0 && (eq + "") in S.inv ? eq : 63;
  return `<div class="chips"><span class="chip" id="c-cps">0/с</span><span class="chip" id="c-tap"></span><span class="chip" id="c-mult"></span><span class="chip p" id="c-buff" style="display:none"></span></div>
  <div style="text-align:center;font-size:44px;font-weight:800;margin:6px 0 0;color:var(--on)" id="c-pts">0</div>
  <div id="field"><div id="ring"></div><div id="coin" data-coin>${catEl(coin, 240, {})}</div></div>
  <div style="display:flex;align-items:center;gap:10px;margin:0 4px 10px"><span class="t2" style="font-weight:700;display:flex;align-items:center;gap:6px">${ic("fire", 14)}Комбо</span><div class="wb grow"><div class="tr"></div><div class="ac" id="combo" style="width:0%"><i></i></div></div></div>
  <div class="card p" id="daily" style="display:none"><div class="grow t1" style="display:flex;align-items:center;gap:8px">${ic("box", 18)}Ежедневный бонус готов</div>${btn("Забрать", "daily")}</div>`;
}
function tShop() {
  let h = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span class="t2 grow" style="font-weight:700">Покупать:</span>${[1, 10, 999].map(q => `<button class="chip ${qty === q ? "p" : ""}" style="border:0;font-family:inherit" data-a="qty" data-i="${q}">${q === 999 ? "MAX" : "x" + q}</button>`).join("")}</div>`;
  const bc = Math.max(5000, cps() * 300);
  h += row("bolt", "Ускорение x2 на 60 с", "Удваивает весь доход и тапы", btn(fmt(bc), "boost", cost(bc)));
  h += row("gem", "Перерождение", "Сброс прогресса за самоцветы. Каждые 25 самоцветов дают +10% ко всему навсегда", btn("", "prest", 'id="pres"', "o"));
  h += `<div style="display:flex;align-items:center" class="sec"><span class="grow" style="margin:0">Самоцветы</span><span class="chip p">${ic("gem", 14)}${S.gems}</span></div>`;
  for (const [k, icon, name, desc, base, cap] of PERKS) { const lv = perk(k), c = base * (lv + 1); h += row(icon, `${name} · ур. ${lv}/${cap}`, desc, lv >= cap ? `<span class="chip p">МАКС</span>` : btn(ic("gem", 14) + c, "perk", `data-i="${k}" ${cost(c, "gems")}`, "o")); }
  h += `<div class="card col"><div class="t1">Кот на выбор</div><div class="t2">Гарантированный случайный кот нужной редкости</div><div class="buyrow">${[1, 2, 3, 4].map(r => btn(`${RARS[r][0]} ${ic("gem", 14)}${CAT_COST[r]}`, "buycat", `data-i="${r}" ${cost(CAT_COST[r], "gems")} style="color:${RC[r]}"`, "o")).join("")}</div></div>`;
  h += `<div class="sec">Улучшения</div>`;
  UPGR.forEach((u, i) => { const c = uCost(i), mx = S[UK[i]] >= u[5]; h += row(u[0], `${u[1]}  ур. ${S[UK[i]]}`, u[2], mx ? `<span class="chip p">МАКС</span>` : btn(fmt(c), "upg", `data-i="${i}" ${cost(c)}`)); });
  h += `<div class="sec">Генераторы</div>`;
  BUILDS.forEach((b, i) => { const n = bCount(i), c = bCost(i, n), cp = b[3] * factor(); h += row(b[0], `${b[1]}  ×${S.b[i]}`, `+${fmt(cp)}/с каждый · сейчас ${fmt(cp * S.b[i])}/с`, btn((n > 1 ? "×" + n + " · " : "") + fmt(c), "bld", `data-i="${i}" ${cost(c)}`)); });
  return h;
}
function tCases() {
  const [lv, xp, need] = level(); const t = now(); let h = "";
  h += `<div class="card col"><div style="display:flex;align-items:center"><div class="t1 grow" style="display:flex;align-items:center;gap:8px">${ic("box", 18)}Кейсы</div><span class="chip p">Ур. ${lv}</span></div><div class="t2">Собрано ${Object.keys(S.inv).filter(k => +k < 70 || +k >= 72).length} из ${ITEMS.length - 2} · бонус +${collBonus()}% ко всему · открыто ${S.opened}</div>${bar(Math.max(.02, xp / need))}<div class="t2" style="color:var(--out);font-size:11px">${xp} / ${need} XP · за уровень бесплатный кейс</div></div>`;
  h += `<div class="card p"><div class="grow"><div class="t1" style="display:flex;align-items:center;gap:8px">${ic("ticket", 18)}Бесплатный кейс</div><div class="t2" id="freeT"></div></div>${btn("Открыть", "free", 'id="freeB"')}</div>`;
  if (S.fc.some(x => x > 0)) h += `<div class="card"><div class="t1 grow" style="display:flex;align-items:center;gap:8px">${ic("ticket", 16)}За уровни:</div>${[0, 1, 2].filter(c => S.fc[c] > 0).map(c => btn(ic(CASES[c][0], 16) + "×" + S.fc[c], "lvcase", `data-i="${c}"`)).join("")}</div>`;
  CASES.forEach((c, ci) => {
    const tot = c[3].reduce((a, b) => a + b, 0); const ch = c[3].map((x, i) => x ? RARS[i][0].slice(0, 5) + ". " + String(+(x / tot * 100).toFixed(1)) + "%" : "").filter(Boolean).join(" · "); const cur = ci === GEM_CASE ? "gems" : "pts";
    h += `<div class="card${ci === 4 ? " bluecase" : ci === 5 ? " redcase" : ""}">${circ(c[0], 54)}<div class="grow"><div class="t1">${c[1]}</div><div class="t2" style="font-size:11px">${ci === 5 ? "70% — монеты (от 0.4× до 3× цены), 30% — течкот: Google, OnePlus, Vivo, Apple, Xiaomi, Samsung. Каждый даёт +50% ко всему" : ci === 4 ? "Шанс 2% выбить Королевского арбуза (×40 к тапу), 5% — особого кота Джоске (+100% ко всему). Иначе падает как в Золотом: " + ch : ch}</div></div>${btn((ci === GEM_CASE ? ic("gem", 14) : "") + fmt(c[2]), "case", `data-i="${ci}" data-n="1" ${cost(c[2], cur)}`)}${btn("×5", "case", `data-i="${ci}" data-n="5" ${cost(c[2] * 5, cur)}`, "o")}</div>`;
  });
  h += `<div class="t2" style="margin:4px 4px 8px">×5 — пачкой. Каждые 10 открытий без эпика дают гарантированный эпик+. Голограмма: шанс 6% (12% в Золотом и Алмазном), даёт ×2 к бонусу.</div>`;
  if (S.hist.length) h += `<div class="sec">Последние выпадения</div><div class="hs">${S.hist.slice(-10).reverse().map(i => catEl(i, 44)).join("")}</div>`;
  h += `<div class="sec">Запас дубликатов</div>`;
  RARS.forEach((R, r) => { if (r > 6) return; const d = dupCount(r); h += `<div class="card"><div class="grow"><div class="t1" style="color:${RC[r]}">${R[0]} ×${d}</div><div class="t2" style="font-size:11px">${r < 4 ? `Контракт: 5 → 1 выше · Апгрейд: 1 дубль, шанс ${Math.round(UPCH[r] * 100)}%` : "Только продажа"}</div></div>${r < 4 ? `<button class="chip ${d >= 5 ? "" : "dis"}" style="border:0;font-family:inherit" data-a="contract" data-i="${r}">5→1</button><button class="chip ${d >= 1 ? "" : "dis"}" style="border:0;font-family:inherit" data-a="upgrade" data-i="${r}">Апгрейд</button>` : ""}<button class="chip ${d >= 1 ? "" : "dis"}" style="border:0;font-family:inherit;color:var(--gold)" data-a="sell" data-i="${r}">${ic("coin", 14)}${fmt(d * sellVal(r))}${SELLGEM[r] ? " +" + d * SELLGEM[r] + "💎" : ""}</button></div>`; });
  h += `<div class="sec">Коллекция · нажми на кота, чтобы поставить его на монету</div>`;
  for (let ri = RARS.length - 1; ri >= 0; ri--) {
    const ids = ITEMS.map((it, i) => it[2] === ri && (i < 70 || i >= 72 || (i + "") in S.inv) ? i : -1).filter(i => i >= 0); if (!ids.length) continue;
    h += `<div style="font-size:11px;font-weight:700;color:${RC[ri]};margin:8px 4px 4px">${RARS[ri][0]} · ${ri === 8 ? "×40 к тапу" : ri === 7 ? "×1 секстилион к одному тапу" : "+" + RARS[ri][2] + "% за предмет"}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">`;
    for (const idx of ids) { const o = S.inv[idx + ""] || 0, ho = S.holo.includes(idx), isq = +S.eq === idx;
      h += `<div class="cell${o ? " fxc" : ""}" ${o ? `data-a="equip" data-i="${idx}"` : ""} style="${isq || ho ? `box-shadow:inset 0 0 0 2px ${ho ? "#fff" : RC[ri]}` : ""}">${o ? catEl(idx, 52, {holo: ho, fx: true}) : `<div class="q">?</div>`}<span style="color:${o ? RC[ri] : "var(--out)"}">${o ? (ho ? "★ " : "") + ITEMS[idx][1] : "???"}</span>${o > 1 ? `<span style="color:var(--onv);font-weight:500">×${o}</span>` : ""}</div>`; }
    h += `</div>`;
  }
  return h;
}
const WKT = [["Открой 20 кейсов", 20, 4, () => S.opened], ["Сделай 3000 тапов", 3000, 3, () => S.taps], ["Купи 50 генераторов", 50, 3, () => owned()]];
function wkEnsure() { const w = Math.floor(now() / 604800); if (!S.wk || S.wk.w !== w) S.wk = {w, base: WKT.map(t => t[3]()), done: []}; return S.wk; }
function wkHtml() {
  const W = wkEnsure(), left = Math.max(1, Math.ceil(((W.w + 1) * 604800 - now()) / 86400));
  let h = `<div class="sec">Задания недели · до сброса ${left} дн.</div>`;
  WKT.forEach((t, i) => { const p = Math.max(0, Math.min(t[1], t[3]() - W.base[i])), dn = W.done.includes(i), ok = p >= t[1]; h += `<div class="card ${dn ? "p" : ""}"><div class="grow"><div class="t1">${t[0]}</div><div class="t2">${fmt(p)} / ${fmt(t[1])}</div></div>${dn ? `<span class="chip">Получено</span>` : `<button class="btn${ok ? "" : " o"}" data-a="wk" data-i="${i}">${ic("gem", 14)}+${t[2]}</button>`}</div>`; });
  return h;
}
function tAch() {
  let h = `<div class="t2" style="margin:0 4px 8px">Открыто ${S.ach.length} из ${ACH.length} · бонус +${2 * S.ach.length}% ко всему</div>`;
  for (const [id, title, desc, key, goal] of ACH) { const dn = S.ach.includes(id), n = Math.min(stat(key), goal); h += `<div class="card ${dn ? "p" : ""}"><div class="circ" style="${dn ? "background:var(--pri);color:var(--onpri)" : ""}">${ic(dn ? "check" : "lock", 26)}</div><div class="grow"><div class="t1">${title}</div><div class="t2">${desc} · ${fmt(n)}/${fmt(goal)}</div>${dn ? "" : `<div style="margin-top:6px">${bar(n / goal)}</div>`}</div></div>`; }
  h += wkHtml();
  h += `<div class="sec">Сеты котов · нажми, чтобы посмотреть</div>`;
  for (const [key, nm, , bn] of SETS) { const ids = setIdx(key), have = ids.filter(i => (i + "") in S.inv).length, dn = S.sets.includes(key); h += `<div class="card click ${dn ? "p" : ""}" data-a="set" data-i="${key}"><div class="grow"><div class="t1">${nm} · ${have}/${ids.length}</div><div class="t2">+${bn}% ко всему</div><div style="margin-top:6px">${bar(have / ids.length)}</div></div>${dn ? ic("check", 22) : ""}</div>`; }
  return h;
}
function tTop() {
  let h = `<div class="seg"><button class="${sub === 0 ? "on" : ""}" data-a="sub" data-i="0">Лидеры</button><button class="${sub === 1 ? "on" : ""}" data-a="sub" data-i="1">Обмен котами</button></div>`;
  if (sub === 0) {
    h += `<div class="card"><div class="grow"><div class="t1" style="display:flex;align-items:center;gap:8px">${ic("medal", 18)}Таблица лидеров</div><div class="t2">Очки: накоплено за всё время</div></div>${btn("Обновить", "reloadtop")}</div>`;
    if (!lbData) return h + `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
    h += `<div class="card" style="background:var(--sch)"><div class="t1 grow" style="color:var(--onprc)">Ты: ${esc(me.name)}${lbData.rank ? " · место " + lbData.rank : ""}</div></div>`;
    lbData.rows.forEach((r, i) => { h += `<div class="card ${r.id === me.id ? "p" : ""}"><div class="circ" style="width:38px;height:38px;font-size:15px;font-weight:700"><span style="color:${["#ffd54f", "#cfd8dc", "#d7966a"][i] || "inherit"}">${i + 1}</span></div><div class="grow"><div class="t1">${esc(r.name || "Игрок")}</div></div><div class="t1">${fmt(r.total)}</div></div>`; });
    return h;
  }
  h += `<div class="card"><div class="grow"><div class="t1" style="display:flex;align-items:center;gap:8px">${ic("swap", 18)}Обмен котами</div><div class="t2">Меняй дубликаты с другими игроками. Предложенный кот уходит в залог и возвращается при отмене.</div></div></div><div style="display:flex;gap:8px;margin-bottom:10px">${btn("Создать предложение", "newoffer")}${btn("Обновить", "reloadoff", "", "t")}</div>`;
  if (!offData) return h + `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
  const mine = offData.filter(o => o.seller === me.id), oth = offData.filter(o => o.seller !== me.id);
  if (mine.length) { h += `<div class="sec">Мои предложения</div>`; mine.forEach(o => h += offerCard(o, true)); }
  h += `<div class="sec">Все предложения</div>`;
  h += oth.length ? oth.map(o => offerCard(o, false)).join("") : `<div class="t2" style="text-align:center;margin:20px">Пока нет предложений</div>`;
  return h;
}
function offerCard(o, mineF) {
  const can = (S.inv[o.want + ""] || 0) >= 1;
  return `<div class="card">${catEl(o.give, 52, {})}<div style="color:var(--onv)">${ic("arrow", 22)}</div>${catEl(o.want, 52, {})}<div class="grow"><div class="t1" style="font-size:13px"><span class="rar${ITEMS[o.give][2]}">${ITEMS[o.give][1]}</span> за <span class="rar${ITEMS[o.want][2]}">${ITEMS[o.want][1]}</span></div><div class="t2">${mineF ? "Твоё предложение" : esc(o.sname || "Игрок")}</div></div>${mineF ? btn("Отмена", "canceloff", `data-i="${o.id}"`, "o") : btn("Обменять", "accept", `data-i="${o.id}"`, can ? "" : "dis")}</div>`;
}
function tMore() {
  let h = `<div class="card"><div class="grow"><div class="t1">${esc(me.name || "Игрок")}</div><div class="t2">ID ${me.id}</div></div></div>`;
  h += `<div class="sec">Тема</div><div class="hs">${THEMES.map((t, i) => `<button class="chip ${LS("th", 0) === i ? "p" : ""}" style="border:0;font-family:inherit" data-a="theme" data-i="${i}">${t[0]}</button>`).join("")}</div>`;
  h += `<div class="sec">Настройки</div><div class="card click" data-a="hap"><div class="t1 grow">Вибрация</div><div class="sw ${LS("hap", 1) ? "on" : ""}"></div></div>`;
  h += `<div class="sec">Перенос из плагина</div><div class="card col"><div class="t2">В плагине MDMelonClicker: Ещё → «Код переноса в бота». Скопируй код и вставь сюда. Перенос можно сделать один раз, он заменит прогресс в боте.</div><textarea id="imp" rows="3" placeholder="MDC1:…"></textarea>${btn("Перенести прогресс", "import")}</div>`;
  h += `<div class="sec">О боте</div><div class="card col"><div class="t2">Питомец-тамагочи, рыбки, задания и админка живут в плагине для exteraGram: ставь плагин, и твой прогресс можно переносить сюда. Прогресс бота хранится на сервере и привязан к твоему аккаунту Телеграма.</div></div>`;
  return h;
}

// ---------- overlays
function ov(html) { const o = document.createElement("div"); o.className = "ov"; o.innerHTML = html; document.body.appendChild(o); busy = true; return o; }
function closeOv() { document.querySelectorAll(".ov").forEach(o => o.remove()); busy = false; render(); }
const KIND = {new: "Новый кот!", newholo: "Новый · голограмма!", holo: "Голограмма!", dup: "Дубликат"};
function rvHtml(win, kind) { const R = ITEMS[win][2]; return `<div class="rv"><div style="filter:drop-shadow(0 0 28px ${RC[R]});transform:scale(0);animation:pop .45s .05s forwards">${catEl(win, 190, {holo: kind === "newholo" || kind === "holo" || S.holo.includes(win)})}</div><div style="font-size:22px;font-weight:700;color:${RC[R]}">${ITEMS[win][1]}</div><div class="t2">${RARS[R][0]} · ${KIND[kind]}</div></div>`; }
function showResult(icon, res, title, again) {
  const o = ov(`<h2>${title || ""}</h2><div style="animation:bn .5s 3;color:var(--on)" id="chest">${ic(icon, 120)}</div>`); hap("medium");
  setTimeout(() => { if (!document.body.contains(o)) return; hap("ok"); o.innerHTML = `<h2>${title || ""}</h2>` + (res[0] === null ? `<div class="rv"><div style="color:var(--onv)">${ic("smoke", 90)}</div><div class="t1">Не повезло…</div><div class="t2">Дубль сгорел</div></div>` : rvHtml(res[0], res[1])) + `<div style="margin-top:26px;display:flex;gap:10px">${again ? btn("Ещё раз", "again", `data-i="${again[0]}" data-n="${again[1]}"`, "t") : ""}${btn("Закрыть", "close")}</div>`; render(); }, 1100);
}
function showMulti(ci, wins, n) {
  const o = ov(`<h2>${CASES[ci][1]} ×${n}</h2><div style="animation:bn .5s 3;color:var(--on)">${ic(CASES[ci][0], 120)}</div>`); hap("medium");
  setTimeout(() => { if (!document.body.contains(o)) return; hap("ok"); o.innerHTML = `<h2>${CASES[ci][1]} ×${n}</h2><div class="rgrid">${wins.map(([w, k]) => `<div class="cell">${catEl(w, 64, {holo: S.holo.includes(w)})}<span class="rar${ITEMS[w][2]}">${ITEMS[w][1]}</span><span style="color:var(--onv);font-weight:500">${KIND[k]}</span></div>`).join("")}</div><div style="margin-top:20px;display:flex;gap:10px">${btn("Ещё ×" + n, "again", `data-i="${ci}" data-n="${n}"`, "t")}${btn("Закрыть", "close")}</div>`; render(); }, 1100);
}
function showSet(key) {
  const s = SETS.find(x => x[0] === key), ids = setIdx(key); const have = ids.filter(i => (i + "") in S.inv).length;
  ov(`<h2>${s[1]} · ${have}/${ids.length}</h2><div class="rgrid">${ids.map(i => { const o = (i + "") in S.inv; return `<div class="cell" style="opacity:${o ? 1 : .35}">${o ? catEl(i, 64, {holo: S.holo.includes(i)}) : `<div class="q">?</div>`}<span class="rar${ITEMS[i][2]}">${o ? ITEMS[i][1] : "???"}</span></div>`; }).join("")}</div><div style="margin-top:20px">${btn("Закрыть", "close")}</div>`);
}

// ---------- actions
function openCase(ci, mode, n) {
  if (busy) return; n = n || 1; const t = now();
  if (mode === 1) { if (t - S.freecase < freeEvery()) return toast("Бесплатный кейс ещё не готов"); S.freecase = t; }
  else if (mode === 2) { if (S.fc[ci] < 1) return; S.fc[ci]--; n = 1; }
  else { const c = CASES[ci][2] * n; if (ci === GEM_CASE) { if (S.gems < c) return toast("Не хватает самоцветов"); S.gems -= c; } else { if (S.pts < c) return toast("Не хватает монет"); S.pts -= c; } }
  const wins = [];
  for (let k = 0; k < n; k++) { const win = roll(ci), holo = Math.random() < (ci < 2 ? .06 : .12); S.opened++; S.pity = ITEMS[win][2] >= 2 ? 0 : S.pity + 1; const kind = grant(win, holo); S.hist = S.hist.concat([win]).slice(-14); addXp(20 + 15 * ITEMS[win][2]); wins.push([win, kind]); }
  checkAch(); mark(); save(true);
  if (n === 1) showResult(CASES[ci][0], wins[0], CASES[ci][1], mode === 0 ? [ci, 1] : null); else showMulti(ci, wins, n);
}
function afterCraft(win) { S.hist = S.hist.concat([win]).slice(-14); addXp(10 + 10 * ITEMS[win][2]); checkAch(); mark(); save(true); }
const A = {
  tab(e) { tab = +e.dataset.i; render(); $("#view").scrollTop = 0; },
  sub(e) { sub = +e.dataset.i; render(); },
  daily() { if (now() - S.daily < 20 * 3600) return; const gap = now() - S.daily; S.dstreak = gap < 48 * 3600 ? Math.min((S.dstreak || 0) + 1, 99) : 1; S.daily = now(); const sk = S.dstreak, b = Math.max(500, cps() * 600) * (1 + .25 * Math.min(sk - 1, 8)); if (sk % 7 === 0) { S.gems += 3; toast("🔥 Серия " + sk + " дн.: +3 самоцвета"); } S.pts += b; S.run += b; S.total += b; toast("🎁 +" + fmt(b) + (sk > 1 ? " · серия " + sk + " дн. (+" + Math.min(sk - 1, 8) * 25 + "%)" : "")); hap("ok"); mark(); render(); },
  qty(e) { qty = +e.dataset.i; render(); },
  boost() { const c = Math.max(5000, cps() * 300); if (S.pts < c) return; if (now() < S.boost + 180) return toast("Ускорение ещё остывает"); S.pts -= c; S.boost = now() + 60; mark(); hap(); render(); },
  prest() { const g = pendingGems(); if (g < 1) return toast("Нужно накопить хотя бы 1 000 000 за забег"); if (!armed) { armed = true; toast("Нажми ещё раз: сброс за 💎 " + g); setTimeout(() => armed = false, 4000); return; } armed = false; Object.assign(S, {pts: 0, run: 0, click: 0, crit: 0, fev: 0, b: BUILDS.map(() => 0), boost: 0}); S.gems += g; S.gt += g; S.prest++; fever = frenzy = 0; toast("💎 +" + g + ". Бонус теперь +" + 10 * S.gt + "%"); hap("ok"); mark(); save(true); render(); },
  perk(e) { const k = e.dataset.i, p = PERKS.find(x => x[0] === k), lv = perk(k), c = p[4] * (lv + 1); if (lv >= p[5]) return; if (S.gems < c) return toast("Не хватает самоцветов"); S.gems -= c; S.perks[k] = lv + 1; mark(); hap(); render(); },
  buycat(e) { if (busy) return; const r = +e.dataset.i; if (S.gems < CAT_COST[r]) return toast("Не хватает самоцветов"); S.gems -= CAT_COST[r]; const w = pickR(r), k = grant(w, Math.random() < .06); afterCraft(w); showResult("gem", [w, k], "Кот на выбор"); },
  upg(e) { const i = +e.dataset.i, c = uCost(i); if (S.pts < c || S[UK[i]] >= UPGR[i][5]) return; S.pts -= c; S[UK[i]]++; mark(); hap(); render(); },
  bld(e) { const i = +e.dataset.i, n = bCount(i), c = bCost(i, n); if (S.pts < c) return; S.pts -= c; S.b[i] += n; checkAch(); mark(); hap(); render(); },
  free() { openCase(0, 1); },
  lvcase(e) { openCase(+e.dataset.i, 2); },
  case(e) { openCase(+e.dataset.i, 0, +e.dataset.n); },
  again(e) { closeOv(); openCase(+e.dataset.i, 0, +e.dataset.n); },
  close() { closeOv(); },
  equip(e) { const i = +e.dataset.i; S.eq = +S.eq === i ? -1 : i; toast("Монета: " + (S.eq >= 0 ? ITEMS[i][1] : "обычная")); mark(); render(); },
  contract(e) { const r = +e.dataset.i; if (busy || r >= 4 || dupCount(r) < 5) return; takeDups(r, 5); const w = pickR(r + 1), k = grant(w, Math.random() < .06); afterCraft(w); showResult("swap", [w, k], "Контракт"); },
  upgrade(e) { const r = +e.dataset.i; if (busy || r >= 4 || dupCount(r) < 1) return; takeDups(r, 1); if (Math.random() < UPCH[r]) { const w = pickR(r + 1), k = grant(w, Math.random() < .06); afterCraft(w); showResult("up", [w, k], "Апгрейд"); } else { mark(); save(true); showResult("up", [null, "fail"], "Апгрейд"); } },
  sell(e) { const r = +e.dataset.i, n = dupCount(r); if (n < 1) return; const g = n * sellVal(r); takeDups(r, n); S.pts += g; S.run += g; S.total += g; const gg = n * SELLGEM[r]; S.gems += gg; toast("Продано " + n + " шт. за " + fmt(g) + (gg ? " и " + gg + " самоцв." : "")); mark(); save(true); render(); },
  set(e) { showSet(e.dataset.i); },
  theme(e) { LSset("th", +e.dataset.i); setTheme(+e.dataset.i); render(); },
  hap() { LSset("hap", LS("hap", 1) ? 0 : 1); render(); },
  reloadtop() { lbData = null; render(); },
  reloadoff() { offData = null; render(); },
  async import() {
    const code = ($("#imp").value || "").trim(); if (!code) return toast("Вставь код из плагина");
    let st; try { st = await decodeCode(code); } catch (e) { return toast("Код не распознан"); }
    if (!st || typeof st !== "object" || !st.b || !st.inv) return toast("Это не код прогресса");
    st = fixState(st);
    const o = ov(`<h2>Перенос прогресса</h2><div class="card col" style="width:100%"><div class="t1">Из плагина: ${fmt(st.total)} очков</div><div class="t2">Котов: ${Object.keys(st.inv).length}, самоцветов: ${st.gems}, перерождений: ${st.prest}</div><div class="t2">Текущий прогресс в боте будет заменён. Это можно сделать только один раз.</div></div><div style="display:flex;gap:10px;margin-top:20px">${btn("Отмена", "close", "", "t")}${btn("Перенести", "doimport")}</div>`);
    window._imp = st;
  },
  async doimport() { const st = window._imp; const r = await api("import", {state: st}); if (r.error) { toast(r.error); return; } S = fixState(r.state); rev = r.rev; snap = cloneInv(); dirty = false; closeOv(); toast("Прогресс перенесён!"); hap("ok"); tab = 0; render(); },
  newoffer() { startOffer(); },
  async canceloff(e) { await save(true); const r = await api("cancel", {id: +e.dataset.i}); if (r.error) return toast(r.error); adopt(r); offData = null; toast("Предложение снято"); render(); },
  async accept(e) { const id = +e.dataset.i, o = offData.find(x => x.id === id); if (!o) return; if ((S.inv[o.want + ""] || 0) < 1) return toast("У тебя нет кота: " + ITEMS[o.want][1]); await save(true); const r = await api("accept", {id}); if (r.error) { toast(r.error); offData = null; render(); return; } adopt(r); checkAch(); mark(); offData = null; toast("Обмен состоялся!"); hap("ok"); render(); },
};
function adopt(r) { S = fixState(r.state); rev = r.rev; snap = cloneInv(); dirty = false; }
let offer = {give: null, want: null};
function startOffer() {
  const dups = Object.keys(S.inv).filter(k => S.inv[k] >= 1 && +k !== 70 && +k !== 71).map(Number).sort((a, b) => ITEMS[b][2] - ITEMS[a][2] || a - b);
  if (!dups.length) return toast("У тебя нет котов для обмена");
  offer = {give: null, want: null};
  const o = ov(""); const draw = () => {
    const tile = (kind, i, n) => `<div class="cell tcell" data-pick="${kind}" data-i="${i}" style="${offer[kind] === i ? "box-shadow:inset 0 0 0 2px var(--pri);background:var(--sc2,var(--sc))" : ""}">${n > 1 ? `<i class="tcnt">×${n}</i>` : ""}${catEl(i, 76, {})}<span class="rar${ITEMS[i][2]}">${ITEMS[i][1]}</span></div>`;
    const all = ITEMS.map((it, i) => i).filter(i => i !== 70 && i !== 71).sort((a, b) => ITEMS[b][2] - ITEMS[a][2] || a - b);
    o.innerHTML = `<h2>Новое предложение</h2><div class="t2" style="width:100%">Ты отдаёшь:</div><div class="rgrid">${dups.map(i => tile("give", i, S.inv[i + ""])).join("")}</div><div class="t2" style="width:100%;margin-top:14px">Хочешь получить:</div><div class="rgrid">${all.map(i => tile("want", i, 0)).join("")}</div><div style="margin:20px 0;display:flex;gap:10px">${btn("Отмена", "close", "", "t")}${btn("Предложить", "mkoffer")}</div>`;
    o.querySelectorAll("[data-pick]").forEach(e => e.onclick = () => { offer[e.dataset.pick] = +e.dataset.i; const st = o.scrollTop; draw(); o.scrollTop = st; });
  }; draw();
}
A.mkoffer = async function () { if (offer.give === null || offer.want === null) return toast("Выбери обоих котов"); if (offer.give === offer.want) return toast("Коты должны отличаться"); await save(true); const r = await api("offer", offer); if (r.error) return toast(r.error); adopt(r); offData = null; closeOv(); sub = 1; toast("Предложение создано"); render(); };

document.addEventListener("click", e => { const el = e.target.closest("[data-a]"); if (!el) return; if (el.classList.contains("dis") && el.dataset.a !== "accept") { hap("light"); return; } const f = A[el.dataset.a]; if (f) f(el); });

// ---------- coin / loop
function floatTxt(txt, color, size, x, y) { const f = $("#field"); if (!f) return; const e = document.createElement("div"); e.className = "fl"; e.textContent = txt; e.style.color = color; e.style.fontSize = size + "px"; e.style.marginLeft = (x !== undefined ? x : (Math.random() * 160 - 80)) + "px"; e.style.marginTop = (y !== undefined ? y : -100) + "px"; f.appendChild(e); setTimeout(() => e.remove(), 800); }
function tap() {
  const t = now(); let g = tapValue(); const crit = Math.random() < Math.min(.65, .05 + .03 * S.crit); if (crit) g *= 5;
  S.pts += g; S.run += g; S.total += g; S.taps++;
  if (t >= fever) { combo = Math.min(100, combo + 7); if (combo >= 100) { fever = t + 6 + S.fev; S.fevers++; toast("🔥 Лихорадка! x2"); hap("heavy"); } }
  hap(crit ? "medium" : "light"); floatTxt((crit ? "КРИТ +" : "+") + fmt(g), crit ? "#ffd54f" : "var(--on)", crit ? 26 : 20); mark();
}
function spawnStar() {
  const f = $("#field"); if (!f) return; const s = document.createElement("div"); s.className = "star"; s.innerHTML = ic("star", 44, "#ffd54f"); s.style.left = (20 + Math.random() * 60) + "%"; s.style.top = (10 + Math.random() * 70) + "%";
  s.onpointerdown = ev => { ev.stopPropagation(); S.stars++; if (Math.random() < .5) { const b = Math.max(100, cps() * 30, tapValue() * 50); S.pts += b; S.run += b; S.total += b; floatTxt("+" + fmt(b), "#ffd54f", 24, 0, 0); } else { frenzy = now() + 15; floatTxt("x3 на 15 с!", "#ffd54f", 24, 0, 0); } hap("ok"); checkAch(); mark(); s.remove(); };
  f.appendChild(s); setTimeout(() => s.remove(), 6000);
}
let last = now(), tickN = 0;
setInterval(() => {
  if (!S) return; const t = now(), dt = Math.min(1, t - last); last = t; tickN++;
  const inc = cps() * dt; S.pts += inc; S.run += inc; S.total += inc;
  if (S.pts > 1e9) S.pts -= (S.pts - 1e9) * .005 * dt / 3600;
  if (t >= fever) combo = Math.max(0, combo - 22 * dt); else combo = 0;
  if (tickN % 10 === 0) checkAch();
  if (Math.random() < .012 * (1 + .5 * perk("star")) && tab === 0 && !busy) spawnStar();
  if (inc > 0) dirty = true;
  refresh();
  if (tickN % 150 === 0) save();
}, 100);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(true, true); });
window.addEventListener("pagehide", () => save(true, true));

// ---------- server
async function api(path, body) {
  try { const r = await fetch("/api/" + path, {method: "POST", headers: {"content-type": "application/json", "x-init": tg ? tg.initData : ""}, body: JSON.stringify(body || {}), keepalive: path === "save"}); return await r.json(); }
  catch (e) { return {error: "Нет связи с сервером"}; }
}
async function save(force) {
  if (!S || saving || (!dirty && !force)) return; saving = true; S.ts = now();
  const r = await api("save", {rev, state: S}); saving = false;
  if (r.reset) { S = defState(); snap = {inv: {}}; rev = r.rev; dirty = true; toast("Прогресс сброшен администратором"); render(); return save(true); }
  if (r.conflict) {
    const sv = r.state, m = Object.assign({}, sv.inv); for (const k in S.inv) { const d = (S.inv[k] || 0) - (snap.inv[k] || 0); m[k] = Math.max(0, (m[k] || 0) + d); }
    for (const k in snap.inv) if (!(k in S.inv)) m[k] = Math.max(0, (m[k] || 0) - snap.inv[k]);
    for (const k in m) if (m[k] <= 0) delete m[k];
    if ((sv.tk || 0) !== (S.tk || 0)) { S.pts = Math.min(S.pts, sv.pts); S.total = Math.min(S.total, sv.total); S.run = Math.min(S.run, sv.run); S.gems = Math.min(S.gems, sv.gems); S.tk = sv.tk; toast("Администратор забрал: " + (sv.tkm || "")); }
    S.inv = m; S.holo = Array.from(new Set(S.holo.concat(sv.holo || []))).filter(i => (i + "") in m); rev = r.rev; snap = {inv: Object.assign({}, sv.inv)}; dirty = true; toast("Данные обновлены после обмена"); return save(true);
  }
  if (r.error) return; rev = r.rev; if (S) { dirty = false; snap = cloneInv(); }
}
async function loadTop() { const r = await api("top", {}); if (r.rows) { lbData = r; if (tab === 4 && sub === 0) render(); } else toast(r.error || "Не удалось загрузить"); }
async function loadOffers() { const r = await api("offers", {}); if (r.offers) { offData = r.offers; if (tab === 4 && sub === 1) render(); } else toast(r.error || "Не удалось загрузить"); }
async function decodeCode(code) {
  code = code.replace(/^\s*MDC1:/, "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(code), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream("deflate"), w = ds.writable.getWriter(); w.write(u); w.close();
  return JSON.parse(await new Response(ds.readable).text());
}
async function boot() {
  setTheme(LS("th", 0)); buildNav();
  if (!tg || !tg.initData) { $("#lt").textContent = "Открой игру из бота в Телеграме"; if (!window.__DEV) return; }
  const t0 = Date.now(); const r = await api("auth", {});
  if (r.error) { $("#lt").textContent = r.error + ". Нужен интернет."; $("#load .tr").style.display = "none"; return; }
  me = {id: r.id, name: r.name}; S = fixState(r.state || defState()); rev = r.rev || 0; snap = cloneInv(); dirty = !r.state; checkAch();
  setTimeout(() => { $("#load").remove(); render(); }, Math.max(0, 1300 - (Date.now() - t0)));
}
// ============ PART 2: порт геймплея и эффектов плагина ============
const CHANGES = D.CHANGES, TIPS = D.TIPS;
const FALLI = {food: ["apple", "burger"], drink: ["bottle", "milk"], rad: ["rad"], space: ["planet", "star", "comet"], tech: ["bin"]};
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// ---------- звук и вибрация
let AC = null;
function actx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === "suspended") AC.resume(); return AC; }
function tone(f, ms, vol, type) {
  if (!LS("snd", 1)) return; const c = actx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(); o.type = type || "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(vol || .1, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + ms / 1000);
  o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + ms / 1000 + .02);
}
const SCALE = [523, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093];
const JING = [[784], [659, 784], [523, 659, 784], [523, 659, 784, 1047], [523, 659, 784, 1047, 1319, 1568]];
function sfx(kind, n) {
  if (kind === "tick") tone(1500, 18, .05, "square");
  else if (kind === "up") tone(SCALE[(n || 0) % SCALE.length], 60, .09, "triangle");
  else if (kind === "boom") tone(90, 220, .25, "sawtooth");
}
function jingle(ri, fail) { const seq = fail ? [330, 262, 196] : JING[Math.min(4, ri)]; seq.forEach((f, i) => setTimeout(() => tone(f, 160, .1, "triangle"), 110 * i)); }
function buzz(lvl) {
  if (!LS("hap", 1) || !tg || !tg.HapticFeedback) return;
  const kinds = ["light", "medium", "heavy", "heavy", "heavy"], k = kinds[Math.max(0, Math.min(4, lvl))];
  for (let i = 0; i <= lvl; i++) setTimeout(() => { try { tg.HapticFeedback.impactOccurred(k); } catch (e) {} }, 110 * i);
  if (lvl >= 3) setTimeout(() => { try { tg.HapticFeedback.notificationOccurred("success"); } catch (e) {} }, 110 * lvl + 120);
}
const tickHap = () => { if (LS("hap", 1) && tg && tg.HapticFeedback) try { tg.HapticFeedback.selectionChanged(); } catch (e) {} };

// ---------- палитра (как в плагине)
const hex2 = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const toHex = a => "#" + a.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => { const x = hex2(a), y = hex2(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = c => { const [r, g, b] = hex2(c); return (.299 * r + .587 * g + .114 * b) / 255; };
setTheme = function (i) {
  const r = document.documentElement.style; let m;
  if (THEMES[i][1] === null && tg && tg.themeParams && tg.themeParams.bg_color) {
    const p = tg.themeParams, bg = p.bg_color, txt = p.text_color || "#ffffff", sub = p.hint_color || "#aaaaaa", acc = p.button_color || "#ffb77c", dark = lum(bg) < .5;
    m = {"--surf": bg, "--sc": mix(bg, txt, .06), "--sch": mix(bg, txt, .12), "--pri": acc, "--onpri": lum(acc) > .6 ? "#000000" : "#ffffff", "--prc": mix(bg, acc, dark ? .35 : .22), "--onprc": txt, "--on": txt, "--onv": sub, "--out": mix(sub, bg, .35)};
  } else {
    const h = THEMES[i][1] === null ? 28 : THEMES[i][1];
    m = {"--surf": hsv(h, .34, .09), "--sc": hsv(h, .32, .14), "--sch": hsv(h, .30, .19), "--pri": hsv(h, .52, 1), "--onpri": hsv(h, .95, .22), "--prc": hsv(h, .68, .40), "--onprc": hsv(h, .20, 1), "--on": hsv(h, .07, .94), "--onv": hsv(h, .14, .80), "--out": hsv(h, .18, .60)};
  }
  m["--g1"] = mix(m["--surf"], m["--pri"], .22); m["--g2"] = mix(m["--surf"], m["--pri"], .08);
  for (const k in m) r.setProperty(k, m[k]);
  try { tg && (tg.setHeaderColor(m["--surf"]), tg.setBackgroundColor(m["--surf"])); } catch (e) {}
};

// ---------- карточки котов с переливами
const RB = ["#ff6b9d", "#ffb86b", "#fff06b", "#8cff6b", "#6bffd9", "#6ba8ff", "#a86bff", "#ff6bd9"];
function catEl(idx, size, extra) {
  const k = idx === "coin" ? 63 : idx, c = k % 8, r = Math.floor(k / 8), ho = extra && extra.holo;
  const gl = ho || (ITEMS[idx] && ITEMS[idx][2] >= 5), bgs = idx >= 73 ? `background-image:url(${ADM_IMG.replace("admin/0.jpg", "new/" + (idx - 73) + ".jpg?v=2")});background-size:cover;background-position:center` : idx >= 70 ? `background-image:url(${ADM_IMG.replace("0.jpg", (idx - 70) + ".jpg")});background-size:cover;background-position:center` : idx >= 64 ? `background-image:url(${TECH_IMG(idx - 64)});background-size:cover;background-position:center` : idx === 63 ? `background-image:url(${JOSKE_IMG});background-size:cover;background-position:center` : `background-position:${c / 7 * 100}% ${r / 7 * 100}%`;
  return `<div class="cat${ho ? " h" : ""}${gl ? " g" : ""}" style="width:${size}px;height:${size}px;${bgs}">${extra && extra.fx ? `<i class="gl2${ho ? " rb" : ""}"></i>` : ""}</div>`;
}
function bindCards(root) {
  (root || document).querySelectorAll(".fxc:not([data-b])").forEach(el => {
    el.dataset.b = 1; const g = el.querySelector(".gl2");
    const set = e => { const r = el.getBoundingClientRect(), nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); el.style.setProperty("--mx", nx * 100 + "%"); el.style.setProperty("--my", ny * 100 + "%"); el.style.setProperty("--hx", (nx + ny) * 50 + "%"); };
    el.addEventListener("pointerdown", e => { el.classList.add("up"); set(e); });
    el.addEventListener("pointermove", e => { if (el.classList.contains("up")) set(e); });
    const off = () => { el.classList.remove("up"); el.style.removeProperty("--mx"); el.style.removeProperty("--my"); el.style.removeProperty("--hx"); };
    el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("pointerleave", off);
  });
}
// ячейка коллекции с эффектами

// ---------- монета: наклон, отдаление и блик под пальцем
function wavyClip() { let p = []; for (let i = 0; i < 120; i++) { const a = 2 * Math.PI * i / 120, r = 47 * (1 + .04 * Math.cos(12 * a)); p.push((50 + r * Math.cos(a)).toFixed(2) + "% " + (50 + r * Math.sin(a)).toFixed(2) + "%"); } return `polygon(${p.join(",")})`; }
const WAVY = wavyClip();
let coinT = 0, coinDown = false, idleRaf = 0;
function bindCoin() {
  const c = $("#coin"); if (!c) return; const gl = c.querySelector(".gl");
  const move = e => {
    const r = c.getBoundingClientRect(), nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    c.style.transform = `perspective(700px) rotateY(${(nx - .5) * 28}deg) rotateX(${-(ny - .5) * 28}deg) scale(.92)`;
    gl.style.setProperty("--mx", nx * 100 + "%"); gl.style.setProperty("--my", ny * 100 + "%"); gl.style.setProperty("--ga", ".3"); coinT = performance.now();
  };
  c.addEventListener("pointerdown", e => { if (busy || tab !== 0) return; e.preventDefault(); coinDown = true; c.style.transition = "transform .06s"; actx(); move(e); tap(); refresh(); });
  c.addEventListener("pointermove", e => { if (coinDown) move(e); });
  const up = () => { if (!coinDown) return; coinDown = false; c.style.transition = "transform .4s cubic-bezier(.34,1.8,.64,1)"; c.style.transform = ""; };
  c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up); c.addEventListener("pointerleave", up);
  c.addEventListener("contextmenu", e => e.preventDefault());
  cancelAnimationFrame(idleRaf);
  const idle = t => {
    if (!document.body.contains(c)) return;
    if (t - coinT > 1000) { const ph = (t / 4500) % 1; gl.style.setProperty("--mx", (ph * 160 - 30) + "%"); gl.style.setProperty("--my", (30 + 20 * ph) + "%"); gl.style.setProperty("--ga", ".27"); }
    idleRaf = requestAnimationFrame(idle);
  };
  idleRaf = requestAnimationFrame(idle);
}

// ---------- падающий фон
let fallN = 0;
function spawnFall() {
  const m = LS("fall", 0), layer = $("#fall"); if (!m || !layer || fallN >= 26) return;
  let kind, col;
  const cs = ["var(--gold)", "var(--pri)", "var(--on)"];
  if (m === 1) { kind = "flake"; col = "color-mix(in srgb,var(--pri) 25%,#fff)"; }
  else if (m >= 3) { kind = FALLI[SETS[m - 3][0]][rint(0, FALLI[SETS[m - 3][0]].length - 1)]; col = cs[rint(0, 2)]; }
  else { kind = ["pumpkin", "pumpkin", "pumpkin", "ghost", "bat"][rint(0, 4)]; col = cs[rint(0, 2)]; }
  const e = document.createElement("div"), sz = m === 1 ? rint(12, 28) : m >= 3 ? rint(18, 34) : rint(16, 30), W = innerWidth, H = innerHeight, dur = rint(6000, 12000);
  e.style.cssText = `position:absolute;left:${rint(0, W)}px;top:-40px;color:${col};opacity:${rnd(.35, .85).toFixed(2)};transition:transform ${dur}ms linear;will-change:transform`;
  if (kind === "bin") { e.style.color = ["#00e676", "#69f0ae", "#b9f6ca"][rint(0, 2)]; e.style.fontFamily = "monospace"; e.style.fontWeight = "700"; e.style.fontSize = sz + "px"; e.style.textShadow = "0 0 8px currentColor"; e.textContent = Math.random() < .5 ? "0" : "1"; if (Math.random() < .4) e.innerHTML = e.textContent + "<br>" + (Math.random() < .5 ? "0" : "1") + "<br>" + (Math.random() < .5 ? "0" : "1"); } else e.innerHTML = ic(kind, sz);
  layer.appendChild(e); fallN++;
  requestAnimationFrame(() => requestAnimationFrame(() => { e.style.transform = `translate(${rint(-90, 90)}px,${H + 80}px) rotate(${rint(-220, 220)}deg)`; }));
  setTimeout(() => { e.remove(); fallN = Math.max(0, fallN - 1); }, dur + 300);
}
setInterval(() => { if (S && !document.hidden) { if (Math.random() < .5) spawnFall(); if (LS("fall", 0) === 7 && Math.random() < .5) spawnFall(); } }, 100);

// ---------- оверлеи кейсов
let OVL = null, skipRoll = false;
function stopMusic() {}
function mkOv(title) {
  closeOv(true); const o = document.createElement("div"); o.className = "ov2"; o.dataset.t = noemo(title || ""); o.innerHTML = `<div class="ov2t">${noemo(title || "")}</div>`; document.body.appendChild(o); OVL = o; busy = true; skipRoll = false; return o;
}
function endOv(go) { stopMusic(); if (OVL) { OVL.remove(); OVL = null; } busy = false; render(); if (go) go(); }
closeOv = function (quiet) { stopMusic(); document.querySelectorAll(".ov,.ov2").forEach(o => o.remove()); OVL = null; busy = false; if (!quiet) render(); };
const coinPrize = c => { const r = Math.random(); return Math.round(c * (r < .4 ? .4 : r < .8 ? .8 : r < .95 ? 1.5 : 3)); };
function sparksAt(ov, x, y, color, n) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div"); p.className = "sp"; p.textContent = ["✦", "●", "★", "◆"][rint(0, 3)]; p.style.left = x + "px"; p.style.top = y + "px"; p.style.fontSize = rint(10, 20) + "px"; p.style.color = [color, "#fff", "var(--gold)"][rint(0, 2)]; ov.appendChild(p); parts.push(p);
    const a = rnd(0, 6.283), r = rnd(.4, 1) * 90, d = rint(500, 1000);
    requestAnimationFrame(() => requestAnimationFrame(() => { p.style.transition = `transform ${d}ms ease-out,opacity ${d}ms ease-in`; p.style.transform = `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) rotate(${rint(-300, 300)}deg)`; p.style.opacity = 0; }));
  }
  setTimeout(() => parts.forEach(p => p.remove()), 1200);
}
function sparks(ov, color, n, rad) {
  rad = rad || 150; const parts = [];
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div"); p.className = "sp"; p.textContent = ["✦", "●", "★", "◆"][rint(0, 3)]; p.style.fontSize = rint(10, 22) + "px"; p.style.color = [color, "#fff", "var(--gold)"][rint(0, 2)]; ov.appendChild(p); parts.push(p);
    const a = rnd(0, 6.283), r = rnd(.4, 1) * rad, d = rint(500, 1200);
    requestAnimationFrame(() => requestAnimationFrame(() => { p.style.transition = `transform ${d}ms ease-out,opacity ${d}ms ease-in`; p.style.transform = `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) rotate(${rint(-300, 300)}deg)`; p.style.opacity = 0; }));
  }
  setTimeout(() => parts.forEach(p => p.remove()), 1400);
}
function preroll(ov, icon, then) {
  if (!LS("fxc", 1)) { then(); return; }
  const ch = document.createElement("div"); ch.className = "chest"; ch.innerHTML = ic(icon, 120); ov.appendChild(ch);
  let n = 0; const total = 15;
  const step = () => {
    if (OVL !== ov) return;
    if (n >= total) { ch.style.transition = "transform .23s,opacity .23s"; ch.style.transform = "scale(1.9)"; ch.style.opacity = 0; sparks(ov, "#ffd54f", 22); sfx("boom"); buzz(1); setTimeout(() => { ch.remove(); then(); }, 240); return; }
    const k = n / total; ch.style.transform = `rotate(${(n % 2 ? 1 : -1) * (4 + 15 * k)}deg) scale(${1 + .3 * k})`;
    if (n % 2 === 0) { tickHap(); sfx("up", n); }
    n++; setTimeout(step, 62);
  }; step();
}
function roulette(ci, wk, mode) {
  if (!LS("fxc", 1)) { const ov0 = mkOv(CASES[ci][1]); reveal(ov0, wk, () => openCase(ci, mode === 2 && S.fc[ci] > 0 ? 2 : 0), false); return; }
  const win = wk[0], ov = mkOv(CASES[ci][1]), W = 112, N = 52, WIN_I = 44, w = ci === 4 ? CASES[2][3] : CASES[ci][3], sw = innerWidth, special = false;
  const hint = document.createElement("div"); hint.className = "hint"; hint.textContent = "Нажми, чтобы пропустить"; hint.style.opacity = 0; ov.appendChild(hint);
  const strip = document.createElement("div"); strip.className = "strip"; strip.style.width = W * N + "px"; let h = "";
  const coinRc = a => `<div class="rc" style="box-shadow:inset 0 0 0 2px var(--gold)"><div style="color:var(--gold)">${ic("coin", 52)}</div><span style="color:var(--gold)">+${fmt(a)}</span></div>`;
  for (let n = 0; n < N; n++) {
    if (n === WIN_I && wk[1] === "coins") { h += coinRc(wk[2]); continue; }
    if (n !== WIN_I && ci === 5 && Math.random() < .65) { h += coinRc(coinPrize(CASES[5][2])); continue; }
    let idx; if (n === WIN_I) idx = win; else { let ri = rarR(w); if (Math.abs(n - WIN_I) <= 2 && Math.random() < .6) ri = Math.max(ri, w[3] > 0 ? 3 : 2); idx = pickR(ri); }
    const rc = RC[ITEMS[idx][2]]; h += `<div class="rc" style="box-shadow:inset 0 0 0 2px ${rc}">${catEl(idx, 62)}<span style="color:${rc}">${ITEMS[idx][1]}</span></div>`;
  }
  strip.innerHTML = h; ov.appendChild(strip);
  const mark = document.createElement("div"); mark.className = "mark"; const arr = document.createElement("div"); arr.className = "arrow"; arr.textContent = "▼"; ov.appendChild(mark); ov.appendChild(arr);
  [strip, mark, arr].forEach(v => v.style.opacity = 0);
  const tx0 = sw / 2 - W / 2, off = rnd(-.4, .4) * (W - 8), tx1 = sw / 2 - (WIN_I * W + W / 2) - off;
  strip.style.transform = `translateX(${tx0}px)`;
  preroll(ov, CASES[ci][0], () => {
    [strip, mark, arr].concat(special ? [] : [hint]).forEach(v => { v.style.transition = "opacity .25s"; v.style.opacity = 1; });
    ov.onclick = special ? null : () => { skipRoll = true; };
    const t0 = performance.now(), dur = special ? 9100 : 6200; let last = -1;
    const step = t => {
      if (OVL !== ov) return;
      const p = skipRoll ? 1 : (t - t0) / dur;
      if (p >= 1) { strip.style.transform = `translateX(${tx1}px)`; reveal(ov, wk, () => openCase(ci, mode === 2 && S.fc[ci] > 0 ? 2 : 0), false); return; }
      const e = 1 - Math.pow(1 - p, 4.5), x = tx0 + (tx1 - tx0) * e; strip.style.transform = `translateX(${x}px)`;
      const idx = Math.floor((sw / 2 - x) / W); if (idx !== last) { last = idx; tickHap(); sfx("tick"); }
      requestAnimationFrame(step);
    }; requestAnimationFrame(step);
  });
}
function reveal(ov, wk, againFn, fail) {
  if (OVL !== ov) return; const [win, kind] = wk; ov.onclick = null;
  let name, ri, rname, col, bonus;
  const coins = kind === "coins";
  if (coins) { name = "+" + fmt(wk[2]); ri = 3; rname = "Приз"; col = "#ffd54f"; bonus = 0; }
  else if (fail || win === null) { name = "Не вышло…"; ri = 0; rname = "Неудача"; col = "#78909c"; bonus = 0; } else { name = ITEMS[win][1]; ri = ITEMS[win][2]; rname = RARS[ri][0]; col = RC[ri]; bonus = RARS[ri][2]; }
  const holo = kind === "holo" || kind === "newholo";
  ov.innerHTML = `<div class="ov2t">${ov.dataset.t || ""}</div>`;
  const fl = document.createElement("div"); fl.className = "flash"; fl.style.background = holo ? "#fff" : col; ov.appendChild(fl); requestAnimationFrame(() => { fl.style.opacity = 0; });
  if (!fail && ri >= 2) { const ry = document.createElement("div"); ry.className = "rays"; ry.style.color = col; ry.innerHTML = ic("sparkle", 330); ov.appendChild(ry); requestAnimationFrame(() => { ry.style.transform = "translate(-50%,-50%) rotate(360deg)"; }); }
  const gw = document.createElement("div"); gw.className = "glow"; gw.style.background = col; ov.appendChild(gw);
  let pn = 0; const pulse = () => { if (OVL !== ov) return; pn++; gw.style.transform = `translate(-50%,-50%) scale(${1 + .12 * Math.sin(pn * .25)})`; setTimeout(pulse, 40); }; pulse();
  let txt, cc, fg; const own = win !== null ? (S.inv[win + ""] || 1) : 1;
  if (coins) { txt = "Монеты добавлены на счёт"; cc = "var(--prc)"; fg = "var(--gold)"; }
  else if (kind === "fail") { txt = "Дубликат сгорел"; cc = "var(--sch)"; fg = "var(--onv)"; }
  else if (kind === "new") { txt = `НОВИНКА · +${bonus}% ко всему`; cc = "var(--prc)"; fg = "var(--onprc)"; }
  else if (kind === "newholo") { txt = `ГОЛОГРАММА · +${bonus * 2}% ко всему`; cc = "var(--prc)"; fg = "var(--gold)"; }
  else if (kind === "holo") { txt = "ГОЛОГРАММА · бонус x2"; cc = "var(--prc)"; fg = "var(--gold)"; }
  else { txt = `Дубликат · в запасе ×${Math.max(0, own - 1)}`; cc = "var(--sch)"; fg = "var(--gold)"; }
  const card = document.createElement("div"); card.className = "rcard"; card.style.boxShadow = `inset 0 0 0 2px ${holo ? "#fff" : col}`;
  card.innerHTML = `<div style="font-size:12px;font-weight:700;color:${col}">${holo ? "★ " : ""}${rname.toUpperCase()}</div><div style="margin:6px 0;display:flex;justify-content:center">${coins ? `<div style="color:var(--gold);padding:14px">${ic("coin", 110)}</div>` : win !== null ? `<div class="fxc" style="border-radius:22%">${catEl(win, 150, {holo, fx: true})}</div>` : `<div style="color:var(--onv);padding:20px">${ic("close", 84)}</div>`}</div><div style="font-size:22px;font-weight:700">${name}</div><div class="chip" style="margin-top:10px;background:${cc};color:${fg}">${kind === "dup" || kind === "fail" || coins ? "" : ic("sparkle", 14)}${txt}</div>`;
  ov.appendChild(card); bindCards(card);
  card.style.transform = "translate(-50%,-50%) scale(0)"; requestAnimationFrame(() => requestAnimationFrame(() => { card.style.transition = "transform .56s cubic-bezier(.3,1.9,.5,1)"; card.style.transform = "translate(-50%,-50%) scale(1)"; }));
  const row = document.createElement("div"); row.className = "rrow"; row.style.opacity = 0;
  row.innerHTML = btn("Забрать", "ovclose", "", againFn ? "t" : "") + (againFn ? btn("Ещё раз", "ovagain") : ""); ov.appendChild(row);
  setTimeout(() => { row.style.transition = "opacity .3s"; row.style.opacity = 1; }, 900);
  ov.querySelector("[data-a=ovclose]").onclick = () => endOv();
  if (againFn) ov.querySelector("[data-a=ovagain]").onclick = () => endOv(againFn);
  buzz(fail ? 0 : ri + (holo && ri < 4 ? 1 : 0)); jingle(ri, fail);
  const parts = [], cols = [col, "#fff", "#ffd54f"]; if (holo) cols.push("#ff5252", "#69f069", "#40c4ff", "#e040fb");
  const count = fail ? 0 : 14 + ri * 14 + (holo ? 24 : 0);
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div"); p.className = "sp"; p.textContent = ["✦", "●", "★", "◆"][rint(0, 3)]; p.style.fontSize = rint(12, 26) + "px"; p.style.color = cols[rint(0, cols.length - 1)]; p.style.transform = "translate(0,-60px)"; ov.appendChild(p); parts.push(p);
    const a = rnd(0, 6.283), r = rnd(.4, 1) * (110 + 45 * ri), dx = Math.cos(a) * r, dy = Math.sin(a) * r - 30, d = rint(900, 1900);
    requestAnimationFrame(() => requestAnimationFrame(() => { p.style.transition = `transform ${d}ms ease-out,opacity ${d}ms ease-in`; p.style.transform = `translate(${dx}px,${dy + 140}px) rotate(${rint(-360, 360)}deg)`; p.style.opacity = 0; }));
  }
  if (ri >= 4 && !fail) for (let i = 0; i < 40; i++) {
    const p = document.createElement("div"); p.className = "sp"; p.style.top = "0"; p.style.left = "50%"; p.style.color = "var(--gold)"; p.innerHTML = ic("coin", rint(16, 30)); p.style.transform = `translate(${rint(-180, 180)}px,-40px)`; ov.appendChild(p); parts.push(p);
    const d = rint(1400, 2400), dl = rint(0, 900), x = rint(-180, 180);
    setTimeout(() => { p.style.transition = `transform ${d}ms ease-in`; p.style.transform = `translate(${x}px,${innerHeight}px) rotate(${rint(-540, 540)}deg)`; }, dl + 30);
  }
  setTimeout(() => parts.forEach(p => p.remove()), 3800);
  if (ri >= 3 && !fail) { let a = 12, n = 0; const sh = () => { if (OVL !== ov || n > 16) { card.style.marginLeft = 0; return; } n++; card.style.marginLeft = a * (n % 2 ? 1 : -1) + "px"; a *= .82; setTimeout(sh, 45); }; setTimeout(sh, 560); }
}
function resultOnly(icon, wk, title) { const ov = mkOv(title || "Крафт"); ov.dataset.t = noemo(title || "Крафт"); preroll(ov, icon, () => reveal(ov, wk, null, wk[0] === null)); }
showResult = function (icon, res, title, again) { resultOnly(icon, res, title); };
showMulti = function (ci, wins, n) {
  const title = CASES[ci][1] + " ×" + n, ov = mkOv(title); ov.dataset.t = title;
  const rar = w => w[0] === null ? 1 : ITEMS[w[0]][2], isHolo = w => w[1] === "holo" || w[1] === "newholo";
  const col = w => w[0] === null ? "#ffd54f" : isHolo(w) ? "#fff" : RC[ITEMS[w[0]][2]];
  const box = document.createElement("div"); box.className = "mbox"; box.innerHTML = wins.map(() => `<div class="mc"><div class="mq">${ic("box", 34)}</div></div>`).join(""); ov.appendChild(box);
  const cells = [...box.children]; cells.forEach(c => { c.style.opacity = 0; });
  const hint = document.createElement("div"); hint.className = "hint"; hint.textContent = "Двойное касание — показать всё"; hint.style.opacity = .9; ov.appendChild(hint);
  const front = w => {
    if (w[0] === null) return `<div style="color:var(--gold)">${ic("coin", 44)}</div><span style="color:var(--gold)">+${fmt(w[2])}</span><span style="font-size:9px;color:var(--out)">монеты</span>`;
    const k = w[1], ho = isHolo(w), tag = {new: "НОВИНКА", newholo: "ГОЛО · НОВИНКА", holo: "ГОЛО x2", dup: "дубль"}[k], rc = RC[ITEMS[w[0]][2]];
    return `${catEl(w[0], 56, {holo: ho})}<span style="color:${rc}">${ho ? "★ " : ""}${ITEMS[w[0]][1]}</span><span style="font-size:9px;color:${k === "dup" ? "var(--out)" : "var(--gold)"}">${tag}</span>`;
  };
  const setFront = i => { const c = cells[i]; c.innerHTML = front(wins[i]); c.style.boxShadow = `inset 0 0 0 2px ${col(wins[i])}`; };
  let done = false, finished = false, shown = 0;
  const finish = () => {
    if (finished || OVL !== ov) return; finished = true; hint.remove();
    const score = w => w[0] === null ? 1 : ITEMS[w[0]][2] + (isHolo(w) ? .5 : 0), best = wins.reduce((a, b) => score(b) > score(a) ? b : a);
    const bn = best[0] === null ? "+" + fmt(best[2]) + " монет" : ITEMS[best[0]][1];
    const d = document.createElement("div"); d.className = "rrow"; d.style.flexDirection = "column"; d.style.alignItems = "center"; d.style.gap = "10px";
    d.innerHTML = `<div style="font-size:14px;font-weight:700;color:${col(best)}">Лучшее: ${bn}</div><div style="display:flex;gap:10px">${btn("Забрать", "ovclose", "", "t")}${btn("Ещё ×" + n, "ovagain")}</div>`; ov.appendChild(d);
    d.querySelector("[data-a=ovclose]").onclick = () => endOv(); d.querySelector("[data-a=ovagain]").onclick = () => endOv(() => openCase(ci, 0, n));
  };
  const skip = () => { if (done) return; done = true; cells.forEach((c, i) => { c.style.transition = "none"; c.style.transform = "none"; c.style.opacity = 1; setFront(i); }); finish(); };
  let lt = 0; ov.addEventListener("pointerdown", () => { const t = performance.now(); if (t - lt < 350) skip(); lt = t; });
  const step = () => {
    if (OVL !== ov || done) return; if (shown >= cells.length) return finish();
    const i = shown++, c = cells[i], w = wins[i], r = c.getBoundingClientRect(), dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight * .44 - (r.top + r.height / 2);
    c.style.transition = "none"; c.style.opacity = 1; c.style.transform = `translate(${dx}px,${dy}px) scale(.3) rotate(${rint(-220, 220)}deg)`; c.getBoundingClientRect();
    c.style.transition = "transform .42s cubic-bezier(.3,1.5,.5,1)"; c.style.transform = "none"; sfx("up", i * 2); tickHap();
    setTimeout(() => {
      if (OVL !== ov || done) return; c.style.transition = "transform .16s"; c.style.transform = "rotateY(90deg)";
      setTimeout(() => {
        if (OVL !== ov || done) return; setFront(i); c.style.transition = "transform .22s cubic-bezier(.3,1.9,.5,1)"; c.style.transform = "none";
        const rr = c.getBoundingClientRect(), R = rar(w); sparksAt(ov, rr.left + rr.width / 2, rr.top + rr.height / 2, col(w), 8 + R * 5);
        if (R >= 3) { buzz(R - 1); jingle(R); } else { tickHap(); sfx("tick"); }
        setTimeout(step, R >= 3 ? 650 : 220);
      }, 160);
    }, 430);
  };
  if (!LS("fxc", 1)) { skip(); return; }
  preroll(ov, CASES[ci][0], step);
};
openCase = function (ci, mode, n) {
  if (busy) return; n = n || 1; const t = now();
  if (mode === 1) { if (t - S.freecase < freeEvery()) return toast("Бесплатный кейс ещё не готов"); S.freecase = t; }
  else if (mode === 2) { if (S.fc[ci] < 1) return; S.fc[ci]--; n = 1; }
  else { const c = CASES[ci][2] * n; if (ci === GEM_CASE) { if (S.gems < c) return toast("Не хватает самоцветов"); S.gems -= c; } else { if (S.pts < c) return toast("Не хватает монет"); S.pts -= c; } }
  const wins = [];
  for (let k = 0; k < n; k++) { if (ci === 5 && Math.random() < .7) { const amt = coinPrize(CASES[5][2]); S.pts += amt; S.run += amt; S.total += amt; S.opened++; addXp(20); wins.push([null, "coins", amt]); continue; } const win = roll(ci), holo = Math.random() < (ci < 2 ? .06 : .12); S.opened++; S.pity = ITEMS[win][2] >= 2 ? 0 : S.pity + 1; const kind = grant(win, holo); S.hist = S.hist.concat([win]).slice(-14); addXp(20 + 15 * ITEMS[win][2]); wins.push([win, kind]); }
  checkAch(); mark(); save(true); actx();
  if (n === 1) roulette(ci, wins[0], mode); else showMulti(ci, wins, n);
};
A.ovclose = function () {}; A.ovagain = function () {};

// ---------- шапка, вкладка «Игра»
const chipI = (k, id) => `<span class="chip" id="${id}"></span>`;
tGame = function () {
  const eq = +S.eq, cat = eq >= 0 && (eq + "") in S.inv ? eq : "coin", rr = cat === "coin" ? "" : `<i class="rr" style="border-color:${RC[ITEMS[cat][2]]}"></i>`;
  return `<div class="gcol"><div id="g-pts" style="text-align:center;font-size:46px;font-weight:700;color:var(--pri);line-height:1.15">0</div><div class="t2" style="text-align:center;margin:-2px 0 8px;font-size:13px">монет</div>
  <div class="chips"><span class="chip" id="g-cps"></span><span class="chip" id="g-tap"></span><span class="chip" id="g-gem"></span><span class="chip p" id="g-buff" style="display:none"></span></div>
  <div id="field"><div id="ring"></div><div id="coin" data-coin><div class="wv" style="clip-path:${cat === "coin" ? WAVY : "none"};border-radius:${cat === "coin" ? 0 : "50%"}">${catEl(cat, 240, {})}${rr}<i class="gl"></i></div></div></div>
  <div style="display:flex;align-items:center;gap:10px;margin:0 4px 8px"><span class="t2" style="font-weight:700;display:flex;align-items:center;gap:6px;margin:0;min-width:96px">${ic("fire", 14)}<span id="clt">Комбо</span></span><div class="wb grow"><div class="tr"></div><div class="ac" id="combo" style="width:0%"><i></i></div></div></div>
  <div class="card p" id="daily" style="display:none;margin-bottom:0"><div class="grow t1" style="display:flex;align-items:center;gap:8px">${ic("box", 18)}Ежедневный бонус готов</div>${btn("Забрать", "daily")}</div></div>`;
};
const _refresh0 = refresh;
refresh = function (full) {
  _refresh0(full); const t = now();
  const sub = $("#sub"); if (sub) sub.innerHTML = ic("gem", 12) + S.gems + " · бонус x" + baseMult().toFixed(2);
  if (tab === 0) {
    const s = (id, h) => { const e = $("#" + id); if (e) e.innerHTML = h; };
    s("g-pts", fmt(S.pts)); s("g-cps", ic("bolt", 14) + fmt(cps()) + "/с"); s("g-tap", ic("tap", 14) + fmt(tapValue())); s("g-gem", ic("gem", 14) + S.gems);
    const b = []; for (const [nm, u] of [["Жар", fever], ["Буст", S.boost], ["Звёзды", frenzy]]) if (u > t) b.push(nm + " " + clock(u - t));
    const e = $("#g-buff"); if (e) { e.textContent = b.join(" · "); e.style.display = b.length ? "" : "none"; }
    const fv = t < fever, fr = fv ? Math.max(0, (fever - t) / (6 + S.fev)) : combo / 100, cb = $("#combo");
    if (cb) { cb.style.width = Math.max(0, Math.min(1, fr)) * 100 + "%"; cb.firstChild.style.background = fv ? "var(--gold)" : ""; }
    const cl = $("#clt"); if (cl) cl.textContent = fv ? "ЛИХОРАДКА" : "Комбо " + Math.floor(combo) + "%";
    const rg = $("#ring"); if (rg) rg.style.borderColor = fv ? "var(--gold)" : "";
  }
};
const _render0 = render;
render = function () { _render0(); if (tab === 0) bindCoin(); bindCards(); if (OVL === null) { const v = $("#view"); } };

// ---------- «Награды»: сеты с карточками, «Ещё»: настройки как в плагине
const optRow = (title, names, key, vals, cur) => `<div class="t2" style="font-weight:700;margin-top:6px">${title}</div><div class="hs" style="margin-top:6px">${names.map((n, i) => { const on = vals[i] === cur; return `<button class="chip ${on ? "p" : ""}" style="border:0;font-family:inherit;display:inline-flex;gap:6px" data-a="opt" data-k="${key}" data-v="${vals[i]}">${on ? ic("check", 14) : ""}${n}</button>`; }).join("")}</div>`;
const tog = (label, key, on) => `<div class="card click" style="margin:4px 0 0;padding:8px 0;background:none;border:0" data-a="tgl" data-k="${key}"><div class="t1 grow" style="font-size:14px">${label}</div><div class="sw ${on ? "on" : ""}"></div></div>`;
tMore = function () {
  let h = `<div class="card"><div class="grow"><div class="t1">${esc(me.name || "Игрок")}</div><div class="t2">ID ${me.id}</div></div></div>`;
  const fn = ["Нет", "Снежинки", "Тыквы"], fv = [0, 1, 2]; SETS.forEach((x, i) => { if (S.sets.includes(x[0])) { fn.push(x[1]); fv.push(3 + i); } });
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Оформление</div>${optRow("Тема", THEMES.map(t => t[0]), "th", THEMES.map((_, i) => i), LS("th", 0))}${optRow("Падающий фон", fn, "fall", fv, LS("fall", 0))}</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Игра</div>${tog("Вибрация", "hap", LS("hap", 1))}${tog("Звуки кейсов", "snd", LS("snd", 1))}${tog("Анимации клика", "fxt", LS("fxt", 1))}${tog("Анимации открытия кейсов", "fxc", LS("fxc", 1))}</div>`;
  const st = [["Всего тапов", fmt(S.taps)], ["Накоплено за всё время", fmt(S.total)], ["За текущий забег", fmt(S.run)], ["Генераторов", owned()], ["Самоцветов", S.gems], ["Перерождений", S.prest], ["Звёзд поймано", S.stars], ["Лихорадок", S.fevers], ["Общий множитель", "x" + baseMult().toFixed(2)]];
  h += `<div class="card col" style="gap:0">${st.map(r => `<div style="display:flex;padding:3px 0"><span class="t2 grow" style="font-size:14px;margin:0">${r[0]}</span><span style="font-size:14px;font-weight:700">${r[1]}</span></div>`).join("")}</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Как играть</div><div class="t2" style="font-size:13px">${TIPS}</div></div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Что нового</div>${CHANGES.map(c => `<div style="font-size:13px;font-weight:700;margin-top:8px">v${c[0]}</div>${c[1].map(x => `<div class="t2" style="font-size:12px;margin-top:2px">• ${x}</div>`).join("")}`).join("")}</div>`;
  h += `<button class="btn t" data-a="reset" style="width:100%;justify-content:center;margin-top:4px">Сбросить весь прогресс</button>`;
  return h;
};
A.opt = function (e) { const k = e.dataset.k, v = +e.dataset.v; if (k === "th") { LSset("th", v); setTheme(v); } else LSset(k, v); render(); };
A.tgl = function (e) { const k = e.dataset.k; LSset(k, LS(k, 1) ? 0 : 1); if (k === "snd") actx(); render(); };
let rst = 0;
A.reset = function (e) { if (!rst) { rst = 1; e.textContent = "Нажми ещё раз: всё пропадёт!"; setTimeout(() => { rst = 0; }, 4000); return; } rst = 0; const keep = S.ts; S = defState(); fever = frenzy = 0; mark(); snap = {inv: {}}; save(true); toast("Прогресс сброшен"); render(); };
const _tAch0 = tAch;
// ---------- запуск: офлайн-доход
const _boot0 = boot;
boot = async function () {
  buildNav2();
  await _boot0();
  const w = setInterval(() => {
    if (!S || $("#load")) return; clearInterval(w);
    const gain = Math.min(Math.max(0, now() - (S.ts || now())), 8 * 3600) * cps();
    if (gain >= 1) { S.pts += gain; S.run += gain; S.total += gain; mark(); toast("Пока тебя не было: +" + fmt(gain)); }
  }, 200);
};
function buildNav2() {
  const top = $("#top"); top.innerHTML = `<div class="grow"><div style="font-size:22px;font-weight:700" id="ttl">MDMelonClicker</div><div style="font-size:12px;color:var(--out);display:flex;align-items:center;gap:4px" id="sub"></div></div><button id="x" style="width:44px;height:44px;border-radius:50%;border:0;background:var(--sc);color:var(--onv);display:flex;align-items:center;justify-content:center">${ic("close", 22)}</button><span id="gemc" style="display:none"></span>`;
  $("#x").onclick = () => { save(true); if (tg) tg.close(); };
}

/*PART3*/
boot();
