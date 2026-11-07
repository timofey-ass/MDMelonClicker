// ============ PART 3: админка, промокоды, чат, профили, значки, MD3-формы ============
let isAdm = false, myBadges = "", lastBc = 0, onlineN = 0;
const _api0 = api;
api = async function (path, body) {
  const r = await _api0(path, body);
  if (path === "auth" && r && !r.error) { isAdm = !!r.admin; myBadges = r.badges || ""; }
  return r;
};

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
};
const bdg = (s, sz) => String(s || "").split("").filter(c => BADGES[c]).map(c => `<svg class="bdg" title="${BADGES[c][0]}" viewBox="0 0 24 24" width="${sz || 15}" height="${sz || 15}" style="color:${BADGES[c][1]}">${BADGES[c][2]}</svg>`).join("");
const nm = (name, b) => `<span class="nm">${esc(name || "Игрок")}${bdg(b)}</span>`;
const av = (name, id, sz) => { const h = (id * 47) % 360; return `<div class="av" data-a="prof" data-i="${id}" style="width:${sz}px;height:${sz}px;background:${hsv(h, .45, .45)};color:${hsv(h, .15, 1)};font-size:${Math.round(sz * .45)}px">${esc((name || "?").trim().charAt(0).toUpperCase())}</div>`; };

// ---------- модалка
function modal(html) {
  closeModal(); const o = document.createElement("div"); o.className = "mdl"; o.innerHTML = `<div class="mdc">${html}</div>`; o.addEventListener("click", e => { if (e.target === o) closeModal(); }); document.body.appendChild(o); return o;
}
function closeModal() { document.querySelectorAll(".mdl").forEach(m => m.remove()); }
A.mclose = function () { closeModal(); };

// ---------- опрос сервера: выдачи, объявления, онлайн
function applyReward(kind, a, b) {
  if (!S) return;
  if (kind === "pts") { S.pts += a; S.run += a; S.total += a; }
  else if (kind === "gems") S.gems += a;
  else if (kind === "cat") { const i = Math.max(0, Math.min(ITEMS.length - 1, Math.floor(a))); for (let k = 0; k < (b || 1); k++) grant(i, false); }
  else if (kind === "takepts") { const t = a < 0 ? S.pts : b === 2 ? S.pts * Math.min(a, 100) / 100 : Math.min(S.pts, a); S.pts = Math.max(0, S.pts - t); }
  else if (kind === "takegems") { const t = a < 0 ? S.gems : Math.min(S.gems, a); S.gems -= t; }
  else if (kind === "takecat") { const k = String(Math.floor(a)); if (k in S.inv) { S.inv[k] -= (b || 1); if (S.inv[k] <= 0) { delete S.inv[k]; S.holo = S.holo.filter(x => x !== +k); if (+S.eq === +k) S.eq = -1; } } }
  checkAch(); mark(); save(true);
}
const rewTxt = (kind, a, b) => kind === "takegems" ? "−" + (a < 0 ? "все самоцветы" : fmt(a) + " самоцветов") : kind === "takepts" ? "−" + (a < 0 ? "все монеты" : b === 2 ? a + "% монет" : fmt(a) + " монет") : kind === "takecat" ? "отобран кот " + (ITEMS[Math.floor(a)] ? ITEMS[Math.floor(a)][1] : "") + " ×" + (b || 1) : kind === "pts" ? "+" + fmt(a) + " монет" : kind === "gems" ? "+" + fmt(a) + " самоцветов" : ITEMS[Math.floor(a)] ? ITEMS[Math.floor(a)][1] + " ×" + (b || 1) : "награда";
function announce(text) {
  const o = document.createElement("div"); o.className = "ann"; o.innerHTML = `<div class="anc"><div class="t1" style="color:var(--pri);display:flex;align-items:center;gap:8px">${ic("sparkle", 18)}Сообщение</div><div style="margin:10px 0 14px;font-size:15px;white-space:pre-wrap">${esc(text)}</div>${btn("Понятно", "annx")}</div>`;
  document.body.appendChild(o); jingle(1); buzz(1);
}
A.annx = function () { document.querySelectorAll(".ann").forEach(x => x.remove()); };
let polling = false;
async function pollNow() {
  if (!S || polling) return; polling = true;
  try {
    const r = await api("poll", {bc: lastBc});
    if (r && !r.error) {
      onlineN = r.online || 0; if (r.uc !== undefined && r.uc !== ucN) { try { await loadUcats(); } catch (e) {} } if (r.badges !== undefined) myBadges = r.badges;
      if (r.rev && r.rev > rev && !saving && !(r.grants && r.grants.length)) { dirty = true; save(true); }
      for (const g of r.grants || []) {
        if (g.kind === "reset") { S = defState(); snap = {inv: {}}; rev = r.rev; dirty = true; fever = frenzy = 0; mark(); save(true); toast("Прогресс сброшен администратором"); render(); if (g.b === 2) announce("Из-за баланса игры нам пришлось сбросить прогресс всем игрокам. В качестве утешительного приза ты получаешь кота «Королевский арбуз»: он увеличивает заработок за каждый тап в 40 раз. Его также можно выбить в Особом кейсе (шанс 2%). Прости и удачной игры!"); continue; }
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
A.prof = async function (e) {
  const uid = +e.dataset.i; const r = await api("profile", {uid}); if (r.error) return toast(r.error);
  const rows = [["Накоплено", fmt(r.total)], ["Тапов", fmt(r.taps)], ["Котов собрано", r.cats + " / " + ITEMS.length], ["Голограмм", r.holo], ["Достижений", r.ach], ["Кейсов открыто", r.opened], ["Перерождений", r.prest]];
  const bl = String(r.badges || "").split("").filter(c => BADGES[c]).map(c => `<div style="display:flex;align-items:center;gap:8px;font-size:13px;margin-top:4px">${bdg(c, 18)}<span>${BADGES[c][0]}</span></div>`).join("");
  let adm = "";
  if (isAdm) adm = `<div class="sec" style="margin:14px 0 6px">Админ</div><div style="display:flex;gap:6px;flex-wrap:wrap">${uid !== me.id ? btn(r.banned ? "Разблокировать" : "Заблокировать", "pban", `data-i="${uid}" data-on="${r.banned ? 0 : 1}"`, "o") + btn("Выдать", "pgive", `data-i="${uid}"`, "o") : ""}${btn("Сбросить прогресс", "preset", `data-i="${uid}"`, "o")}</div><div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${Object.keys(BADGES).map(c => `<button class="chip ${String(r.badges).includes(c) ? "p" : ""}" style="border:0;font-family:inherit" data-a="pbadge" data-i="${uid}" data-c="${c}" data-cur="${r.badges}">${BADGES[c][0].split(" ")[0]}</button>`).join("")}</div>`;
  const eq = r.eq >= 0 ? catEl(r.eq, 64, {}) : catEl("coin", 64, {});
  const own = uid === me.id, bn = own && Number.isInteger(S.bn) ? S.bn : (r.bn || 0);
  const bnr = `<div style="height:64px;border-radius:14px;margin:-4px 0 12px;background:${BNR[bn % BNR.length]}"></div>` + (own ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:-4px 0 12px">${BNR.map((g, k) => `<div data-a="setbn" data-k="${k}" style="width:34px;height:24px;border-radius:8px;background:${g};cursor:pointer;${k === bn ? "outline:2px solid var(--pri);outline-offset:2px" : ""}"></div>`).join("")}</div>` : "");
  const tr = (r.offers || []).length ? `<div class="sec" style="margin:14px 0 6px">Активные обмены</div>${r.offers.map(o => `<div style="display:flex;align-items:center;gap:8px;padding:3px 0">${catEl(o.give, 36, {})}<span style="color:var(--onv)">${ic("arrow", 18)}</span>${catEl(o.want, 36, {})}<span class="t2 grow" style="font-size:12px;margin:0"><span class="rar${ITEMS[o.give][2]}">${ITEMS[o.give][1]}</span> за <span class="rar${ITEMS[o.want][2]}">${ITEMS[o.want][1]}</span></span></div>`).join("")}` : "";
  modal(bnr + `<div style="display:flex;gap:14px;align-items:center"><div style="border-radius:50%;overflow:hidden;width:64px;height:64px;flex:none">${eq}</div><div class="grow"><div class="t1" style="font-size:18px">${nm(r.name, r.badges)}</div><div class="t2">ID ${r.id} · <span style="color:${r.online ? "var(--good)" : "var(--out)"}">${r.online ? "в игре" : "не в сети"}</span>${r.banned ? ' · <span style="color:#ff5252">заблокирован</span>' : ""}</div></div></div>${bl}${tr}<div class="card col" style="margin:12px 0 0;gap:0">${rows.map(x => `<div style="display:flex;padding:3px 0"><span class="t2 grow" style="font-size:14px;margin:0">${x[0]}</span><span style="font-size:14px;font-weight:700">${x[1]}</span></div>`).join("")}</div>${adm}<div style="margin-top:14px;text-align:right">${btn("Закрыть", "mclose", "", "t")}</div>`);
};
const BNR = ["linear-gradient(135deg,#ff9a3c,#ff3d6e)", "linear-gradient(135deg,#43e97b,#38f9d7)", "linear-gradient(135deg,#4facfe,#7b5cff)", "linear-gradient(135deg,#f6d365,#fda085)", "linear-gradient(135deg,#a18cd1,#fbc2eb)", "linear-gradient(135deg,#232526,#5a5f66)", "linear-gradient(135deg,#00c6ff,#0072ff)", "linear-gradient(135deg,#f953c6,#b91d73)"];
A.setbn = function (e) { S.bn = +e.dataset.k; mark(); save(true); A.prof({dataset: {i: me.id}}); };
A.pban = async function (e) { const r = await api("adm_ban", {uid: +e.dataset.i, on: +e.dataset.on}); toast(r.error || (+e.dataset.on ? "Заблокирован" : "Разблокирован")); closeModal(); chatSig = ""; chatLoad(); };
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
A.admresetall = async function (e) {
  if (!rstAll) { rstAll = 1; e.textContent = "ТОЧНО сбросить ВСЕМ? Нажми ещё раз"; setTimeout(() => { rstAll = 0; render(); }, 5000); return; }
  rstAll = 0; const r = await api("adm_resetall", {}); if (r.error) return toast(r.error);
  toast("Сброшено игроков: " + r.count); lbData = null; chatSig = ""; pollNow();
};
A.pgive = function (e) { KEEP.admid = e.dataset.i; closeModal(); tab = 5; moreSub = 3; render(); $("#view").scrollTop = 0; };

// ---------- Топ: лидеры, обмен, чат
tTop = function () {
  let h = `<div class="seg"><button class="${sub === 0 ? "on" : ""}" data-a="sub" data-i="0">Лидеры</button><button class="${sub === 1 ? "on" : ""}" data-a="sub" data-i="1">Обмен</button><button class="${sub === 2 ? "on" : ""}" data-a="sub" data-i="2">Чат</button></div>`;
  if (sub === 2) {
    return h + `<div class="t2" style="margin:0 4px 6px;display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:var(--good)"></span>Общий чат · в игре ${onlineN || 1}</div><div id="chatlist" class="chatlist">${chatHtml()}</div><div style="display:flex;gap:8px;margin-top:8px"><input id="chatin" data-keep="chat" maxlength="200" placeholder="Сообщение" autocomplete="off">${btn(ic("up", 18), "csend", 'style="width:48px;padding:0;justify-content:center"')}</div>`;
  }
  if (sub === 0) {
    h += `<div class="card"><div class="grow"><div class="t1" style="display:flex;align-items:center;gap:8px">${ic("medal", 18)}Таблица лидеров</div><div class="t2">Очки: накоплено за всё время</div></div>${btn("Обновить", "reloadtop")}</div>`;
    if (!lbData) return h + `<div class="t2" style="text-align:center;margin:30px">Загружаю…</div>`;
    h += `<div class="card" style="background:var(--sch)"><div class="t1 grow" style="color:var(--onprc)">Ты: ${nm(me.name, myBadges)}${lbData.rank ? " · место " + lbData.rank : ""}</div></div>`;
    lbData.rows.forEach((r, i) => { h += `<div class="card ${r.id === me.id ? "p" : ""}"><div class="circ" style="width:38px;height:38px;font-size:15px;font-weight:700"><span style="color:${["#ffd54f", "#cfd8dc", "#d7966a"][i] || "inherit"}">${i + 1}</span></div>${av(r.name, r.id, 40)}<div class="grow"><div class="t1">${nm(r.name, r.badges)}</div></div><div class="t1">${fmt(r.total)}</div></div>`; });
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
  h += chips3([["+1M", 1e6], ["+1B", 1e9], ["+1T", 1e12]], "admpts");
  h += `<div class="buyrow">${btn(ic("gem", 14) + "+10", "admgem", 'data-v="10"', "o")}${btn(ic("gem", 14) + "+100", "admgem", 'data-v="100"', "o")}</div>`;
  h += `<div class="t1" style="color:var(--err,#ff5252);margin-top:10px">Забрать у игрока</div><div class="t2">Нужен ID игрока в поле выше (себе тоже можно)</div>`;
  h += btn("Отобрать кота: " + it[1] + " ×" + admQty, "admtakecat", 'style="width:100%;justify-content:center"', "o");
  h += `<div class="buyrow3">${[10, 50, 99].map(x => btn("−" + x + "%", "admtakepct", `data-v="${x}"`, "o")).join("")}</div><input data-keep="admamt" placeholder="Своя сумма, например 5e25" style="margin-top:6px">` + btn("Забрать эту сумму", "admtakeamt", 'style="width:100%;justify-content:center"', "o") + btn("Забрать все монеты", "admtakeall", 'style="width:100%;justify-content:center"', "o") + `` + btn("Забрать все самоцветы", "admtakegem", 'data-v="-1" style="width:100%;justify-content:center"', "o") + `</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Сообщение всем в игре</div><textarea data-keep="bc" rows="2" placeholder="Текст сообщения"></textarea>${btn("Показать всем", "admbc")}</div>`;
  h += `<div class="card col"><div class="t1" style="color:var(--pri)">Промокоды</div><input data-keep="pcode" placeholder="Код, например NEWYEAR" style="text-transform:uppercase"><div class="buyrow4">${[["Монеты", "pts"], ["Самоцветы", "gems"], ["Кот", "cat"]].map(x => `<button class="chip ${admKind === x[1] ? "p" : ""}" style="border:0;font-family:inherit;justify-content:center" data-a="admkind" data-v="${x[1]}">${x[0]}</button>`).join("")}</div><input data-keep="pa" inputmode="decimal" placeholder="${admKind === "cat" ? "Номер кота 0–62" : "Сколько"}">${admKind === "cat" ? `<input data-keep="pb" inputmode="numeric" placeholder="Сколько котов (1)">` : ""}<input data-keep="pmx" inputmode="numeric" placeholder="Сколько человек смогут ввести (0 = без лимита)">${btn("Создать промокод", "admpromo")}`;
  if (promoList) h += promoList.map(p => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)"><div class="grow"><div class="t1" style="font-size:14px">${esc(p.code)}</div><div class="t2" style="font-size:11px">${rewTxt(p.kind, p.a, p.b)} · использовано ${p.used}${p.mx ? "/" + p.mx : ""}</div></div>${btn(ic("close", 16), "admpdel", `data-v="${esc(p.code)}"`, "t")}</div>`).join("");
  h += `<div class="t1" style="color:#ff5252;margin-top:12px">Опасная зона</div>` + btn("Сбросить прогресс ВСЕМ игрокам", "admresetall", 'style="width:100%;justify-content:center"', "o");
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
A.admcat = function () { admGive("cat", admIdx, admQty); };
A.admpts = function (e) { admGive("pts", +e.dataset.v, 1); };
A.admtakecat = function () { admGive("takecat", admIdx, admQty); };
A.admtakepts = function (e) { admGive("takepts", +e.dataset.v, 1); };
A.admtakegem = function (e) { admGive("takegems", +e.dataset.v, 1); };
A.admtakepct = function (e) { admGive("takepts", +e.dataset.v, 2); };
A.admtakeamt = function () { const v = Number(String(KEEP.admamt || "").replace(",", ".")); if (!isFinite(v) || v <= 0) return toast("Введи сумму"); admGive("takepts", v, 1); };
A.admtakeall = function () { admGive("takepts", -1, 1); };
A.admgem = function (e) { admGive("gems", +e.dataset.v, 1); };
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
function fxPart(x, y, txt, col, size, dx, dy, dur, rot, grav) { if (!LS("fxt", 1)) return;
  const p = document.createElement("div"); p.className = "fxp"; p.textContent = txt; p.style.color = col; p.style.fontSize = size + "px"; p.style.left = x + "px"; p.style.top = y + "px";
  document.body.appendChild(p);
  try { p.animate([{transform: "translate(-50%,-50%) scale(.4) rotate(0)", opacity: 1}, {transform: `translate(calc(-50% + ${dx * .6}px),calc(-50% + ${dy * .6}px)) scale(1.1) rotate(${rot * .5}deg)`, opacity: 1, offset: .45}, {transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy + (grav || 0)}px)) scale(.3) rotate(${rot}deg)`, opacity: 0}], {duration: dur, easing: "cubic-bezier(.2,.7,.3,1)"}); } catch (e) {}
  setTimeout(() => p.remove(), dur + 50);
}
function fxRing(x, y, col, size, dur) { if (!LS("fxt", 1)) return;
  const r = document.createElement("div"); r.className = "fxr"; r.style.left = x - size / 2 + "px"; r.style.top = y - size / 2 + "px"; r.style.width = r.style.height = size + "px"; r.style.borderColor = col; document.body.appendChild(r);
  try { r.animate([{transform: "scale(.2)", opacity: .9}, {transform: "scale(1.6)", opacity: 0}], {duration: dur || 480, easing: "ease-out"}); } catch (e) {}
  setTimeout(() => r.remove(), (dur || 480) + 50);
}
function fxBurst(x, y, n, cols, spd) {
  for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), r = rnd(.5, 1) * (spd || 90); fxPart(x, y, ["✦", "●", "★", "◆", "✧"][rint(0, 4)], cols[rint(0, cols.length - 1)], rint(9, 20), Math.cos(a) * r, Math.sin(a) * r - 20, rint(420, 800), rint(-260, 260), rint(20, 60)); }
}
function fxConfetti(n) { if (!LS("fxt", 1)) return;
  const cs = ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#fff"];
  for (let i = 0; i < n; i++) setTimeout(() => fxPart(rnd(0, innerWidth), -10, ["■", "●", "▲", "✦"][rint(0, 3)], cs[rint(0, 5)], rint(10, 18), rint(-60, 60), innerHeight * rnd(.5, 1), rint(1400, 2600), rint(-500, 500), 0), i * 14);
}
function fxFloat(txt, x, y, col, size) { if (!LS("fxt", 1)) return;
  const e = document.createElement("div"); e.className = "fxf"; e.textContent = txt; e.style.left = x + "px"; e.style.top = y + "px"; e.style.color = col; e.style.fontSize = size + "px"; document.body.appendChild(e);
  const dx = rint(-30, 30);
  try { e.animate([{transform: "translate(-50%,-50%) scale(.5)", opacity: 0}, {transform: `translate(calc(-50% + ${dx * .4}px),-90%) scale(1.15)`, opacity: 1, offset: .2}, {transform: `translate(calc(-50% + ${dx}px),-260%) scale(.9)`, opacity: 0}], {duration: 900, easing: "ease-out"}); } catch (x) {}
  setTimeout(() => e.remove(), 950);
}
const _tap0 = tap;
tap = function () {
  const before = S.pts, c0 = S.crit, tt0 = S.total, rr0 = S.run; _tap0();
  if (("71" in S.inv) && S.pts > before) { const g0 = S.pts - before; S.pts = Math.max(0, before - g0); S.total = tt0; S.run = rr0; const {x, y} = lastPt; fxRing(x, y, "#ff1744", 110, 500); fxBurst(x, y, 8, ["#ff1744", "#ff5252", "#fff"], 100); fxFloat("−" + fmt(g0), x, y - 30, "#ff5252", 24); return; }
  const g = S.pts - before, crit = g > tapValue() * 3, fe = now() < fever, f = now() < frenzy;
  const {x, y} = lastPt, cols = fe ? ["#ff6d00", "#ffab00", "#ffff00", "#fff"] : f ? ["#e040fb", "#ffd740", "#fff"] : PCOL;
  fxRing(x, y, crit ? "#fff" : cols[0], crit ? 130 : 80, crit ? 560 : 420);
  fxBurst(x, y, crit ? 18 : fe ? 10 : 6, cols, crit ? 130 : 90);
  fxFloat((crit ? "КРИТ +" : "+") + fmt(g), x, y - 30, crit ? "#fff" : fe ? "#ffab00" : "#ffd54f", crit ? 30 : 21);
  if (crit) { const v = $("#view"); if (v) { v.classList.remove("shk"); void v.offsetWidth; v.classList.add("shk"); setTimeout(() => v.classList.remove("shk"), 300); } fxRing(x, y, "#ffd54f", 200, 650); }
  if (S.taps % 25 === 0) fxConfetti(14);
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
  if (tab !== _lastTab || sub !== _lastSub) { _lastTab = tab; _lastSub = sub; const v = $("#view"); if (v) { v.classList.remove("vin"); void v.offsetWidth; v.classList.add("vin"); } }
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
  "Копить миллиарды невыгодно: свыше 1 млрд идёт небольшой налог."
];
let masEl = null, masT = 0, masSide = 0, masBag = [], masQ = [], masRun = 0;
const masBlocked = () => (tab === 6 && cz.sub === 2) || OVL || document.hidden || document.querySelector(".mdl");
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
const mback = `<button class="btn t" data-a="mnu" data-k="back" style="margin:0 0 8px">← Ещё</button>`;
A.mnu = function (e) {
  const k = e.dataset.k;
  if (k === "back") { moreSub = 0; tab = 5; }
  else if (k === "lead" || k === "trade" || k === "chat") { tab = 4; sub = k === "lead" ? 0 : k === "trade" ? 1 : 2; }
  else { tab = 5; moreSub = {set: 1, info: 2, adm: 3, ws: 4}[k]; if (k === "ws") wsLoad(); }
  render(); $("#view").scrollTop = 0;
};
const _tTopOld = tTop; tTop = function () { return mback + _tTopOld(); };
const _tab0 = A.tab; A.tab = function (e) { moreSub = 0; return _tab0(e); };
tMore = function () {
  const head = `<div class="card"><div class="grow"><div class="t1">${nm(me.name, myBadges)}</div><div class="t2">ID ${me.id}</div></div></div>`;
  if (moreSub === 0) return head + `<div class="t2" style="margin:12px 4px 0;font-weight:700">Сообщество</div>` + mbtn("podium", "Лидеры", "lead") + mbtn("swap", "Обмен", "trade") + mbtn("cat", "Чат", "chat") + mbtn("cube", "Мастерская", "ws") + `<div style="height:10px"></div>` + mbtn("tune", "Настройки", "set") + mbtn("check", "Информация", "info") + (isAdm ? mbtn("crown", "Админка", "adm", "adm") : "");
  if (moreSub === 4) return mback + tWorkshop();
  if (moreSub === 3 && isAdm) { if (!promoList) loadPromos(); return mback + admCard(); }
  if (moreSub === 2) {
    const st = [["Всего тапов", fmt(S.taps)], ["Накоплено за всё время", fmt(S.total)], ["За текущий забег", fmt(S.run)], ["Генераторов", owned()], ["Самоцветов", S.gems], ["Перерождений", S.prest], ["Звёзд поймано", S.stars], ["Лихорадок", S.fevers], ["Общий множитель", "x" + baseMult().toFixed(2)]];
    return mback + `<div class="card col" style="gap:0">${st.map(r => `<div style="display:flex;padding:3px 0"><span class="t2 grow" style="font-size:14px;margin:0">${r[0]}</span><span style="font-size:14px;font-weight:700">${r[1]}</span></div>`).join("")}</div>` +
      `<div class="card col"><div class="t1" style="color:var(--pri)">Как играть</div><div class="t2" style="font-size:13px">${TIPS}</div></div>` +
      `<div class="card col"><div class="t1" style="color:var(--pri)">Что нового</div>${CHANGES.map(c => `<div style="font-size:13px;font-weight:700;margin-top:8px">v${c[0]}</div>${c[1].map(x => `<div class="t2" style="font-size:12px;margin-top:2px">• ${x}</div>`).join("")}`).join("")}</div>`;
  }
  const fn = ["Нет", "Снежинки", "Тыквы"], fv = [0, 1, 2]; SETS.forEach((x, i) => { if (S.sets.includes(x[0])) { fn.push(x[1]); fv.push(3 + i); } });
  return mback + `<div class="card col"><div class="t1" style="color:var(--pri)">Оформление</div>${optRow("Тема", THEMES.map(t => t[0]), "th", THEMES.map((_, i) => i), LS("th", 0))}${optRow("Падающий фон", fn, "fall", fv, LS("fall", 0))}</div>` +
    `<div class="card col"><div class="t1" style="color:var(--pri)">Игра</div>${tog("Вибрация", "hap", LS("hap", 1))}${tog("Звуки кейсов", "snd", LS("snd", 1))}${tog("Анимации клика", "fxt", LS("fxt", 1))}${tog("Анимации открытия кейсов", "fxc", LS("fxc", 1))}</div>` +
    `<div class="card col"><div class="t1" style="color:var(--pri)">Промокод</div><div style="display:flex;gap:8px"><input data-keep="promo" placeholder="Введи промокод" style="text-transform:uppercase">${btn("Ок", "promo")}</div></div>` +
    `<button class="btn t" data-a="reset" style="width:100%;justify-content:center;margin-top:4px">Сбросить весь прогресс</button>`;
};

// ---------- пользовательские коты и мастерская
const BASE_N = ITEMS.length; let ucN = 0;
async function loadUcats() {
  const r = await api("ucats", {}); if (!r || !r.rows) return;
  ITEMS.length = BASE_N;
  r.rows.forEach(x => { ITEMS[x.idx] = ["", x.name, x.rar, x.uid, x.uname, x.id]; });
  for (let i = BASE_N; i < ITEMS.length; i++) if (!ITEMS[i]) ITEMS[i] = ["", "?", 0, 0, "", 0];
  ucN = r.rows.length;
}
const _catEl1 = catEl;
catEl = function (idx, size, extra) {
  const h = _catEl1(idx, size, extra);
  if (typeof idx === "number" && idx >= BASE_N && ITEMS[idx]) return h.replace(/background-image:url\([^)]*\)/, `background-image:url(/ucat/${ITEMS[idx][5]}.jpg)`);
  return h;
};
A.catinfo = function (e) {
  const i = +e.dataset.i, it = ITEMS[i]; if (!it) return; const o = S.inv[i + ""] || 0, ho = S.holo.includes(i), r = it[2];
  const bonus = r === 8 ? "×40 к тапу" : r === 7 ? "×1 секстилион к одному тапу" : "+" + RARS[r][2] + "% ко всему за предмет" + (ho ? " (×1.5 голограмма)" : "");
  const cr = i >= BASE_N ? `<span data-a="prof" data-i="${it[3]}" style="color:var(--pri);text-decoration:underline;font-weight:700">${esc(it[4] || "Игрок")}</span>` : `<span style="font-weight:700">MDMelon</span>`;
  const row = (k, v) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0"><span class="t2" style="margin:0;font-size:14px">${k}</span><span style="font-size:14px;text-align:right">${v}</span></div>`;
  const mo = modal(`<div style="text-align:center"><div class="t1" style="font-size:22px;color:${RC[r]}">${ho ? "★ " : ""}${esc(it[1])}</div><div style="margin:14px auto;width:220px;max-width:70vw">${catEl(i, 220, {holo: ho})}</div></div>` +
    row("Редкость", `<span style="color:${RC[r]};font-weight:700">${RARS[r][0]}</span>`) + row("Бонус", bonus) + row("У тебя", o ? "×" + o + (ho ? " · голограмма" : "") : "нет") + row("Создатель", cr) +
    `<div style="display:flex;gap:10px;margin-top:14px">${btn("Закрыть", "mclose", "", "t")}${o ? btn(+S.eq === i ? "Снять с монеты" : "На монету", "catequip", `data-i="${i}"`) : ""}</div>`);
  mo.style.alignItems = "center"; const c = mo.firstChild; c.style.borderRadius = "28px"; c.style.width = "calc(100% - 32px)"; c.style.padding = "20px 18px"; c.style.animation = "catpop .25s ease-out";
};
A.catequip = function (e) { closeModal(); A.equip(e); };

let wsSub = 0, wsRar = 0, wsImg = "", wsMine = null, wsPend = null, ideaData = null; const wsAR = {};
async function wsLoad() {
  const m = await api("uc_mine", {}); wsMine = m.rows || [];
  if (isAdm) { const q = await api("uc_pending", {}); wsPend = q.rows || []; (wsPend).forEach(x => { if (KEEP["wn" + x.id] === undefined) KEEP["wn" + x.id] = x.name; }); }
  ideaData = await api("idea_list", {});
  if (tab === 5 && moreSub === 4) render();
}
const wsRarChips = (cur, act, id) => `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${RARS.slice(0, 7).map((R, r) => `<button class="chip ${cur === r ? "p" : ""}" style="border:0;font-family:inherit;color:${cur === r ? "" : RC[r]}" data-a="${act}" data-v="${r}" data-i="${id}">${R[0]}</button>`).join("")}</div>`;
const STT = {new: "На проверке", ok: "Одобрено", rej: "Отклонено"};
function tWorkshop() {
  let h = `<div class="seg"><button class="${wsSub === 0 ? "on" : ""}" data-a="wssub" data-i="0">Коты</button><button class="${wsSub === 1 ? "on" : ""}" data-a="wssub" data-i="1">Идеи</button></div>`;
  if (wsSub === 0) {
    h += `<div class="card col"><div class="t1" style="color:var(--pri)">Предложить кота</div><div class="t2" style="font-size:12px">Загрузи картинку, придумай название и предложи редкость. Админ проверит и может изменить название и редкость. Если одобрят, кот появится в игре с твоим именем создателя.</div><input data-keep="wsname" placeholder="Название кота" maxlength="24">${wsRarChips(wsRar, "wsrar", 0)}<div style="display:flex;align-items:center;gap:10px"><label class="btn o" for="wsfile">${wsImg ? "Другая картинка" : "Выбрать картинку"}</label><input type="file" id="wsfile" accept="image/*" hidden>${wsImg ? `<img src="${wsImg}" style="width:72px;height:72px;border-radius:14px;object-fit:cover">` : ""}</div>${btn("Отправить на проверку", "wssend")}</div>`;
    if (isAdm) {
      h += `<div class="sec">Заявки на модерации${wsPend ? " · " + wsPend.length : ""}</div>`;
      if (!wsPend) h += `<div class="t2" style="text-align:center;margin:12px">Загружаю…</div>`;
      else if (!wsPend.length) h += `<div class="t2" style="text-align:center;margin:12px">Заявок нет</div>`;
      else wsPend.forEach(x => { const cr = wsAR[x.id] !== undefined ? wsAR[x.id] : x.rar; h += `<div class="card col"><div style="display:flex;gap:12px;align-items:center"><img src="/ucat/${x.id}.jpg" style="width:84px;height:84px;border-radius:16px;object-fit:cover;flex:none"><div class="grow"><div class="t2" style="margin:0;font-size:12px">от <b>${esc(x.uname)}</b></div><div class="t2" style="margin:2px 0 0;font-size:12px">Предложил: ${esc(x.name)} · <span style="color:${RC[x.rar]}">${RARS[x.rar][0]}</span></div></div></div><input data-keep="wn${x.id}" placeholder="Название" maxlength="24">${wsRarChips(cr, "wsadr", x.id)}<div style="display:flex;gap:8px">${btn("Отклонить", "ucno", `data-i="${x.id}"`, "o")}${btn("Одобрить", "ucok", `data-i="${x.id}"`)}</div></div>`; });
    }
    if (wsMine && wsMine.length) { h += `<div class="sec">Мои заявки</div>` + wsMine.map(x => `<div class="card"><div class="grow"><div class="t1" style="font-size:14px">${esc(x.name)}</div><div class="t2" style="font-size:12px">${RARS[x.rar][0]}</div></div><span class="chip ${x.status === "ok" ? "p" : ""}">${STT[x.status] || x.status}</span></div>`).join(""); }
    const ucs = ITEMS.map((it, i) => i >= BASE_N ? i : -1).filter(i => i >= 0);
    h += `<div class="sec">Коты игроков${ucs.length ? " · " + ucs.length : ""}</div>`;
    h += ucs.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${ucs.map(i => `<div class="cell" data-a="catinfo" data-i="${i}" style="padding:8px 4px">${catEl(i, 76, {})}<span style="color:${RC[ITEMS[i][2]]}">${esc(ITEMS[i][1])}</span><span style="color:var(--onv);font-weight:500">${esc(ITEMS[i][4])}</span></div>`).join("")}</div>` : `<div class="t2" style="text-align:center;margin:12px">Пока нет котов от игроков. Будь первым!</div>`;
  } else {
    h += `<div class="card col"><div class="t1" style="color:var(--pri)">Предложить идею</div><div class="t2" style="font-size:12px">Если админ добавит твою идею в игру, ты получишь значок «Гений».</div><textarea data-keep="idea" rows="3" maxlength="300" placeholder="Что добавить в игру?"></textarea>${btn("Отправить идею", "ideasend")}</div>`;
    const d = ideaData;
    if (!d) return h + `<div class="t2" style="text-align:center;margin:12px">Загружаю…</div>`;
    if (isAdm && d.pend && d.pend.length) h += `<div class="sec">Идеи на рассмотрении · ${d.pend.length}</div>` + d.pend.map(x => `<div class="card col"><div class="t2" style="margin:0;font-size:12px">от <b>${esc(x.uname)}</b></div><div style="font-size:14px;white-space:pre-wrap">${esc(x.text)}</div><div style="display:flex;gap:8px">${btn("Отклонить", "ideano", `data-i="${x.id}"`, "o")}${btn("Добавить · Гений", "ideaok", `data-i="${x.id}"`)}</div></div>`).join("");
    if (d.mine && d.mine.length) h += `<div class="sec">Мои идеи</div>` + d.mine.map(x => `<div class="card"><div class="grow t2" style="margin:0;font-size:13px;white-space:pre-wrap">${esc(x.text)}</div><span class="chip">${STT[x.status] || x.status}</span></div>`).join("");
    h += `<div class="sec">Добавленные идеи</div>` + (d.ok && d.ok.length ? d.ok.map(x => `<div class="card">${bdg("g", 20)}<div class="grow"><div style="font-size:14px;white-space:pre-wrap">${esc(x.text)}</div><div class="t2" style="margin:2px 0 0;font-size:11px">${esc(x.uname)}</div></div></div>`).join("") : `<div class="t2" style="text-align:center;margin:12px">Пока ни одной</div>`);
  }
  return h;
}
A.wssub = function (e) { wsSub = +e.dataset.i; render(); };
A.wsrar = function (e) { wsRar = +e.dataset.v; render(); };
A.wsadr = function (e) { wsAR[+e.dataset.i] = +e.dataset.v; render(); };
A.wssend = async function () {
  if (!wsImg) return toast("Выбери картинку");
  const r = await api("uc_submit", {name: KEEP.wsname || "", rar: wsRar, img: wsImg}); if (r.error) return toast(r.error);
  toast("Заявка отправлена на проверку"); wsImg = ""; KEEP.wsname = ""; wsLoad(); render();
};
A.ucok = async function (e) {
  const id = +e.dataset.i, x = (wsPend || []).find(q => q.id === id); if (!x) return;
  const r = await api("uc_approve", {id, name: KEEP["wn" + id] || x.name, rar: wsAR[id] !== undefined ? wsAR[id] : x.rar}); if (r.error) return toast(r.error);
  toast("Кот одобрен"); await wsLoad(); await loadUcats(); render();
};
A.ucno = async function (e) { const r = await api("uc_reject", {id: +e.dataset.i}); if (r.error) return toast(r.error); toast("Заявка отклонена"); wsLoad(); };
A.ideasend = async function () { const r = await api("idea_submit", {text: KEEP.idea || ""}); if (r.error) return toast(r.error); toast("Идея отправлена"); KEEP.idea = ""; wsLoad(); render(); };
A.ideaok = async function (e) { const r = await api("idea_ok", {id: +e.dataset.i}); if (r.error) return toast(r.error); toast("Идея добавлена, игроку выдан значок Гений"); wsLoad(); };
A.ideano = async function (e) { const r = await api("idea_rej", {id: +e.dataset.i}); if (r.error) return toast(r.error); toast("Идея отклонена"); wsLoad(); };
document.addEventListener("change", e => {
  const f = e.target; if (!f || f.id !== "wsfile" || !f.files || !f.files[0]) return;
  const url = URL.createObjectURL(f.files[0]), im = new Image();
  im.onload = () => {
    const c = document.createElement("canvas"); c.width = c.height = 320; const g = c.getContext("2d"), s = Math.min(im.width, im.height);
    g.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 320, 320);
    let q = .85, d = c.toDataURL("image/jpeg", q); while (d.length > 150000 && q > .3) { q -= .1; d = c.toDataURL("image/jpeg", q); }
    URL.revokeObjectURL(url); wsImg = d; render();
  };
  im.onerror = () => toast("Не удалось открыть картинку"); im.src = url;
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
  const seg = `<div class="seg"><button data-a="sub" data-i="0">Лидеры</button><button class="on" data-a="sub" data-i="1">Обмен</button><button data-a="sub" data-i="2">Чат</button></div>`;
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
const czBet = () => { const mx = Math.floor(S.pts); cz.bet = Math.max(100, Math.min(cz.bet, mx >= 100 ? mx : 100)); return cz.bet; };
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
  if (cz.sub === 2 && cz.phase !== 1) { const r = await api("cz_pk_state", {}); if (r && r.hand) { cz.phase = 1; cz.hand = r.hand; cz.pbet = r.bet; cz.hold = [false, false, false, false, false]; cz.res = null; toast("Продолжаем начатую раздачу"); } else { cz.phase = 0; cz.res = null; } }
  render(); czInfo(); $("#view").scrollTop = 0;
};
tCasino = function () {
  const back = `<button class="btn t" data-a="czgo" data-k="0" style="margin:0 0 8px">← Казино</button>`;
  const jp = `<div class="czjpc"><div class="czjt">🎰 ДЖЕКПОТ</div><div class="czjp czjv">${cz.jp === null ? "…" : fmt(cz.jp)}</div><div id="czlast" class="czjs"></div></div>`;
  const bal = `<div class="card" style="padding:10px 16px"><span class="t2 grow" style="margin:0">Баланс</span><b id="czbal" style="font-size:18px">${fmt(S.pts)}</b></div>`;
  if (cz.sub === 0) return jp + `<button class="mbtn" data-a="czgo" data-k="1"><span style="font-size:28px">🎡</span><span class="grow">Рулетка<div class="t2" style="margin:0;font-size:12px;font-weight:500">Красное и чёрное ×2, зелёное ×24 и сектор с джекпотом</div></span>${ic("arrow", 20)}</button><button class="mbtn" data-a="czgo" data-k="2" style="height:70px"><span style="font-size:28px">🃏</span><span class="grow">Покер<div class="t2" style="margin:0;font-size:12px;font-weight:500">Простой: 5 карт, одна замена, раздаёт арбуз</div></span>${ic("arrow", 20)}</button><div class="t2" style="margin:14px 6px;font-size:12px">Играть можно только на монеты. Выигрыш не идёт в таблицу лидеров и не считается за забег. Играй осторожно!</div>`;
  if (cz.sub === 1) {
    const stops = Array.from({length: ZN}, (_, i) => `${ZC[secCol(i)]} ${i * ZS}deg ${(i + 1) * ZS}deg`).join(",");
    const lab = (i, t) => `<span class="rlab" style="transform:rotate(${(i + .5) * ZS}deg) translateY(-104px)">${t}</span>`;
    return back + jp + bal + `<div class="rwrap"><div class="rptr">▼</div><div id="rwheel" class="rwheel" style="background:repeating-conic-gradient(rgba(0,0,0,.45) 0 .5deg,transparent .5deg ${ZS}deg),conic-gradient(${stops});transform:rotate(${cz.rot}deg)">${lab(0, "0")}${lab(13, "★")}<span class="rhub">🍉</span></div></div><div class="rhist" id="rhist">${cz.hist.map(c => `<i style="background:${ZC[c]}"></i>`).join("")}</div><div class="rpicks">${[["r", "Красное ×2"], ["b", "Чёрное ×2"], ["g", "Зелёное ×24"]].map(x => `<button class="rpick${cz.pick === x[0] ? " on" : ""}" data-a="czpick" data-v="${x[0]}" style="--c:${ZC[x[0]]}">${x[1]}</button>`).join("")}</div>${czBetUi()}<div id="czres" class="czres"></div><button id="rspin" class="btn" data-a="czspin" style="width:100%;height:54px;justify-content:center;font-size:17px;margin-top:10px">Крутить</button><div class="t2" style="margin:12px 6px;font-size:12px">5% каждой ставки идёт в джекпот. Выпал сектор ★ — забираешь весь джекпот, на какой бы цвет ни ставил.</div>`;
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
  const r = await api("cz_roulette", {bet, pick: cz.pick});
  if (!r || r.error) { S.pts += bet; cz.busy = false; mark(); czUpd(); if (btn0) btn0.classList.remove("dis"); return toast((r && r.error) || "Нет связи"); }
  const w = $("#rwheel"); cz.rot = (Math.floor(cz.rot / 360) + 6) * 360 - (r.sector + .5) * ZS + (Math.random() - .5) * ZS * .6;
  if (w) { w.style.transition = "transform 4.2s cubic-bezier(.12,.7,.1,1)"; w.style.transform = `rotate(${cz.rot}deg)`; }
  await sleep(4400);
  S.pts += r.payout; mark(); if (r.payout > bet) save(true); cz.jp = r.jp; cz.last = r.last; const col = secCol(r.sector); cz.hist.push(col); if (cz.hist.length > 14) cz.hist.shift(); cz.busy = false; czUpd();
  const hi = $("#rhist"); if (hi) hi.innerHTML = cz.hist.map(c => `<i style="background:${ZC[c]}"></i>`).join("");
  const rs2 = $("#czres"), b2 = $("#rspin"); if (b2) b2.classList.remove("dis");
  if (r.jackpot) { if (rs2) { rs2.className = "czres win jp"; rs2.textContent = "ДЖЕКПОТ! +" + fmt(r.payout - bet); } try { fxConfetti(160); jingle(2); hap("ok"); } catch (e) {} }
  else if (r.payout > 0) { if (rs2) { rs2.className = "czres win"; rs2.textContent = "Выигрыш +" + fmt(r.payout - bet); } try { fxConfetti(40); hap("ok"); } catch (e) {} }
  else if (rs2) { rs2.className = "czres lose"; rs2.textContent = "Проигрыш −" + fmt(bet); }
  if (tab === 6) czUpd();
};
// --- покер
let pkTalk = 0;
function pkFr(n) { const m = $("#pkm"); if (m) m.style.backgroundPositionX = (-96 * n) + "px"; }
function pkSay(t, ms) {
  const b = $("#pkb"); if (b) b.textContent = t; const id = ++pkTalk; let f = 1; const end = Date.now() + (ms || 900);
  const tk = setInterval(() => { if (id !== pkTalk || Date.now() > end) { clearInterval(tk); if (id === pkTalk) pkFr(2); return; } pkFr(f = f === 1 ? 2 : 1); }, 220);
}
function pkFly(i, delay) {
  const slot = document.querySelectorAll("#pkrow .pks")[i], m = $("#pkm"); if (!slot || !m) return;
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
  cz.hand = r.hand; S.pts += r.payout; mark(); if (r.payout > cz.pbet) save(true);
  const ev = $("#pkev"); if (ev) ev.textContent = r.name;
  const win = r.payout - r.pbet || 0, prof = r.payout - cz.pbet;
  cz.res = r.mult > 0 ? `${r.name}: +${fmt(prof)}${r.mult === 1 ? " (ставка возвращена)" : ""}` : `Ничего — −${fmt(cz.pbet)}`;
  cz.phase = 2; cz.busy = false; render(); czUpd();
  const sl = $("#pkrow"); if (sl) sl.querySelectorAll(".pk3").forEach(c => c.classList.remove("back"));
  const rs = $("#czres"); if (rs) rs.className = "czres " + (r.mult > 1 ? "win" : r.mult === 1 ? "" : "lose");
  pkSay(r.mult >= 6 ? "Вот это да!!!" : r.mult >= 2 ? "Отлично, ты в плюсе!" : r.mult === 1 ? "Хоть ставку вернул!" : "Не повезло… ещё разок?", 1400);
  if (r.mult >= 2) { try { fxConfetti(r.mult >= 9 ? 120 : 50); jingle(2); hap("ok"); } catch (x) {} }
};
A.czagain = function () { if (cz.busy) return; cz.phase = 0; cz.res = null; cz.hand = []; render(); };
const _r6 = render;
render = function () {
  if (tab === 6 && cz.busy) return;
  _r6();
  if (tab === 6) { if (Date.now() - cz.jpAt > 4000) czInfo(); if (cz.sub === 2) { pkFr(2); } }
};
setInterval(() => { if (tab === 6 && !document.hidden) { const e = document.getElementById("czbal"); if (e) e.textContent = fmt(S.pts); } }, 700);
