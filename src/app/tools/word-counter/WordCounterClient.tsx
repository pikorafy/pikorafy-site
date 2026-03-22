"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function WordCounterClient() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: "0 sec",
      };
    }

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const sentences = trimmed
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0).length;
    const paragraphs = trimmed
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0).length;

    const wpm = 225;
    const minutes = words / wpm;
    let readingTime: string;
    if (minutes < 1) {
      readingTime = `${Math.max(1, Math.ceil(minutes * 60))} sec`;
    } else {
      readingTime = `${Math.ceil(minutes)} min`;
    }

    return { characters, charactersNoSpaces, words, sentences, paragraphs, readingTime };
  }, [text]);

  const statCards = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Reading Time", value: stats.readingTime },
  ];

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">Word Counter</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Word Counter
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Paste or type your text below to instantly see word count, character
          count, sentences, paragraphs, and estimated reading time.
        </p>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-4 text-center"
            >
              <p className="text-2xl font-bold text-blue-500">{s.value}</p>
              <p className="mt-1 text-xs text-[#8b8fa3]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Textarea */}
        <div className="mt-8">
          <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
            Your Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here..."
            spellCheck={false}
            className="h-80 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Clear button */}
        <div className="mt-4">
          <button
            onClick={() => setText("")}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
