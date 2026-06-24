-- ============================================================================
-- RollUp — auth migration. Run AFTER migration.sql.
-- Adds profiles, ties every row to its owner, removes anonymous access.
-- ============================================================================

-- profiles — the details captured at sign-up
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  club         text,
  discipline   text check (discipline in ('singles','pairs','triples','fours')),
  position     text check (position in ('lead','second','third','skip')),
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- sessions — auto-stamp the owner, scope to the owner
alter table public.sessions alter column user_id set default auth.uid();
drop policy if exists anon_all_sessions on public.sessions;
drop policy if exists sessions_owner    on public.sessions;
create policy sessions_owner on public.sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ends — scoped through their parent session
drop policy if exists anon_all_ends on public.ends;
drop policy if exists ends_owner    on public.ends;
create policy ends_owner on public.ends for all
  using (exists (select 1 from public.sessions s where s.id = ends.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sessions s where s.id = ends.session_id and s.user_id = auth.uid()));

-- shots — scoped through their parent session
drop policy if exists anon_all_shots on public.shots;
drop policy if exists shots_owner    on public.shots;
create policy shots_owner on public.shots for all
  using (exists (select 1 from public.sessions s where s.id = shots.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sessions s where s.id = shots.session_id and s.user_id = auth.uid()));

-- OPTIONAL: clear the earlier anonymous test data (it has no owner and is now
-- invisible under the new policies). Uncomment to remove it.
-- delete from public.sessions where user_id is null;
