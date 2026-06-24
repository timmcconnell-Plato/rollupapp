'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header, BottomNav } from '../../components/Nav';
import { supabase, supabaseReady } from '../../lib/supabase';

function fmtDate(s) {
  try { return new Date(s).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }); }
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
      .select('id,mode,name,notes,discipline,position,created_at')
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
        {!supabaseReady && <p className="err">Supabase keys not set.</p>}

        <div className="row" style={{ gap: 6 }}>
          {[['all', 'All'], ['practice', 'Practice'], ['match', 'Matches']].map(([v, l]) => (
            <button key={v} className="chip" style={{ flex: 1 }} aria-pressed={tab === v} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {sessions === null ? (
          <p className="muted">Loading…</p>
        ) : list.length === 0 ? (
          <div className="card">
            <p style={{ marginTop: 0 }}>No {tab === 'all' ? '' : tab === 'practice' ? 'practice ' : 'match '}sessions yet.</p>
            <div className="row" style={{ gap: 8 }}>
              <Link href="/setup/practice" className="cta" style={{ textAlign: 'center', flex: 1 }}>New practice</Link>
              <Link href="/setup/match" className="cta" style={{ textAlign: 'center', flex: 1 }}>New match</Link>
            </div>
          </div>
        ) : (
          list.map((s) => {
            const isMatch = s.mode === 'match';
            const sc = scores[s.id];
            return (
              <Link key={s.id} href={`/sessions/${s.id}`} className="listrow">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, marginBottom: 2 }}>
                    <span className={`badge ${isMatch ? 'm' : 'p'}`}>{isMatch ? 'Match' : 'Practice'}</span>
                    <span className="lr-title">{s.name || (isMatch ? 'Match' : 'Practice session')}</span>
                  </div>
                  <div className="lr-sub">
                    {fmtDate(s.created_at)} · {s.discipline}{s.position ? ` · ${s.position}` : ''}
                    {s.notes ? ` · ${s.notes}` : ''}
                  </div>
                </div>
                <div className="lr-meta">
                  {isMatch
                    ? (sc ? <><span className="score">{sc.f}–{sc.a}</span><span className="lr-sub">{sc.ends} ends</span></> : <span className="lr-sub">no ends</span>)
                    : <><span className="score">{bowls[s.id] || 0}</span><span className="lr-sub">bowls</span></>}
                </div>
              </Link>
            );
          })
        )}
        {err && <p className="err">{err}</p>}
      </div>
      <BottomNav />
    </>
  );
}
