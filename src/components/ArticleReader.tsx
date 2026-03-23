"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react";

interface ArticleReaderProps {
  contentSelector?: string;
}

export default function ArticleReader({
  contentSelector = ".prose-custom",
}: ArticleReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("");
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    // Extract text and estimate duration on mount
    const el = document.querySelector(contentSelector);
    if (el) {
      const text = el.textContent || "";
      textRef.current = text;
      const words = text.split(/\s+/).length;
      const minutes = Math.ceil(words / 150); // ~150 words/min for TTS
      setDuration(`${minutes} min`);
    }

    return () => {
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [contentSelector]);

  const trackProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = Date.now();

    const words = textRef.current.split(/\s+/).length;
    const estimatedMs = (words / 150) * 60 * 1000;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / estimatedMs) * 100, 99);
      setProgress(pct);
    }, 500);
  }, []);

  const handlePlay = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      trackProgress();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textRef.current);
    utterance.rate = 1;
    utterance.pitch = 1;

    // Prefer a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") ||
          v.name.includes("Microsoft") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
    trackProgress();
  }, [isPaused, trackProgress]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] px-4 py-3">
      <Volume2 className="h-4 w-4 text-[#3B82F6] flex-shrink-0" />

      <div className="flex items-center gap-2 flex-shrink-0">
        {isPlaying ? (
          <button
            onClick={handlePause}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6] text-white transition-colors hover:bg-[#2563EB]"
            aria-label="Pause"
          >
            <Pause className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6] text-white transition-colors hover:bg-[#2563EB]"
            aria-label={isPaused ? "Resume" : "Listen to article"}
          >
            <Play className="h-4 w-4 ml-0.5" />
          </button>
        )}

        {(isPlaying || isPaused) && (
          <button
            onClick={handleStop}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2a2e3a] text-[#8b8fa3] transition-colors hover:text-[#e4e6eb] hover:border-[#3B82F6]"
            aria-label="Stop"
          >
            <Square className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="h-1.5 w-full rounded-full bg-[#2a2e3a] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span className="text-xs text-[#8b8fa3] flex-shrink-0 tabular-nums">
        {isPlaying || isPaused ? (
          <VolumeX
            className="h-3.5 w-3.5 cursor-pointer hover:text-[#e4e6eb] transition-colors"
            onClick={handleStop}
          />
        ) : (
          duration
        )}
      </span>
    </div>
  );
}
