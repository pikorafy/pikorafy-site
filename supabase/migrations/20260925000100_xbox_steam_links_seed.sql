-- Manual Xbox → Steam links for titles the name matcher can't pair (reviewed by hand).
-- Add rows here (group_key = norm_game_title(xbox title)); steam_app_id null blocks a link.
insert into public.xbox_steam_links (group_key, steam_app_id, note) values
  ('tom clancy s rainbow six siege free access',  359550,  'Free Access listing of Siege'),
  ('tom clancy s rainbow six siege elite edition', 359550, 'Elite Edition of Siege'),
  ('cities skylines edition',                     255710,  'Cities: Skylines - Xbox One Edition'),
  ('cities skylines remastered',                  255710,  'Console remaster of Cities: Skylines'),
  ('it takes two digital version',                1426210, null),
  ('hollow knight voidheart edition',             367520,  'Console name of Hollow Knight'),
  ('the sims 4 ea play edition',                  1222670, null),
  ('mass effect',                                 17460,   'Steam: Mass Effect (2007)'),
  ('mass effect 2',                               24980,   'Steam: Mass Effect 2 (2010 Edition)'),
  ('call of duty modern warfare 4',               null,    'New 2026 game, not Call of Duty 4 (2007)')
on conflict (group_key) do update set steam_app_id = excluded.steam_app_id, note = excluded.note;

select public.refresh_xbox_catalog();
