'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseReady } from '../lib/supabase';
import Logo from './Logo';

const AuthCtx = createContext({ user: null, profile: null, loading: true, signOut: () => {} });
export const useAuth = () => useContext(AuthCtx);

const DISC = [['singles', 'Singles'], ['pairs', 'Pairs'], ['triples', 'Triples'], ['fours', 'Fours']];
const POS = [['lead', 'Lead'], ['second', 'Second'], ['third', 'Third'], ['skip', 'Skip']];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(u) {
    if (!u) { setProfile(null); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
    setProfile(data || null);
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user || null);
      await loadProfile(data.session?.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user || null);
      await loadProfile(session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    user, profile, loading,
    refreshProfile: () => loadProfile(user),
    signOut: () => supabase && supabase.auth.signOut(),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function AuthGate({ children }) {
  const { user, profile, loading, refreshProfile } = useAuth();

  if (!supabaseReady) {
    return <div className="bd"><p className="err">Supabase keys not set — add them in Vercel to enable accounts.</p></div>;
  }
  if (loading) {
    return <div className="bd"><p className="muted" style={{ marginTop: 40 }}>Loading…</p></div>;
  }
  if (!user) return <AuthScreen />;
  if (!profile || !profile.display_name) return <ProfileSetup user={user} onDone={refreshProfile} />;
  return children;
}

function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [discipline, setDiscipline] = useState('singles');
  const [position, setPosition] = useState('lead');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function submit() {
    setErr(''); setMsg(''); setBusy(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password: pw });
      if (error) { setBusy(false); setErr(error.message); return; }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, display_name: name, club: club || null, discipline, position,
        });
      }
      if (!data.session) { setBusy(false); setMsg('Account created. Check your email to confirm, then sign in.'); setMode('signin'); return; }
      setBusy(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      setBusy(false);
      if (error) { setErr(error.message); return; }
    }
  }

  return (
    <>
      <div className="hd"><Logo height={24} /><span className="ctx">{mode === 'signup' ? 'create account' : 'sign in'}</span></div>
      <div className="bd">
        <h1 className="big">{mode === 'signup' ? 'Set up your account.' : 'Welcome back.'}</h1>
        <p className="sub">Your practice and match data, kept to your account.</p>

        <div className="field"><label>Email</label>
          <input className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@club.co.nz" /></div>
        <div className="field"><label>Password</label>
          <input className="inp" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></div>

        {mode === 'signup' && (
          <>
            <div className="field"><label>Name</label>
              <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
            <div className="field"><label>Club (optional)</label>
              <input className="inp" value={club} onChange={(e) => setClub(e.target.value)} placeholder="e.g. Burnside" /></div>
            <div className="field"><label>Usual discipline</label>
              <div className="seg">{DISC.map(([v, l]) => <button key={v} aria-pressed={discipline === v} onClick={() => setDiscipline(v)}>{l}</button>)}</div></div>
            <div className="field"><label>Usual position</label>
              <div className="seg">{POS.map(([v, l]) => <button key={v} aria-pressed={position === v} onClick={() => setPosition(v)}>{l}</button>)}</div></div>
          </>
        )}

        <button className="cta" onClick={submit} disabled={busy || !email || !pw || (mode === 'signup' && !name)}>
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account  →' : 'Sign in  →'}
        </button>
        {err && <p className="err">{err}</p>}
        {msg && <p className="muted" style={{ fontSize: 13 }}>{msg}</p>}

        <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
          {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
          <a style={{ color: 'var(--deep)', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setErr(''); setMsg(''); }}>
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </a>
        </p>
      </div>
    </>
  );
}

function ProfileSetup({ user, onDone }) {
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [discipline, setDiscipline] = useState('singles');
  const [position, setPosition] = useState('lead');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setErr(''); setBusy(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, display_name: name, club: club || null, discipline, position,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onDone();
  }

  return (
    <>
      <div className="hd"><Logo height={24} /><span className="ctx">profile</span></div>
      <div className="bd">
        <h1 className="big">A few details.</h1>
        <p className="sub">So your data slices by discipline and position.</p>
        <div className="field"><label>Name</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
        <div className="field"><label>Club (optional)</label>
          <input className="inp" value={club} onChange={(e) => setClub(e.target.value)} placeholder="e.g. Burnside" /></div>
        <div className="field"><label>Usual discipline</label>
          <div className="seg">{DISC.map(([v, l]) => <button key={v} aria-pressed={discipline === v} onClick={() => setDiscipline(v)}>{l}</button>)}</div></div>
        <div className="field"><label>Usual position</label>
          <div className="seg">{POS.map(([v, l]) => <button key={v} aria-pressed={position === v} onClick={() => setPosition(v)}>{l}</button>)}</div></div>
        <button className="cta" onClick={save} disabled={busy || !name}>{busy ? 'Saving…' : 'Continue  →'}</button>
        {err && <p className="err">{err}</p>}
      </div>
    </>
  );
}
