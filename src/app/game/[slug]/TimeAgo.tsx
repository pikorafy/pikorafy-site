"use client";

import { useSyncExternalStore } from "react";

// Pages are cached for up to an hour, so relative times must be computed in the
// browser. The server (and cached HTML) shows the absolute date; the client
// shows "3h ago".
const noSubscribe = () => () => {};

export default function TimeAgo({ iso }: { iso: string }) {
  const label = useSyncExternalStore(
    noSubscribe,
    () => relative(iso),
    () => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
  );
  return <time dateTime={iso}>{label}</time>;
}

function relative(iso: string) {
  const hours = Math.round((Date.now() - Date.parse(iso)) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
