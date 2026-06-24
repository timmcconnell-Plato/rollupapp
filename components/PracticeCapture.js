'use client';

import { useState } from 'react';
import Link from 'next/link';
import Rink from './Rink';
import { decode } from '../lib/geometry';
import { supabase } from '../lib/supabase';

const ND = [
  { label: 'Took shot', intent: 'drive', outcome: 'took_shot' },
  { label: 'Rested', intent: 'rest', outcome: 'rested' },
  { label: 'Missed', intent: 'drive', outcome: 'missed' },
  { label: 'Wrecked head', intent: 'drive', outcome: 'wrecked_head' },
];

export default function PracticeCapture({ sessionId, jackLength }) {
  const [hand, setHand] = useState('forehand');
  const [jackLen, setJackLen] = useState(jackLength || 'long');
  const [mode, setMode] = useState('draw');
  const [bowls, setBowls] = useState([]);
  const [saving, setSaving] = useState(0);
  const [err, setErr] = useState('');

  async function insertShot(row) {
    if (!supabase || !sessionId) return null;
    setSaving((n) => n + 1);
    const { data, error } = await supabase.from('shots').insert({
      session_id: sessionId,
      hand: row.hand,
      jack_length: jackLen || null,
      intent: row.intent,
      finish_x: row.x ?? null,
      finish_y: row.y ?? null,
      outcome_tag: row.outcome ?? null,
      capture_method: 'manual_tap',
      capture_fidelity: 'approximate',
    }).select('id').single();
    setSaving((n) => n - 1);
    if (error) { setErr(error.message); return null; }
    return data.id;
  }

  async function place(m) {
    const local = { tmp: Math.random(), id: null, hand, intent: 'draw', x: m.x, y: m.y };
    setBowls((b) => [...b, local]);
    const id = await insertShot(local);
    if (id) setBowls((b) => b.map((x) => (x.tmp === local.tmp ? { ...x, id } : x)));
  }

  async function nonDraw(t) {
    const local = { tmp: Math.random(), id: null, hand, intent: t.intent, outcome: t.outcome };
    setBowls((b) => [...b, local]);
    const id = await insertShot(local);
    if (id) setBowls((b) => b.map((x) => (x.tmp === local.tmp ? { ...x, id } : x)));
  }

  async function undo() {
    const last = bowls[bowls.length - 1];
    if (!last) return;
    setBowls((b) => b.slice(0, -1));
    if (last.id && supabase) await supabase.from('shots').delete().eq('id', last.id);
  }

  const draws = bowls.filter((b) => b.intent === 'draw');
  const nd = bowls.filter((b) => b.intent !== 'draw');
  const fh = draws.filter((b) => b.hand === 'forehand').length;
  const bh = draws.length - fh;
  const n = draws.length || 1;
  const sh = draws.filter((b) => b.y < -0.25).length;
  const lo = draws.filter((b) => b.y > 0.25).length;
  const onL = draws.length - sh - lo;
  const lf = draws.filter((b) => b.x < -0.18).length;
  const ri = draws.filter((b) => b.x > 0.18).length;
  const pct = (v) => `${Math.round((v / n) * 100)}%`;
  const last = draws[draws.length - 1];
  let pattern = '';
  if (draws.length >= 4) {
    if (sh / draws.length >= 0.6) pattern = 'Running short.';
    else if (lo / draws.length >= 0.6) pattern = 'Running long.';
    else if (lf / draws.length >= 0.6) pattern = 'Tight to the left.';
    else if (ri / draws.length >= 0.6) pattern = 'Leaking right.';
  }

  return (
    <div className="bd">
      <div className="field">
        <label>Drilling hand</label>
        <div className="seg" role="group" aria-label="Hand">
          <button aria-pressed={hand === 'forehand'} onClick={() => setHand('forehand')}>Forehand</button>
          <button aria-pressed={hand === 'backhand'} onClick={() => setHand('backhand')}>Backhand</button>
        </div>
      </div>

      <div className="field">
        <label>Jack length — change it when you move the jack</label>
        <div className="seg" role="group" aria-label="Jack length">
          {['short', 'medium', 'long'].map((l) => (
            <button key={l} aria-pressed={jackLen === l} onClick={() => setJackLen(l)}>
              {l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Rink dots={draws} interactive={mode === 'draw'} onPlace={place} />
      <p className="muted" style={{ fontSize: 13, margin: 0, opacity: mode === 'draw' ? 1 : 0.4 }}>Tap where the bowl finished</p>

      <div className="row" style={{ gap: 6 }}>
        <button className="chip" style={{ flex: 1 }} aria-pressed={mode === 'draw'} onClick={() => setMode('draw')}>Draw</button>
        <button className="chip" style={{ flex: 1 }} aria-pressed={mode === 'nondraw'} onClick={() => setMode('nondraw')}>Non-draw</button>
        <button className="chip" onClick={undo} aria-label="Undo last">↩</button>
      </div>

      {mode === 'nondraw' && (
        <div className="row" style={{ gap: 6 }}>
          {ND.map((t) => <button key={t.label} className="chip" onClick={() => nonDraw(t)}>{t.label}</button>)}
        </div>
      )}

      <div className="card">
        <span className="kk">Bowls this session {saving > 0 ? '· saving…' : ''}</span>
        <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
          <span className="stat">{bowls.length}</span>
          <span className="faint" style={{ fontSize: 12 }}>
            {[fh && `${fh} FH`, bh && `${bh} BH`, nd.length && `${nd.length} non-draw`].filter(Boolean).join(' · ')}
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Length</div>
          <div className="bar">
            <div style={{ background: 'var(--short)', width: pct(sh) }} />
            <div style={{ background: 'var(--on)', width: pct(onL) }} />
            <div style={{ background: 'var(--long)', width: pct(lo) }} />
          </div>
        </div>
        <div style={{ fontSize: 13, marginTop: 10, minHeight: 20 }}>
          {bowls.length === 0
            ? <span className="muted">Tap where the bowl finished.</span>
            : <><span>{last ? decode(last) : ''}</span>{pattern && <span className="faint">  {pattern}</span>}</>}
        </div>
        <div className="faint" style={{ fontSize: 11, marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
          Capture fidelity: manual tap — approximate
        </div>
      </div>
      {err && <p className="err">{err}</p>}
      <Link href={`/sessions/${sessionId}`} className="finishbtn">Finish &amp; save  →</Link>
    </div>
  );
}
