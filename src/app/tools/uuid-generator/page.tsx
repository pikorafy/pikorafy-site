import type { Metadata } from "next";
import UuidGeneratorClient from "./UuidGeneratorClient";

export const metadata: Metadata = {
  title: "UUID Generator - Generate UUID v4 Online | Pikorafy",
  description:
    "Generate random UUID v4 identifiers online. Create single or bulk UUIDs instantly with options for uppercase and no-dash formatting.",
  keywords: ["uuid generator", "uuid v4", "random uuid", "bulk uuid", "guid generator"],
};

export default function UuidGeneratorPage() {
  return <UuidGeneratorClient />;
}
