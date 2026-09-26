-- Nintendo eShop (Switch) catalog, Europe: scripts/import-nintendo.mts.
-- Catalog (titles, art, genres) from Nintendo Europe's public search index, in English;
-- prices from the eShop price endpoint for Spain (EUR). NSUIDs are shared across Europe.
create table if not exists public.nintendo_games (
  nsuid            text primary key,              -- eShop ID, e.g. 70010000000025
  fs_id            text,                          -- Nintendo Europe catalog ID
  slug             text not null unique,
  title            text not null,
  title_key        text generated always as (public.norm_game_title(title)) stored,
  developer        text,
  publisher        text,
  excerpt          text,
  genres           text[] not null default '{}',
  platforms        text[] not null default '{}',  -- e.g. Nintendo Switch, Nintendo Switch 2
  release_date     date,
  image_wide       text,                          -- 2:1 key art
  image_square     text,
  url_path         text,                          -- nintendo.com product page path (catalog locale)
  popularity       integer,                       -- catalog popularity (lower = more popular)
  sales_status     text,                          -- onsale | not_found | unreleased | …
  price            numeric(10,2),                 -- current, EUR (Spain)
  regular_price    numeric(10,2),
  discount_pct     smallint,
  discount_ends_at timestamptz,
  currency         text,
  is_free          boolean not null default false,
  steam_app_id     integer references public.games on delete set null,
  catalog_at       timestamptz,
  price_at         timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists nintendo_games_popularity_idx on public.nintendo_games (popularity);
create index if not exists nintendo_games_title_key_idx on public.nintendo_games (title_key);
create index if not exists nintendo_games_steam_idx on public.nintendo_games (steam_app_id) where steam_app_id is not null;
create index if not exists nintendo_games_genres_idx on public.nintendo_games using gin (genres);

drop trigger if exists nintendo_games_touch on public.nintendo_games;
create trigger nintendo_games_touch before update on public.nintendo_games
  for each row execute function public.touch_updated_at();

alter table public.nintendo_games enable row level security;
drop policy if exists "nintendo games are public" on public.nintendo_games;
create policy "nintendo games are public" on public.nintendo_games for select using (true);

-- Link to Steam games by normalized title (most popular Steam game wins). Called after each import.
create or replace function public.link_nintendo_games() returns integer
language plpgsql set search_path = '' as $$
declare linked integer;
begin
  with steam as (
    select distinct on (title_key) title_key k, steam_app_id
      from public.games
     where popularity_rank is not null and type = 'game' and length(title_key) > 2
     order by title_key, popularity_rank)
  update public.nintendo_games n set steam_app_id = s.steam_app_id
    from (select n2.nsuid, st.steam_app_id
            from public.nintendo_games n2 left join steam st on st.k = n2.title_key) s
   where s.nsuid = n.nsuid and n.steam_app_id is distinct from s.steam_app_id;
  select count(*) into linked from public.nintendo_games where steam_app_id is not null;
  return linked;
end $$;
revoke execute on function public.link_nintendo_games() from public, anon, authenticated;

-- Bulk price update from the importer: one call per batch of 50.
create or replace function public.apply_nintendo_prices(rows jsonb) returns integer
language sql set search_path = '' as $$
  with upd as (
    update public.nintendo_games n set
      sales_status = r.sales_status, price = r.price, regular_price = r.regular_price,
      discount_pct = r.discount_pct, discount_ends_at = r.discount_ends_at,
      currency = r.currency, is_free = coalesce(r.is_free, false), price_at = r.price_at
    from jsonb_to_recordset(rows) as r(nsuid text, sales_status text, price numeric, regular_price numeric,
      discount_pct smallint, discount_ends_at timestamptz, currency text, is_free boolean, price_at timestamptz)
    where n.nsuid = r.nsuid
    returning 1)
  select count(*)::integer from upd
$$;
revoke execute on function public.apply_nintendo_prices(jsonb) from public, anon, authenticated;
