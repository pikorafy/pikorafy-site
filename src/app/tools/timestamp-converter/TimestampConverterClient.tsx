"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function TimestampConverterClient() {
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  // Unix -> Date
  const [unixInput, setUnixInput] = useState("");
  const [dateFromUnix, setDateFromUnix] = useState("");
  const [unixError, setUnixError] = useState("");

  // Date -> Unix
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [unixFromDate, setUnixFromDate] = useState("");
  const [dateError, setDateError] = useState("");

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    setCurrentTimestamp(Math.floor(Date.now() / 1000));
    return () => clearInterval(interval);
  }, []);

  const convertUnixToDate = useCallback(() => {
    setUnixError("");
    setDateFromUnix("");
    const num = Number(unixInput);
    if (isNaN(num) || !unixInput.trim()) {
      setUnixError("Please enter a valid Unix timestamp.");
      return;
    }
    // Handle seconds vs milliseconds
    const ts = num > 1e12 ? num : num * 1000;
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      setUnixError("Invalid timestamp.");
      return;
    }
    setDateFromUnix(
      `${d.toUTCString()}\n${d.toISOString()}\n${d.toLocaleString()}`
    );
  }, [unixInput]);

  const convertDateToUnix = useCallback(() => {
    setDateError("");
    setUnixFromDate("");
    if (!dateInput) {
      setDateError("Please select a date.");
      return;
    }
    const dateStr = timeInput
      ? `${dateInput}T${timeInput}`
      : `${dateInput}T00:00:00`;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      setDateError("Invalid date/time.");
      return;
    }
    const seconds = Math.floor(d.getTime() / 1000);
    const millis = d.getTime();
    setUnixFromDate(`Seconds: ${seconds}\nMilliseconds: ${millis}`);
  }, [dateInput, timeInput]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">Timestamp Converter</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Timestamp Converter
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Convert between Unix timestamps and human-readable dates. See the
          current timestamp and convert in both directions.
        </p>

        {/* Current Timestamp */}
        <div className="mt-8 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <p className="text-sm text-[#8b8fa3] mb-2">Current Unix Timestamp</p>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold font-mono text-blue-500">
              {mounted ? currentTimestamp : "---"}
            </span>
            <button
              onClick={() =>
                copyToClipboard(String(currentTimestamp), "current")
              }
              className="rounded-md border border-[#2a2e3a] px-3 py-1 text-xs text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
            >
              {copiedField === "current" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Unix to Date */}
          <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
            <h2 className="text-lg font-semibold text-[#e4e6eb] mb-4">
              Unix Timestamp to Date
            </h2>
            <label className="mb-2 block text-sm text-[#8b8fa3]">
              Unix Timestamp (seconds or milliseconds)
            </label>
            <input
              type="text"
              value={unixInput}
              onChange={(e) => setUnixInput(e.target.value)}
              placeholder="e.g. 1700000000"
              className="w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] p-3 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={convertUnixToDate}
              disabled={!unixInput.trim()}
              className="mt-3 rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert
            </button>
            {unixError && (
              <p className="mt-3 text-sm text-red-400">{unixError}</p>
            )}
            {dateFromUnix && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8b8fa3]">Result</span>
                  <button
                    onClick={() => copyToClipboard(dateFromUnix, "unixResult")}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {copiedField === "unixResult" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="rounded-lg bg-[#0f1117] border border-[#2a2e3a] p-3 text-sm text-[#e4e6eb] font-mono whitespace-pre-wrap">
                  {dateFromUnix}
                </pre>
              </div>
            )}
          </div>

          {/* Date to Unix */}
          <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
            <h2 className="text-lg font-semibold text-[#e4e6eb] mb-4">
              Date to Unix Timestamp
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm text-[#8b8fa3]">
                  Date
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] p-3 text-sm text-[#e4e6eb] focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[#8b8fa3]">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  step="1"
                  className="w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] p-3 text-sm text-[#e4e6eb] focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <button
              onClick={convertDateToUnix}
              disabled={!dateInput}
              className="mt-3 rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert
            </button>
            {dateError && (
              <p className="mt-3 text-sm text-red-400">{dateError}</p>
            )}
            {unixFromDate && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8b8fa3]">Result</span>
                  <button
                    onClick={() => copyToClipboard(unixFromDate, "dateResult")}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {copiedField === "dateResult" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="rounded-lg bg-[#0f1117] border border-[#2a2e3a] p-3 text-sm text-[#e4e6eb] font-mono whitespace-pre-wrap">
                  {unixFromDate}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
