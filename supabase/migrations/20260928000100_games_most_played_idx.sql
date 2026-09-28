-- Home page "Most played right now": sort by current players without scanning the whole
-- games table (was ~2.3 s and timed out under load, leaving the list empty; now ~70 ms).
create index if not exists games_most_played_idx on public.games (current_players desc)
  where type = 'game' and popularity_rank is not null and current_players is not null;
