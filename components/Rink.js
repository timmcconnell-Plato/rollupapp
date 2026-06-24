'use client';

import { useRef } from 'react';
import { RINK, jackPx, pxToMetres, metresToPx } from '../lib/geometry';

const COL = { forehand: 'var(--fh)', backhand: 'var(--bh)' };

export default function Rink({ dots = [], interactive = true, onPlace }) {
  const ref = useRef(null);
  const J = jackPx();

  function tap(e) {
    if (!interactive || !onPlace) return;
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * RINK.vbW;
    const py = ((e.clientY - r.top) / r.height) * RINK.vbH;
    if (px < RINK.playX0 || px > RINK.playX1 || py < RINK.playY0 || py > RINK.playY1) return;
    onPlace(pxToMetres(px, py));
  }

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${RINK.vbW} ${RINK.vbH}`}
      onPointerDown={tap}
      role="img"
      aria-label="Rink — tap where the bowl finished"
      style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--line)', background: 'var(--pale)', cursor: interactive ? 'crosshair' : 'default', touchAction: 'none' }}
    >
      <line x1={J.x} y1={RINK.playY0} x2={J.x} y2={RINK.playY1} stroke="var(--green)" strokeWidth="1.5" strokeDasharray="5 6" opacity="0.5" />
      <circle cx={J.x} cy={J.y} r="34" fill="none" stroke="var(--green)" strokeWidth="1" strokeDasharray="3 5" opacity="0.45" />
      <rect x={J.x - 8} y={RINK.playY1 - 18} width="16" height="22" rx="2" fill="#5F5E5A" opacity="0.7" />
      <circle cx={J.x} cy={J.y} r="6" fill="var(--jack)" stroke="#854F0B" strokeWidth="1" />
      <text x={J.x} y={RINK.playY0 + 14} textAnchor="middle" fontSize="11" fill="var(--deep)" opacity="0.55">long</text>
      <text x={J.x} y={RINK.playY1 - 24} textAnchor="middle" fontSize="11" fill="var(--deep)" opacity="0.55">short · mat</text>
      {dots.map((d, i) => {
        const p = metresToPx(d.x, d.y);
        const last = i === dots.length - 1;
        return (
          <circle key={i} cx={p.x} cy={p.y} r={last ? 7 : 5.5} fill={COL[d.hand] || 'var(--fh)'} stroke={last ? '#FAF9F6' : '#04342C'} strokeWidth={last ? 1.6 : 0.8} opacity="0.92" />
        );
      })}
    </svg>
  );
}
