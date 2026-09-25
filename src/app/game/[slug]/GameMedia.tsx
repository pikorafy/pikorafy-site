"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [lightbox, setLightbox] = useState(false);

  const select = useCallback((i: number) => {
    setIndex((i + items.length) % items.length);
    setPlaying(false);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[index];
  const shotOffset = (keyArt ? 1 : 0) + trailers.length;

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
        {current.kind === "art" ? (
          <KeyArtSlide art={current.art} name={name} />
        ) : current.kind === "trailer" ? (
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
          <button type="button" className="media-play" onClick={() => setLightbox(true)} aria-label="View screenshot full size">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.shot.full} alt={`${name} screenshot ${index - shotOffset + 1}`} />
          </button>
        )}
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
            key={item.kind === "trailer" ? `t${item.trailer.id}` : `${item.kind}${i}`}
            type="button"
            role="listitem"
            className="media-thumb"
            aria-current={i === index}
            aria-label={item.kind === "art" ? `${name} key art` : item.kind === "trailer" ? item.trailer.name : `Screenshot ${i - shotOffset + 1}`}
            onClick={() => select(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.kind === "art" ? thumbFor(item.art) : item.kind === "trailer" ? item.trailer.thumb : item.shot.thumb} alt="" loading="lazy" />
            {item.kind === "trailer" && <span className="media-thumb-play" aria-hidden>▶</span>}
          </button>
        ))}
      </div>

      {lightbox && current.kind === "shot" && (
        <Lightbox
          src={current.shot.full}
          alt={`${name} screenshot`}
          onClose={() => setLightbox(false)}
          onPrev={() => select(index - 1)}
          onNext={() => select(index + 1)}
        />
      )}
    </section>
  );
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

function Lightbox({ src, alt, onClose, onPrev, onNext }: {
  src: string; alt: string; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div className="media-lightbox" role="dialog" aria-modal="true" aria-label="Screenshot viewer" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="media-nav prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous">‹</button>
      <button type="button" className="media-nav next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next">›</button>
      <button type="button" className="media-close" onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
}
