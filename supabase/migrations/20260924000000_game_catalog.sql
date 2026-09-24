-- Game catalog for programmatic SEO pages (/game/[slug], /deals/[genre], ...).
--
-- Data flow:
--   scripts/import-steam.mts → games, game_prices, price_history, import_queue
--   (later) price joiners    → game_prices (cheapshark / itad / instant_gaming)
--   (later) content job      → game_content
--
-- Pages only ever READ from these tables. Nothing calls Steam at request time.
-- Note: src/app/api/v1/prices uses store_prices / store_partners, which were
-- never created in this project. They are not part of this migration.

-- ─── games ───────────────────────────────────────────────────────────────────
-- One row per Steam app. Facts only — we keep Steam's description in `raw`
-- for reference but never render or paraphrase it.
create table if not exists public.games (
  steam_app_id      integer primary key,
  slug              text not null unique,           -- "baldurs-gate-3"
  name              text not null,
  type              text not null default 'game',   -- game | dlc | demo ...
  is_free           boolean not null default false,
  release_date      date,
  coming_soon       boolean not null default false,
  developers        text[] not null default '{}',
  publishers        text[] not null default '{}',
  genres            text[] not null default '{}',   -- Steam genre descriptions
  categories        text[] not null default '{}',   -- "Single-player", "Co-op"...
  platforms         text[] not null default '{}',   -- windows | mac | linux
  metacritic        smallint,
  review_score_pct  smallint,                       -- positive / total * 100
  review_count      integer,
  review_label      text,                           -- "Very Positive"
  header_image      text,
  cheapshark_game_id text,                          -- filled by the CheapShark joiner
  popularity_rank   integer,                        -- lower = more popular; drives generateStaticParams
  raw               jsonb,                          -- last appdetails payload (internal only)
  steam_fetched_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists games_popularity_idx on public.games (popularity_rank) where type = 'game';
create index if not exists games_genres_idx     on public.games using gin (genres);
create index if not exists games_release_idx    on public.games (release_date);

-- ─── game_prices ─────────────────────────────────────────────────────────────
-- Current price per (game, source, store, currency). Overwritten on every sync.
create table if not exists public.game_prices (
  steam_app_id   integer not null references public.games on delete cascade,
  source         text not null,          -- steam | cheapshark | itad | instant_gaming
  store          text not null,          -- "Steam", "GOG", "Instant Gaming"...
  currency       text not null,          -- EUR | USD ...
  price          numeric(10,2) not null,
  regular_price  numeric(10,2),
  discount_pct   smallint,
  url            text,                   -- already affiliate-tagged where applicable
  fetched_at     timestamptz not null default now(),
  primary key (steam_app_id, source, store, currency)
);

create index if not exists game_prices_best_idx on public.game_prices (steam_app_id, currency, price);

-- ─── price_history ───────────────────────────────────────────────────────────
-- Append-only, at most one row per (game, store, currency, day).
-- Feeds "historical low" facts and the buy-now verdict.
create table if not exists public.price_history (
  steam_app_id  integer not null references public.games on delete cascade,
  store         text not null,
  currency      text not null,
  day           date not null default current_date,
  price         numeric(10,2) not null,
  regular_price numeric(10,2),
  primary key (steam_app_id, store, currency, day)
);

-- ─── game_content ────────────────────────────────────────────────────────────
-- LLM-written (or hand-edited) copy, written natively per locale.
create table if not exists public.game_content (
  steam_app_id    integer not null references public.games on delete cascade,
  locale          text not null check (locale in ('es', 'en')),
  summary         text,                  -- what it is + who it's for
  verdict         text,                  -- is now a good time to buy?
  verdict_label   text check (verdict_label in ('buy_now', 'good_deal', 'wait')),
  pros            text[] not null default '{}',
  cons            text[] not null default '{}',
  facts_hash      text,                  -- hash of the facts fed to the model; regenerate when it changes
  verdict_price   numeric(10,2),         -- best price the verdict was written against
  model           text,
  human_edited    boolean not null default false,  -- never overwrite automatically if true
  status          text not null default 'draft' check (status in ('draft', 'published')),
  generated_at    timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (steam_app_id, locale)
);

-- ─── import_queue ────────────────────────────────────────────────────────────
-- Work list for the importer so each run does a bounded batch and resumes
-- where the last one stopped (keeps us well under Steam's rate limit).
create table if not exists public.import_queue (
  steam_app_id   integer primary key,
  priority       integer not null default 1000,   -- = popularity rank at seed time
  next_fetch_at  timestamptz not null default now(),
  attempts       smallint not null default 0,
  last_error     text,
  skip           boolean not null default false   -- not a game / region-locked / delisted
);

create index if not exists import_queue_due_idx on public.import_queue (next_fetch_at, priority) where not skip;

-- ─── views ───────────────────────────────────────────────────────────────────
-- Cheapest current offer per game/currency — what list pages and cards read.
create or replace view public.game_best_price
with (security_invoker = true) as
select distinct on (p.steam_app_id, p.currency)
  p.steam_app_id, p.currency, p.store, p.source, p.price, p.regular_price, p.discount_pct, p.url, p.fetched_at,
  (select min(h.price) from public.price_history h
    where h.steam_app_id = p.steam_app_id and h.currency = p.currency) as historical_low
from public.game_prices p
order by p.steam_app_id, p.currency, p.price asc;

-- ─── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists games_touch on public.games;
create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();

drop trigger if exists game_content_touch on public.game_content;
create trigger game_content_touch before update on public.game_content
  for each row execute function public.touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Public read for the catalog (anon key is fine for pages); writes only via
-- the service role, which bypasses RLS. import_queue is not readable at all.
alter table public.games         enable row level security;
alter table public.game_prices   enable row level security;
alter table public.price_history enable row level security;
alter table public.game_content  enable row level security;
alter table public.import_queue  enable row level security;

create policy "games are public"         on public.games         for select using (true);
create policy "prices are public"        on public.game_prices   for select using (true);
create policy "history is public"        on public.price_history for select using (true);
create policy "published content public" on public.game_content  for select using (status = 'published');
