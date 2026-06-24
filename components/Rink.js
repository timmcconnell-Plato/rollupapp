'use client';

import { useRef } from 'react';

// Head close-up view. Isotropic scale so distance rings are true circles.
// Coordinates out are metres, jack-relative (+x right, -x left, +y long, -y short)
// — identical to the rest of the app, only the zoom changes here.
const W = 300, H = 480;
const SCALE = 150;            // px per metre
const JX = 150, JY = 150;     // jack position in viewBox px (1.0m long room above)
const COL = { forehand: 'var(--fh)', backhand: 'var(--bh)' };

function toMetres(px, py) {
  return { x: (px - JX) / SCALE, y: (JY - py) / SCALE };
}
function toPx(x, y) {
  return { x: JX + x * SCALE, y: JY - y * SCALE };
}

export default function Rink({ dots = [], interactive = true, onPlace }) {
  const ref = useRef(null);

  function tap(e) {
    if (!interactive || !onPlace) return;
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    if (px < 0 || px > W || py < 0 || py > H) return;
    onPlace(toMetres(px, py));
  }

  const BOWL = 12.5;            // a bowl is ~12.5cm wide — rings count bowl-widths from the jack
  const rings = [1, 2, 3, 4, 5, 6];

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      onPointerDown={tap}
      role="img"
      aria-label="Head close-up — tap where the bowl finished, relative to the jack"
      style={{ width: '100%', maxWidth: 300, alignSelf: 'center', height: 'auto', display: 'block', border: '1px solid var(--line)', background: 'var(--pale)', cursor: interactive ? 'crosshair' : 'default', touchAction: 'none' }}
    >
      {rings.map((n) => {
        const major = n % 2 === 0;
        return (
          <circle key={n} cx={JX} cy={JY} r={n * BOWL * 1.5} fill="none"
            stroke="var(--green)" strokeWidth={major ? 1 : 0.75}
            opacity={major ? 0.3 : 0.16} />
        );
      })}
      {[1, 2, 3, 4].map((n) => {
        const r = n * BOWL * 1.5, a = -Math.PI / 4;
        return (
          <text key={n} x={JX + r * Math.cos(a)} y={JY + r * Math.sin(a) - 2}
            fontSize="9" fill="var(--green)" opacity="0.6" textAnchor="middle">
            {n === 1 ? '1 bowl' : n}
          </text>
        );
      })}

      <line x1={JX} y1="0" x2={JX} y2={H} stroke="var(--deep)" strokeWidth="1" opacity="0.4" />
      <line x1="0" y1={JY} x2={W} y2={JY} stroke="var(--deep)" strokeWidth="1" opacity="0.4" />

      <text x={JX} y="14" textAnchor="middle" fontSize="11" fill="var(--deep)" opacity="0.55">long / behind</text>
      <text x={JX} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--deep)" opacity="0.55">short / front</text>

      <circle cx={JX} cy={JY} r="6" fill="var(--jack)" stroke="var(--jack-edge)" strokeWidth="1" />

      {dots.map((d, i) => {
        const p = toPx(d.x, d.y);
        const last = i === dots.length - 1;
        const opp = d.side === 'opp' || d.side === 'opponent';
        const fill = opp ? '#ffffff' : (COL[d.hand] || 'var(--fh)');
        const stroke = opp ? 'var(--bh)' : (last ? '#ffffff' : 'var(--deep)');
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={last ? 8.5 : 7.5} fill={fill}
              stroke={stroke} strokeWidth={opp ? 1.6 : (last ? 1.8 : 0.8)} opacity="0.95" />
            {d.n ? (
              <text x={p.x} y={p.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                fontSize="9.5" fontWeight="700" fill={opp ? 'var(--bh)' : '#ffffff'}>{d.n}</text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
