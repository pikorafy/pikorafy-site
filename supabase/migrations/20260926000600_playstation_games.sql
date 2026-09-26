-- PlayStation Store (PS4 / PS5) catalog, Spain: scripts/import-playstation.mts.
-- Catalog (which games, English title/summary/genres, Steam app id) from IGDB, which links
-- each game to its PlayStation Store concept id; store data (price, PS Plus, art) from the
-- game's own concept page on store.playstation.com/es-es, read on a schedule per game.
create table if not exists public.playstation_games (
  igdb_id          integer primary key,
  concept_id       text not null,                 -- store.playstation.com/…/concept/<id>
  concept_ids      text[] not null default '{}',  -- every concept IGDB lists (regional duplicates)
  slug             text not null unique,
  title            text not null,
  title_key        text generated always as (public.norm_game_title(title)) stored,
  summary          text,
  genres           text[] not null default '{}',
  igdb_platforms   text[] not null default '{}',  -- PS4 / PS5 per IGDB (store platforms below win)
  first_release    date,
  igdb_rating_count integer,
  steam_app_id     integer,                       -- from IGDB; not a foreign key (not every app is imported)
  popularity       integer,                       -- rank, lower = more popular
  catalog_hash     text,
  catalog_at       timestamptz,
  -- From the store page (Spain, EUR).
  product_id       text,
  np_title_id      text,
  store_name       text,
  classification   text,                          -- FULL_GAME, PREMIUM_EDITION, BUNDLE…
  platforms        text[] not null default '{}',
  release_date     date,
  publisher        text,
  sales_status     text,                          -- onsale | preorder | free | plus_only | unavailable | missing
  price            numeric(10,2),
  regular_price    numeric(10,2),
  discount_pct     smallint,
  discount_ends_at timestamptz,
  lowest_30d       numeric(10,2),                 -- EU "lowest price in the last 30 days"
  currency         text,
  is_free          boolean not null default false,
  plus_price       numeric(10,2),                 -- PS Plus member price, when there is one
  plus_tier        text,                          -- included with PS Plus essential | extra | premium
  star_rating      numeric(3,2),
  rating_count     integer,
  image_wide       text,
  image_hero       text,
  image_square     text,
  image_portrait   text,
  image_logo       text,
  screenshots      text[] not null default '{}',
  store_hash       text,
  price_at         timestamptz,                   -- last time the store data changed
  checked_at       timestamptz,
  next_check_at    timestamptz,
  fail_count       smallint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists playstation_games_popularity_idx on public.playstation_games (popularity);
create index if not exists playstation_games_title_key_idx on public.playstation_games (title_key);
create index if not exists playstation_games_steam_idx on public.playstation_games (steam_app_id) where steam_app_id is not null;
create index if not exists playstation_games_genres_idx on public.playstation_games using gin (genres);
create index if not exists playstation_games_due_idx on public.playstation_games (next_check_at nulls first, popularity);

drop trigger if exists playstation_games_touch on public.playstation_games;
create trigger playstation_games_touch before update on public.playstation_games
  for each row execute function public.touch_updated_at();

alter table public.playstation_games enable row level security;
drop policy if exists "playstation games are public" on public.playstation_games;
create policy "playstation games are public" on public.playstation_games for select using (true);

-- Store results from the importer, one call per small batch. Rows whose store data is
-- unchanged (same store_hash) only get their check times moved; returns how many changed.
create or replace function public.apply_playstation_store(rows jsonb) returns integer
language plpgsql set search_path = '' as $$
declare changed integer;
begin
  with r as (
    select * from jsonb_to_recordset(rows) as r(
      igdb_id integer, concept_id text, product_id text, np_title_id text, store_name text, classification text,
      platforms text[], release_date date, publisher text, sales_status text, price numeric, regular_price numeric,
      discount_pct smallint, discount_ends_at timestamptz, lowest_30d numeric, currency text, is_free boolean,
      plus_price numeric, plus_tier text, star_rating numeric, rating_count integer, image_wide text, image_hero text,
      image_square text, image_portrait text, image_logo text, screenshots text[], store_hash text,
      checked_at timestamptz, next_check_at timestamptz, fail_count smallint)
  ), upd as (
    update public.playstation_games p set
      concept_id = r.concept_id, product_id = r.product_id, np_title_id = r.np_title_id, store_name = r.store_name,
      classification = r.classification, platforms = coalesce(r.platforms, '{}'), release_date = r.release_date,
      publisher = r.publisher, sales_status = r.sales_status, price = r.price, regular_price = r.regular_price,
      discount_pct = r.discount_pct, discount_ends_at = r.discount_ends_at, lowest_30d = r.lowest_30d,
      currency = r.currency, is_free = coalesce(r.is_free, false), plus_price = r.plus_price, plus_tier = r.plus_tier,
      star_rating = r.star_rating, rating_count = r.rating_count, image_wide = r.image_wide, image_hero = r.image_hero,
      image_square = r.image_square, image_portrait = r.image_portrait, image_logo = r.image_logo,
      screenshots = coalesce(r.screenshots, '{}'), store_hash = r.store_hash, price_at = r.checked_at,
      checked_at = r.checked_at, next_check_at = r.next_check_at, fail_count = r.fail_count
    from r
    where p.igdb_id = r.igdb_id and p.store_hash is distinct from r.store_hash
    returning 1
  )
  select count(*)::integer into changed from upd;

  update public.playstation_games p set
    checked_at = r.checked_at, next_check_at = r.next_check_at, fail_count = r.fail_count
  from jsonb_to_recordset(rows) as r(igdb_id integer, store_hash text, checked_at timestamptz,
    next_check_at timestamptz, fail_count smallint)
  where p.igdb_id = r.igdb_id and p.store_hash is not distinct from r.store_hash
    and p.checked_at is distinct from r.checked_at;
  return changed;
end $$;
revoke execute on function public.apply_playstation_store(jsonb) from public, anon, authenticated;
