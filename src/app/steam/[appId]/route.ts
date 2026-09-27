import { NextRequest, NextResponse } from "next/server";
import { getSlugForSteamApp } from "@/lib/catalog";

// /steam/<appId>: our page for a Steam app id when we have the game, otherwise the game's
// Steam store page (calendar games are queued for import, so this is temporary for them).
export async function GET(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const slug = /^\d+$/.test(appId) ? await getSlugForSteamApp(Number(appId)) : null;

  if (slug) return NextResponse.redirect(new URL(`/game/${slug}`, req.url), 307);
  if (/^\d+$/.test(appId)) return NextResponse.redirect(`https://store.steampowered.com/app/${appId}/`, 307);
  return NextResponse.redirect(new URL("/games", req.url), 307);
}
