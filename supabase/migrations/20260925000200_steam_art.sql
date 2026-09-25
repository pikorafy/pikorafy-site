-- Store art assets per game (IStoreBrowseService/GetItems "assets"): the exact,
-- hash-versioned file names of the header, main capsule, library hero, logo…
-- so pages can show the sharpest key art instead of the 460x215 header.
alter table public.games
  add column if not exists art jsonb,
  add column if not exists art_fetched_at timestamptz;
