-- Steam serves region-specific trailers: the main import runs as Spain (cc=es,
-- for EUR prices), which returns Spanish/PEGI cuts. trailers_en holds the movie
-- list as seen from the US, used on English pages; raw->movies stays for /es.
alter table public.games add column if not exists trailers_en jsonb;
