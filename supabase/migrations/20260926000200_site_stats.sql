-- Real numbers for the home page hero (games tracked, stores, deals, last price check).
-- One call, cached by the page (revalidate hourly).
create or replace function public.site_stats() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'steam_games',    (select count(*) from public.games where type = 'game' and popularity_rank is not null),
    'xbox_games',     (select count(*) from public.xbox_games where is_primary and steam_app_id is null),
    'nintendo_games', (select count(*) from public.nintendo_games where sales_status in ('onsale', 'preorder', 'unreleased')),
    'pc_stores',      (select count(distinct store) from public.game_prices where currency = 'EUR'),
    'on_sale',        (select count(*) from public.game_listing where discount_pct > 0)
                      + (select count(*) from public.xbox_games where is_primary and steam_app_id is null and discount_pct > 0)
                      + (select count(*) from public.nintendo_games where sales_status = 'onsale' and discount_pct > 0),
    'last_price_at',  greatest(
                        (select max(fetched_at) from public.game_prices),
                        (select max(fetched_at) from public.xbox_games),
                        (select max(price_at) from public.nintendo_games))
  )
$$;
revoke execute on function public.site_stats() from public, anon, authenticated;
