import type { Metadata } from "next";
import RegexTesterClient from "./RegexTesterClient";

export const metadata: Metadata = {
  title: "Regex Tester - Pikorafy",
  description:
    "Test and debug regular expressions with live matching, capture groups, and a handy regex reference.",
};

export default function RegexTesterPage() {
  return <RegexTesterClient />;
}
