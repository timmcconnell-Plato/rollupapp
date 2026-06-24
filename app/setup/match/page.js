'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, BottomNav } from '../../../components/Nav';
import Seg from '../../../components/Seg';
import { supabase } from '../../../lib/supabase';

const DISC = [['singles', 'Singles'], ['pairs', 'Pairs'], ['triples', 'Triples'], ['fours', 'Fours']].map(([value, label]) => ({ value, label }));
const POS = [['lead', 'Lead'], ['second', 'Second'], ['third', 'Third'], ['skip', 'Skip']].map(([value, label]) => ({ value, label }));

export default function MatchSetup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState('singles');
  const [position, setPosition] = useState('lead');
  const [opponent, setOpponent] = useState('');
  const [venue, setVenue] = useState('');
  const [green, setGreen] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function start() {
    setErr('');
    if (!supabase) { setErr('Supabase keys not set.'); return; }
    setBusy(true);
    const noteParts = [];
    if (opponent.trim()) noteParts.push(`vs ${opponent.trim()}`);
    if (notes.trim()) noteParts.push(notes.trim());
    const { data, error } = await supabase.from('sessions').insert({
      mode: 'match', discipline, position,
      name: name.trim() || (opponent.trim() ? `vs ${opponent.trim()}` : null),
      green_speed: green ? Number(green) : null,
      venue: venue || null,
      notes: noteParts.length ? noteParts.join(' — ') : null,
    }).select('id').single();
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push(`/capture?s=${data.id}&mode=match&disc=${discipline}`);
  }

  return (
    <>
      <Header ctx="match" />
      <div className="bd">
        <span className="kk">New match</span>
        <div className="field">
          <label>Match name</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Club champs — round 2" />
        </div>
        <Seg label="Discipline" options={DISC} value={discipline} onChange={setDiscipline} />
        <Seg label="Your position" options={POS} value={position} onChange={setPosition} />
        <div className="field">
          <label>Opponent</label>
          <input className="inp" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Papanui A" />
        </div>
        <div className="field">
          <label>Green / venue</label>
          <input className="inp" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Burnside, rink 4" />
        </div>
        <div className="field">
          <label>Green speed — seconds</label>
          <input className="inp" type="number" value={green} onChange={(e) => setGreen(e.target.value)} placeholder="14" />
        </div>
        <div className="field">
          <label>Notes / context</label>
          <textarea className="inp area" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. tricky cross-wind, heavy end of the green" />
        </div>
        <p className="amber" style={{ fontSize: 12, margin: 0 }}>Green-speed definition to confirm with coach.</p>
        <button className="cta" onClick={start} disabled={busy}>{busy ? 'Starting…' : 'Start match  →'}</button>
        {err && <p className="err">{err}</p>}
      </div>
      <BottomNav />
    </>
  );
}
