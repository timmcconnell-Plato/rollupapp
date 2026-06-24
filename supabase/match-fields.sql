-- RollUp — per-bowl detail for match capture. Run after the earlier migrations.
-- bowl_number: delivery order in the end (1st..4th, depending on discipline)
-- side: whose bowl it is — 'player' (you) or 'opponent'
alter table public.shots add column if not exists bowl_number int;
alter table public.shots add column if not exists side text default 'player';
