'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Nav';
import { computeStats, Heatmap, LengthProfile } from '../../components/Analysis';
import { supabase, supabaseReady } from '../../lib/supabase';

export default function Dashboard() {
  const [shots, setShots] = useState(null);
  const [modeById, setModeById] = useState({});
  const [sessions, setSessions] = useState([]);
  const [src, setSrc] = useState('all');
  const [hand, setHand] = useState('all');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setShots([]); return; }
    const { data: s } = await supabase.from('sessions').select('id,mode,name,created_at').order('created_at', { ascending: false }).limit(500);
    const map = {}; (s || []).forEach((r) => { map[r.id] = r.mode; });
    setModeById(map); setSessions(s || []);
    const { data, error } = await supabase.from('shots').select('session_id,hand,jack_length,finish_x,finish_y').not('finish_y', 'is', null).limit(5000);
    if (error) { setErr(error.message); setShots([]); return; }
    setShots(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pts = (shots || []).filter((p) => {
    const m = modeById[p.session_id];
    const okSrc = src === 'all' || (src === 'practice' ? m === 'training' : m === 'match');
    const okHand = hand === 'all' || p.hand === hand;
    return okSrc && okHand;
  });
  const st = computeStats(pts);
  const nMatch = Object.values(modeById).filter((m) => m === 'match').length;
  const nPractice = Object.values(modeById).filter((m) => m === 'training').length;

  const Filter = ({ opts, val, set }) => (
    <div className="row" style={{ gap: 6 }}>
      {opts.map((o) => <button key={o[0]} className="chip" aria-pressed={val === o[0]} onClick={() => set(o[0])}>{o[1]}</button>)}
    </div>
  );

  return (
    <>
      <Header ctx="dashboard" />
      <div className="bd">
        <div className="wide">
          {!supabaseReady && <p className="err">Supabase keys not set.</p>}

          <div className="dash-head">
            <div>
              <h1 className="big" style={{ margin: 0 }}>Performance dashboard</h1>
              <p className="sub">{src === 'all' ? 'Practice + match' : src === 'practice' ? 'Practice only' : 'Match only'} · {hand === 'all' ? 'both hands' : hand}</p>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <Filter opts={[['all', 'All'], ['practice', 'Practice'], ['match', 'Match']]} val={src} set={setSrc} />
              <Filter opts={[['all', 'Both'], ['forehand', 'FH'], ['backhand', 'BH']]} val={hand} set={setHand} />
            </div>
          </div>

          {shots === null ? <p className="muted">Loading…</p> : (
            <div className="dash">
              <div className="dash-tiles">
                <div className="tile"><div className="tn">{st.n}</div><div className="tl">bowls placed</div></div>
                <div className="tile"><div className="tn">{sessions.length}</div><div className="tl">sessions</div></div>
                <div className="tile"><div className="tn">{nPractice}/{nMatch}</div><div className="tl">practice / match</div></div>
                <div className="tile"><div className="tn">{st.tightPct}%</div><div className="tl">within 30cm</div></div>
                <div className="tile"><div className="tn">{st.shortPct}%</div><div className="tl">short of jack</div></div>
                <div className="tile"><div className="tn">{st.fh}/{st.bh}</div><div className="tl">FH / BH</div></div>
              </div>

              <div className="dash-main">
                <div>
                  <span className="kk">Finishing density</span>
                  <Heatmap shots={pts} max={420} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <span className="kk">Length profile</span>
                    <LengthProfile shots={pts} />
                  </div>
                  <div className="card">
                    <span className="kk">Line</span>
                    <div className="bar" style={{ marginTop: 8 }}>
                      <div style={{ background: 'var(--short)', width: `${st.leftPct}%` }} />
                      <div style={{ background: 'var(--on)', width: `${st.onLinePct}%` }} />
                      <div style={{ background: 'var(--long)', width: `${st.rightPct}%` }} />
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                      <span className="faint" style={{ fontSize: 12 }}>{st.leftPct}% left</span>
                      <span className="faint" style={{ fontSize: 12 }}>{st.onLinePct}% on line</span>
                      <span className="faint" style={{ fontSize: 12 }}>{st.rightPct}% right</span>
                    </div>
                  </div>
                  <div className="card">
                    <span className="kk">Recent sessions</span>
                    <div style={{ marginTop: 6 }}>
                      {sessions.slice(0, 5).map((s) => (
                        <Link key={s.id} href={`/sessions/${s.id}`} className="endrow" style={{ textDecoration: 'none' }}>
                          <span className={`badge ${s.mode === 'match' ? 'm' : 'p'}`}>{s.mode === 'match' ? 'M' : 'P'}</span>
                          <span style={{ flex: 1 }}>{s.name || (s.mode === 'match' ? 'Match' : 'Practice')}</span>
                          <span className="faint">{new Date(s.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="faint" style={{ fontSize: 12 }}>Describes finishing positions; not yet prescriptive. Length bands and scoring model pending coach confirmation.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
