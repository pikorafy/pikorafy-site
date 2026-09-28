-- Full Xbox catalog (~17,600 games from xbox.com's browse service instead of ~700 from
-- OpenXBL lists and Game Pass). Rows must stay small and writes change-only:
--  - no more `raw` Store payload (~4 KB a row): the importer now stores the subscription ids
--    and the two key-art images the site reads from it;
--  - content_hash lets the importer skip unchanged products;
--  - apply_xbox_ranks() moves popularity ranks only when they change noticeably;
--  - refresh_xbox_catalog() no longer rewrites every row on every run.

alter table public.xbox_games
  add column if not exists titled_art   text,   -- TitledHeroArt (16:9, title on it)
  add column if not exists poster_art   text,   -- Poster (portrait)
  add column if not exists content_hash text;

-- Key art out of the stored payload before it goes.
update public.xbox_games x set
  titled_art = coalesce(x.titled_art, (select i->>'Uri' from jsonb_array_elements(coalesce(x.raw->'LocalizedProperties'->0->'Images', '[]')) i
                                        where i->>'ImagePurpose' = 'TitledHeroArt' limit 1)),
  poster_art = coalesce(x.poster_art, (select i->>'Uri' from jsonb_array_elements(coalesce(x.raw->'LocalizedProperties'->0->'Images', '[]')) i
                                        where i->>'ImagePurpose' = 'Poster' limit 1))
where x.raw is not null;

-- Two identical indexes on steam_app_id.
drop index if exists public.xbox_games_steam_app_idx;

-- Popularity ranks, written only when a game moved noticeably (±10%, at least 5 places):
-- the whole list shifts by a few places every day as new games come in.
create or replace function public.apply_xbox_ranks(rows jsonb) returns integer
language sql set search_path = '' as $$
  with upd as (
    update public.xbox_games x set popularity_rank = r.rank
      from jsonb_to_recordset(rows) as r(product_id text, rank integer)
     where x.product_id = r.product_id
       and (x.popularity_rank is null or abs(x.popularity_rank - r.rank) > greatest(5, x.popularity_rank / 10))
    returning 1)
  select count(*)::integer from upd
$$;
revoke execute on function public.apply_xbox_ranks(jsonb) from public, anon, authenticated;

-- Recompute groups, primaries and Steam links. Called after every import. Subscriptions
-- now come from the importer; every update skips rows that wouldn't change.
create or replace function public.refresh_xbox_catalog() returns integer
language plpgsql set search_path = '' as $$
declare linked integer;
begin
  update public.xbox_games x set group_key = public.norm_game_title(x.title)
   where x.group_key is distinct from public.norm_game_title(x.title);

  -- Primary per group: priced > plain title (no edition / platform suffix) > most popular > cheapest.
  with ranked as (
    select product_id, group_key,
      row_number() over (partition by group_key order by
        (price is null),
        (title ~* '(vault|ultimate|deluxe|gold|bundle|cross-gen|complete|definitive|premium|game of the year|goty|edition)'),
        (title ~* '(xbox one|series x|windows|\(pc\)|\mpc$|preview)'),
        popularity_rank nulls last, price, product_id) rn,
      min(popularity_rank) over (partition by group_key) grank,
      count(*) over (partition by group_key) n,
      min(price) filter (where price is not null) over (partition by group_key) minp
    from public.xbox_games)
  update public.xbox_games x set
    is_primary = r.rn = 1, group_rank = r.grank, edition_count = r.n, group_min_price = r.minp
  from ranked r
  where r.product_id = x.product_id
    and (x.is_primary, x.group_rank, x.edition_count, x.group_min_price)
        is distinct from (r.rn = 1, r.grank, r.n::integer, r.minp);

  -- Steam links: manual overrides first, then exact title-key match (most popular Steam game wins).
  with steam as (
    select distinct on (public.norm_game_title(name)) public.norm_game_title(name) k, steam_app_id
      from public.games
     where popularity_rank is not null and type = 'game'
     order by public.norm_game_title(name), popularity_rank),
  target as (
    select x2.product_id,
           case when m.group_key is not null then m.steam_app_id else st.steam_app_id end steam_app_id
      from public.xbox_games x2
      left join public.xbox_steam_links m on m.group_key = x2.group_key
      left join steam st on st.k = x2.group_key and length(st.k) > 2)
  update public.xbox_games x set steam_app_id = t.steam_app_id
    from target t
   where t.product_id = x.product_id and x.steam_app_id is distinct from t.steam_app_id;

  select count(*) into linked from public.xbox_games where steam_app_id is not null;
  return linked;
end $$;
revoke execute on function public.refresh_xbox_catalog() from public, anon, authenticated;
