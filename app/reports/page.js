'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header, BottomNav } from '../../components/Nav';
import { computeStats, Heatmap, LengthProfile } from '../../components/Analysis';
import { supabase, supabaseReady } from '../../lib/supabase';

export default function ReportsPage() {
  const [shots, setShots] = useState(null);
  const [modeById, setModeById] = useState({});
  const [fSrc, setFSrc] = useState('all');
  const [fHand, setFHand] = useState('all');
  const [fLen, setFLen] = useState('all');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setShots([]); return; }
    const { data: s } = await supabase.from('sessions').select('id,mode').limit(500);
    const map = {}; (s || []).forEach((r) => { map[r.id] = r.mode; });
    setModeById(map);
    const { data, error } = await supabase
      .from('shots').select('session_id,hand,jack_length,finish_x,finish_y,intent')
      .not('finish_y', 'is', null).limit(5000);
    if (error) { setErr(error.message); setShots([]); return; }
    setShots(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function seedDemo() {
    if (!supabase) { setErr('Supabase keys not set.'); return; }
    setBusy(true);
    const { data: s, error: e1 } = await supabase.from('sessions')
      .insert({ mode: 'training', discipline: 'singles', position: 'lead', name: 'Demo session', notes: 'demo' })
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
      let y = -0.6 + g() * 0.55 + (hand === 'backhand' ? -0.18 : 0);
      if (y > 1.2) y = 1.2; if (y < -3) y = -3;
      rows.push({
        session_id: s.id, hand, jack_length: lens[Math.floor(rnd() * 3)], intent: 'draw',
        finish_x: Math.round((bias + g() * 0.32) * 100) / 100, finish_y: Math.round(y * 100) / 100,
        capture_method: 'manual_tap', capture_fidelity: 'approximate',
      });
    }
    const { error: e2 } = await supabase.from('shots').insert(rows);
    setBusy(false);
    if (e2) { setErr(e2.message); return; }
    load();
  }

  const pts = (shots || []).filter((p) => {
    const m = modeById[p.session_id];
    const okSrc = fSrc === 'all' || (fSrc === 'practice' ? m === 'training' : m === 'match');
    return okSrc && (fHand === 'all' || p.hand === fHand) && (fLen === 'all' || p.jack_length === fLen);
  });
  const st = computeStats(pts);

  const Filter = ({ opts, val, set }) => (
    <div className="row" style={{ gap: 6 }}>
      {opts.map((o) => <button key={o[0]} className="chip" aria-pressed={val === o[0]} onClick={() => set(o[0])}>{o[1]}</button>)}
    </div>
  );

  return (
    <>
      <Header ctx="reports" />
      <div className="bd">
        <div className="wide">
          {!supabaseReady && <p className="err">Supabase keys not set — add them to see real data.</p>}

          {shots === null ? (
            <p className="muted">Loading…</p>
          ) : (shots.length === 0) ? (
            <div className="card">
              <p style={{ marginTop: 0 }}>No bowls captured yet.</p>
              <p className="muted" style={{ fontSize: 14 }}>Capture a session, or load a labelled demo set to see the views.</p>
              <button className="cta" onClick={seedDemo} disabled={busy}>{busy ? 'Adding…' : 'Add sample session (demo)'}</button>
              {err && <p className="err">{err}</p>}
            </div>
          ) : (
            <>
              <div className="dash-head">
                <div>
                  <span className="kk">Across {fSrc === 'all' ? 'all data' : fSrc === 'practice' ? 'practice' : 'matches'} · {pts.length} bowls</span>
                </div>
                <Link href="/dashboard" className="chip">Open dashboard ›</Link>
              </div>
              <Filter opts={[['all', 'All data'], ['practice', 'Practice'], ['match', 'Match']]} val={fSrc} set={setFSrc} />
              <Filter opts={[['all', 'Both hands'], ['forehand', 'Forehand'], ['backhand', 'Backhand']]} val={fHand} set={setFHand} />
              <Filter opts={[['all', 'Any length'], ['short', 'Short'], ['medium', 'Med'], ['long', 'Long']]} val={fLen} set={setFLen} />

              <div className="cols2">
                <div>
                  <span className="kk">Finishing-position density</span>
                  <Heatmap shots={pts} />
                  <div className="center" style={{ gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--faint)', marginTop: 6 }}>
                    fewer
                    {[0.15, 0.35, 0.55, 0.75, 0.9].map((o, i) => <span key={i} style={{ width: 16, height: 8, background: 'var(--coral)', opacity: o, display: 'inline-block' }} />)}
                    more
                  </div>
                </div>
                <div>
                  <span className="kk">Length profile — side view</span>
                  <LengthProfile shots={pts} />
                  <p style={{ fontSize: 13, margin: '8px 0 0' }}>
                    <span>{st.shortPct}% finishing short of the jack.</span>{' '}
                    <span className="muted">Line and weight are different errors — the heatmap holds both, this profile isolates weight.</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
