import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Family } from "@/lib/versions";

// Home page lists across every store (supabase/migrations/*_home_lists*.sql): small summaries
// that pg_cron refreshes hourly, read through a few RPCs.

export interface HomeDeal {
  slug: string;
  name: string;
  cover_id: string | null;
  art_id: string | null;
  genres: string[];
  families: Family[];
  family: Family;
  store: string;
  price: number;
  regular_price: number | null;
  discount_pct: number;
}

export interface HomeGame {
  slug: string;
  name: string;
  cover_id: string | null;
  families: Family[];
  from_price: number | null;
  released?: string | null;
  max_discount?: number;
}

export const FAMILY_ORDER: Family[] = ["pc", "playstation", "xbox", "nintendo"];

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const sortFamilies = (f: string[] | null) => FAMILY_ORDER.filter((x) => (f ?? []).includes(x));

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await getSupabaseAdmin().rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function getBestDeals(n = 8): Promise<HomeDeal[]> {
  const rows = await rpc<HomeDeal>("home_best_deals", { n });
  return rows.map((r) => ({ ...r, families: sortFamilies(r.families), price: Number(r.price), regular_price: num(r.regular_price) }));
}

export async function getReleases(from: string, to: string, n = 8): Promise<HomeGame[]> {
  const rows = await rpc<HomeGame>("home_releases", { from_day: from, to_day: to, n });
  return rows.map((r) => ({ ...r, families: sortFamilies(r.families), from_price: num(r.from_price) }));
}

export async function getPopular(n = 10): Promise<HomeGame[]> {
  const rows = await rpc<HomeGame>("home_popular", { n });
  return rows.map((r) => ({ ...r, families: sortFamilies(r.families), from_price: num(r.from_price) }));
}

export async function getDealCounts(): Promise<Partial<Record<Family, number>>> {
  const rows = await rpc<{ family: Family; games: number }>("home_deal_counts", {});
  return Object.fromEntries(rows.map((r) => [r.family, Number(r.games)]));
}
