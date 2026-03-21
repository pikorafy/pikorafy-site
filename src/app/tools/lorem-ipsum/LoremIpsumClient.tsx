"use client";

import { useState, useCallback } from "react";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "at", "vero", "eos",
  "accusamus", "iusto", "odio", "dignissimos", "ducimus", "blanditiis",
  "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores",
  "quas", "molestias", "recusandae", "itaque", "earum", "rerum", "hic",
  "tenetur", "sapiente", "delectus", "reiciendis", "maiores", "alias",
  "consequatur", "perferendis", "doloribus", "asperiores", "repellat",
  "temporibus", "quibusdam", "illum", "fugit", "quo", "voluptas", "nemo",
  "quisquam", "placeat", "facere", "possimus", "omnis", "voluptatem",
  "accusantium", "doloremque", "laudantium", "totam", "rem", "aperiam", "eaque",
  "ipsa", "quae", "ab", "illo", "inventore", "veritatis", "quasi", "architecto",
  "beatae", "vitae", "dicta", "explicabo", "natus", "error", "voluptatibus",
  "maxime", "harum", "necessitatibus", "saepe", "eveniet", "optio", "cumque",
  "nihil", "impedit", "minus", "quod",
];

const CLASSIC_START =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";

function randomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(minWords = 6, maxWords = 15): string {
  const length = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const words: string[] = [];
  for (let i = 0; i < length; i++) {
    words.push(randomWord());
  }
  return capitalize(words.join(" ")) + ".";
}

function generateParagraph(minSentences = 3, maxSentences = 7): string {
  const count =
    minSentences + Math.floor(Math.random() * (maxSentences - minSentences + 1));
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(" ");
}

type UnitType = "paragraphs" | "sentences" | "words";

export default function LoremIpsumClient() {
  const [unit, setUnit] = useState<UnitType>("paragraphs");
  const [count, setCount] = useState(3);
  const [startClassic, setStartClassic] = useState(true);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let result = "";

    if (unit === "paragraphs") {
      const paragraphs: string[] = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph());
      }
      result = paragraphs.join("\n\n");
    } else if (unit === "sentences") {
      const sentences: string[] = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      result = sentences.join(" ");
    } else {
      const words: string[] = [];
      for (let i = 0; i < count; i++) {
        words.push(randomWord());
      }
      result = capitalize(words.join(" ")) + ".";
    }

    if (startClassic) {
      result = CLASSIC_START + result;
    }

    setOutput(result);
    setCopied(false);
  }, [unit, count, startClassic]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Lorem Ipsum Generator
        </h1>
        <p className="mt-4 text-lg text-[#8b8fa3]">
          Generate placeholder text for your designs, layouts, and prototypes.
        </p>

        {/* Controls */}
        <div className="mt-10 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            {/* Unit Type */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#e4e6eb] mb-2">
                Generate
              </label>
              <div className="flex rounded-lg border border-[#2a2e3a] overflow-hidden">
                {(["paragraphs", "sentences", "words"] as UnitType[]).map(
                  (u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                        unit === u
                          ? "bg-blue-500 text-white"
                          : "bg-[#0f1117] text-[#8b8fa3] hover:text-[#e4e6eb]"
                      }`}
                    >
                      {capitalize(u)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Count */}
            <div className="w-32">
              <label
                htmlFor="lorem-count"
                className="block text-sm font-medium text-[#e4e6eb] mb-2"
              >
                How many
              </label>
              <input
                id="lorem-count"
                type="number"
                min={1}
                max={999}
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.max(1, Math.min(999, Number(e.target.value) || 1))
                  )
                }
                className="w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-2.5 text-[#e4e6eb] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1a1d27]"
            >
              Generate
            </button>
          </div>

          {/* Options */}
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-[#e4e6eb] cursor-pointer">
              <input
                type="checkbox"
                checked={startClassic}
                onChange={(e) => setStartClassic(e.target.checked)}
                className="rounded border-[#2a2e3a] bg-[#0f1117] text-blue-500 focus:ring-blue-500"
              />
              Start with &quot;Lorem ipsum dolor sit amet...&quot;
            </label>
          </div>
        </div>

        {/* Output */}
        {output && (
          <div className="mt-6 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#8b8fa3]">
                Generated Text
              </h2>
              <button
                onClick={copyToClipboard}
                className="rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-1.5 text-xs font-medium text-[#e4e6eb] transition-colors hover:border-blue-500/50 hover:text-blue-400"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg bg-[#0f1117] border border-[#2a2e3a] p-4 max-h-[500px] overflow-y-auto">
              <p className="text-sm text-[#e4e6eb] leading-relaxed whitespace-pre-wrap">
                {output}
              </p>
            </div>
            <p className="mt-3 text-xs text-[#555]">
              {output.split(/\s+/).length} words &middot;{" "}
              {output.length} characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
