-- Name and slug corrections from the admin's title editor. The daily link-titles run applies
-- them on top of what IGDB says (store-item moves live in title_overrides).
create table if not exists public.title_edits (
  title_id   integer primary key,
  name       text,
  slug       text check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  updated_by text,
  updated_at timestamptz not null default now()
);

-- Who made a store-item correction, for the editor's history.
alter table public.title_overrides add column if not exists created_by text;
