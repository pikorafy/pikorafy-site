"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Deals", href: "/deals" },
  { label: "Browse", href: "/browse" },
  { label: "Stores", href: "/stores" },
  { label: "Compare", href: "/vs" },
  { label: "Blog", href: "/blog" },
  { label: "API", href: "/api-docs" },
];

export default function PikorafyNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("pkfy:theme");
    if (stored === "light") {
      setDark(false);
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("pkfy:theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const inp = document.querySelector<HTMLInputElement>(".searchbar input");
        if (inp) { inp.focus(); inp.select(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          {/* Brand */}
          <Link href="/" className="brand">
            <span className="brand-dot" />
            PIKORAFY
          </Link>

          {/* Desktop nav links */}
          <nav className="nav-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right tools */}
          <div className="nav-tools">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {dark ? "☾" : "☀"}
            </button>
            <Link href="/deals" className="icon-btn" title="Wishlist" style={{ display: "grid" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7-4.5-9.5-9C.7 8.5 2.5 4.5 6.5 4c2.2 0 3.7 1.2 5.5 3.2C13.8 5.2 15.3 4 17.5 4c4 .5 5.8 4.5 4 8-2.5 4.5-9.5 9-9.5 9z" />
              </svg>
            </Link>
            <Link href="/deals" className="btn btn-primary">
              Get Deals
            </Link>
            {/* Mobile hamburger */}
            <button
              className="nav-mobile-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <nav className={`nav-mobile-menu ${mobileOpen ? "open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
