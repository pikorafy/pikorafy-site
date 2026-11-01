"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isStore, resolveTitle, setItemTitle, type Store } from "@/lib/admin/catalog";
import { confirmMatch, dismiss, pickCandidate, rejectAll, reopen, resolveMoved } from "@/lib/admin/review";
import { requireAdmin } from "@/lib/admin/session";

// Review-queue decisions. Each ends back on the queue page it came from with ?ok= or ?error=.

function parse(form: FormData): { store: Store; storeId: string; back: string } {
  const store = String(form.get("store") ?? "");
  const storeId = String(form.get("store_id") ?? "");
  const back = String(form.get("return") ?? "/admin/review");
  if (!isStore(store) || !storeId) redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent("Unknown store item.")}`);
  return { store: store as Store, storeId, back };
}
const go = (back: string, kind: "ok" | "error", msg: string) =>
  redirect(`${back}${back.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);

export async function pick(form: FormData) {
  const user = await requireAdmin();
  const { store, storeId, back } = parse(form);
  let name = "";
  try {
    const c = await pickCandidate(store, storeId, Number(form.get("candidate")), user.name);
    name = c.name;
    if (c.slug) revalidatePath(`/game/${c.slug}`);
  } catch (err) {
    go(back, "error", (err as Error).message);
  }
  go(back, "ok", `Linked to “${name}”.`);
}

export async function confirm(form: FormData) {
  const user = await requireAdmin();
  const { store, storeId, back } = parse(form);
  try {
    await confirmMatch(store, storeId, user.name);
  } catch (err) {
    go(back, "error", (err as Error).message);
  }
  go(back, "ok", "Match confirmed and locked.");
}

export async function none(form: FormData) {
  const user = await requireAdmin();
  const { store, storeId, back } = parse(form);
  await rejectAll(store, storeId, user.name);
  go(back, "ok", "Kept off every title.");
}

export async function moveTo(form: FormData) {
  const user = await requireAdmin();
  const { store, storeId, back } = parse(form);
  const target = await resolveTitle(String(form.get("target") ?? ""));
  if (!target) go(back, "error", "No title found. Use a title id, its address or a link to its page.");
  await setItemTitle(store, storeId, target!.id, user.name);
  await resolveMoved(store, storeId, user.name);
  revalidatePath(`/game/${target!.slug}`);
  go(back, "ok", `Linked to “${target!.name}”.`);
}

export async function skip(form: FormData) {
  const user = await requireAdmin();
  const { store, storeId, back } = parse(form);
  await dismiss(store, storeId, user.name);
  go(back, "ok", "Dismissed: left as it is, and it won't be asked again.");
}

export async function askAgain(form: FormData) {
  await requireAdmin();
  const { store, storeId, back } = parse(form);
  await reopen(store, storeId);
  go(back, "ok", "Back in the queue.");
}
