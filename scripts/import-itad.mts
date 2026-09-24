// IsThereAnyDeal → Supabase: current prices at official stores + all-time lows.
// Runs after scripts/import-steam.mts has filled `games`.
//
// Usage (Node ≥ 23.6 runs .mts directly; on Node 22 add --experimental-strip-types):
//   node scripts/import-itad.mts run          link new games to ITAD, then refresh prices
//   node scripts/import-itad.mts probe 730    print ITAD's raw responses for one Steam app
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ITAD_API_KEY
//
// API docs: https://docs.isthereanydeal.com/ — we use two bulk endpoints, so the
// whole catalog costs roughly (games / 200) × 2 requests per run.

import { createClient } from "@supabase/supabase-js";

const API = "https://api.isthereanydeal.com";
const COUNTRY = "ES";            // EUR prices, matching the Steam import
const STEAM_SHOP_ID = 61;        // ITAD's shop id for Steam
const BATCH = 200;               // max ids per prices request
const REQUEST_GAP_MS = 1000;

const supabase = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);
const KEY = required("ITAD_API_KEY");

// ─── ITAD types (only the fields we use) ─────────────────────────────────────

interface Money { amount: number; currency: string }

interface ItadDeal {
  shop: { id: number; name: string };
  price: Money;
  regular: Money;
  cut: number;
  url: string;
}

interface ItadPrices {
  id: string;
  historyLow?: { all?: Money | null } | null;
  deals: ItadDeal[];
}

interface ItadHistoryLow {
  id: string;
  low?: { shop: { name: string }; price: Money; timestamp: string } | null;
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

let lastRequestAt = 0;

async function itad<T>(path: string, body: unknown): Promise<T> {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API}${path}${sep}key=${encodeURIComponent(KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Never log the URL: it contains the API key.
    throw new Error(`ITAD ${path.split("?")[0]} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

// ─── Step 1: link Steam apps to ITAD game ids ────────────────────────────────

async function linkGames() {
  // Games never checked, plus unmatched ones re-checked weekly (ITAD adds games over time).
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("games")
    .select("steam_app_id")
    .is("itad_id", null)
    .or(`itad_checked_at.is.null,itad_checked_at.lt.${weekAgo}`)
    .order("popularity_rank", { ascending: true, nullsFirst: false })
    .limit(2000);
  if (error) throw new Error(`games select: ${error.message}`);

  const ids = (data ?? []).map((r) => r.steam_app_id as number);
  let linked = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const map = await itad<Record<string, string | null>>(
      `/lookup/id/shop/${STEAM_SHOP_ID}/v1`,
      chunk.map((id) => `app/${id}`),
    );
    if (typeof map !== "object" || map === null || Array.isArray(map)) {
      throw new Error(`Unexpected lookup response: ${JSON.stringify(map).slice(0, 300)}`);
    }
    const now = new Date().toISOString();
    await Promise.all(chunk.map(async (appId) => {
      const itadId = map[`app/${appId}`] ?? null;
      if (itadId) linked++;
      const { error: e } = await supabase
        .from("games")
        .update({ itad_id: itadId, itad_checked_at: now })
        .eq("steam_app_id", appId);
      if (e) throw new Error(`games update ${appId}: ${e.message}`);
    }));
  }
  console.log(`Lookup: ${ids.length} checked, ${linked} linked to ITAD.`);
}

// ─── Step 2: prices + all-time lows ──────────────────────────────────────────

async function refreshPrices() {
  const { data, error } = await supabase
    .from("games")
    .select("steam_app_id, itad_id")
    .not("itad_id", "is", null)
    .order("popularity_rank", { ascending: true, nullsFirst: false })
    .limit(5000);
  if (error) throw new Error(`games select: ${error.message}`);

  const games = (data ?? []) as { steam_app_id: number; itad_id: string }[];
  const appIdFor = new Map(games.map((g) => [g.itad_id, g.steam_app_id]));
  let offers = 0, lows = 0;

  for (let i = 0; i < games.length; i += BATCH) {
    const chunk = games.slice(i, i + BATCH).map((g) => g.itad_id);

    const prices = await itad<ItadPrices[]>(`/games/prices/v3?country=${COUNTRY}`, chunk);
    if (!Array.isArray(prices)) throw new Error(`Unexpected prices response: ${JSON.stringify(prices).slice(0, 300)}`);

    const history = await itad<ItadHistoryLow[]>(`/games/historylow/v1?country=${COUNTRY}`, chunk);
    const lowFor = new Map((Array.isArray(history) ? history : []).map((h) => [h.id, h.low]));

    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    for (const entry of prices) {
      const appId = appIdFor.get(entry.id);
      if (!appId) continue;

      // Steam comes from the Steam importer directly; skip ITAD's copy of it.
      const deals = (entry.deals ?? []).filter((d) => d.shop?.id !== STEAM_SHOP_ID && d.price?.currency);
      const rows = dedupeByStore(deals).map((d) => ({
        steam_app_id: appId,
        source: "itad",
        store: d.shop.name,
        currency: d.price.currency,
        price: d.price.amount,
        regular_price: d.regular?.amount ?? null,
        discount_pct: d.cut ?? 0,
        url: d.url,
        fetched_at: now,
      }));

      // Replace this game's ITAD offers so shops that stopped selling it disappear.
      const del = await supabase.from("game_prices").delete().eq("steam_app_id", appId).eq("source", "itad");
      if (del.error) throw new Error(`game_prices delete ${appId}: ${del.error.message}`);
      if (rows.length) {
        const ins = await supabase.from("game_prices").insert(rows);
        if (ins.error) throw new Error(`game_prices insert ${appId}: ${ins.error.message}`);
        const hist = await supabase.from("price_history").upsert(rows.map((r) => ({
          steam_app_id: appId, store: r.store, currency: r.currency, day: today,
          price: r.price, regular_price: r.regular_price,
        })));
        if (hist.error) throw new Error(`price_history upsert ${appId}: ${hist.error.message}`);
        offers += rows.length;
      }

      const low = lowFor.get(entry.id);
      if (low?.price) {
        const upd = await supabase.from("games").update({
          history_low_price: low.price.amount,
          history_low_currency: low.price.currency,
          history_low_shop: low.shop?.name ?? null,
          history_low_at: low.timestamp ?? null,
        }).eq("steam_app_id", appId);
        if (upd.error) throw new Error(`games low ${appId}: ${upd.error.message}`);
        lows++;
      }
    }
    console.log(`Prices: ${Math.min(i + BATCH, games.length)}/${games.length} games…`);
  }
  console.log(`Done: ${offers} offers from ${games.length} games, ${lows} all-time lows.`);
}

/** One row per store (cheapest), since the table key is (game, source, store, currency). */
function dedupeByStore(deals: ItadDeal[]): ItadDeal[] {
  const best = new Map<string, ItadDeal>();
  for (const d of deals) {
    const k = `${d.shop.name}|${d.price.currency}`;
    const cur = best.get(k);
    if (!cur || d.price.amount < cur.price.amount) best.set(k, d);
  }
  return [...best.values()];
}

// ─── Probe ───────────────────────────────────────────────────────────────────

async function probe(appId: number) {
  const map = await itad<Record<string, string | null>>(`/lookup/id/shop/${STEAM_SHOP_ID}/v1`, [`app/${appId}`]);
  console.log("lookup:", JSON.stringify(map));
  const id = map[`app/${appId}`];
  if (!id) return;
  console.log("prices:", JSON.stringify(await itad(`/games/prices/v3?country=${COUNTRY}`, [id]), null, 2).slice(0, 4000));
  console.log("historylow:", JSON.stringify(await itad(`/games/historylow/v1?country=${COUNTRY}`, [id]), null, 2));
}

// ─── Entry ───────────────────────────────────────────────────────────────────

function required(name: string): string {
  // Trim: secrets pasted into GitHub often pick up a trailing space or newline.
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case "run":   await linkGames(); await refreshPrices(); break;
  case "probe": await probe(Number(arg ?? 730)); break;
  default:
    console.error("Usage: import-itad.mts run | probe <steamAppId>");
    process.exit(1);
}
