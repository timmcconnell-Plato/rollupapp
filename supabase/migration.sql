-- ============================================================================
-- Competitive Lawn Bowls — capture schema (Horizon 1)
-- ============================================================================
-- This is the durable asset. The web prototype is disposable; this schema is
-- not. Everything is built around ONE primitive: where a bowl finished,
-- expressed as a coordinate in green-space. Manual taps and future CV output
-- write the SAME record into the SAME table. That identity is what lets
-- training data and match data join — which is the whole wedge.
--
-- COORDINATE CONVENTION (green-space, jack-relative)
--   origin (0,0) = the jack
--   units        = metres
--   +x = right of the line of play (mat looking up the green); -x = left
--   +y = beyond the jack (long);  -y = short of the jack (toward the mat)
--
-- NOTE: green dimensions, jack length bands and green-speed definition are
-- flagged as ASSUMPTIONS pending Domain Lead / World Bowls confirmation.
-- They are stored as free-ish enums here so corrections don't require a
-- destructive migration.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- sessions — a training or match outing
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete cascade,
  mode          text not null check (mode in ('training','match')),
  discipline    text not null check (discipline in ('singles','pairs','triples','fours')),
  position      text     check (position in ('lead','second','third','skip')),
  green_speed   numeric,                       -- seconds; definition pending confirmation
  venue         text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ends — the per-end record. In MATCH mode this is the minimum-viable signal
-- (shots for/against). In TRAINING mode it is optional.
-- ---------------------------------------------------------------------------
create table if not exists public.ends (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions (id) on delete cascade,
  end_number     int  not null,
  jack_length    text check (jack_length in ('short','medium','long')),
  shots_for      int,
  shots_against  int,
  created_at     timestamptz not null default now()
);
create index if not exists ends_session_idx on public.ends (session_id);

-- ---------------------------------------------------------------------------
-- shots — THE PRIMITIVE. The atomic unit. Carries hand at the shot level.
-- A draw stores a finishing coordinate; a non-draw stores a coarse outcome
-- tag and leaves the coordinate null (a distance-from-jack number cannot
-- honestly represent a drive). Intent is set BEFORE success means anything.
-- ---------------------------------------------------------------------------
create table if not exists public.shots (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.sessions (id) on delete cascade,
  end_id           uuid references public.ends (id) on delete set null,

  hand             text not null check (hand in ('forehand','backhand')),
  jack_length      text check (jack_length in ('short','medium','long')),
  intent           text not null default 'draw'
                     check (intent in ('draw','weighted','drive','rest','block','trail','ditch_weight')),

  -- the green-space coordinate (see convention above). Null for non-draws /
  -- unplaced bowls. THIS is the field manual + CV both write.
  finish_x         numeric,
  finish_y         numeric,

  -- coarse outcome for non-draws (intent-relative success, not a distance)
  outcome_tag      text check (outcome_tag in ('took_shot','rested','missed','wrecked_head','jack_moved')),

  -- how this record was produced and how much to trust it. Manual tap and CV
  -- land in the same table, distinguished here — never by a separate schema.
  capture_method   text not null default 'manual_tap'
                     check (capture_method in ('manual_tap','manual_confirm','cv')),
  capture_fidelity text not null default 'approximate'
                     check (capture_fidelity in ('exact','approximate','low')),

  created_at       timestamptz not null default now()
);
create index if not exists shots_session_idx on public.shots (session_id);
create index if not exists shots_end_idx     on public.shots (end_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- PROTOTYPE-ONLY: the policies below allow anonymous read/write so the demo
-- works with no auth. THIS IS A KNOWN GAP. Before anything real, replace these
-- with user_id = auth.uid() policies and require sign-in.
-- ---------------------------------------------------------------------------
alter table public.sessions enable row level security;
alter table public.ends     enable row level security;
alter table public.shots    enable row level security;

drop policy if exists anon_all_sessions on public.sessions;
drop policy if exists anon_all_ends     on public.ends;
drop policy if exists anon_all_shots    on public.shots;

create policy anon_all_sessions on public.sessions for all using (true) with check (true);
create policy anon_all_ends     on public.ends     for all using (true) with check (true);
create policy anon_all_shots    on public.shots    for all using (true) with check (true);
