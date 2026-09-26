-- Wide key art from each game's nintendo.com product page (its og:image share image),
-- for games whose catalog entry has none. Kept apart from image_wide so catalog
-- updates never erase it; reads use coalesce(image_wide, image_page).
alter table public.nintendo_games
  add column if not exists image_page text,
  add column if not exists art_checked_at timestamptz;
create index if not exists nintendo_games_art_todo_idx on public.nintendo_games (popularity)
  where image_wide is null and image_page is null;
