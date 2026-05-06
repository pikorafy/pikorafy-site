import type { Metadata } from "next";
import GameDetailClient from "./GameDetailClient";

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;
  return {
    title: `Game #${gameId} — Best Price & Value Analysis | Pikorafy`,
    description: `Compare prices across 30+ stores for game ${gameId}. Find the cheapest deal, track price history, and set alerts.`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  return <GameDetailClient gameId={gameId} />;
}
