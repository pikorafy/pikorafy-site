import { NextRequest, NextResponse } from "next/server";
import { getSlugForSteamApp } from "@/lib/catalog";

// /steam/<appId>: our page for a Steam app id when we have the game, otherwise /games.
// (Older deal links pointed here.)
export async function GET(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const slug = /^\d+$/.test(appId) ? await getSlugForSteamApp(Number(appId)) : null;

  const target = slug ? `/game/${slug}` : "/games";
  return NextResponse.redirect(new URL(target, req.url), 307);
}
