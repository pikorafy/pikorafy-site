import { NextRequest, NextResponse } from "next/server";
import { getSlugForSteamApp } from "@/lib/catalog";

// /steam/<appId>?cs=<cheapsharkGameId>
// Deal grids (client-side CheapShark data) link here: go to our catalog page when
// we have the game, otherwise fall back to the legacy CheapShark page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const cs = req.nextUrl.searchParams.get("cs");
  const slug = /^\d+$/.test(appId) ? await getSlugForSteamApp(Number(appId)) : null;

  const target = slug ? `/game/${slug}` : cs && /^\d+$/.test(cs) ? `/game/${cs}` : "/games";
  return NextResponse.redirect(new URL(target, req.url), 307);
}
