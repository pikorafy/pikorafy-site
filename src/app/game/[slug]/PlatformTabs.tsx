"use client";

import { useSyncExternalStore } from "react";

// Platform tabs on the shared game page. Every panel is rendered on the server (search
// engines and the cache see all offers); the tabs only switch which one shows, and keep
// the choice in the URL hash (#pc, #playstation, #xbox, #switch) so links and the old
// store pages' redirects can open a platform directly.

export interface PlatformPanel {
  key: string;
  label: string;
  /** Short line under the label, e.g. the best price. */
  note?: string;
  content: React.ReactNode;
}

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const readHash = () => window.location.hash.slice(1);

export default function PlatformTabs({ panels }: { panels: PlatformPanel[] }) {
  // The server (and the first client render) show the first platform; the hash then picks.
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const active = panels.some((p) => p.key === hash) ? hash : panels[0]?.key;

  const choose = (key: string) => {
    history.replaceState(null, "", `#${key}`);                  // no new history entry, no scroll
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  if (panels.length === 1) return <>{panels[0].content}</>;
  return (
    <>
      <div className="pt-tabs" role="tablist" aria-label="Platform">
        {panels.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            id={`tab-${p.key}`}
            aria-selected={active === p.key}
            aria-controls={`panel-${p.key}`}
            className="pt-tab"
            onClick={() => choose(p.key)}
          >
            <span className="pt-tab-label">{p.label}</span>
            {p.note && <span className="pt-tab-note">{p.note}</span>}
          </button>
        ))}
      </div>
      {panels.map((p) => (
        <div key={p.key} id={`panel-${p.key}`} role="tabpanel" aria-labelledby={`tab-${p.key}`} hidden={active !== p.key}>
          {p.content}
        </div>
      ))}
    </>
  );
}
