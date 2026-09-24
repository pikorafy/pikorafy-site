-- Hourly concurrent player counts from Steam (scripts/import-players.mts).
create table if not exists public.player_counts (
  steam_app_id integer not null references public.games on delete cascade,
  at           timestamptz not null,           -- truncated to the hour
  players      integer not null,
  primary key (steam_app_id, at)
);

alter table public.player_counts enable row level security;
create policy "player counts are public" on public.player_counts for select using (true);

-- Denormalised on games so pages and listings don't aggregate on every request.
alter table public.games
  add column if not exists current_players    integer,
  add column if not exists current_players_at timestamptz,
  add column if not exists peak_players_24h   integer,
  add column if not exists peak_players_30d   integer;

-- Called by the importer after each run: recompute peaks, drop data older than 90 days.
create or replace function public.refresh_player_stats() returns void
language sql set search_path = '' as $$
  update public.games g set
    peak_players_24h = s.p24, peak_players_30d = s.p30
  from (
    select steam_app_id,
      max(players) filter (where at > now() - interval '24 hours') as p24,
      max(players) filter (where at > now() - interval '30 days')  as p30
    from public.player_counts
    group by steam_app_id
  ) s
  where s.steam_app_id = g.steam_app_id;

  delete from public.player_counts where at < now() - interval '90 days';
$$;

revoke execute on function public.refresh_player_stats() from public, anon, authenticated;
