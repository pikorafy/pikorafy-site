"use client";

import { useState, useCallback } from "react";

function generateUUIDv4(): string {
  const hex = "0123456789abcdef";
  let uuid = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4";
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8];
    } else {
      uuid += hex[(Math.random() * 16) | 0];
    }
  }
  return uuid;
}

export default function UuidGeneratorClient() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);

  const generate = useCallback(() => {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      let uuid = generateUUIDv4();
      if (noDashes) uuid = uuid.replace(/-/g, "");
      if (uppercase) uuid = uuid.toUpperCase();
      result.push(uuid);
    }
    setUuids(result);
    setCopied(null);
    setCopiedAll(false);
  }, [count, uppercase, noDashes]);

  const copyOne = async (uuid: string) => {
    await navigator.clipboard.writeText(uuid);
    setCopied(uuid);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          UUID Generator
        </h1>
        <p className="mt-4 text-lg text-[#8b8fa3]">
          Generate random UUID v4 identifiers instantly. Single or bulk
          generation up to 100 at a time.
        </p>

        {/* Controls */}
        <div className="mt-10 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="count"
                className="block text-sm font-medium text-[#e4e6eb] mb-2"
              >
                Number of UUIDs
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                  setCount(v);
                }}
                className="w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-2.5 text-[#e4e6eb] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generate}
              className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1a1d27]"
            >
              Generate
            </button>
          </div>

          {/* Options */}
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-[#e4e6eb] cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded border-[#2a2e3a] bg-[#0f1117] text-blue-500 focus:ring-blue-500"
              />
              Uppercase
            </label>
            <label className="flex items-center gap-2 text-sm text-[#e4e6eb] cursor-pointer">
              <input
                type="checkbox"
                checked={noDashes}
                onChange={(e) => setNoDashes(e.target.checked)}
                className="rounded border-[#2a2e3a] bg-[#0f1117] text-blue-500 focus:ring-blue-500"
              />
              No dashes
            </label>
          </div>
        </div>

        {/* Results */}
        {uuids.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#8b8fa3]">
                Generated {uuids.length} UUID{uuids.length > 1 ? "s" : ""}
              </h2>
              <button
                onClick={copyAll}
                className="rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-1.5 text-xs font-medium text-[#e4e6eb] transition-colors hover:border-blue-500/50 hover:text-blue-400"
              >
                {copiedAll ? "Copied!" : "Copy all"}
              </button>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {uuids.map((uuid, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-2.5 transition-colors hover:border-[#3a3e4a]"
                >
                  <code className="text-sm text-[#e4e6eb] font-mono select-all">
                    {uuid}
                  </code>
                  <button
                    onClick={() => copyOne(uuid)}
                    className="ml-3 shrink-0 rounded-md px-3 py-1 text-xs text-[#8b8fa3] transition-colors hover:bg-[#2a2e3a] hover:text-[#e4e6eb]"
                  >
                    {copied === uuid ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
