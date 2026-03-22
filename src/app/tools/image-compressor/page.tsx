import type { Metadata } from "next";
import ImageCompressorClient from "./ImageCompressorClient";

export const metadata: Metadata = {
  title: "Image Compressor - Pikorafy",
  description:
    "Compress images client-side with adjustable quality. Free online image compressor with before/after size comparison.",
};

export default function ImageCompressorPage() {
  return <ImageCompressorClient />;
}
