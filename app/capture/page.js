'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header, BottomNav } from '../../components/Nav';
import PracticeCapture from '../../components/PracticeCapture';
import MatchCapture from '../../components/MatchCapture';

export default function CapturePage() {
  const [params, setParams] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ s: q.get('s'), mode: q.get('mode') || 'practice', jl: q.get('jl') || 'long', disc: q.get('disc') || 'singles' });
  }, []);

  if (!params) return <><Header ctx="capture" /><div className="bd" /><BottomNav /></>;

  if (!params.s) {
    return (
      <>
        <Header ctx="capture" />
        <div className="bd">
          <p className="muted">No active session. Start one from home.</p>
          <Link href="/" className="cta" style={{ textAlign: 'center' }}>Go home</Link>
        </div>
        <BottomNav />
      </>
    );
  }

  const isMatch = params.mode === 'match';
  return (
    <>
      <Header ctx={isMatch ? 'match' : `practice · ${params.jl} jack`} />
      {isMatch
        ? <MatchCapture sessionId={params.s} discipline={params.disc} />
        : <PracticeCapture sessionId={params.s} jackLength={params.jl} />}
      <BottomNav />
    </>
  );
}
