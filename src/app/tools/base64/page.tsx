import type { Metadata } from "next";
import Base64Client from "./Base64Client";

export const metadata: Metadata = {
  title: "Base64 Encoder / Decoder",
  description:
    "Encode and decode Base64 strings online. Supports text and UTF-8 with auto-detection. Free developer tool.",
};

export default function Base64Page() {
  return <Base64Client />;
}
