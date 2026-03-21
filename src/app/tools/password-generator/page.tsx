import type { Metadata } from "next";
import PasswordGeneratorClient from "./PasswordGeneratorClient";

export const metadata: Metadata = {
  title: "Password Generator",
  description:
    "Generate strong, secure passwords with customizable length, character types, and strength indicator. Free online tool.",
};

export default function PasswordGeneratorPage() {
  return <PasswordGeneratorClient />;
}
