'use client';

import Link from 'next/link';
import { Header, BottomNav } from '../components/Nav';
import { supabaseReady } from '../lib/supabase';

export default function Home() {
  return (
    <>
      <Header ctx="sandbox" />
      <div className="bd">
        <h1 className="big">You're measured in the match, not at practice.</h1>
        <p className="sub">Train. Compete. Diagnose. Adjust.</p>
        {!supabaseReady && (
          <p className="err">Supabase keys not set — add them in .env.local / Vercel env vars to persist data.</p>
        )}
        <div style={{ height: 4 }} />
        <Link href="/setup/match" className="modecard">
          <span className="ic" />
          <span><span className="t">Set up a match</span><br /><span className="s">Per-end capture, sparse and fast</span></span>
        </Link>
        <Link href="/setup/practice" className="modecard">
          <span className="ic" />
          <span><span className="t">Set up practice</span><br /><span className="s">Per-bowl, rich and controlled</span></span>
        </Link>
        <Link href="/reports" className="modecard">
          <span className="ic" />
          <span><span className="t">Reports</span><br /><span className="s">Heatmap and length profile</span></span>
        </Link>
      </div>
      <BottomNav />
    </>
  );
}
