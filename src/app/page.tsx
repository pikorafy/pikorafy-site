import type { Metadata } from "next";
import Link from "next/link";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import HeroSection from "@/components/HeroSection";
import { getSiteStats } from "@/lib/catalog";
import HomeTopLists from "@/components/HomeTopLists";
import InstantGamingBanner from "@/components/InstantGamingBanner";

// Top lists come from the catalog; refresh at most hourly (the importers run hourly).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pikorafy — Game Key Price Comparison",
  description:
    "Find the cheapest game keys across 40+ stores. Real-time price tracking, deal alerts, and trust scores so you never overpay again.",
};

const TRUSTED_STORES = [
  { name: "Steam",            short: "STM", trust: 99 },
  { name: "GOG",              short: "GOG", trust: 98 },
  { name: "Epic Games",       short: "EPC", trust: 97 },
  { name: "Humble",           short: "HMB", trust: 95 },
  { name: "Fanatical",        short: "FNT", trust: 94 },
  { name: "Green Man Gaming", short: "GMG", trust: 93 },
  { name: "GameBillet",       short: "GMB", trust: 88 },
  { name: "IndieGala",        short: "IGL", trust: 84 },
  { name: "Voidu",            short: "VDU", trust: 82 },
  { name: "Kinguin",          short: "KIN", trust: 70 },
  { name: "G2A",              short: "G2A", trust: 65 },
];

const FAQ_ITEMS = [
  [
    "Are the stores you list actually safe?",
    "Every store goes through our trust audit — chargeback rate, regional licensing, response time, refund policy. Anything below 70 trust is flagged in red and pushed to the bottom of every list. We never accept paid placement.",
  ],
  [
    "How often do prices update?",
    "Live indexes (Steam, GOG, Epic) refresh every 14 seconds via the CheapShark API. You're looking at a price that's at most a few minutes old.",
  ],
  [
    "What's the difference between a key and a direct purchase?",
    "A \"key\" is a code you redeem on Steam, GOG, or another launcher. A direct purchase adds the game to your store library. Keys are usually cheaper but tied to a specific platform — we label every offer so there are no surprises.",
  ],
  [
    "Do you make money from this?",
    "A small affiliate commission on some retailers, fully disclosed. Affiliate status never affects ranking — the cheapest legit price always shows first.",
  ],
];

export default async function Home() {
  const stats = await getSiteStats();
  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Hero ─── */}
      <HeroSection stats={stats} />

      {/* ─── Top 10s (most played, recent releases) and genre top 5s ─── */}
      <HomeTopLists />

      {/* ─── Price Drop Alerts CTA ─── */}
      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="cta-band">
            <div>
              <div className="eyebrow">● Price drop alerts</div>
              <h3>
                Wait for the price to <em>break.</em><br />
                We&rsquo;ll ping you the second it does.
              </h3>
              <p>
                Set a target price on any title — Pikorafy emails you the moment any tracked store
                drops below it. Average wait: 18 days. Average savings: 64% off MSRP.
              </p>
            </div>
            <form className="cta-form" action="#">
              <input type="email" placeholder="you@inbox.com" required />
              <button type="submit">Track →</button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Instant Gaming Partner Banner ─── */}
      <section style={{ paddingBottom: "var(--pad-sec)" }}>
        <div className="shell">
          <InstantGamingBanner />
        </div>
      </section>

      {/* ─── Trusted Stores ─── */}
      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="section-hd">
            <div>
              <div className="eyebrow">Stores · we compare</div>
              <h2 className="h2">
                47 stores. <em>One</em> ranking.<br />
                Trust score, never paid placement.
              </h2>
            </div>
            <Link href="/stores" className="btn btn-ghost">View all stores →</Link>
          </div>
          <div className="stores-band">
            {TRUSTED_STORES.map((s) => (
              <div key={s.name} className="store-tile">
                <div className="sn">{s.name}</div>
                <div className="stt">
                  <span style={{ fontFamily: "var(--ff-mono)" }}>{s.short}</span>
                  <span>·</span>
                  <span>trust {s.trust}</span>
                </div>
                <div className={`trust-bar${s.trust < 75 ? " bad" : ""}`}>
                  <div style={{ width: `${s.trust}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Newsletter ─── */}
      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="newsletter-band">
            <div>
              <div className="eyebrow">The Drop · weekly digest</div>
              <h2 className="h2">
                One email.<br />The week&rsquo;s <em>best 10</em> deals.
              </h2>
              <p className="sub" style={{ marginTop: 12 }}>
                Every Friday, hand-curated. No spam, no affiliate-stuffing.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <form className="newsletter-form" action="#">
                <input type="email" placeholder="you@inbox.com" />
                <button className="btn btn-primary" type="submit">Subscribe →</button>
              </form>
              <div className="newsletter-meta">
                <span>✓ No spam</span>
                <span>✓ Unsubscribe any time</span>
              </div>
            </div>
          </div>
          <p style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 20, letterSpacing: "0.06em" }}>
            {AFFILIATE_DISCLOSURE_SHORT}
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="section-hd">
            <div>
              <div className="eyebrow">FAQ · the honest version</div>
              <h2 className="h2">
                Questions we<br />answer <em>without dodging</em>.
              </h2>
            </div>
          </div>
          <div className="faq">
            {FAQ_ITEMS.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>
                  {q}
                  <span className="plus">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
