import { GameShell } from "@/components/GameShell";

// The whole game is a client-side experience (no accounts, localStorage-backed).
export default function Home() {
  return <GameShell />;
}
