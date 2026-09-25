"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { KeyArt, SteamScreenshot, SteamTrailer } from "@/lib/catalog";

type Item =
  | { kind: "art"; art: KeyArt }
  | { kind: "trailer"; trailer: SteamTrailer }
  | { kind: "shot"; shot: SteamScreenshot };

// Steam-style media viewer: a large stage plus a thumbnail strip. Trailers are
// HLS streams (Steam's or the Xbox Store's CDN); hls.js is only downloaded when
// one is played. `source` is where to send people when a stream can't play.
export default function GameMedia({
  name,
  source,
  trailers,
  screenshots,
  keyArt = null,
  inHero = false,
}: {
  name: string;
  /** Title key art shown as the first slide, before trailers and screenshots. */
  keyArt?: KeyArt | null;
  /** Rendered inside the page hero (no top margin). */
  inHero?: boolean;
  source: { label: string; url: string };
  trailers: SteamTrailer[];
  screenshots: SteamScreenshot[];
}) {
  const items: Item[] = [
    ...(keyArt ? [{ kind: "art" as const, art: keyArt }] : []),
    ...trailers.map((trailer) => ({ kind: "trailer" as const, trailer })),
    ...screenshots.map((shot) => ({ kind: "shot" as const, shot })),
  ];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);   // item index

  const select = useCallback((i: number) => {
    setIndex((i + items.length) % items.length);
    setPlaying(false);
  }, [items.length]);
  const openLightbox = (i: number) => { setPlaying(false); setLightboxAt(i); };

  if (items.length === 0) return null;
  const current = items[index];

  return (
    <section aria-label={`${name} trailers and screenshots`} style={{ marginTop: inHero ? 0 : 40 }}>
      <div
        className="media-stage"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") select(index + 1);
          if (e.key === "ArrowLeft") select(index - 1);
        }}
      >
        {current.kind === "trailer" ? (
          playing ? (
            <TrailerPlayer key={current.trailer.id} trailer={current.trailer} source={source} />
          ) : (
            <button type="button" className="media-play" onClick={() => setPlaying(true)} aria-label={`Play ${current.trailer.name}`}>
              <TrailerPoster key={current.trailer.id} thumb={current.trailer.thumb} />
              <span className="media-play-icon" aria-hidden>▶</span>
              <span className="media-caption">{current.trailer.name}</span>
            </button>
          )
        ) : (
          <button type="button" className="media-play" onClick={() => openLightbox(index)} aria-label="View full screen">
            {current.kind === "art"
              ? <KeyArtSlide art={current.art} name={name} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={current.shot.full} alt={labelOf(items, index, name)} />}
          </button>
        )}
        <button type="button" className="media-expand" onClick={() => openLightbox(index)} aria-label="Open full screen" title="Full screen">⤢</button>
        {items.length > 1 && (
          <>
            <button type="button" className="media-nav prev" onClick={() => select(index - 1)} aria-label="Previous">‹</button>
            <button type="button" className="media-nav next" onClick={() => select(index + 1)} aria-label="Next">›</button>
          </>
        )}
      </div>

      <div className="media-strip" role="list">
        {items.map((item, i) => (
          <button
            key={keyOf(item, i)}
            type="button"
            role="listitem"
            className="media-thumb"
            aria-current={i === index}
            aria-label={labelOf(items, i, name)}
            onClick={() => select(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbOf(item)} alt="" loading="lazy" />
            {item.kind === "trailer" && <span className="media-thumb-play" aria-hidden>▶</span>}
          </button>
        ))}
      </div>

      {lightboxAt !== null && (
        <Lightbox
          items={items}
          start={lightboxAt}
          name={name}
          source={source}
          onClose={(last) => { setLightboxAt(null); select(last); }}
        />
      )}
    </section>
  );
}

const keyOf = (item: Item, i: number) => (item.kind === "trailer" ? `t${item.trailer.id}` : `${item.kind}${i}`);

function thumbOf(item: Item): string {
  return item.kind === "art" ? thumbFor(item.art) : item.kind === "trailer" ? item.trailer.thumb : item.shot.thumb;
}

/** "ELDEN RING key art", the trailer's name, or "Screenshot 3". */
function labelOf(items: Item[], i: number, name: string): string {
  const item = items[i];
  if (item.kind === "art") return `${name} key art`;
  if (item.kind === "trailer") return item.trailer.name;
  const firstShot = items.findIndex((it) => it.kind === "shot");
  return `${name} screenshot ${i - firstShot + 1}`;
}

/** Smallest title art for the thumbnail strip (the header is last in the chain). */
function thumbFor(art: KeyArt): string {
  return art.fallbacks[art.fallbacks.length - 1] ?? art.src;
}

/**
 * Title key art. Flat art (capsule / header) is shown whole over a blurred copy of
 * itself, so any aspect ratio fits the 16:9 stage without cropping the title. Hero
 * art is shown full-bleed with the game's logo laid over it, like Steam's library.
 * Any image that fails to load drops to the next source.
 */
function KeyArtSlide({ art, name }: { art: KeyArt; name: string }) {
  const chain = art.logo ? art.fallbacks : [art.src, ...art.fallbacks];
  const [step, setStep] = useState(art.logo ? -1 : 0);   // -1 = hero + logo
  const next = () => setStep((s) => s + 1);

  if (step === -1) {
    return (
      <div className="media-keyart hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src={art.src} alt="" onError={next} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src={art.logo} alt={`${name} key art`} onError={next} />
      </div>
    );
  }
  const src = chain[step];
  if (!src) return null;
  return (
    <div className="media-keyart">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="blur" src={src} alt="" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={src} className="fg" src={src} alt={`${name} key art`} onError={next} />
    </div>
  );
}

/**
 * Each trailer's own poster. Steam's listed thumbnail is only 293x165, so try the
 * full-size frame (movie_max.jpg, same folder) first and fall back to the small one.
 */
function TrailerPoster({ thumb }: { thumb: string }) {
  const large = thumb.replace(/movie\.\d+x\d+\.jpg/, "movie_max.jpg");
  const [src, setSrc] = useState(large);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" onError={() => { if (src !== thumb) setSrc(thumb); }} />
  );
}

function TrailerPlayer({ trailer, source }: { trailer: SteamTrailer; source: { label: string; url: string } }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(!trailer.hls);

  useEffect(() => {
    const video = ref.current;
    if (!video || !trailer.hls) return;
    let destroy: (() => void) | undefined;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = trailer.hls;           // Safari / iOS play HLS natively
      video.play().catch(() => {});
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) return setFailed(true);
        const hls = new Hls();
        hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) setFailed(true); });
        hls.loadSource(trailer.hls!);
        hls.attachMedia(video);
        video.play().catch(() => {});
        destroy = () => hls.destroy();
      }).catch(() => setFailed(true));
    }
    return () => destroy?.();
  }, [trailer.hls]);

  if (failed) {
    return (
      <div className="media-fallback">
        <p>This trailer can’t play here.</p>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          Watch on {source.label} →
        </a>
      </div>
    );
  }
  return <video ref={ref} controls playsInline onError={() => setFailed(true)} aria-label={trailer.name} />;
}

/**
 * Full-screen viewer for the whole gallery: key art, trailers (played in place)
 * and screenshots. Rendered into <body> through a portal so no ancestor's stacking
 * context, overflow or transform can clip it or paint over it.
 */
function Lightbox({ items, start, name, source, onClose }: {
  items: Item[];
  start: number;
  name: string;
  source: { label: string; url: string };
  onClose: (last: number) => void;
}) {
  const [i, setI] = useState(start);
  // Opening full screen on a trailer means "watch it": start playing straight away.
  const [playing, setPlaying] = useState(items[start].kind === "trailer");
  const touchX = useRef<number | null>(null);
  const count = items.length;
  const item = items[i];
  const go = useCallback((d: number) => { setI((n) => (n + d + count) % count); setPlaying(false); }, [count]);
  const close = useCallback(() => onClose(i), [onClose, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.target instanceof HTMLVideoElement) return;    // let the player seek with the arrows
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [close, go]);

  // Warm the cache for neighbouring screenshots so paging feels instant.
  useEffect(() => {
    for (const d of [-1, 1]) {
      const n = items[(i + d + count) % count];
      if (n.kind === "shot") new Image().src = n.shot.full;
    }
  }, [i, items, count]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return createPortal(
    <div
      className="media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} media`}
      onClick={close}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="lb-top" onClick={stop}>
        <span className="lb-count">{i + 1} / {count}</span>
        <span className="lb-title">{item.kind === "trailer" ? `${name} · ${item.trailer.name}` : name}</span>
        <button type="button" className="lb-close" onClick={close} aria-label="Close">✕</button>
      </div>

      <div className="lb-stage">
        {item.kind === "shot" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.shot.full} className="lb-image" src={item.shot.full} alt={labelOf(items, i, name)} onClick={stop} />
        ) : (
          <div className="media-stage lb-media" onClick={stop}>
            {item.kind === "art" ? (
              <KeyArtSlide art={item.art} name={name} />
            ) : playing ? (
              <TrailerPlayer key={item.trailer.id} trailer={item.trailer} source={source} />
            ) : (
              <button type="button" className="media-play" onClick={() => setPlaying(true)} aria-label={`Play ${item.trailer.name}`}>
                <TrailerPoster key={item.trailer.id} thumb={item.trailer.thumb} />
                <span className="media-play-icon" aria-hidden>▶</span>
              </button>
            )}
          </div>
        )}
        {count > 1 && (
          <>
            <button type="button" className="lb-nav prev" onClick={(e) => { stop(e); go(-1); }} aria-label="Previous">‹</button>
            <button type="button" className="lb-nav next" onClick={(e) => { stop(e); go(1); }} aria-label="Next">›</button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="lb-strip" onClick={stop}>
          {items.map((it, n) => (
            <button key={keyOf(it, n)} type="button" className="lb-thumb" aria-current={n === i} aria-label={labelOf(items, n, name)} onClick={() => { setI(n); setPlaying(false); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbOf(it)} alt="" loading="lazy" />
              {it.kind === "trailer" && <span className="media-thumb-play" aria-hidden>▶</span>}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
