-- Games on the release calendar get our own product page: their Steam apps are queued for
-- the Steam importer (priority 95000, just after Steam's charts at 90000) and kept out of
-- the catalog's weekly demotion / daily pruning while they're upcoming or released in the
-- last 90 days. Afterwards they stay only if they earn a place like any other game.

create or replace function public.queue_release_games() returns integer
language plpgsql set search_path = '' as $$
declare n integer;
begin
  insert into public.import_queue (steam_app_id, priority)
  select distinct r.steam_app_id, 95000
    from public.releases r
   where r.steam_app_id is not null and r.release_date >= current_date - 90
  on conflict (steam_app_id) do update set priority = least(public.import_queue.priority, 95000)
    where public.import_queue.priority > 95000;
  get diagnostics n = row_count;
  -- Already imported but demoted: back into listings.
  update public.games g set popularity_rank = 95000
    from public.releases r
   where r.steam_app_id = g.steam_app_id and r.release_date >= current_date - 90
     and (g.popularity_rank is null or g.popularity_rank >= 100000);
  return n;
end $$;
revoke execute on function public.queue_release_games() from public, anon, authenticated;

create or replace function public.demote_unseeded(seeded integer[]) returns integer
language plpgsql set search_path = '' as $$
declare n integer;
begin
  update public.import_queue q set priority = 100000
   where q.priority > 0 and q.priority < 100000 and not (q.steam_app_id = any(seeded))
     and not exists (select 1 from public.releases r
                      where r.steam_app_id = q.steam_app_id and r.release_date >= current_date - 90);
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.demote_unseeded(integer[]) from public, anon, authenticated;

create or replace function public.prune_catalog() returns integer
language plpgsql set search_path = '' as $$
declare n integer;
begin
  with gone as (
    delete from public.games g
     using public.import_queue q
     where q.steam_app_id = g.steam_app_id and q.priority >= 100000
       and not exists (select 1 from public.game_content c where c.steam_app_id = g.steam_app_id)
       and not exists (select 1 from public.releases r
                        where r.steam_app_id = g.steam_app_id and r.release_date >= current_date - 90)
    returning g.steam_app_id)
  delete from public.import_queue q using gone where q.steam_app_id = gone.steam_app_id;
  get diagnostics n = row_count;
  -- Queue entries that were never imported and fell out: drop too.
  delete from public.import_queue q
   where q.priority >= 100000 and not exists (select 1 from public.games g where g.steam_app_id = q.steam_app_id)
     and not exists (select 1 from public.releases r
                      where r.steam_app_id = q.steam_app_id and r.release_date >= current_date - 90);
  return n;
end $$;
revoke execute on function public.prune_catalog() from public, anon, authenticated;
