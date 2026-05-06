import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import ToolLogo from "@/components/ToolLogo";
import HeroSection from "@/components/HeroSection";
import TopDealsSection from "@/components/TopDealsSection";
import TrendingSection from "@/components/TrendingSection";
import NewReleasesSection from "@/components/NewReleasesSection";
import UpcomingSection from "@/components/UpcomingSection";
import FreeGamesSection from "@/components/FreeGamesSection";
import InstantGamingBanner from "@/components/InstantGamingBanner";

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
  [
    "Can I compare subscriptions too?",
    "Yes — our /vs section lets you compare Xbox Game Pass vs PS Plus, key store pricing, and more. Use it to find the best value for your setup.",
  ],
];

export default async function Home() {
  const comparisons = getAllComparisons().slice(0, 6);
  const articles = getAllArticles().slice(0, 4);

  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Hero ─── */}
      <HeroSection />

      {/* ─── Top Deals ─── */}
      <TopDealsSection />

      {/* ─── Trending ─── */}
      <TrendingSection />

      {/* ─── New Releases ─── */}
      <NewReleasesSection />

      {/* ─── Upcoming ─── */}
      <UpcomingSection />

      {/* ─── Free This Week ─── */}
      <FreeGamesSection />

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

      {/* ─── Comparisons ─── */}
      {comparisons.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="shell">
            <div className="section-hd">
              <div>
                <div className="eyebrow">Compare · side-by-side</div>
                <h2 className="h2">
                  Don&rsquo;t guess.<br /><em>Compare.</em>
                </h2>
              </div>
              <Link href="/vs" className="btn btn-ghost">All comparisons →</Link>
            </div>
            <div style={{ display: "grid", gap: "var(--gap)", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {comparisons.map((comp) => (
                <Link
                  key={comp.frontmatter.slug}
                  href={`/vs/${comp.frontmatter.slug}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 16, padding: "16px 18px", background: "var(--bg-elev)",
                    border: "1px solid var(--line)", borderRadius: "var(--r)",
                    transition: "border-color .15s, transform .15s",
                  }}
                  className="comp-card"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ToolLogo name={comp.frontmatter.toolA} size={22} />
                    <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)" }}>vs</span>
                    <ToolLogo name={comp.frontmatter.toolB} size={22} />
                  </div>
                  <span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 14, flex: 1 }}>
                    {comp.frontmatter.toolA} vs {comp.frontmatter.toolB}
                  </span>
                  <span style={{ fontFamily: "var(--ff-mono)", fontSize: 12, color: "var(--accent)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Latest Articles ─── */}
      {articles.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="shell">
            <div className="section-hd">
              <div>
                <div className="eyebrow">Articles · latest from the blog</div>
                <h2 className="h2">
                  Read before<br />you <em>buy</em>.
                </h2>
              </div>
              <Link href="/blog" className="btn btn-ghost">All articles →</Link>
            </div>
            <div style={{ display: "grid", gap: "var(--gap)", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {articles.map((article) => (
                <Link
                  key={article.frontmatter.slug}
                  href={`/blog/${article.frontmatter.slug}`}
                  className="article-card"
                  style={{
                    display: "flex", flexDirection: "column", gap: 10,
                    padding: "var(--pad-card)", background: "var(--bg-elev)",
                    border: "1px solid var(--line)", borderRadius: "var(--r)",
                    transition: "border-color .15s, transform .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--accent)",
                      textTransform: "uppercase", letterSpacing: "0.12em",
                      padding: "2px 6px", border: "1px solid var(--accent)", borderRadius: 3,
                    }}>
                      {article.frontmatter.category}
                    </span>
                    <time style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)" }}>
                      {new Date(article.frontmatter.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </time>
                  </div>
                  <h3 style={{
                    fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 15,
                    letterSpacing: "-0.01em", margin: 0, lineHeight: 1.3,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {article.frontmatter.title}
                  </h3>
                  <span style={{
                    marginTop: "auto", fontFamily: "var(--ff-mono)", fontSize: 11,
                    color: "var(--accent)", letterSpacing: "0.08em",
                  }}>
                    Read more →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
