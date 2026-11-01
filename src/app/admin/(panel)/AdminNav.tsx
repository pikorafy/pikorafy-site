"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  catalog: <path d="M4 5h16M4 12h16M4 19h10" />,
  review: <><path d="M9 11l3 3 8-8" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></>,
  jobs: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  prices: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  content: <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  stores: <><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
};

// Live sections link; the rest show what's coming.
const ITEMS: { key: string; label: string; href?: string }[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "catalog", label: "Catalog", href: "/admin/catalog" },
  { key: "review", label: "Review queue", href: "/admin/review" },
  { key: "jobs", label: "Jobs", href: "/admin/jobs" },
  { key: "prices", label: "Prices" },
  { key: "content", label: "Content" },
  { key: "stores", label: "Stores & partners" },
  { key: "settings", label: "Settings" },
];

function Icon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ flex: "none" }}>
      {ICONS[name]}
    </svg>
  );
}

export default function AdminNav({ reviewCount = 0 }: { reviewCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Admin">
      {ITEMS.map((item) => {
        if (!item.href) {
          return <span key={item.key} className="soon"><Icon name={item.key} />{item.label}<small>soon</small></span>;
        }
        const current = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.key} href={item.href} aria-current={current ? "page" : undefined}>
            <Icon name={item.key} />{item.label}
            {item.key === "review" && reviewCount > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, background: "var(--a-warn-bg)", color: "var(--a-warn)", padding: "2px 8px", borderRadius: 999 }}>
                {reviewCount.toLocaleString("en-US")}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
