import "server-only";
import { db } from "./db";
import { setItemTitle, type Store } from "./catalog";

// The review queue: matches link-titles wasn't sure about (scripts/link-titles.mts writes
// review_items). Every decision is also a catalog correction, so it sticks.

export interface Candidate { id: number; name: string; slug: string | null; year: string | null }

export interface ReviewItem {
  store: Store;
  store_id: string;
  kind: "ambiguous" | "weak";
  item_name: string;
  item_release: string | null;
  current_title_id: number | null;
  current_title: { name: string; slug: string } | null;
  candidates: (Candidate & { inCatalog: boolean })[];
  reason: string;
  status: "open" | "resolved" | "dismissed";
  resolved_by: string | null;
}

export const REVIEW_PAGE = 25;

export async function openReviewCount(): Promise<number> {
  try {
    const { rows } = await db().raw("select count(*) n from public.review_items where status = 'open'");
    return Number(rows[0].n);
  } catch {
    return 0;            // table not there yet (before the first migration)
  }
}

export async function reviewCounts(): Promise<Record<string, number>> {
  const { rows } = await db().raw("select status, kind, count(*) n from public.review_items group by status, kind");
  const out: Record<string, number> = {};
  for (const r of rows as { status: string; kind: string; n: string }[]) {
    out[r.status] = (out[r.status] ?? 0) + Number(r.n);
    out[`${r.status}:${r.kind}`] = Number(r.n);
  }
  return out;
}

export async function listReviews(status: "open" | "done", kind: "all" | "ambiguous" | "weak", page: number): Promise<{ rows: ReviewItem[]; total: number }> {
  const q = db()("review_items as r")
    .modify((b) => { if (status === "open") b.where("r.status", "open"); else b.whereNot("r.status", "open"); })
    .modify((b) => { if (kind !== "all") b.where("r.kind", kind); });
  const total = Number((await q.clone().count({ n: "*" }).first())?.n ?? 0);
  const rows = await q.clone()
    .leftJoin("titles as t", "t.id", "r.current_title_id")
    // item_release last, as text: it replaces the date object r.* brings.
    .select(db().raw("r.*, t.name as current_name, t.slug as current_slug, to_char(r.item_release, 'YYYY-MM-DD') as item_release"))
    .orderBy([{ column: "r.kind", order: "asc" }, { column: "r.item_name", order: "asc" }])
    .limit(REVIEW_PAGE).offset((page - 1) * REVIEW_PAGE);
  const ids: number[] = [...new Set<number>(rows.flatMap((r: { candidates: Candidate[] }) => r.candidates.map((c) => c.id)))];
  const known = new Set<number>(ids.length
    ? (await db().raw("select id from public.titles where id = any(?::int[])", [ids])).rows.map((t: { id: number }) => t.id)
    : []);
  return {
    total,
    rows: rows.map((r: ReviewItem & { current_name: string | null; current_slug: string | null }) => ({
      ...r,
      current_title: r.current_name ? { name: r.current_name, slug: r.current_slug! } : null,
      candidates: r.candidates.map((c) => ({ ...c, inCatalog: known.has(c.id) })),
    })),
  };
}

async function getReview(store: Store, storeId: string) {
  return db()("review_items").where({ store, store_id: storeId }).first() as Promise<(ReviewItem & { candidates: Candidate[] }) | undefined>;
}

async function close(store: Store, storeId: string, status: "resolved" | "dismissed", by: string) {
  await db()("review_items").where({ store, store_id: storeId })
    .update({ status, resolved_by: by, resolved_at: db().fn.now(), updated_at: db().fn.now() });
}

/** A title row for an IGDB game we don't have yet (link-titles fills in the rest next run). */
async function ensureTitle(c: Candidate) {
  const exists = await db()("titles").where({ id: c.id }).first();
  if (exists) return;
  // IGDB's slug without its "--2" duplicate suffix, like link-titles makes them.
  const base = (c.slug?.replace(/--\d+$/, "") ?? c.name).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || String(c.id);
  const taken = await db()("titles").where({ slug: base }).first() || await db()("title_slug_aliases").where({ slug: base }).first();
  await db()("titles").insert({
    id: c.id, name: c.name, slug: taken ? `${base}-${c.id}` : base,
    first_release: c.year ? `${c.year}-01-01` : null,
  });
}

export async function pickCandidate(store: Store, storeId: string, candidateId: number, by: string) {
  const item = await getReview(store, storeId);
  const c = item?.candidates.find((x) => x.id === candidateId);
  if (!item || !c) throw new Error("That review item or candidate isn't there any more.");
  await ensureTitle(c);
  await setItemTitle(store, storeId, candidateId, by);
  await close(store, storeId, "resolved", by);
  return c;
}

/** The current match is right: lock it as a correction. */
export async function confirmMatch(store: Store, storeId: string, by: string) {
  const item = await getReview(store, storeId);
  if (!item?.current_title_id) throw new Error("This item has no current match to confirm.");
  await setItemTitle(store, storeId, item.current_title_id, by);
  await close(store, storeId, "resolved", by);
}

/** None of the candidates: keep the item off every title. */
export async function rejectAll(store: Store, storeId: string, by: string) {
  await setItemTitle(store, storeId, null, by);
  await close(store, storeId, "resolved", by);
}

/** Moved to another title from the queue. */
export async function resolveMoved(store: Store, storeId: string, by: string) {
  await close(store, storeId, "resolved", by);
}

/** Leave it as link-titles has it, and don't ask again. */
export async function dismiss(store: Store, storeId: string, by: string) {
  await close(store, storeId, "dismissed", by);
}

/** Ask again (from the decided list). */
export async function reopen(store: Store, storeId: string) {
  await db()("review_items").where({ store, store_id: storeId }).update({ status: "open", resolved_by: null, resolved_at: null });
}
