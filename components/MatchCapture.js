'use client';

import { useState } from 'react';
import Link from 'next/link';
import Rink from './Rink';
import { supabase } from '../lib/supabase';

const BOWLS_PER_PLAYER = { singles: 4, pairs: 4, triples: 3, fours: 2 };
const ORD = ['', '1st', '2nd', '3rd', '4th'];

export default function MatchCapture({ sessionId, discipline = 'singles' }) {
  const maxBowls = BOWLS_PER_PLAYER[discipline] || 4;
  const [end, setEnd] = useState(1);
  const [sfor, setSfor] = useState(0);
  const [sag, setSag] = useState(0);
  const [hand, setHand] = useState('forehand');
  const [side, setSide] = useState('you');
  const [bowlNo, setBowlNo] = useState(1);
  const [jackLen, setJackLen] = useState('long');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState([]);
  const [totals, setTotals] = useState({ f: 0, a: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function place(m) {
    setPlaced((p) => [...p, { x: m.x, y: m.y, hand, side, n: bowlNo }]);
    setBowlNo((b) => (b >= maxBowls ? 1 : b + 1)); // auto-advance for speed
  }

  function undoPlaced() {
    setPlaced((p) => p.slice(0, -1));
    setBowlNo((b) => (b <= 1 ? maxBowls : b - 1));
  }

  async function tally() {
    setErr('');
    if (!supabase || !sessionId) { setErr('Supabase keys not set.'); return; }
    setBusy(true);
    const { data: endRow, error: e1 } = await supabase.from('ends').insert({
      session_id: sessionId, end_number: end, shots_for: sfor, shots_against: sag, jack_length: jackLen,
    }).select('id').single();
    if (e1) { setBusy(false); setErr(e1.message); return; }
    if (placed.length) {
      const rows = placed.map((p) => ({
        session_id: sessionId, end_id: endRow.id, hand: p.hand, intent: 'draw', jack_length: jackLen,
        finish_x: p.x, finish_y: p.y, bowl_number: p.n, side: p.side === 'opp' ? 'opponent' : 'player',
        capture_method: 'manual_tap', capture_fidelity: 'approximate',
      }));
      const { error: e2 } = await supabase.from('shots').insert(rows);
      if (e2) { setBusy(false); setErr(e2.message); return; }
    }
    setBusy(false);
    setTotals((t) => ({ f: t.f + sfor, a: t.a + sag }));
    setEnd((n) => n + 1);
    setSfor(0); setSag(0); setPlaced([]); setBowlNo(1); setSide('you');
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--line)', borderRadius: 16, background: '#fff', padding: '14px 18px' }}>
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
        <label>Jack length this end</label>
        <div className="seg" role="group" aria-label="Jack length">
          {['short', 'medium', 'long'].map((l) => (
            <button key={l} aria-pressed={jackLen === l} onClick={() => setJackLen(l)}>
              {l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {placing && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field" style={{ gap: 7 }}>
            <label>Whose bowl</label>
            <div className="seg" role="group" aria-label="Whose bowl">
              <button aria-pressed={side === 'you'} onClick={() => setSide('you')}>You</button>
              <button aria-pressed={side === 'opp'} onClick={() => setSide('opp')}>Opposition</button>
            </div>
          </div>
          <div className="field" style={{ gap: 7 }}>
            <label>Which bowl</label>
            <div className="seg" role="group" aria-label="Bowl number">
              {Array.from({ length: maxBowls }, (_, i) => i + 1).map((n) => (
                <button key={n} aria-pressed={bowlNo === n} onClick={() => setBowlNo(n)}>{ORD[n]}</button>
              ))}
            </div>
          </div>
          <div className="field" style={{ gap: 7 }}>
            <label>Hand</label>
            <div className="seg" role="group" aria-label="Hand">
              <button aria-pressed={hand === 'forehand'} onClick={() => setHand('forehand')}>Forehand</button>
              <button aria-pressed={hand === 'backhand'} onClick={() => setHand('backhand')}>Backhand</button>
            </div>
          </div>
        </div>
      )}

      <Rink dots={placed} interactive={placing} onPlace={place} />
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {placing
            ? `Placing ${side === 'opp' ? 'opposition' : 'your'} ${ORD[bowlNo]} bowl — tap the head. ${placed.length} down.`
            : 'Optional — two stepper taps is the default. Tap "+ place bowls" to map the head.'}
        </p>
        {placed.length > 0 && (
          <button className="chip" onClick={undoPlaced} aria-label="Undo last placed bowl">↩</button>
        )}
      </div>

      <button className="cta" onClick={tally} disabled={busy}>{busy ? 'Saving…' : 'Tally end  →'}</button>
      {err && <p className="err">{err}</p>}
      <Link href={`/sessions/${sessionId}`} className="finishbtn">Finish match &amp; save  →</Link>
    </div>
  );
}
