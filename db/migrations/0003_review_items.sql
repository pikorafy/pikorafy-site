-- Matches link-titles wasn't sure about, for the admin's review queue. Rewritten by every
-- link-titles run; a decision (resolved / dismissed) stays and the item isn't raised again.
create table if not exists public.review_items (
  store            text not null check (store in ('steam', 'xbox', 'playstation', 'nintendo')),
  store_id         text not null,
  kind             text not null check (kind in ('ambiguous', 'weak')),
  item_name        text not null,
  item_release     date,
  current_title_id integer,                  -- weak: the title it was linked to
  candidates       jsonb not null default '[]',   -- [{ id, name, slug, year }]
  reason           text not null,
  status           text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by      text,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (store, store_id)
);
create index if not exists review_items_open_idx on public.review_items (status, kind, store);
