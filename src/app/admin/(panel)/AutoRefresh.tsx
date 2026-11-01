"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renders the page from the server every few seconds while something is running. */
export default function AutoRefresh({ active, seconds = 3 }: { active: boolean; seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [active, seconds, router]);
  return null;
}
