-- When each queued app was last imported successfully, so runs can take games we
-- have never imported before the daily/weekly refreshes of games we already have.
alter table public.import_queue add column if not exists imported_at timestamptz;

update public.import_queue q
   set imported_at = g.steam_fetched_at
  from public.games g
 where g.steam_app_id = q.steam_app_id and q.imported_at is null;

create index if not exists import_queue_due_idx on public.import_queue (imported_at nulls first, priority) where not skip;
