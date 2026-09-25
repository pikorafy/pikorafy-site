-- Raw IStoreBrowseService/GetItems responses per app. appdetails (store.steampowered.com)
-- blocks GitHub's runner IPs; GetItems (api.steampowered.com) doesn't, returns 50 apps per
-- request, and carries names, descriptions, release, platforms, reviews, price, tags,
-- screenshots and trailers. Stored raw so the mapping into `games` can evolve without refetching.
create table if not exists public.steam_store_items (
  steam_app_id integer primary key,
  item jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.steam_store_items enable row level security;   -- service role only

-- Steam tag id → English name (IStoreService/GetTagList), to turn tagids into genres.
create table if not exists public.steam_tags (
  tagid integer primary key,
  name text not null
);
alter table public.steam_tags enable row level security;
