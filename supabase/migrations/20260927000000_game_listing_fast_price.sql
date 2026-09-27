-- /games timed out: game_listing joined game_best_price, a view that computes a historical
-- low (a subquery on the ever-growing price_history) for every price row before picking the
-- best one, so every page load did that for all ~22k prices (4.5 s, then statement timeouts).
-- Look up each game's cheapest EUR price directly instead (game_prices_best_idx): the first
-- page takes a few milliseconds. Same columns, same order.
create or replace view public.game_listing with (security_invoker = true) as
 select g.steam_app_id, g.slug, g.name, g.header_image, g.genres, g.is_free, g.release_date,
        g.review_score_pct, g.review_count, g.metacritic, g.popularity_rank, g.history_low_price,
        b.price, b.regular_price, b.discount_pct, b.store,
        g.current_players, g.coming_soon, g.title_key,
        g.platforms,
        exists (select 1 from public.xbox_games x where x.steam_app_id = g.steam_app_id) as on_xbox,
        exists (select 1 from public.nintendo_games n where n.steam_app_id = g.steam_app_id) as on_nintendo
   from public.games g
   left join lateral (
     select p.price, p.regular_price, p.discount_pct, p.store
       from public.game_prices p
      where p.steam_app_id = g.steam_app_id and p.currency = 'EUR'
      order by p.price
      limit 1
   ) b on true
  where g.type = 'game' and g.popularity_rank is not null;
