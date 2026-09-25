-- Xbox catalog cleanup:
--  * group duplicate Store products (Xbox One / Series X|S / PC variants, editions,
--    re-listings) under one title key; one "primary" product represents the group
--    in listings, the others show up as editions on its page;
--  * manual Steam links for titles the name matcher can't pair (or pairs wrongly);
--  * subscriptions a product is included with (Game Pass tiers, EA Play…), read from
--    the Store's own "upsell" remediations instead of trusting the Game Pass lists.

-- Only strip platform / preview parentheticals: "(PC)", "(Xbox One)", "(Game Preview)".
-- Years stay, so "Dead Space (2008)" no longer matches the 2023 remake "Dead Space".
create or replace function public.norm_game_title(t text) returns text
language sql immutable set search_path = '' as $$
  select trim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    lower(extensions.unaccent(regexp_replace(t, '[™®©]', '', 'g'))),
    '\((pc|windows[^)]*|xbox[^)]*|game preview)\)', ' ', 'g'),
    '[-–:]?\s*(standard|deluxe|ultimate|gold|complete|definitive|vault|premium|digital deluxe|game of the year|goty|legacy|enhanced|anniversary|cross-gen|launch)( edition| bundle)?\s*$', ' ', 'g'),
    '\m(for )?(xbox series x\|s|xbox series x|xbox one|windows 10|windows|pc)\M', ' ', 'g'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

alter table public.xbox_games
  add column if not exists group_key text,
  add column if not exists is_primary boolean not null default true,
  add column if not exists group_rank integer,
  add column if not exists edition_count integer not null default 1,
  add column if not exists group_min_price numeric(10,2),
  add column if not exists subscriptions text[] not null default '{}';
create index if not exists xbox_games_group_idx on public.xbox_games (group_key);
create index if not exists xbox_games_primary_rank_idx on public.xbox_games (group_rank) where is_primary;

-- Subscription products (Store BigIds) → display names; filled by the importer.
create table if not exists public.xbox_subscriptions (
  big_id text primary key,
  name text not null,
  updated_at timestamptz not null default now()
);
alter table public.xbox_subscriptions enable row level security;
drop policy if exists "public read" on public.xbox_subscriptions;
create policy "public read" on public.xbox_subscriptions for select using (true);

-- Manual Steam links by group key. steam_app_id null = never link this group.
create table if not exists public.xbox_steam_links (
  group_key text primary key,
  steam_app_id integer references public.games on delete cascade,
  note text
);
alter table public.xbox_steam_links enable row level security;   -- no policy: service role only

-- Recompute groups, primaries, subscriptions and Steam links. Called after every import.
create or replace function public.refresh_xbox_catalog() returns integer
language plpgsql set search_path = '' as $$
declare linked integer;
begin
  update public.xbox_games x set
    group_key = public.norm_game_title(x.title),
    subscriptions = array(
      select distinct r->>'BigId'
        from jsonb_array_elements(coalesce(x.raw->'DisplaySkuAvailabilities', '[]')) s,
             jsonb_array_elements(coalesce(s->'Availabilities', '[]')) av,
             jsonb_array_elements(case when jsonb_typeof(av->'Remediations') = 'array' then av->'Remediations' else '[]' end) r
       where r->>'Type' = 'Upsell' and r->>'BigId' is not null
       order by 1);

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

-- Kept for older importer builds.
create or replace function public.link_xbox_games() returns integer
language sql set search_path = '' as $$ select public.refresh_xbox_catalog() $$;

revoke execute on function public.refresh_xbox_catalog() from public, anon, authenticated;
revoke execute on function public.link_xbox_games() from public, anon, authenticated;
