"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// Home hero: the day's top deals, one slide at a time. Advances every 7 seconds unless the
// pointer or keyboard focus is on it, or the viewer prefers reduced motion.

export interface HeroSlide {
  slug: string;
  name: string;
  art: string | null;
  cover: string | null;
  genres: string[];
  platforms: { key: string; label: string }[];
  price: string;
  regular: string | null;
  discount: number;
  store: string;
}

const INTERVAL_MS = 7000;

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  if (!count) return null;
  return (
    <section
      className="hc"
      aria-roledescription="carousel"
      aria-label="Top deals"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div key={s.slug} className="hc-slide" aria-roledescription="slide" aria-label={`${i + 1} of ${count}: ${s.name}`} hidden={i !== index}>
          {s.art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hc-art" src={s.art} alt="" aria-hidden loading={i === 0 ? "eager" : "lazy"} />
          )}
          <div className="hc-body">
            <div className="hc-main">
              <div className="hc-eyebrow">Top deal · {s.store}</div>
              <h2 className="hc-title">{s.name}</h2>
              {s.genres.length > 0 && <div className="hc-meta">{s.genres.slice(0, 3).join(" · ")}</div>}
              <div className="hc-platforms">
                {s.platforms.map((p) => <span key={p.key} className={`hc-platform pf-${p.key}`}><i aria-hidden />{p.label}</span>)}
              </div>
              <div className="hc-deal">
                <span className="hm-price hc-big num">{s.price}</span>
                <span className="hm-pill">-{s.discount}%</span>
                {s.regular && <s className="num">{s.regular}</s>}
              </div>
              <Link href={`/game/${s.slug}`} className="pp-btn pp-btn-primary hc-cta">Compare all offers</Link>
            </div>
            {s.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hc-cover" src={s.cover} alt={`${s.name} cover`} loading={i === 0 ? "eager" : "lazy"} />
            )}
          </div>
        </div>
      ))}
      {count > 1 && (
        <div className="hc-nav">
          <button className="hc-arrow" onClick={() => go(index - 1)} aria-label="Previous deal">‹</button>
          <div className="hc-dots">
            {slides.map((s, i) => (
              <button key={s.slug} className="hc-dot" aria-label={`Show ${s.name}`} aria-current={i === index ? "true" : undefined} onClick={() => go(i)} />
            ))}
          </div>
          <button className="hc-arrow" onClick={() => go(index + 1)} aria-label="Next deal">›</button>
        </div>
      )}
    </section>
  );
}
