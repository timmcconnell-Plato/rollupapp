'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, BottomNav } from '../../../components/Nav';
import Seg from '../../../components/Seg';
import { supabase } from '../../../lib/supabase';

const DISC = [['singles', 'Singles'], ['pairs', 'Pairs'], ['triples', 'Triples'], ['fours', 'Fours']].map(([value, label]) => ({ value, label }));
const POS = [['lead', 'Lead'], ['second', 'Second'], ['third', 'Third'], ['skip', 'Skip']].map(([value, label]) => ({ value, label }));
const LEN = [['short', 'Short'], ['medium', 'Medium'], ['long', 'Long']].map(([value, label]) => ({ value, label }));
const FOCUS = [['draw', 'Draw'], ['weighted', 'Weighted'], ['drive', 'Drive']].map(([value, label]) => ({ value, label }));

export default function PracticeSetup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState('singles');
  const [position, setPosition] = useState('lead');
  const [jackLength, setJackLength] = useState('long');
  const [focus, setFocus] = useState('draw');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function start() {
    setErr('');
    if (!supabase) { setErr('Supabase keys not set.'); return; }
    setBusy(true);
    const noteParts = [`focus: ${focus}`];
    if (notes.trim()) noteParts.push(notes.trim());
    const { data, error } = await supabase.from('sessions').insert({
      mode: 'training', discipline, position,
      name: name.trim() || null,
      notes: noteParts.join(' — '),
    }).select('id').single();
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push(`/capture?s=${data.id}&mode=practice&jl=${jackLength}`);
  }

  return (
    <>
      <Header ctx="practice" />
      <div className="bd">
        <span className="kk">New practice</span>
        <div className="field">
          <label>Session name</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tuesday draw work" />
        </div>
        <Seg label="Discipline" options={DISC} value={discipline} onChange={setDiscipline} />
        <Seg label="Position" options={POS} value={position} onChange={setPosition} />
        <Seg label="Jack length" options={LEN} value={jackLength} onChange={setJackLength} />
        <Seg label="Focus" options={FOCUS} value={focus} onChange={setFocus} />
        <div className="field">
          <label>Notes / what you're working on</label>
          <textarea className="inp area" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. backhand on a long jack — kept finishing short last week" />
        </div>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>Practice logs every bowl. Match stays sparse.</p>
        <button className="cta" onClick={start} disabled={busy}>{busy ? 'Starting…' : 'Start practice  →'}</button>
        {err && <p className="err">{err}</p>}
      </div>
      <BottomNav />
    </>
  );
}
