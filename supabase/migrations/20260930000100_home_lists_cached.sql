-- The home lists read two small summaries instead of the live views (those take ~10s,
-- over PostgREST's statement timeout). pg_cron refreshes them hourly, after the imports.

create extension if not exists pg_cron;

-- One row per game: platforms, lowest price, deepest discount, best rank, first release.
create materialized view if not exists public.home_title_summary as
  select * from public.title_summary;
create unique index if not exists home_title_summary_pk on public.home_title_summary (title_id);
create index if not exists home_title_summary_rank on public.home_title_summary (rank);
create index if not exists home_title_summary_released on public.home_title_summary (released);

-- Each game's best discounted offer.
create materialized view if not exists public.home_best_offer as
  select distinct on (o.title_id) o.title_id, o.family, o.store, o.price, o.regular_price, o.discount_pct
    from public.title_store_offers o
   where o.discount_pct > 0 and o.price is not null
   order by o.title_id, o.discount_pct desc, o.price;
create unique index if not exists home_best_offer_pk on public.home_best_offer (title_id);

-- Deals per platform family.
create materialized view if not exists public.home_family_deals as
  select family, count(distinct title_id) as games from public.title_store_offers where discount_pct > 0 group by family;
create unique index if not exists home_family_deals_pk on public.home_family_deals (family);

revoke all on public.home_title_summary, public.home_best_offer, public.home_family_deals from anon, authenticated;

create or replace function public.refresh_home_lists() returns void
language plpgsql security definer set search_path = public as $$
begin
  refresh materialized view concurrently public.home_title_summary;
  refresh materialized view concurrently public.home_best_offer;
  refresh materialized view concurrently public.home_family_deals;
end $$;
revoke execute on function public.refresh_home_lists() from public, anon, authenticated;

select cron.schedule('refresh-home-lists', '17 * * * *', 'select public.refresh_home_lists()');

create or replace function public.home_best_deals(n int default 8, min_discount int default 30, max_rank int default 400)
returns table (slug text, name text, cover_id text, art_id text, genres text[], families text[],
               family text, store text, price numeric, regular_price numeric, discount_pct int, rank int)
language sql stable set search_path = public as $$
  select s.slug, s.name, s.cover_id, s.art_id, s.genres, s.families,
         b.family, b.store, b.price, b.regular_price, b.discount_pct::int, s.rank
    from home_best_offer b join home_title_summary s on s.title_id = b.title_id
   where b.discount_pct >= min_discount and s.rank <= max_rank
   order by s.rank limit n
$$;

create or replace function public.home_releases(from_day date, to_day date, n int default 8, max_rank int default 1500)
returns table (slug text, name text, cover_id text, families text[], from_price numeric, released date)
language sql stable set search_path = public as $$
  select s.slug, s.name, s.cover_id, s.families, s.from_price, s.released
    from home_title_summary s
   where s.released between from_day and to_day and s.rank <= max_rank
   order by s.rank limit n
$$;

create or replace function public.home_popular(n int default 10)
returns table (slug text, name text, cover_id text, families text[], from_price numeric, max_discount int)
language sql stable set search_path = public as $$
  select s.slug, s.name, s.cover_id, s.families, s.from_price, s.max_discount::int
    from home_title_summary s
   where cardinality(s.families) >= 2 and s.rank is not null
   order by s.rank limit n
$$;

create or replace function public.home_deal_counts()
returns table (family text, games bigint)
language sql stable set search_path = public as $$
  select family, games from home_family_deals
$$;
