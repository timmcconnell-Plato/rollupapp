-- RollUp — add a session name. Run after the earlier migrations.
alter table public.sessions add column if not exists name text;
