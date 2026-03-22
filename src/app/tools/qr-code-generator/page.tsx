import type { Metadata } from "next";
import QrCodeGeneratorClient from "./QrCodeGeneratorClient";

export const metadata: Metadata = {
  title: "QR Code Generator - Pikorafy",
  description:
    "Generate QR codes from text or URLs. Free online QR code generator with SVG download.",
};

export default function QrCodeGeneratorPage() {
  return <QrCodeGeneratorClient />;
}
