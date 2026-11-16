// ---------- шахматы: общий код клиента и сервера (0 = a8, 63 = h1; белые >0, чёрные <0; 1 п, 2 к, 3 с, 4 л, 5 ф, 6 кр)
const CH_V = [0, 100, 320, 330, 500, 900, 20000];
function chNew() { const b = Array(64).fill(0), k = [4, 2, 3, 5, 6, 3, 2, 4]; for (let c = 0; c < 8; c++) { b[c] = -k[c]; b[8 + c] = -1; b[48 + c] = 1; b[56 + c] = k[c]; } return {b, t: 1, c: [1, 1, 1, 1], ep: -1, hm: 0, n: 0}; }
function chAtt(b, sq, by) {
  const r = sq >> 3, c = sq & 7, at = (rr, cc, p) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === p * by;
  if (at(r + by, c - 1, 1) || at(r + by, c + 1, 1)) return true;
  for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) if (at(r + dr, c + dc, 2)) return true;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && at(r + dr, c + dc, 6)) return true;
  for (const [dr, dc, a] of [[-1, 0, 4], [1, 0, 4], [0, -1, 4], [0, 1, 4], [-1, -1, 3], [-1, 1, 3], [1, -1, 3], [1, 1, 3]]) {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const v = b[rr * 8 + cc]; if (v) { if (v * by > 0 && (Math.abs(v) === a || Math.abs(v) === 5)) return true; break; } rr += dr; cc += dc; }
  }
  return false;
}
function chGen(st, caps) {
  const b = st.b, t = st.t, out = [];
  for (let f = 0; f < 64; f++) {
    const v = b[f]; if (!v || v * t < 0) continue; const p = Math.abs(v), r = f >> 3, c = f & 7;
    const add = (tr, tc) => { if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false; const to = tr * 8 + tc, x = b[to]; if (x * t > 0) return false; if (!caps || x) out.push([f, to, 0]); return !x; };
    if (p === 1) {
      const nr = r - t, pr = nr === 0 || nr === 7 ? 5 : 0;
      if (nr >= 0 && nr < 8) {
        if (!b[nr * 8 + c] && !caps) { out.push([f, nr * 8 + c, pr]); if (r === (t === 1 ? 6 : 1) && !b[(r - 2 * t) * 8 + c]) out.push([f, (r - 2 * t) * 8 + c, 0]); }
        for (const dc of [-1, 1]) { const cc = c + dc; if (cc < 0 || cc > 7) continue; const to = nr * 8 + cc; if ((b[to] * t < 0) || to === st.ep) out.push([f, to, pr]); }
      }
    } else if (p === 2) { for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) add(r + dr, c + dc); }
    else if (p === 6) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(r + dr, c + dc);
      if (!caps) { const base = t === 1 ? 60 : 4, ix = t === 1 ? 0 : 2;
        if (f === base && !chAtt(b, f, -t)) {
          if (st.c[ix] && !b[f + 1] && !b[f + 2] && b[f + 3] === 4 * t && !chAtt(b, f + 1, -t)) out.push([f, f + 2, 0]);
          if (st.c[ix + 1] && !b[f - 1] && !b[f - 2] && !b[f - 3] && b[f - 4] === 4 * t && !chAtt(b, f - 1, -t)) out.push([f, f - 2, 0]);
        } }
    } else {
      const dirs = p === 3 ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : p === 4 ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) { let rr = r + dr, cc = c + dc; while (add(rr, cc)) { rr += dr; cc += dc; } }
    }
  }
  return out;
}
function chApply(st, m) {
  const b = st.b.slice(), [f, to, pr] = m, v = b[f], p = Math.abs(v), t = st.t, cap = b[to] !== 0 || (p === 1 && to === st.ep);
  const c = st.c.slice(); let ep = -1;
  if (p === 1 && to === st.ep && !b[to]) b[to + 8 * t] = 0;
  b[to] = pr ? 5 * t : v; b[f] = 0;
  if (p === 1 && Math.abs(to - f) === 16) ep = (f + to) >> 1;
  if (p === 6) { if (to - f === 2) { b[f + 1] = b[f + 3]; b[f + 3] = 0; } else if (f - to === 2) { b[f - 1] = b[f - 4]; b[f - 4] = 0; } if (t === 1) { c[0] = c[1] = 0; } else { c[2] = c[3] = 0; } }
  if (f === 63 || to === 63) c[0] = 0; if (f === 56 || to === 56) c[1] = 0; if (f === 7 || to === 7) c[2] = 0; if (f === 0 || to === 0) c[3] = 0;
  return {b, t: -t, c, ep, hm: p === 1 || cap ? 0 : st.hm + 1, n: st.n + 1};
}
const chKing = (b, t) => b.indexOf(6 * t);
const chCheck = st => chAtt(st.b, chKing(st.b, st.t), -st.t);
function chLegal(st) { return chGen(st).filter(m => { const s = chApply(st, m), k = chKing(s.b, st.t); return k >= 0 && !chAtt(s.b, k, -st.t); }); }
function chStatus(st) {
  if (!chLegal(st).length) return chCheck(st) ? "mate" : "stalemate";
  if (st.hm >= 100 || st.n >= 240) return "draw";
  let minor = 0; for (const v of st.b) { const p = Math.abs(v); if (p === 1 || p === 4 || p === 5) return ""; if (p === 2 || p === 3) minor++; }
  return minor <= 1 ? "draw" : "";
}
function chEval(st) {
  let s = 0; const b = st.b;
  for (let i = 0; i < 64; i++) { const v = b[i]; if (!v) continue; const p = Math.abs(v), sg = v > 0 ? 1 : -1, r = i >> 3, c = i & 7, cen = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)) * .5 - Math.min(Math.abs(r - 3.5), Math.abs(c - 3.5)) * .5;
    let x = CH_V[p]; if (p === 1) x += (sg > 0 ? 6 - r : r - 1) * 6 + cen * 4; else if (p === 2 || p === 3) x += cen * 9; else if (p === 5) x += cen * 2;
    s += sg * x; }
  return s * st.t;
}
// ход бота: глубина 2 (его ход + ответ), с отсечением и небольшим случайным шумом
function chBest(st, rnd) {
  const moves = chLegal(st); if (!moves.length) return null;
  const sc = m => (st.b[m[1]] ? CH_V[Math.abs(st.b[m[1]])] * 10 - CH_V[Math.abs(st.b[m[0]])] : 0) + (m[2] ? 800 : 0);
  moves.sort((a, b) => sc(b) - sc(a));
  let best = null, bv = -1e9;
  for (const m of moves) {
    const s1 = chApply(st, m); let v;
    if (chCheck(s1)) { if (!chLegal(s1).length) return m; }
    const rep = chGen(s1).sort((a, b) => sc(b) - sc(a)); let worst = 1e9;
    for (const r of rep) { const s2 = chApply(s1, r); const val = chEval({b: s2.b, t: st.t}); if (val < worst) { worst = val; if (worst <= bv) break; } }
    if (!rep.length) worst = 0;
    v = worst + (chCheck(s1) ? 25 : 0) + (rnd ? rnd() * 14 : 0);
    if (v > bv) { bv = v; best = m; }
  }
  return best;
}
