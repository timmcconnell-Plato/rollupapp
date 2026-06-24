'use client';

// One place the report views compute from. Head-scale so the cluster is legible.
// Coordinates in are metres jack-relative (+x right, +y long, -y short).
const HALF = 1.5, LONG = 1.2, SHORT = 3.0;   // visible metres
const W = 300, H = 420, SCALE = 100;          // px
const JX = 150, JY = 120;                     // jack px (1.2m long room above)

const m2p = (x, y) => ({ x: JX + x * SCALE, y: JY - y * SCALE });

export function computeStats(shots = []) {
  const draws = shots.filter((s) => s.finish_y !== null && s.finish_y !== undefined);
  const n = draws.length;
  const pct = (v) => (n ? Math.round((v / n) * 100) : 0);
  const fh = draws.filter((s) => s.hand === 'forehand').length;
  const bh = draws.filter((s) => s.hand === 'backhand').length;
  const short = draws.filter((s) => s.finish_y < -0.25).length;
  const long = draws.filter((s) => s.finish_y > 0.25).length;
  const left = draws.filter((s) => s.finish_x < -0.18).length;
  const right = draws.filter((s) => s.finish_x > 0.18).length;
  const tight = draws.filter((s) => Math.hypot(s.finish_x, s.finish_y) <= 0.25).length;  // within 2 bowl-widths
  const avg = n ? draws.reduce((a, s) => a + Math.hypot(s.finish_x, s.finish_y), 0) / n : 0;
  return {
    n, fh, bh, short, long, left, right, tight,
    onLen: n - short - long,
    shortPct: pct(short), longPct: pct(long), onLenPct: pct(n - short - long),
    leftPct: pct(left), rightPct: pct(right), onLinePct: pct(n - left - right),
    tightPct: pct(tight), avgMiss: Math.round(avg * 100), avgBowls: Math.round((avg / 0.125) * 10) / 10,
  };
}

export function Heatmap({ shots = [], max: maxW = 320 }) {
  const draws = shots.filter((s) => s.finish_y !== null && s.finish_y !== undefined);
  const cols = 12, rows = 18, cw = W / cols, ch = H / rows;
  const grid = {}; let max = 0;
  draws.forEach((p) => {
    const px = m2p(p.finish_x, p.finish_y);
    const c = Math.floor(px.x / cw), r = Math.floor(px.y / ch);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return;
    const k = `${c}_${r}`; grid[k] = (grid[k] || 0) + 1; if (grid[k] > max) max = grid[k];
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: maxW, alignSelf: 'center', display: 'block', border: '1px solid var(--line)', background: '#fff' }}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <circle key={n} cx={JX} cy={JY} r={n * 12.5} fill="none" stroke="var(--green)" strokeWidth={n % 2 === 0 ? 1 : 0.6} opacity={n % 2 === 0 ? 0.2 : 0.1} />
      ))}
      {Object.keys(grid).map((k) => {
        const [c, r] = k.split('_').map(Number);
        const op = 0.14 + 0.78 * (grid[k] / (max || 1));
        return <rect key={k} x={c * cw} y={r * ch} width={cw + 0.5} height={ch + 0.5} fill="var(--coral)" opacity={op.toFixed(2)} />;
      })}
      <line x1={JX} y1="0" x2={JX} y2={H} stroke="var(--deep)" strokeWidth="1" opacity="0.3" />
      <line x1="0" y1={JY} x2={W} y2={JY} stroke="var(--deep)" strokeWidth="1" opacity="0.3" />
      <text x={JX} y="14" textAnchor="middle" fontSize="11" fill="var(--deep)" opacity="0.5">long / behind</text>
      <text x={JX} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--deep)" opacity="0.5">short / front</text>
      <circle cx={JX} cy={JY} r="5.5" fill="var(--jack)" stroke="var(--jack-edge)" strokeWidth="1" />
    </svg>
  );
}

export function LengthProfile({ shots = [] }) {
  const draws = shots.filter((s) => s.finish_y !== null && s.finish_y !== undefined);
  const lo = -SHORT, hi = LONG, bins = 26;
  const hist = new Array(bins).fill(0);
  draws.forEach((p) => { const t = (p.finish_y - lo) / (hi - lo); const b = Math.min(bins - 1, Math.max(0, Math.floor(t * bins))); hist[b]++; });
  const hmax = Math.max(...hist, 1);
  const PW = 300, PH = 150, padL = 8, padT = 10, padB = 24;
  const plotW = PW - padL * 2, plotH = PH - padT - padB;
  const bx = (i) => padL + (i / (bins - 1)) * plotW;
  const by = (v) => padT + plotH - (v / hmax) * plotH;
  let line = ''; for (let i = 0; i < bins; i++) line += `${i ? 'L' : 'M'}${bx(i).toFixed(1)} ${by(hist[i]).toFixed(1)} `;
  const area = `M${padL} ${padT + plotH} L${line.slice(1)}L${padL + plotW} ${padT + plotH} Z`;
  const jackX = padL + ((0 - lo) / (hi - lo)) * plotW;
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} style={{ width: '100%', display: 'block', border: '1px solid var(--line)', background: '#fff' }}>
      <rect x={padL} y={padT + plotH + 4} width={plotW} height="6" fill="#E2EDE2" />
      <path d={area} fill="var(--teal)" opacity="0.18" />
      <path d={line} fill="none" stroke="var(--teal)" strokeWidth="2" />
      <line x1={jackX.toFixed(1)} y1={padT} x2={jackX.toFixed(1)} y2={padT + plotH + 10} stroke="var(--jack-edge)" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x={jackX.toFixed(1)} y={PH - 6} textAnchor="middle" fontSize="10" fill="#854F0B">jack</text>
      <text x={padL} y={PH - 6} fontSize="10" fill="var(--faint)">short</text>
      <text x={padL + plotW} y={PH - 6} textAnchor="end" fontSize="10" fill="var(--faint)">long</text>
    </svg>
  );
}
