'use client';

import Link from 'next/link';
import { Header, BottomNav } from '../components/Nav';
import { supabaseReady } from '../lib/supabase';

export default function Home() {
  return (
    <>
      <Header ctx="home" />
      <div className="bd">
        <h1 className="big">You're measured in the match, not at practice.</h1>
        <p className="sub">Train. Compete. Diagnose. Adjust.</p>
        {!supabaseReady && (
          <p className="err">Supabase keys not set — add them in Vercel env vars to persist data.</p>
        )}
        <div style={{ height: 4 }} />
        <Link href="/setup/match" className="modecard">
          <span className="ic" />
          <span><span className="t">New match</span><br /><span className="s">Per-end capture, sparse and fast</span></span>
        </Link>
        <Link href="/setup/practice" className="modecard">
          <span className="ic" />
          <span><span className="t">New practice</span><br /><span className="s">Per-bowl, rich and controlled</span></span>
        </Link>
        <Link href="/sessions" className="modecard">
          <span className="ic" />
          <span><span className="t">Sessions</span><br /><span className="s">History, matches log, per-session data</span></span>
        </Link>
        <Link href="/reports" className="modecard">
          <span className="ic" />
          <span><span className="t">Reports</span><br /><span className="s">Heatmap, length profile, filters</span></span>
        </Link>
        <Link href="/dashboard" className="modecard">
          <span className="ic" />
          <span><span className="t">Dashboard</span><br /><span className="s">Wide view for a monitor</span></span>
        </Link>
      </div>
      <BottomNav />
    </>
  );
}
