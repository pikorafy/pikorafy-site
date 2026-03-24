import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Find Your Perfect AI Tool - Pikorafy Quiz",
  description:
    "Answer 5 quick questions and get personalized AI tool recommendations based on your needs, budget, and skill level. Find the best AI tools for writing, coding, design, and more.",
};

export default function QuizPage() {
  return <QuizClient />;
}
