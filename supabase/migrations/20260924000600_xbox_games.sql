-- Xbox / Microsoft Store catalog (scripts/import-xbox.mts), listed on /xbox.
-- Separate from the Steam `games` table for now; linking the two is a later step.
create table if not exists public.xbox_games (
  product_id       text primary key,              -- Microsoft Store "BigId", e.g. 9P3J32CTXLRZ
  slug             text not null unique,
  title            text not null,
  developer        text,
  publisher        text,
  short_description text,
  categories       text[] not null default '{}',  -- English, from the Store catalog
  platforms        text[] not null default '{}',  -- XboxSeriesX, XboxOne, PC
  release_date     date,
  rating           numeric(3,2),                  -- Store average (0-5)
  rating_count     integer,
  box_art          text,                          -- square
  hero_art         text,                          -- 16:9
  screenshots      jsonb not null default '[]',
  trailers         jsonb not null default '[]',
  price            numeric(10,2),                 -- current, in `currency` (EUR for market ES)
  regular_price    numeric(10,2),
  discount_pct     smallint,
  currency         text,
  is_free          boolean not null default false,
  popularity_rank  integer,                       -- position in OpenXBL "most played", then other lists
  lists            text[] not null default '{}',  -- which Store lists it appeared in (deals, top-paid, ...)
  store_url        text,
  raw              jsonb,                         -- last Store catalog payload (internal)
  fetched_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists xbox_games_rank_idx on public.xbox_games (popularity_rank);
create index if not exists xbox_games_categories_idx on public.xbox_games using gin (categories);

drop trigger if exists xbox_games_touch on public.xbox_games;
create trigger xbox_games_touch before update on public.xbox_games
  for each row execute function public.touch_updated_at();

alter table public.xbox_games enable row level security;
create policy "xbox games are public" on public.xbox_games for select using (true);
