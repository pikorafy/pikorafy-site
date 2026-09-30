-- Home page lists across every store: one view with each store's current price per game
-- (title), and small functions for the lists. Read hourly by the home page (ISR).

create or replace view public.title_store_offers with (security_invoker = true) as
  select l.title_id, 'pc'::text as family, p.store, p.price, p.regular_price, p.discount_pct,
         g.popularity_rank as rank, g.release_date
    from public.title_links l
    join public.game_prices p on l.store = 'steam' and p.steam_app_id::text = l.store_id
    join public.games g on g.steam_app_id = p.steam_app_id
  union all
  select l.title_id, 'xbox', 'Microsoft Store', x.price, x.regular_price, x.discount_pct, x.popularity_rank, x.release_date
    from public.title_links l join public.xbox_games x on l.store = 'xbox' and x.product_id = l.store_id
  union all
  select l.title_id, 'playstation', 'PlayStation Store', s.price, s.regular_price, s.discount_pct, s.popularity, s.release_date
    from public.title_links l join public.playstation_games s on l.store = 'playstation' and s.igdb_id::text = l.store_id
  union all
  select l.title_id, 'nintendo', 'Nintendo eShop', n.price, n.regular_price, n.discount_pct, n.popularity, n.release_date
    from public.title_links l join public.nintendo_games n on l.store = 'nintendo' and n.nsuid = l.store_id;

-- One row per game: its platforms, lowest price, deepest discount, best rank, first release.
create or replace view public.title_summary with (security_invoker = true) as
  select o.title_id, t.slug, t.name, t.cover_id, t.art_id, t.genres,
         array_agg(distinct o.family) as families,
         min(o.price) filter (where o.price is not null) as from_price,
         coalesce(max(o.discount_pct), 0) as max_discount,
         min(o.rank) as rank,
         coalesce(t.first_release, min(o.release_date)) as released
    from public.title_store_offers o join public.titles t on t.id = o.title_id
   group by o.title_id, t.slug, t.name, t.cover_id, t.art_id, t.genres, t.first_release;

-- Best deals on popular games: each game's deepest discount (min_discount+), most popular first.
create or replace function public.home_best_deals(n int default 8, min_discount int default 30, max_rank int default 400)
returns table (slug text, name text, cover_id text, art_id text, genres text[], families text[],
               family text, store text, price numeric, regular_price numeric, discount_pct int, rank int)
language sql stable set search_path = public as $$
  with best as (
    select distinct on (o.title_id) o.* from title_store_offers o
     where o.discount_pct >= min_discount and o.price is not null
     order by o.title_id, o.discount_pct desc, o.price
  )
  select s.slug, s.name, s.cover_id, s.art_id, s.genres, s.families,
         b.family, b.store, b.price, b.regular_price, b.discount_pct::int, s.rank
    from best b join title_summary s on s.title_id = b.title_id
   where s.rank <= max_rank
   order by s.rank limit n
$$;

-- Games released (or releasing) between two dates, most popular first.
create or replace function public.home_releases(from_day date, to_day date, n int default 8, max_rank int default 1500)
returns table (slug text, name text, cover_id text, families text[], from_price numeric, released date)
language sql stable set search_path = public as $$
  select s.slug, s.name, s.cover_id, s.families, s.from_price, s.released
    from title_summary s
   where s.released between from_day and to_day and s.rank <= max_rank
   order by s.rank limit n
$$;

-- Most popular games on at least two platforms.
create or replace function public.home_popular(n int default 10)
returns table (slug text, name text, cover_id text, families text[], from_price numeric, max_discount int)
language sql stable set search_path = public as $$
  select s.slug, s.name, s.cover_id, s.families, s.from_price, s.max_discount::int
    from title_summary s
   where cardinality(s.families) >= 2 and s.rank is not null
   order by s.rank limit n
$$;

-- How many games are on sale on each platform family.
create or replace function public.home_deal_counts()
returns table (family text, games bigint)
language sql stable set search_path = public as $$
  select family, count(distinct title_id) from title_store_offers where discount_pct > 0 group by family
$$;
