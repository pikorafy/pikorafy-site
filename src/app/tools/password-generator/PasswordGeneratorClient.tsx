"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";

function getStrength(
  password: string,
  length: number,
  options: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }
): { label: string; color: string; percent: number } {
  let poolSize = 0;
  if (options.upper) poolSize += 26;
  if (options.lower) poolSize += 26;
  if (options.numbers) poolSize += 10;
  if (options.symbols) poolSize += SYMBOLS.length;

  const entropy = password.length * Math.log2(poolSize || 1);

  if (entropy < 28) return { label: "Very Weak", color: "bg-red-500", percent: 15 };
  if (entropy < 36) return { label: "Weak", color: "bg-orange-500", percent: 30 };
  if (entropy < 60) return { label: "Fair", color: "bg-yellow-500", percent: 50 };
  if (entropy < 80) return { label: "Strong", color: "bg-green-500", percent: 75 };
  return { label: "Very Strong", color: "bg-emerald-400", percent: 100 };
}

export default function PasswordGeneratorClient() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let charset = "";
    if (useUpper) charset += UPPERCASE;
    if (useLower) charset += LOWERCASE;
    if (useNumbers) charset += NUMBERS;
    if (useSymbols) charset += SYMBOLS;

    if (!charset) {
      setPassword("");
      return;
    }

    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);

    // Guarantee at least one char from each selected set
    const required: string[] = [];
    if (useUpper) required.push(UPPERCASE[arr[0] % UPPERCASE.length]);
    if (useLower) required.push(LOWERCASE[arr[1] % LOWERCASE.length]);
    if (useNumbers) required.push(NUMBERS[arr[2] % NUMBERS.length]);
    if (useSymbols) required.push(SYMBOLS[arr[3] % SYMBOLS.length]);

    const remaining = length - required.length;
    const rest: string[] = [];
    for (let i = 0; i < remaining; i++) {
      rest.push(charset[arr[(i + 4) % arr.length] % charset.length]);
    }

    // Shuffle all characters together
    const all = [...required, ...rest];
    for (let i = all.length - 1; i > 0; i--) {
      const j = arr[i % arr.length] % (i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }

    setPassword(all.join(""));
    setCopied(false);
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  useEffect(() => {
    generate();
  }, [generate]);

  function handleCopy() {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const atLeastOne = useUpper || useLower || useNumbers || useSymbols;
  const strength = password
    ? getStrength(password, length, {
        upper: useUpper,
        lower: useLower,
        numbers: useNumbers,
        symbols: useSymbols,
      })
    : null;

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">Password Generator</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Password Generator
        </h1>
        <p className="mt-3 text-[#8b8fa3]">
          Generate cryptographically secure passwords. Customize length and
          character types to match your requirements.
        </p>

        {/* Password Display */}
        <div className="mt-8 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 overflow-x-auto rounded-md bg-[#0f1117] p-3 font-mono text-lg text-[#e4e6eb] select-all whitespace-nowrap">
              {password || (
                <span className="text-[#8b8fa3]">Select at least one character type</span>
              )}
            </div>
            <button
              onClick={handleCopy}
              disabled={!password}
              className="shrink-0 rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={generate}
              disabled={!atLeastOne}
              className="shrink-0 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Generate
            </button>
          </div>

          {/* Strength Indicator */}
          {strength && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b8fa3]">Strength</span>
                <span className="text-[#e4e6eb] font-medium">{strength.label}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#2a2e3a]">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="mt-6 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-6 space-y-6">
          {/* Length */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-[#e4e6eb]">
                Password Length
              </label>
              <span className="rounded-md bg-[#0f1117] px-3 py-1 text-sm font-mono text-blue-500">
                {length}
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#2a2e3a] accent-blue-500"
            />
            <div className="flex justify-between text-xs text-[#8b8fa3] mt-1">
              <span>8</span>
              <span>64</span>
            </div>
          </div>

          {/* Character types */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Uppercase (A-Z)", checked: useUpper, set: setUseUpper },
              { label: "Lowercase (a-z)", checked: useLower, set: setUseLower },
              { label: "Numbers (0-9)", checked: useNumbers, set: setUseNumbers },
              { label: "Symbols (!@#...)", checked: useSymbols, set: setUseSymbols },
            ].map((opt) => (
              <label
                key={opt.label}
                className="flex items-center gap-3 rounded-lg border border-[#2a2e3a] bg-[#0f1117] p-3 cursor-pointer hover:border-blue-500/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={(e) => opt.set(e.target.checked)}
                  className="h-4 w-4 rounded border-[#2a2e3a] bg-[#0f1117] text-blue-500 focus:ring-blue-500 accent-blue-500"
                />
                <span className="text-sm text-[#e4e6eb]">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
