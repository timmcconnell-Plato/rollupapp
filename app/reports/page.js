'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header, BottomNav } from '../../components/Nav';
import { RINK, jackPx, metresToPx } from '../../lib/geometry';
import { supabase, supabaseReady } from '../../lib/supabase';

const J = jackPx();

export default function ReportsPage() {
  const [shots, setShots] = useState(null);
  const [fHand, setFHand] = useState('all');
  const [fLen, setFLen] = useState('all');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setShots([]); return; }
    const { data, error } = await supabase
      .from('shots')
      .select('hand,jack_length,finish_x,finish_y,intent')
      .not('finish_y', 'is', null)
      .limit(2000);
    if (error) { setErr(error.message); setShots([]); return; }
    setShots(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function seedDemo() {
    if (!supabase) { setErr('Supabase keys not set.'); return; }
    setBusy(true);
    const { data: s, error: e1 } = await supabase.from('sessions')
      .insert({ mode: 'training', discipline: 'singles', position: 'lead', notes: 'demo session' })
      .select('id').single();
    if (e1) { setBusy(false); setErr(e1.message); return; }
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const g = () => rnd() + rnd() + rnd() - 1.5;
    const lens = ['short', 'medium', 'long'];
    const rows = [];
    for (let i = 0; i < 45; i++) {
      const hand = rnd() < 0.5 ? 'forehand' : 'backhand';
      const bias = hand === 'forehand' ? 0.12 : -0.18;
      let y = -0.9 + g() * 0.75 + (hand === 'backhand' ? -0.25 : 0);
      if (y > RINK.LONG_M) y = RINK.LONG_M; if (y < -RINK.SHORT_M) y = -RINK.SHORT_M;
      rows.push({
        session_id: s.id, hand, jack_length: lens[Math.floor(rnd() * 3)], intent: 'draw',
        finish_x: Math.round((bias + g() * 0.42) * 100) / 100, finish_y: Math.round(y * 100) / 100,
        capture_method: 'manual_tap', capture_fidelity: 'approximate',
      });
    }
    const { error: e2 } = await supabase.from('shots').insert(rows);
    setBusy(false);
    if (e2) { setErr(e2.message); return; }
    load();
  }

  const pts = (shots || []).filter((p) =>
    (fHand === 'all' || p.hand === fHand) && (fLen === 'all' || p.jack_length === fLen));

  // heatmap bins
  const cols = 12, rows = 16;
  const cw = (RINK.playX1 - RINK.playX0) / cols, ch = (RINK.playY1 - RINK.playY0) / rows;
  const grid = {}; let max = 0;
  pts.forEach((p) => {
    const px = metresToPx(p.finish_x, p.finish_y);
    const c = Math.floor((px.x - RINK.playX0) / cw), r = Math.floor((px.y - RINK.playY0) / ch);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return;
    const k = `${c}_${r}`; grid[k] = (grid[k] || 0) + 1; if (grid[k] > max) max = grid[k];
  });

  // length profile
  const lo = -RINK.SHORT_M, hi = RINK.LONG_M, bins = 26;
  const hist = new Array(bins).fill(0);
  pts.forEach((p) => { const t = (p.finish_y - lo) / (hi - lo); const b = Math.min(bins - 1, Math.max(0, Math.floor(t * bins))); hist[b]++; });
  const hmax = Math.max(...hist, 1);
  const W = 300, H = 150, padL = 8, padT = 10, padB = 24;
  const plotW = W - padL * 2, plotH = H - padT - padB;
  const bx = (i) => padL + (i / (bins - 1)) * plotW;
  const by = (v) => padT + plotH - (v / hmax) * plotH;
  let line = ''; for (let i = 0; i < bins; i++) line += `${i ? 'L' : 'M'}${bx(i).toFixed(1)} ${by(hist[i]).toFixed(1)} `;
  const area = `M${padL} ${padT + plotH} L${line.slice(1)}L${padL + plotW} ${padT + plotH} Z`;
  const jackX = padL + ((0 - lo) / (hi - lo)) * plotW;
  const shortPct = pts.length ? Math.round(pts.filter((p) => p.finish_y < -0.25).length / pts.length * 100) : 0;

  const Filter = ({ opts, val, set }) => (
    <div className="row" style={{ gap: 6 }}>
      {opts.map((o) => (
        <button key={o[0]} className="chip" aria-pressed={val === o[0]} onClick={() => set(o[0])}>{o[1]}</button>
      ))}
    </div>
  );

  return (
    <>
      <Header ctx="reports" />
      <div className="bd">
        {!supabaseReady && <p className="err">Supabase keys not set — add them to see real data.</p>}

        {shots === null ? (
          <p className="muted">Loading…</p>
        ) : pts.length === 0 ? (
          <div className="card">
            <p style={{ marginTop: 0 }}>No bowls captured yet.</p>
            <p className="muted" style={{ fontSize: 14 }}>Capture a practice session, or load a labelled demo set to see the views.</p>
            <button className="cta" onClick={seedDemo} disabled={busy}>{busy ? 'Adding…' : 'Add sample session (demo)'}</button>
            {err && <p className="err">{err}</p>}
          </div>
        ) : (
          <>
            <Filter opts={[['all', 'All'], ['forehand', 'Forehand'], ['backhand', 'Backhand']]} val={fHand} set={setFHand} />
            <Filter opts={[['all', 'Any length'], ['short', 'Short'], ['medium', 'Med'], ['long', 'Long']]} val={fLen} set={setFLen} />

            <span className="kk">Finishing-position density · {pts.length} bowls</span>
            <svg viewBox={`0 0 ${RINK.vbW} ${RINK.vbH}`} style={{ width: '100%', maxWidth: 300, alignSelf: 'center', display: 'block', border: '1px solid var(--line)', background: 'var(--pale)' }}>
              {Object.keys(grid).map((k) => {
                const [c, r] = k.split('_').map(Number);
                const op = 0.12 + 0.8 * (grid[k] / (max || 1));
                return <rect key={k} x={RINK.playX0 + c * cw} y={RINK.playY0 + r * ch} width={cw + 0.5} height={ch + 0.5} fill="var(--coral)" opacity={op.toFixed(2)} />;
              })}
              <line x1={J.x} y1={RINK.playY0} x2={J.x} y2={RINK.playY1} stroke="var(--deep)" strokeWidth="1" strokeDasharray="5 6" opacity="0.35" />
              <circle cx={J.x} cy={J.y} r="6" fill="var(--jack)" stroke="#854F0B" strokeWidth="1" />
            </svg>
            <div className="center" style={{ gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--faint)' }}>
              fewer
              {[0.15, 0.35, 0.55, 0.75, 0.9].map((o, i) => <span key={i} style={{ width: 16, height: 8, background: 'var(--coral)', opacity: o, display: 'inline-block' }} />)}
              more
            </div>

            <span className="kk">Length profile — side view</span>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', border: '1px solid var(--line)', background: '#fff' }}>
              <rect x={padL} y={padT + plotH + 4} width={plotW} height="6" fill="#CFE0B6" />
              <path d={area} fill="var(--teal)" opacity="0.18" />
              <path d={line} fill="none" stroke="var(--teal)" strokeWidth="2" />
              <line x1={jackX.toFixed(1)} y1={padT} x2={jackX.toFixed(1)} y2={padT + plotH + 10} stroke="#854F0B" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x={jackX.toFixed(1)} y={H - 6} textAnchor="middle" fontSize="10" fill="#854F0B">jack</text>
              <text x={padL} y={H - 6} fontSize="10" fill="var(--faint)">short</text>
              <text x={padL + plotW} y={H - 6} textAnchor="end" fontSize="10" fill="var(--faint)">long</text>
            </svg>
            <p style={{ fontSize: 13, margin: 0 }}>
              <span>{shortPct}% finishing short of the jack.</span>{' '}
              <span className="muted">Line and weight are different errors — the heatmap holds both, this profile isolates weight.</span>
            </p>
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}
