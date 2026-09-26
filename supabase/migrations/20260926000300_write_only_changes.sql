-- Disk I/O budget: the importers rewrote every row on every refresh (Steam: whole game
-- rows with their raw payload, up to 4,000 an hour; Nintendo: 19k catalog rows and 19k
-- prices every 6h), which exhausted the free plan's burst I/O and stalled the database.
-- Fingerprints let them skip unchanged rows; the Nintendo price update skips equal prices.

alter table public.games add column if not exists content_hash text;
alter table public.nintendo_games add column if not exists catalog_hash text;

create or replace function public.apply_nintendo_prices(rows jsonb) returns integer
language sql set search_path = '' as $$
  with upd as (
    update public.nintendo_games n set
      sales_status = r.sales_status, price = r.price, regular_price = r.regular_price,
      discount_pct = r.discount_pct, discount_ends_at = r.discount_ends_at,
      currency = r.currency, is_free = coalesce(r.is_free, false), price_at = r.price_at
    from jsonb_to_recordset(rows) as r(nsuid text, sales_status text, price numeric, regular_price numeric,
      discount_pct smallint, discount_ends_at timestamptz, currency text, is_free boolean, price_at timestamptz)
    where n.nsuid = r.nsuid
      and (n.sales_status, n.price, n.regular_price, n.discount_pct, n.discount_ends_at, n.currency, n.is_free)
          is distinct from
          (r.sales_status, r.price, r.regular_price, r.discount_pct, r.discount_ends_at, r.currency, coalesce(r.is_free, false))
    returning 1)
  select count(*)::integer from upd
$$;
revoke execute on function public.apply_nintendo_prices(jsonb) from public, anon, authenticated;
