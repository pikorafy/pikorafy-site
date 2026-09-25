-- Copy the freshly seeded queue priorities onto games in one statement, so a re-seed
-- re-ranks the catalog immediately instead of hiding games until their next refresh.
create or replace function public.apply_seed_ranks() returns integer
language sql set search_path = '' as $$
  with upd as (
    update public.games g set popularity_rank = q.priority
      from public.import_queue q
     where q.steam_app_id = g.steam_app_id and not q.skip and q.priority > 0
       and g.popularity_rank is distinct from q.priority
    returning 1)
  select count(*)::integer from upd
$$;
revoke execute on function public.apply_seed_ranks() from public, anon, authenticated;
