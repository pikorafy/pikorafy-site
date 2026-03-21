import type { Metadata } from "next";
import UrlEncoderClient from "./UrlEncoderClient";

export const metadata: Metadata = {
  title: "URL Encoder / Decoder - Encode & Decode URLs Online | Pikorafy",
  description:
    "Encode and decode URLs and query parameters online. Handles all special characters with proper percent-encoding.",
  keywords: ["url encoder", "url decoder", "percent encoding", "encode url", "decode url", "urlencode"],
};

export default function UrlEncoderPage() {
  return <UrlEncoderClient />;
}
