'use client';

import { useState } from 'react';
import Rink from './Rink';
import { supabase } from '../lib/supabase';

export default function MatchCapture({ sessionId }) {
  const [end, setEnd] = useState(1);
  const [sfor, setSfor] = useState(0);
  const [sag, setSag] = useState(0);
  const [hand, setHand] = useState('forehand');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState([]);
  const [totals, setTotals] = useState({ f: 0, a: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function place(m) {
    setPlaced((p) => [...p, { x: m.x, y: m.y, hand }]);
    // stay armed — place as many bowls in this end as you like
  }

  function undoPlaced() {
    setPlaced((p) => p.slice(0, -1));
  }

  async function tally() {
    setErr('');
    if (!supabase || !sessionId) { setErr('Supabase keys not set.'); return; }
    setBusy(true);
    const { data: endRow, error: e1 } = await supabase.from('ends').insert({
      session_id: sessionId, end_number: end, shots_for: sfor, shots_against: sag,
    }).select('id').single();
    if (e1) { setBusy(false); setErr(e1.message); return; }
    if (placed.length) {
      const rows = placed.map((p) => ({
        session_id: sessionId, end_id: endRow.id, hand: p.hand, intent: 'draw',
        finish_x: p.x, finish_y: p.y, capture_method: 'manual_tap', capture_fidelity: 'approximate',
      }));
      const { error: e2 } = await supabase.from('shots').insert(rows);
      if (e2) { setBusy(false); setErr(e2.message); return; }
    }
    setBusy(false);
    setTotals((t) => ({ f: t.f + sfor, a: t.a + sag }));
    setEnd((n) => n + 1);
    setSfor(0); setSag(0); setPlaced([]);
  }

  function Stepper({ label, value, set }) {
    return (
      <div className="field" style={{ flex: 1 }}>
        <label>{label}</label>
        <div className="step">
          <button onClick={() => set(Math.max(0, value - 1))}>–</button>
          <span className="v">{value}</span>
          <button onClick={() => set(value + 1)}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bd">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--line)', background: '#fff', padding: '14px 18px' }}>
        <div style={{ textAlign: 'center', minWidth: 72 }}>
          <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: 'var(--deep)' }}>{totals.f}</div>
          <div className="kk" style={{ marginTop: 4 }}>for</div>
        </div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>End {end}</div>
          <button className="chip" aria-pressed={placing} onClick={() => setPlacing((p) => !p)}>
            {placing ? 'Done placing' : '+ place bowls'}
          </button>
        </div>
        <div style={{ textAlign: 'center', minWidth: 72 }}>
          <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: 'var(--muted)' }}>{totals.a}</div>
          <div className="kk" style={{ marginTop: 4 }}>against</div>
        </div>
      </div>

      <div className="row" style={{ gap: 18, flexWrap: 'nowrap' }}>
        <Stepper label="Shots for" value={sfor} set={setSfor} />
        <Stepper label="Shots against" value={sag} set={setSag} />
      </div>

      <div className="field">
        <label>Hand (for optional placement)</label>
        <div className="seg" role="group" aria-label="Hand">
          <button aria-pressed={hand === 'forehand'} onClick={() => setHand('forehand')}>Forehand</button>
          <button aria-pressed={hand === 'backhand'} onClick={() => setHand('backhand')}>Backhand</button>
        </div>
      </div>

      <Rink dots={placed} interactive={placing} onPlace={place} />
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {placing
            ? `Tap to add bowls to the head — ${placed.length} placed${placed.length ? ' · keep tapping' : ''}`
            : 'Optional — two stepper taps is the default. Tap "+ place bowls" to map the head.'}
        </p>
        {placed.length > 0 && (
          <button className="chip" onClick={undoPlaced} aria-label="Undo last placed bowl">↩</button>
        )}
      </div>

      <button className="cta" onClick={tally} disabled={busy}>{busy ? 'Saving…' : 'Tally end  →'}</button>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
