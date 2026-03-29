"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-10 max-w-md">
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="mt-3 text-sm text-[#8b8fa3]">
          An unexpected error occurred. Try reloading the page.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
