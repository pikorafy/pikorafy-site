-- The site and the importers read and write with the service role only; nothing uses the
-- public anon key. Take read access to the catalog away from anon and authenticated, so it
-- isn't exposed through the public REST/GraphQL APIs, and stop new tables getting it by default.
-- (Supabase linter 0026 / 0027.)

do $$
declare r record;
begin
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'f')
  loop
    execute format('revoke all on public.%I from anon, authenticated', r.relname);
  end loop;
end $$;

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

-- The home RPCs are for the server only too.
revoke execute on function public.home_best_deals(int, int, int), public.home_releases(date, date, int, int),
  public.home_popular(int), public.home_deal_counts(), public.home_genre_top(text, int) from public, anon, authenticated;
grant execute on function public.home_best_deals(int, int, int), public.home_releases(date, date, int, int),
  public.home_popular(int), public.home_deal_counts(), public.home_genre_top(text, int) to service_role;
