'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header, BottomNav } from '../components/Nav';
import { useAuth } from '../components/Auth';
import { computeStats } from '../components/Analysis';
import { supabase, supabaseReady } from '../lib/supabase';

function fmtDate(s) {
  try { return new Date(s).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }); }
  catch { return ''; }
}

export default function Home() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [shots, setShots] = useState([]);

  const load = useCallback(async () => {
    if (!supabase) { setSessions([]); return; }
    const { data: s } = await supabase.from('sessions')
      .select('id,mode,name,notes,discipline,created_at')
      .order('created_at', { ascending: false }).limit(60);
    setSessions(s || []);
    const { data: sh } = await supabase.from('shots')
      .select('hand,finish_x,finish_y').not('finish_y', 'is', null).limit(5000);
    setShots(sh || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const first = (profile?.display_name || '').trim().split(' ')[0];
  const st = computeStats(shots);
  const nSessions = (sessions || []).length;
  const recent = (sessions || []).slice(0, 3);
  const hasData = nSessions > 0;

  return (
    <>
      <Header ctx="home" />
      <div className="bd">
        {!supabaseReady && <p className="err">Supabase keys not set — add them in Vercel to persist data.</p>}

        <div className="greet">
          <h1 className="big">Kia ora{first ? `, ${first}` : ''}.</h1>
          <p className="sub">{hasData ? "Here's where your game's at." : 'Train. Compete. Diagnose. Adjust.'}</p>
        </div>

        {sessions === null ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <Link href="/dashboard" className="statcard hero">
              <div className="tiles3">
                <div className="tile"><div className="tn">{st.n}</div><div className="tl">bowls logged</div></div>
                <div className="tile"><div className="tn">{nSessions}</div><div className="tl">sessions</div></div>
                <div className="tile"><div className="tn">{st.n ? `${st.tightPct}%` : '—'}</div><div className="tl">within 2 bowls</div></div>
              </div>
              <span className="statcard-go">Open dashboard <span aria-hidden>›</span></span>
            </Link>

            {st.n >= 8 && (
              <Link href="/reports" className="insight">
                <span className="insight-dot" />
                <span>{st.shortPct}% of your draws finish short of the jack — worth a length session. <span className="insight-go">Diagnose ›</span></span>
              </Link>
            )}

            <span className="kk">Start capturing</span>
            <div className="actiongrid">
              <Link href="/setup/practice" className="actioncard">
                <span className="ic" />
                <span className="t">New practice</span>
                <span className="s">Per-bowl, rich</span>
              </Link>
              <Link href="/setup/match" className="actioncard">
                <span className="ic" />
                <span className="t">New match</span>
                <span className="s">Per-end, fast</span>
              </Link>
            </div>

            {hasData ? (
              <>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="kk">Jump back in</span>
                  <Link href="/sessions" className="linklite">All sessions ›</Link>
                </div>
                <div className="sesslist">
                  {recent.map((s) => {
                    const isMatch = s.mode === 'match';
                    return (
                      <Link key={s.id} href={`/sessions/${s.id}`} className="listrow">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="row" style={{ gap: 8, marginBottom: 2 }}>
                            <span className={`badge ${isMatch ? 'm' : 'p'}`}>{isMatch ? 'Match' : 'Practice'}</span>
                            <span className="lr-title">{s.name || (isMatch ? 'Match' : 'Practice session')}</span>
                          </div>
                          <div className="lr-sub">{fmtDate(s.created_at)} · {s.discipline}</div>
                        </div>
                        <span className="lr-sub" aria-hidden>›</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="muted" style={{ fontSize: 14 }}>Log your first session and your stats will show up here.</p>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}
