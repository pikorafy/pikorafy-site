-- Release calendar (/releases): scripts/import-releases.mts. Games with a release date on
-- PC, PlayStation, Xbox or Switch from ~6 months ago to a year ahead, from IGDB; the most
-- anticipated per month only. One row per game: its earliest (European / worldwide) date.
create table if not exists public.releases (
  igdb_id       integer primary key,
  slug          text not null,                -- IGDB slug
  title         text not null,
  title_key     text generated always as (public.norm_game_title(title)) stored,
  release_date  date not null,                -- the day, or the period's first day
  precision     text not null,                -- day | month | quarter | year
  platforms     text[] not null default '{}', -- PC, PS5, PS4, Xbox Series, Xbox One, Switch 2, Switch
  hypes         integer not null default 0,   -- IGDB follows before release
  rating_count  integer not null default 0,
  score         integer not null default 0,   -- ranking within a day / month
  cover_id      text,                         -- IGDB image ids (portrait cover, wide artwork)
  art_id        text,
  steam_app_id  integer,
  content_hash  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists releases_date_idx on public.releases (release_date, score desc);
create index if not exists releases_title_key_idx on public.releases (title_key);

drop trigger if exists releases_touch on public.releases;
create trigger releases_touch before update on public.releases
  for each row execute function public.touch_updated_at();

alter table public.releases enable row level security;
drop policy if exists "releases are public" on public.releases;
create policy "releases are public" on public.releases for select using (true);
