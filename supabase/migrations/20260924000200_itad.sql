-- IsThereAnyDeal integration (scripts/import-itad.mts).
-- itad_id links a Steam app to ITAD's game UUID; history_low_* is ITAD's
-- all-time lowest price across official stores, in the import country's currency.
alter table public.games
  add column if not exists itad_id uuid,
  add column if not exists itad_checked_at timestamptz,     -- last lookup attempt (null match included)
  add column if not exists history_low_price numeric(10,2),
  add column if not exists history_low_currency text,
  add column if not exists history_low_shop text,
  add column if not exists history_low_at timestamptz;

create index if not exists games_itad_idx on public.games (itad_id) where itad_id is not null;
