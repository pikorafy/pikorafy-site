-- After a seed has written its new ranks: demote everything else (except manual
-- seed-ids at priority 0) so games that fell out of the top N can be pruned.
-- Demoting last (instead of first) means a failed seed leaves the old ranks intact.
create or replace function public.demote_unseeded(seeded integer[]) returns integer
language plpgsql set search_path = '' as $$
declare n integer;
begin
  update public.import_queue q set priority = 100000
   where q.priority > 0 and q.priority < 100000 and not (q.steam_app_id = any(seeded));
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.demote_unseeded(integer[]) from public, anon, authenticated;
