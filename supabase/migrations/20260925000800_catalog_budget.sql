-- Keep the database within ~90 MB while the catalog grows by popularity / most played.

-- 1. Raw GetItems copies duplicated games.raw (~10 MB): no longer stored.
truncate public.steam_store_items;

-- 2. Price history keeps change points only: an insert that repeats the store's
--    previous price is skipped (both the Steam and ITAD importers write here).
create or replace function public.price_history_skip_unchanged() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from (
      select h.price from public.price_history h
       where h.steam_app_id = new.steam_app_id and h.store = new.store
         and h.currency = new.currency and h.day < new.day
       order by h.day desc limit 1) prev
     where prev.price = new.price) then
    return null;
  end if;
  return new;
end $$;
drop trigger if exists price_history_skip_unchanged on public.price_history;
create trigger price_history_skip_unchanged before insert on public.price_history
  for each row execute function public.price_history_skip_unchanged();

-- Compact existing rows the same way.
delete from public.price_history h
 using (select steam_app_id, store, currency, day,
               price = lag(price) over (partition by steam_app_id, store, currency order by day) same
          from public.price_history) z
 where z.same and h.steam_app_id = z.steam_app_id and h.store = z.store and h.currency = z.currency and h.day = z.day;

-- 3. Size guard for the importers.
create or replace function public.db_size_mb() returns numeric
language sql stable set search_path = '' as $$
  select round(pg_database_size(current_database()) / 1048576.0, 1)
$$;

-- 4. Trending apps (Steam most played, SteamSpy top of the last 2 weeks) join the
--    queue at priority 90000; seeded ranks (1..N) are never demoted by this.
create or replace function public.mark_trending(ids integer[]) returns integer
language plpgsql set search_path = '' as $$
declare n integer;
begin
  insert into public.import_queue (steam_app_id, priority)
  select unnest(ids), 90000
  on conflict (steam_app_id) do update set priority = least(public.import_queue.priority, 90000);
  get diagnostics n = row_count;
  update public.games g set popularity_rank = q.priority
    from public.import_queue q
   where q.steam_app_id = g.steam_app_id and q.steam_app_id = any(ids) and g.popularity_rank is distinct from q.priority;
  return n;
end $$;

-- 5. Drop games that fell out of the seeded top N and aren't trending
--    (queue priority 100000 after a re-seed), unless they carry written content.
create or replace function public.prune_catalog() returns integer
language plpgsql set search_path = '' as $$
declare n integer;
begin
  with gone as (
    delete from public.games g
     using public.import_queue q
     where q.steam_app_id = g.steam_app_id and q.priority >= 100000
       and not exists (select 1 from public.game_content c where c.steam_app_id = g.steam_app_id)
    returning g.steam_app_id)
  delete from public.import_queue q using gone where q.steam_app_id = gone.steam_app_id;
  get diagnostics n = row_count;
  -- Queue entries that were never imported and fell out: drop too.
  delete from public.import_queue q
   where q.priority >= 100000 and not exists (select 1 from public.games g where g.steam_app_id = q.steam_app_id);
  return n;
end $$;

revoke execute on function public.db_size_mb() from public, anon, authenticated;
revoke execute on function public.mark_trending(integer[]) from public, anon, authenticated;
revoke execute on function public.prune_catalog() from public, anon, authenticated;
