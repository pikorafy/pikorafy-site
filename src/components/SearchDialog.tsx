"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface SearchResult {
  title: string;
  description: string;
  url: string;
  type: "Article" | "Comparison" | "Alternative" | "Tool";
}

const typeBadgeColors: Record<string, string> = {
  Article: "bg-emerald-500/15 text-emerald-400",
  Comparison: "bg-purple-500/15 text-purple-400",
  Alternative: "bg-amber-500/15 text-amber-400",
  Tool: "bg-blue-500/15 text-blue-400",
};

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDialog = useCallback(() => {
    setOpen(true);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
  }, []);

  // Global "/" shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !open &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        openDialog();
      }
      if (e.key === "Escape" && open) {
        closeDialog();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, openDialog, closeDialog]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll("[data-search-item]");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      closeDialog();
      window.location.href = results[activeIndex].url;
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      closeDialog();
    }
  }

  if (!open) {
    return (
      <button
        onClick={openDialog}
        className="flex items-center gap-2 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-[#3B82F6]/50 hover:text-[#e4e6eb]"
        aria-label="Search"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-[#2a2e3a] bg-[#0f1117] px-1.5 py-0.5 text-xs text-zinc-500 sm:inline">
          /
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Trigger button (hidden when open) */}
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
        onClick={handleOverlayClick}
      >
        {/* Dialog */}
        <div className="w-full max-w-lg rounded-xl border border-[#2a2e3a] bg-[#1a1d27] shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[#2a2e3a] px-4 py-3">
            <svg
              className="h-5 w-5 shrink-0 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search articles, tools, comparisons..."
              className="flex-1 bg-transparent text-[#e4e6eb] placeholder-zinc-500 outline-none"
            />
            <button
              onClick={closeDialog}
              className="rounded border border-[#2a2e3a] bg-[#0f1117] px-1.5 py-0.5 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-80 overflow-y-auto">
            {loading && query.trim() && (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                Searching...
              </div>
            )}

            {!loading && query.trim() && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading &&
              results.map((result, index) => (
                <Link
                  key={result.url}
                  href={result.url}
                  data-search-item
                  onClick={closeDialog}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    index === activeIndex
                      ? "bg-[#3B82F6]/10"
                      : "hover:bg-[#2a2e3a]/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeBadgeColors[result.type]}`}
                      >
                        {result.type}
                      </span>
                      <span className="truncate text-sm font-medium text-[#e4e6eb]">
                        {result.title}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {result.description}
                    </p>
                  </div>
                  <svg
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              ))}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-[#2a2e3a] px-4 py-2">
            <span className="text-xs text-zinc-600">
              Press <kbd className="rounded border border-[#2a2e3a] bg-[#0f1117] px-1 py-0.5 text-[10px]">/</kbd> to search
            </span>
            <div className="flex gap-1 text-xs text-zinc-600">
              <kbd className="rounded border border-[#2a2e3a] bg-[#0f1117] px-1 py-0.5 text-[10px]">&uarr;</kbd>
              <kbd className="rounded border border-[#2a2e3a] bg-[#0f1117] px-1 py-0.5 text-[10px]">&darr;</kbd>
              <span className="ml-1">navigate</span>
              <kbd className="ml-2 rounded border border-[#2a2e3a] bg-[#0f1117] px-1 py-0.5 text-[10px]">&crarr;</kbd>
              <span className="ml-1">open</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
