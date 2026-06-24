'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header, BottomNav } from '../../components/Nav';
import { supabase, supabaseReady } from '../../lib/supabase';

function fmtDate(s) {
  try { return new Date(s).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState(null);
  const [bowls, setBowls] = useState({});
  const [scores, setScores] = useState({});
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setSessions([]); return; }
    const { data: s, error } = await supabase
      .from('sessions')
      .select('id,mode,name,notes,discipline,position,venue,created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) { setErr(error.message); setSessions([]); return; }
    setSessions(s || []);

    const { data: sh } = await supabase.from('shots').select('session_id').limit(5000);
    const bc = {}; (sh || []).forEach((r) => { bc[r.session_id] = (bc[r.session_id] || 0) + 1; });
    setBowls(bc);

    const { data: en } = await supabase.from('ends').select('session_id,shots_for,shots_against').limit(5000);
    const sc = {};
    (en || []).forEach((r) => {
      const cur = sc[r.session_id] || { f: 0, a: 0, ends: 0 };
      cur.f += r.shots_for || 0; cur.a += r.shots_against || 0; cur.ends += 1;
      sc[r.session_id] = cur;
    });
    setScores(sc);
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = (sessions || []).filter((s) =>
    tab === 'all' ? true : tab === 'practice' ? s.mode === 'training' : s.mode === 'match');

  return (
    <>
      <Header ctx="sessions" />
      <div className="bd">
        <div className="wide">
          {!supabaseReady && <p className="err">Supabase keys not set.</p>}

          <div className="seg" role="group" aria-label="Filter sessions">
            {[['all', 'All'], ['practice', 'Practice'], ['match', 'Matches']].map(([v, l]) => (
              <button key={v} aria-pressed={tab === v} onClick={() => setTab(v)}>{l}</button>
            ))}
          </div>

          {sessions === null ? (
            <p className="muted">Loading…</p>
          ) : list.length === 0 ? (
            <div className="card">
              <p style={{ marginTop: 0 }}>No {tab === 'all' ? '' : tab === 'practice' ? 'practice ' : 'match '}sessions yet.</p>
              <div className="actiongrid">
                <Link href="/setup/practice" className="actioncard"><span className="ic" /><span className="t">New practice</span><span className="s">Per-bowl, rich</span></Link>
                <Link href="/setup/match" className="actioncard"><span className="ic" /><span className="t">New match</span><span className="s">Per-end, fast</span></Link>
              </div>
            </div>
          ) : (
            <div className="sesslist">{list.map((s) => {
              const isMatch = s.mode === 'match';
              const sc = scores[s.id];
              return (
                <Link key={s.id} href={`/sessions/${s.id}`} className="srow">
                  <div className="srow-head">
                    <span className={`badge ${isMatch ? 'm' : 'p'}`}>{isMatch ? 'Match' : 'Practice'}</span>
                    <span className="srow-title">{s.name || (isMatch ? 'Match' : 'Practice session')}</span>
                    <span className="srow-metric">
                      {isMatch
                        ? (sc ? <><b>{sc.f}–{sc.a}</b><i>{sc.ends} ends</i></> : <i>no ends</i>)
                        : <><b>{bowls[s.id] || 0}</b><i>bowls</i></>}
                    </span>
                  </div>
                  <div className="srow-meta">
                    {fmtDate(s.created_at)} · {s.discipline}{s.position ? ` · ${s.position}` : ''}{s.venue ? ` · ${s.venue}` : ''}
                  </div>
                  {s.notes && <p className="srow-notes">{s.notes}</p>}
                  <span className="srow-go">View session <span aria-hidden>›</span></span>
                </Link>
              );
            })}</div>
          )}
          {err && <p className="err">{err}</p>}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
