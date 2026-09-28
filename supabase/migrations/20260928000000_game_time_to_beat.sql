-- "How long to beat" on game pages: scripts/import-time-to-beat.mts, weekly, from IGDB's
-- player submissions. Only times that pass the checks in scripts/lib/time-to-beat.mts are
-- stored (story games, 3+ submissions, consistent main / extras / 100%). Minutes.
create table if not exists public.game_time_to_beat (
  steam_app_id  integer primary key references public.games (steam_app_id) on delete cascade,
  igdb_id       integer not null,
  igdb_slug     text,
  main_min      integer not null,   -- main story
  extras_min    integer,            -- main + extras
  full_min      integer,            -- 100%
  submissions   integer not null,
  updated_at    timestamptz not null default now()
);

drop trigger if exists game_time_to_beat_touch on public.game_time_to_beat;
create trigger game_time_to_beat_touch before update on public.game_time_to_beat
  for each row execute function public.touch_updated_at();

alter table public.game_time_to_beat enable row level security;
drop policy if exists "time to beat is public" on public.game_time_to_beat;
create policy "time to beat is public" on public.game_time_to_beat for select using (true);
