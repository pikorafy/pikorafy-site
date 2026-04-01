import type { Metadata } from "next";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import DealsGrid from "@/components/DealsGrid";

export const metadata: Metadata = {
  title: "Today's Best Game Deals — Up to 95% Off",
  description:
    "Find the best PC game deals right now. Compare prices across Steam, GOG, Epic, Humble, Fanatical and more. Updated hourly.",
  openGraph: {
    title: "Today's Best Game Deals | Pikorafy",
    description: "Compare PC game prices across 30+ stores. Find deals up to 95% off.",
  },
};

export default function DealsPage() {
  return (
    <div className="bg-[#0f1117] min-h-screen">
      {/* Header */}
      <section className="border-b border-[#2a2e3a]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Best Game Deals</h1>
            <span className="rounded-full bg-red-500/15 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold uppercase text-red-400 animate-pulse">
              Live
            </span>
          </div>
          <p className="text-[#8b8fa3] max-w-2xl">
            Compare prices across 30+ stores. Sorted by deal quality — best value first. Updated hourly.
          </p>
          <p className="mt-2 text-xs text-[#8b8fa3]/60">{AFFILIATE_DISCLOSURE_SHORT}</p>
        </div>
      </section>

      {/* Deals grid — fetched client-side to avoid CheapShark blocking Vercel IPs */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <DealsGrid sortBy="Deal Rating" pageSize={60} metacritic={50} columns="5" />
      </section>
    </div>
  );
}
