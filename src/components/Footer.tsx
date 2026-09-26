import Link from "next/link";

const COLS = [
  {
    label: "Games",
    links: [
      { name: "All Games", href: "/games" },
      { name: "Biggest Discounts", href: "/games?sort=discount" },
      { name: "Best Reviewed", href: "/games?sort=reviews" },
      { name: "Free to Play", href: "/games/free-to-play" },
      { name: "Early Access", href: "/games/early-access" },
    ],
  },
  {
    label: "Genres",
    links: [
      { name: "Action", href: "/games/action" },
      { name: "RPG", href: "/games/rpg" },
      { name: "Strategy", href: "/games/strategy" },
      { name: "Adventure", href: "/games/adventure" },
      { name: "Simulation", href: "/games/simulation" },
    ],
  },
  {
    label: "Consoles & Deals",
    links: [
      { name: "Xbox Games", href: "/xbox" },
      { name: "Xbox on Sale", href: "/xbox?sort=discount" },
      { name: "In Game Pass", href: "/xbox?gamepass=1" },
      { name: "PlayStation Games", href: "/playstation" },
      { name: "In PS Plus", href: "/playstation?plus=1" },
      { name: "Nintendo Switch Games", href: "/nintendo" },
      { name: "Switch on Sale", href: "/nintendo?sale=1&sort=discount" },
      { name: "All Deals", href: "/deals" },
      { name: "Browse Deals", href: "/browse" },
    ],
  },
  {
    label: "Pikorafy",
    links: [
      { name: "Stores", href: "/stores" },
      { name: "API", href: "/api-docs" },
      { name: "About", href: "#" },
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
