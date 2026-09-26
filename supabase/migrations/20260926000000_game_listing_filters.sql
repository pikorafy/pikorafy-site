-- Filters on /games: PC platforms (windows | mac | linux) and "also on Xbox"
-- (a linked Xbox Store product). Columns appended; existing ones unchanged.
create or replace view public.game_listing with (security_invoker = true) as
 select g.steam_app_id, g.slug, g.name, g.header_image, g.genres, g.is_free, g.release_date,
        g.review_score_pct, g.review_count, g.metacritic, g.popularity_rank, g.history_low_price,
        b.price, b.regular_price, b.discount_pct, b.store,
        g.current_players, g.coming_soon, g.title_key,
        g.platforms,
        exists (select 1 from public.xbox_games x where x.steam_app_id = g.steam_app_id) as on_xbox
   from public.games g
   left join public.game_best_price b on b.steam_app_id = g.steam_app_id and b.currency = 'EUR'
  where g.type = 'game' and g.popularity_rank is not null;

create index if not exists xbox_games_steam_app_idx on public.xbox_games (steam_app_id) where steam_app_id is not null;
