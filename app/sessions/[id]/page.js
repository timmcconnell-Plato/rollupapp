'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header, BottomNav } from '../../../components/Nav';
import { computeStats, Heatmap, LengthProfile } from '../../../components/Analysis';
import { supabase } from '../../../lib/supabase';

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [shots, setShots] = useState([]);
  const [ends, setEnds] = useState([]);
  const [hand, setHand] = useState('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!supabase || !id) { setLoading(false); return; }
    (async () => {
      const { data: s, error } = await supabase.from('sessions').select('*').eq('id', id).maybeSingle();
      if (error) { setErr(error.message); setLoading(false); return; }
      setSession(s);
      const { data: sh } = await supabase.from('shots').select('hand,jack_length,finish_x,finish_y,intent,outcome_tag').eq('session_id', id).limit(2000);
      setShots(sh || []);
      const { data: en } = await supabase.from('ends').select('end_number,shots_for,shots_against,jack_length').eq('session_id', id).order('end_number');
      setEnds(en || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (<><Header ctx="session" /><div className="bd"><p className="muted">Loading…</p></div><BottomNav /></>);
  if (!session) return (<><Header ctx="session" /><div className="bd"><p className="err">Session not found.</p><Link href="/sessions" className="cta" style={{ textAlign: 'center' }}>Back to sessions</Link></div><BottomNav /></>);

  const isMatch = session.mode === 'match';
  const filtered = shots.filter((s) => hand === 'all' || s.hand === hand);
  const st = computeStats(filtered);
  const sf = ends.reduce((a, e) => a + (e.shots_for || 0), 0);
  const sa = ends.reduce((a, e) => a + (e.shots_against || 0), 0);

  return (
    <>
      <Header ctx="session" />
      <div className="bd">
        <div className="wide">
        <Link href="/sessions" className="lr-sub" style={{ textDecoration: 'underline' }}>‹ All sessions</Link>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span className={`badge ${isMatch ? 'm' : 'p'}`}>{isMatch ? 'Match' : 'Practice'}</span>
            <span className="lr-sub">{new Date(session.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <h1 className="big" style={{ marginTop: 6 }}>{session.name || (isMatch ? 'Match' : 'Practice session')}</h1>
          <p className="sub">{session.discipline}{session.position ? ` · ${session.position}` : ''}{session.notes ? ` · ${session.notes}` : ''}</p>
        </div>

        {isMatch && (
          <div className="card">
            <span className="kk">Final</span>
            <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
              <span className="stat" style={{ fontSize: 34 }}>{sf}–{sa}</span>
              <span className="faint">{ends.length} ends · {sf > sa ? 'won' : sf < sa ? 'lost' : 'drawn'}</span>
            </div>
          </div>
        )}

        {st.n > 0 && (
          <>
            <div className="row" style={{ gap: 6 }}>
              {[['all', 'Both hands'], ['forehand', 'Forehand'], ['backhand', 'Backhand']].map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={hand === v} onClick={() => setHand(v)}>{l}</button>
              ))}
            </div>
            <div className="tiles3">
              <div className="tile"><div className="tn">{st.n}</div><div className="tl">bowls</div></div>
              <div className="tile"><div className="tn">{st.tightPct}%</div><div className="tl">within 30cm</div></div>
              <div className="tile"><div className="tn">{st.shortPct}%</div><div className="tl">short</div></div>
            </div>
            <div className="cols2">
              <div><span className="kk">Finishing density</span><Heatmap shots={filtered} /></div>
              <div><span className="kk">Length profile</span><LengthProfile shots={filtered} /></div>
            </div>
            <p className="faint" style={{ fontSize: 12, margin: 0 }}>Capture fidelity: manual tap — approximate. Length bands pending coach confirmation.</p>
          </>
        )}

        {isMatch && ends.length > 0 && (
          <>
            <span className="kk">Ends</span>
            <div className="card" style={{ padding: 0 }}>
              {ends.map((e) => (
                <div key={e.end_number} className="endrow">
                  <span className="faint">End {e.end_number}</span>
                  <span>{e.jack_length || '—'}</span>
                  <span style={{ fontWeight: 600 }}>{e.shots_for ?? 0}–{e.shots_against ?? 0}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {st.n === 0 && !isMatch && <p className="muted">No placed bowls in this session.</p>}
        {err && <p className="err">{err}</p>}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
