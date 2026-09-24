-- Link Xbox Store products to Steam catalog games by normalized title, so one
-- game page (/game/[slug]) can show PC store prices and the Xbox price together.

alter table public.xbox_games
  add column if not exists steam_app_id integer references public.games on delete set null;
create index if not exists xbox_games_steam_idx on public.xbox_games (steam_app_id) where steam_app_id is not null;

-- "Battlefield™ 2042 Xbox Series X|S" / "DOOM Eternal Standard Edition" /
-- "Grand Theft Auto V (Xbox One & Xbox Series X|S)" → "battlefield 2042" / "doom eternal" / "grand theft auto v"
create or replace function public.norm_game_title(t text) returns text
language sql immutable set search_path = '' as $$
  select trim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    lower(extensions.unaccent(regexp_replace(t, '[™®©]', '', 'g'))),
    '\([^)]*\)', ' ', 'g'),
    '[-–:]?\s*(standard|deluxe|ultimate|gold|complete|definitive|vault|premium|digital deluxe|game of the year|goty|legacy|enhanced|anniversary|cross-gen|launch)( edition| bundle)?\s*$', ' ', 'g'),
    '\m(for )?(xbox series x\|s|xbox series x|xbox one|windows 10|windows|pc)\M', ' ', 'g'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

-- Re-link every Xbox product; when several Steam games share a title key, the most
-- popular one wins. Keys of 1–2 characters are ignored (too ambiguous).
create or replace function public.link_xbox_games() returns integer
language plpgsql set search_path = '' as $$
declare linked integer;
begin
  with steam as (
    select distinct on (public.norm_game_title(name)) public.norm_game_title(name) k, steam_app_id
    from public.games
    where popularity_rank is not null and type = 'game'
    order by public.norm_game_title(name), popularity_rank
  )
  update public.xbox_games x
     set steam_app_id = s.steam_app_id
    from (select x2.product_id, st.steam_app_id
            from public.xbox_games x2
            left join steam st on st.k = public.norm_game_title(x2.title) and length(st.k) > 2) s
   where s.product_id = x.product_id
     and x.steam_app_id is distinct from s.steam_app_id;
  select count(*) into linked from public.xbox_games where steam_app_id is not null;
  return linked;
end $$;

revoke execute on function public.link_xbox_games() from public, anon, authenticated;
