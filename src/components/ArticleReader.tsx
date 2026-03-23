"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2, VolumeX, ChevronDown } from "lucide-react";

interface ArticleReaderProps {
  contentSelector?: string;
}

function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  // Neural/Natural voices (Edge) are the best
  if (name.includes("online") && name.includes("natural")) return 100;
  if (name.includes("neural")) return 90;
  if (name.includes("online")) return 80;
  // Apple premium voices
  if (name.includes("premium")) return 75;
  // Known good voices
  if (name.includes("samantha")) return 70;
  if (name.includes("daniel")) return 65;
  if (name.includes("karen")) return 60;
  if (name.includes("aria")) return 95;
  if (name.includes("jenny")) return 95;
  if (name.includes("guy")) return 90;
  // Google voices
  if (name.includes("google")) return 50;
  // Any English voice
  if (v.lang.startsWith("en")) return 10;
  return 0;
}

function getBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang.startsWith("en"));
  if (english.length === 0) return undefined;
  return english.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

export default function ArticleReader({
  contentSelector = ".prose-custom",
}: ArticleReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("");
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(-1);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const el = document.querySelector(contentSelector);
    if (el) {
      const text = el.textContent || "";
      textRef.current = text;
      const words = text.split(/\s+/).length;
      const minutes = Math.ceil(words / 150);
      setDuration(`${minutes} min`);
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const english = available
        .filter((v) => v.lang.startsWith("en"))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a));
      setVoices(english);

      // Restore saved preference or pick best
      const saved = localStorage.getItem("pikorafy-voice");
      if (saved) {
        const idx = english.findIndex((v) => v.name === saved);
        setSelectedVoiceIndex(idx >= 0 ? idx : 0);
      } else {
        setSelectedVoiceIndex(0);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [contentSelector]);

  // Close picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowVoicePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getSelectedVoice = useCallback(() => {
    if (selectedVoiceIndex >= 0 && selectedVoiceIndex < voices.length) {
      return voices[selectedVoiceIndex];
    }
    return getBestVoice(window.speechSynthesis.getVoices());
  }, [voices, selectedVoiceIndex]);

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

    const voice = getSelectedVoice();
    if (voice) utterance.voice = voice;

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
  }, [isPaused, trackProgress, getSelectedVoice]);

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

  const handleVoiceChange = useCallback(
    (idx: number) => {
      setSelectedVoiceIndex(idx);
      setShowVoicePicker(false);
      if (voices[idx]) {
        localStorage.setItem("pikorafy-voice", voices[idx].name);
      }
      // If currently playing, restart with new voice
      if (isPlaying || isPaused) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    },
    [voices, isPlaying, isPaused],
  );

  const voiceLabel = (v: SpeechSynthesisVoice) => {
    const name = v.name
      .replace("Microsoft ", "")
      .replace("Google ", "")
      .replace(" Online (Natural)", " (Neural)")
      .replace(" (Natural)", " (Neural)");
    return name;
  };

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

      {/* Voice picker */}
      {voices.length > 1 && (
        <div className="relative flex-shrink-0" ref={pickerRef}>
          <button
            onClick={() => setShowVoicePicker(!showVoicePicker)}
            className="flex items-center gap-1 text-xs text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
            aria-label="Choose voice"
          >
            <span className="max-w-[80px] truncate">
              {voices[selectedVoiceIndex]
                ? voiceLabel(voices[selectedVoiceIndex])
                : "Voice"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showVoicePicker && (
            <div className="absolute right-0 bottom-full mb-2 w-56 max-h-48 overflow-y-auto rounded-lg border border-[#2a2e3a] bg-[#1a1d27] shadow-xl z-50">
              {voices.map((v, idx) => (
                <button
                  key={v.name}
                  onClick={() => handleVoiceChange(idx)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#2a2e3a] ${
                    idx === selectedVoiceIndex
                      ? "text-[#3B82F6] bg-[#3B82F6]/10"
                      : "text-[#b0b3c0]"
                  }`}
                >
                  {voiceLabel(v)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
