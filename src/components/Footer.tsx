import Link from "next/link";

const COLS = [
  {
    label: "Browse",
    links: [
      { name: "All Deals", href: "/deals" },
      { name: "Top Discounts", href: "/deals?sort=savings" },
      { name: "New Releases", href: "/gaming#new" },
      { name: "Upcoming", href: "/gaming#upcoming" },
      { name: "Free Games", href: "/gaming#free" },
    ],
  },
  {
    label: "Compare",
    links: [
      { name: "All Comparisons", href: "/vs" },
      { name: "Alternatives", href: "/alternatives" },
      { name: "Game Pass vs PS Plus", href: "/vs/xbox-game-pass-vs-ps-plus" },
      { name: "DLSS vs FSR", href: "/vs/dlss-4-vs-fsr-4" },
      { name: "Key Stores", href: "/vs/eneba-vs-g2a-vs-kinguin" },
    ],
  },
  {
    label: "Content",
    links: [
      { name: "Blog", href: "/blog" },
      { name: "Gaming Hub", href: "/gaming" },
      { name: "AI Quiz", href: "/quiz" },
      { name: "Cloud Gaming", href: "/blog/best-game-streaming-services-2026" },
      { name: "Gaming VPNs", href: "/blog/best-gaming-vpns-2026" },
    ],
  },
  {
    label: "Pikorafy",
    links: [
      { name: "Stores", href: "/stores" },
      { name: "About", href: "#" },
      { name: "Press Kit", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Report a Deal", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer shell">
      <div className="footer-grid">
        {/* Brand col */}
        <div>
          <Link href="/" className="brand" style={{ marginBottom: 14, display: "inline-flex" }}>
            <span className="brand-dot" />
            PIKORAFY
          </Link>
          <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: "38ch", margin: "14px 0 0", lineHeight: 1.6 }}>
            We compare keys, codes, and Steam prices across 40+ trusted stores. No affiliate fluff — just the cheapest, safest deal at the top.
          </p>
          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <a
              href="https://twitter.com/pikorafy"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              title="Twitter / X"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Link cols */}
        {COLS.map((col) => (
          <div key={col.label}>
            <h5>{col.label}</h5>
            <ul>
              {col.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bot">
        <span>© {new Date().getFullYear()} Pikorafy · Independent · No affiliate boost</span>
        <span>Prices from 40+ stores · Some links earn a small commission</span>
      </div>
    </footer>
  );
}
