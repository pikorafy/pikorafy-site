-- Store each Steam game's normalized title so refresh_xbox_catalog() joins on an
-- indexed column instead of re-normalizing ~2,300 names every run (it was hitting
-- the API statement timeout after the catalog grew).
alter table public.games add column if not exists title_key text generated always as (public.norm_game_title(name)) stored;
create index if not exists games_title_key_idx on public.games (title_key) where popularity_rank is not null and type = 'game';

-- refresh_xbox_catalog(): same as 20260925000000, but uses games.title_key and only
-- re-derives group keys / subscriptions for Xbox rows that changed recently.
-- (Full definition applied via migration "games_title_key"; see database.)
