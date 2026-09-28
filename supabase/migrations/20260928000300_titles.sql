-- One game across stores: `titles` holds one row per game (the root IGDB game: editions,
-- ports and expanded versions collapse into it; remakes and remasters stay separate), and
-- `title_links` says which store item belongs to which title and how that was decided.
-- Filled by scripts/link-titles.mts (daily); `title_overrides` holds manual corrections,
-- which always win. The store tables stay the sources of offers and prices.

create table if not exists public.titles (
  id            integer primary key,              -- root IGDB game id
  slug          text not null unique,             -- IGDB slug
  name          text not null,
  title_key     text generated always as (public.norm_game_title(name)) stored,
  game_type     smallint,                         -- IGDB game_type (0 main, 8 remake, 9 remaster…)
  first_release date,
  summary       text,
  genres        text[] not null default '{}',
  cover_id      text,                             -- IGDB image ids (portrait cover, wide artwork)
  art_id        text,
  content_hash  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists titles_title_key_idx on public.titles (title_key);

drop trigger if exists titles_touch on public.titles;
create trigger titles_touch before update on public.titles
  for each row execute function public.touch_updated_at();

create table if not exists public.title_links (
  store      text not null check (store in ('steam', 'xbox', 'playstation', 'nintendo')),
  store_id   text not null,                       -- Steam app id, Xbox product id, IGDB id (PlayStation), NSUID
  title_id   integer not null references public.titles (id) on delete cascade,
  method     text not null,                       -- store_link | title | title_date | steam_link | same_title | override
  updated_at timestamptz not null default now(),
  primary key (store, store_id)
);
create index if not exists title_links_title_idx on public.title_links (title_id);

-- Manual corrections from the admin panel (later) or by hand. title_id null = "don't link
-- this store item to any title" (bundles, pre-order listings, software…).
create table if not exists public.title_overrides (
  store      text not null check (store in ('steam', 'xbox', 'playstation', 'nintendo')),
  store_id   text not null,
  title_id   integer,
  note       text,
  created_at timestamptz not null default now(),
  primary key (store, store_id)
);

alter table public.titles enable row level security;
alter table public.title_links enable row level security;
alter table public.title_overrides enable row level security;   -- no policy: service role only
drop policy if exists "titles are public" on public.titles;
create policy "titles are public" on public.titles for select using (true);
drop policy if exists "title links are public" on public.title_links;
create policy "title links are public" on public.title_links for select using (true);
