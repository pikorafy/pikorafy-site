import type { Metadata } from "next";
import JwtDecoderClient from "./JwtDecoderClient";

export const metadata: Metadata = {
  title: "JWT Decoder",
  description:
    "Decode and inspect JSON Web Tokens. View header, payload, signature, and expiration status. Free developer tool.",
};

export default function JwtDecoderPage() {
  return <JwtDecoderClient />;
}
