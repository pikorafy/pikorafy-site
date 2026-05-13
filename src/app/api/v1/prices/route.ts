import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Resolve the store partner from the Authorization: Bearer <key> header. */
async function authenticate(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!key) return null;

  const { data } = await supabaseAdmin
    .from("store_partners")
    .select("id, name, short, trust, active")
    .eq("api_key", key)
    .single();

  return data?.active ? data : null;
}

// ─── GET /api/v1/prices ───────────────────────────────────────────────────────
// Public. Query params: steamId, region, edition, currency
//
// Example: GET /api/v1/prices?steamId=730&region=Global

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const steamId  = searchParams.get("steamId");
  const region   = searchParams.get("region");
  const edition  = searchParams.get("edition");
  const currency = searchParams.get("currency") ?? "USD";

  if (!steamId) {
    return apiError("Missing required parameter: steamId", 400);
  }

  let query = supabaseAdmin
    .from("store_prices")
    .select(`
      id,
      steam_app_id,
      game_title,
      sale_price,
      normal_price,
      currency,
      deal_url,
      edition,
      region,
      drm,
      updated_at,
      expires_at,
      store_partners (
        id,
        name,
        short,
        url,
        trust
      )
    `)
    .eq("steam_app_id", steamId)
    .eq("currency", currency)
    .filter("expires_at", "is", null)  // non-expiring
    .or(`expires_at.gt.${new Date().toISOString()}`)  // or not yet expired
    .order("sale_price", { ascending: true });

  if (region)  query = query.eq("region", region);
  if (edition) query = query.eq("edition", edition);

  // Filter out expired listings
  const { data, error } = await query;

  if (error) return apiError("Database error", 500);

  // Filter client-side for expiry (belt-and-suspenders)
  const now = new Date();
  const prices = (data ?? []).filter(
    (p) => !p.expires_at || new Date(p.expires_at) > now
  );

  return NextResponse.json({
    steamId,
    count: prices.length,
    currency,
    prices: prices.map((p) => {
      const sp = p.store_partners as unknown as { id: string; name: string; short: string; url: string; trust: number };
      return {
      store: {
        id:    sp.id,
        name:  sp.name,
        short: sp.short,
        url:   sp.url,
        trust: sp.trust,
      },
      salePrice:    Number(p.sale_price),
      normalPrice:  Number(p.normal_price),
      savings:      p.normal_price > 0
        ? Math.round(((Number(p.normal_price) - Number(p.sale_price)) / Number(p.normal_price)) * 100)
        : 0,
      currency:     p.currency,
      dealUrl:      p.deal_url,
      edition:      p.edition,
      region:       p.region,
      drm:          p.drm,
      updatedAt:    p.updated_at,
      expiresAt:    p.expires_at,
    };
  }),
  }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}

// ─── POST /api/v1/prices ──────────────────────────────────────────────────────
// Authenticated (Bearer token). Store submits one or more price listings.
//
// Body (JSON):
// {
//   "prices": [
//     {
//       "steamAppId": "730",
//       "gameTitle":  "Counter-Strike 2",
//       "salePrice":  14.99,
//       "normalPrice": 19.99,
//       "dealUrl":    "https://yourstore.com/cs2",
//       "edition":    "Standard",     // optional, default "Standard"
//       "region":     "Global",       // optional, default "Global"
//       "drm":        "Steam Key",    // optional, default "Steam Key"
//       "currency":   "USD",          // optional, default "USD"
//       "expiresAt":  "2026-06-01"    // optional ISO date
//     }
//   ]
// }

export async function POST(req: NextRequest) {
  const store = await authenticate(req);
  if (!store) return apiError("Invalid or missing API key", 401);

  let body: { prices?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  if (!Array.isArray(body.prices) || body.prices.length === 0) {
    return apiError("Body must include a non-empty `prices` array", 400);
  }
  if (body.prices.length > 500) {
    return apiError("Maximum 500 prices per request", 400);
  }

  const rows = [];
  const invalid = [];

  for (const [i, item] of body.prices.entries()) {
    const p = item as Record<string, unknown>;
    if (!p.steamAppId || !p.gameTitle || p.salePrice === undefined || p.normalPrice === undefined || !p.dealUrl) {
      invalid.push({ index: i, reason: "Missing required fields: steamAppId, gameTitle, salePrice, normalPrice, dealUrl" });
      continue;
    }
    const salePrice   = Number(p.salePrice);
    const normalPrice = Number(p.normalPrice);
    if (isNaN(salePrice) || isNaN(normalPrice) || salePrice < 0 || normalPrice < 0) {
      invalid.push({ index: i, reason: "salePrice and normalPrice must be non-negative numbers" });
      continue;
    }
    rows.push({
      store_id:     store.id,
      steam_app_id: String(p.steamAppId),
      game_title:   String(p.gameTitle),
      sale_price:   salePrice,
      normal_price: normalPrice,
      currency:     String(p.currency ?? "USD").toUpperCase(),
      deal_url:     String(p.dealUrl),
      edition:      String(p.edition  ?? "Standard"),
      region:       String(p.region   ?? "Global"),
      drm:          String(p.drm      ?? "Steam Key"),
      expires_at:   p.expiresAt ? new Date(p.expiresAt as string).toISOString() : null,
      updated_at:   new Date().toISOString(),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ accepted: 0, rejected: invalid.length, errors: invalid }, { status: 422 });
  }

  const { error } = await supabaseAdmin
    .from("store_prices")
    .upsert(rows, { onConflict: "store_id,steam_app_id,edition,region" });

  if (error) return apiError("Database error: " + error.message, 500);

  return NextResponse.json({
    accepted: rows.length,
    rejected: invalid.length,
    errors:   invalid,
  }, { status: 200 });
}

// ─── DELETE /api/v1/prices ────────────────────────────────────────────────────
// Authenticated. Remove store's listings for a game (or all games).
//
// Query params:
//   steamId  — remove listings for this Steam App ID only
//   (omit)   — remove ALL listings for this store (full wipe)

export async function DELETE(req: NextRequest) {
  const store = await authenticate(req);
  if (!store) return apiError("Invalid or missing API key", 401);

  const steamId = req.nextUrl.searchParams.get("steamId");

  let query = supabaseAdmin
    .from("store_prices")
    .delete()
    .eq("store_id", store.id);

  if (steamId) query = query.eq("steam_app_id", steamId);

  const { error, count } = await query;
  if (error) return apiError("Database error: " + error.message, 500);

  return NextResponse.json({ deleted: count ?? 0, steamId: steamId ?? "all" });
}
