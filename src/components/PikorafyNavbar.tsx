"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteSearch from "@/components/SiteSearch";

// One row: logo · platforms (each with a dropdown of its listing pages) and a few site-wide
// links · search · tools. On phones the search wraps under the logo and the platforms move
// into the menu.

interface Menu {
  key: string;
  label: string;
  mark: string;        // letters on the small platform square
  href: string;
  links: { label: string; href: string; note?: string }[];
}

const PLATFORMS: Menu[] = [
  {
    key: "pc", label: "PC", mark: "PC", href: "/games",
    links: [
      { label: "Top games", href: "/games" },
      { label: "Deals", href: "/games?sale=1&sort=discount" },
      { label: "New releases", href: "/releases?platform=pc" },
    ],
  },
  {
    key: "playstation", label: "PlayStation", mark: "PS", href: "/playstation",
    links: [
      { label: "PS5 games", href: "/playstation?platform=ps5" },
      { label: "PS4 games", href: "/playstation?platform=ps4" },
      { label: "In PS Plus", href: "/playstation?plus=1", note: "subscription" },
      { label: "Deals", href: "/playstation?sale=1&sort=discount" },
      { label: "New releases", href: "/releases?platform=playstation" },
    ],
  },
  {
    key: "xbox", label: "Xbox", mark: "X", href: "/xbox",
    links: [
      { label: "Xbox Series X|S games", href: "/xbox?platform=series" },
      { label: "Xbox One games", href: "/xbox?platform=one" },
      { label: "In Game Pass", href: "/xbox?gamepass=1", note: "subscription" },
      { label: "Deals", href: "/xbox?sale=1&sort=discount" },
      { label: "New releases", href: "/releases?platform=xbox" },
    ],
  },
  {
    key: "nintendo", label: "Nintendo", mark: "N", href: "/nintendo",
    links: [
      { label: "Switch 2 games", href: "/nintendo?platform=switch2" },
      { label: "Switch games", href: "/nintendo?platform=switch" },
      { label: "Deals", href: "/nintendo?sale=1&sort=discount" },
      { label: "New releases", href: "/releases?platform=switch" },
    ],
  },
];

const SITE_LINKS = [
  { label: "Deals", href: "/games?sale=1&sort=discount" },
  { label: "Releases", href: "/releases" },
  { label: "Stores", href: "/stores" },
];

function subscribeTheme(onChange: () => void) {
  window.addEventListener("pkfy:theme", onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener("pkfy:theme", onChange); window.removeEventListener("storage", onChange); };
}
function readTheme(): "dark" | "light" {
  try { return localStorage.getItem("pkfy:theme") === "light" ? "light" : "dark"; } catch { return "dark"; }
}

export default function PikorafyNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const platformsRef = useRef<HTMLDivElement>(null);

  // Close menus when the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMenu(null);
  }

  // The theme lives in localStorage; the page applies it to <html data-theme>.
  const dark = useSyncExternalStore(subscribeTheme, () => readTheme() === "dark", () => true);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const toggleTheme = () => {
    try { localStorage.setItem("pkfy:theme", dark ? "light" : "dark"); } catch { /* storage blocked */ }
    window.dispatchEvent(new Event("pkfy:theme"));
  };

  // ⌘K / Ctrl+K focuses the search; Esc and clicks elsewhere close a platform dropdown.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.current?.focus();
        searchInput.current?.select();
      }
      if (e.key === "Escape") setMenu(null);
    };
    const onClick = (e: MouseEvent) => {
      if (platformsRef.current && !platformsRef.current.contains(e.target as Node)) setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, []);

  const section = PLATFORMS.find((p) => pathname === p.href || pathname.startsWith(`${p.href}/`))?.key;

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-dot" />
          PIKORAFY
        </Link>

        {/* Platforms with their dropdowns, then site-wide links */}
        <div className="nav-platforms" ref={platformsRef}>
          {PLATFORMS.map((p) => (
            <div key={p.key} className="nav-menu" onMouseEnter={() => setMenu(p.key)} onMouseLeave={() => setMenu((m) => (m === p.key ? null : m))}>
              <button
                className={`nav-menu-btn pf-${p.key}`}
                aria-expanded={menu === p.key}
                aria-controls={`nav-menu-${p.key}`}
                aria-current={section === p.key ? "true" : undefined}
                onClick={() => setMenu((m) => (m === p.key ? null : p.key))}
              >
                <span className="nav-pf" aria-hidden="true">{p.mark}</span>
                {p.label}
                <svg className="nav-chev" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <div id={`nav-menu-${p.key}`} className="nav-drop" hidden={menu !== p.key}>
                <Link href={p.href} className="nav-drop-all">All {p.label} games</Link>
                {p.links.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}{l.note && <small>{l.note}</small>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <span className="nav-sep" aria-hidden="true" />
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" aria-current={pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-search">
          <SiteSearch inputRef={searchInput} />
        </div>

        <div className="nav-tools">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {dark ? "☾" : "☀"}
          </button>
          <Link href="/games?sale=1&sort=discount" className="icon-btn" title="Wishlist" aria-label="Wishlist">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 21s-7-4.5-9.5-9C.7 8.5 2.5 4.5 6.5 4c2.2 0 3.7 1.2 5.5 3.2C13.8 5.2 15.3 4 17.5 4c4 .5 5.8 4.5 4 8-2.5 4.5-9.5 9-9.5 9z" />
            </svg>
          </Link>
          <button className="icon-btn nav-mobile-toggle" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Phones: platforms and their pages as a list */}
      <nav className={`nav-mobile-menu${mobileOpen ? " open" : ""}`} aria-label="Menu">
        {PLATFORMS.map((p) => (
          <div key={p.key} className="nav-mobile-group">
            <Link href={p.href} className={`nav-mobile-head pf-${p.key}`} onClick={() => setMobileOpen(false)}>
              <span className="nav-pf" aria-hidden="true">{p.mark}</span>{p.label}
            </Link>
            <div className="nav-mobile-links">
              {p.links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</Link>
              ))}
            </div>
          </div>
        ))}
        <div className="nav-mobile-group">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-mobile-head" onClick={() => setMobileOpen(false)}>{l.label}</Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
