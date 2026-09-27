-- Official store release dates for calendar games, first found wins:
-- Steam (by app id) → Nintendo eShop (title) → PlayStation Store (IGDB id) → Xbox Store
-- (Steam link or title). IGDB's own date is only the fallback (import-releases.mts).
-- Titles are matched with norm_game_title, the same key the catalogs use.
create or replace function public.release_store_dates(items jsonb)
returns table (igdb_id integer, store_date date, source text)
language sql stable set search_path = '' as $$
  with i as (
    select x.igdb_id, x.steam_app_id, public.norm_game_title(x.title) as tk
      from jsonb_to_recordset(items) as x(igdb_id integer, title text, steam_app_id integer)
  )
  select i.igdb_id,
         coalesce(s.d, n.d, p.d, xb.d),
         case when s.d is not null then 'steam' when n.d is not null then 'nintendo'
              when p.d is not null then 'playstation' when xb.d is not null then 'xbox' end
    from i
    left join lateral (select g.release_date d from public.games g
                        where g.steam_app_id = i.steam_app_id and g.release_date is not null) s on true
    left join lateral (select n.release_date d from public.nintendo_games n
                        where length(i.tk) > 2 and n.title_key = i.tk and n.release_date is not null
                          and n.sales_status in ('onsale', 'preorder', 'unreleased')
                        order by n.popularity nulls last limit 1) n on true
    left join lateral (select p.release_date d from public.playstation_games p
                        where p.igdb_id = i.igdb_id and p.release_date is not null) p on true
    left join lateral (select x.release_date d from public.xbox_games x
                        where x.release_date is not null and x.is_primary
                          and (x.steam_app_id = i.steam_app_id or (length(i.tk) > 2 and x.group_key = i.tk))
                        limit 1) xb on true
$$;
revoke execute on function public.release_store_dates(jsonb) from public, anon, authenticated;
