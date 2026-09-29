-- Old game-page slugs that now belong to another slug (a title renamed, or merged into
-- another title), so old links keep working: /game/<old> redirects to the title's page.
-- Written by scripts/link-titles.mts.
create table if not exists public.title_slug_aliases (
  slug       text primary key,
  title_id   integer not null references public.titles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists title_slug_aliases_title_idx on public.title_slug_aliases (title_id);

alter table public.title_slug_aliases enable row level security;
drop policy if exists "title_slug_aliases public read" on public.title_slug_aliases;
create policy "title_slug_aliases public read" on public.title_slug_aliases for select using (true);
