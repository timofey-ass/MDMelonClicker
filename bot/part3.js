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
      onlineN = r.online || 0; if (r.badges !== undefined) myBadges = r.badges;
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
A.pgive = function (e) { KEEP.admid = e.dataset.i; closeModal(); tab = 5; render(); $("#view").scrollTop = 0; };

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
  const chips = (arr, a) => `<div class="buyrow4">${arr.map(x => btn(x[0], a, `data-v="${x[1]}"`, "o")).join("")}</div>`;
  let h = `<div class="card col"><div class="t1" style="color:var(--pri);display:flex;align-items:center;gap:8px">${ic("tune", 18)}Админ-панель</div><div class="t2">Выдача приходит игроку в течение нескольких секунд, если у него открыта игра. Пусто в поле ID = себе.</div><input data-keep="admid" inputmode="numeric" placeholder="ID игрока">`;
  h += `<div style="display:flex;align-items:center;gap:10px;margin-top:6px">${catEl(admIdx, 46, {})}<div class="grow t1" style="color:${rc};font-size:14px">${it[1]} · ${RARS[it[2]][0]} ×${admQty}</div></div>`;
  h += chips([["−5", -5], ["−", -1], ["+", 1], ["+5", 5]], "admidx") + chips([["×1", 1], ["×5", 5], ["×10", 10], ["×50", 50]], "admqty");
  h += btn("Выдать котика", "admcat", 'style="width:100%;justify-content:center"');
  h += chips([["+1K", 1e3], ["+1M", 1e6], ["+1B", 1e9], ["+1T", 1e12]], "admpts");
  h += `<div class="buyrow">${btn(ic("gem", 14) + "+10", "admgem", 'data-v="10"', "o")}${btn(ic("gem", 14) + "+100", "admgem", 'data-v="100"', "o")}</div>`;
  h += `<div class="t1" style="color:var(--err,#ff5252);margin-top:10px">Забрать у игрока</div><div class="t2">Нужен ID игрока в поле выше (себе тоже можно)</div>`;
  h += btn("Отобрать кота: " + it[1] + " ×" + admQty, "admtakecat", 'style="width:100%;justify-content:center"', "o");
  h += chips([["−1K", 1e3], ["−1M", 1e6], ["−1B", 1e9], ["−1T", 1e12]], "admtakepts") + `<div class="buyrow4">${[10, 50, 90, 99].map(x => btn("−" + x + "%", "admtakepct", `data-v="${x}"`, "o")).join("")}</div><input data-keep="admamt" placeholder="Своя сумма, например 5e25" style="margin-top:6px">` + btn("Забрать эту сумму", "admtakeamt", 'style="width:100%;justify-content:center"', "o") + btn("Забрать все монеты", "admtakeall", 'style="width:100%;justify-content:center"', "o") + `<div class="buyrow">${btn(ic("gem", 14) + "−10", "admtakegem", 'data-v="10"', "o")}${btn(ic("gem", 14) + "−100", "admtakegem", 'data-v="100"', "o")}</div>` + btn("Забрать все самоцветы", "admtakegem", 'data-v="-1" style="width:100%;justify-content:center"', "o") + `</div>`;
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
