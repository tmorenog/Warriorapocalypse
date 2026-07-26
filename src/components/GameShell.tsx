"use client";

import React from "react";
import { useGameController } from "@/game/useGameController";
import { TitleScreen } from "./screens/TitleScreen";
import { NewGameScreen } from "./screens/NewGameScreen";
import { ScavengingScreen } from "./screens/ScavengingScreen";
import { DigShelterScreen } from "./screens/DigShelterScreen";
import { DayScreen } from "./screens/DayScreen";
import { BattleScreen } from "./screens/BattleScreen";
import { RunEndScreen } from "./screens/RunEndScreen";
import {
  CollectionScreen,
  ShopScreen,
  AchievementsScreen,
  HowToPlayScreen,
  SettingsScreen,
  CreditsScreen,
} from "./screens/MetaScreens";
import { MultiplayerScreen } from "./screens/MultiplayerScreen";
import { DebugPanel } from "./screens/DebugPanel";

export function GameShell() {
  const ctx = useGameController();

  if (!ctx.meta) {
    return (
      <div className="flex min-h-screen items-center justify-center text-parchment/60">
        Loading…
      </div>
    );
  }

  const isDev = process.env.NODE_ENV === "development";

  return (
    <main className="min-h-screen">
      {renderScreen()}
      <ToastLayer ctx={ctx} />
      {isDev && <DebugPanel ctx={ctx} />}
    </main>
  );

  function renderScreen() {
    switch (ctx.screen) {
      case "title": return <TitleScreen ctx={ctx} />;
      case "newGame": return <NewGameScreen ctx={ctx} />;
      case "collection": return <CollectionScreen ctx={ctx} />;
      case "shop": return <ShopScreen ctx={ctx} />;
      case "achievements": return <AchievementsScreen ctx={ctx} />;
      case "howToPlay": return <HowToPlayScreen ctx={ctx} />;
      case "settings": return <SettingsScreen ctx={ctx} />;
      case "credits": return <CreditsScreen ctx={ctx} />;
      case "multiplayer": return <MultiplayerScreen ctx={ctx} />;
      case "playing": return renderPlaying();
      default: return <TitleScreen ctx={ctx} />;
    }
  }

  function renderPlaying() {
    const run = ctx.run;
    if (!run) return <TitleScreen ctx={ctx} />;
    if (run.ended || run.phase === "ended") return <RunEndScreen ctx={ctx} />;
    switch (run.phase) {
      case "scavenging": return <ScavengingScreen ctx={ctx} />;
      case "digShelter": return <DigShelterScreen ctx={ctx} />;
      case "battle": return <BattleScreen ctx={ctx} />;
      case "day": return <DayScreen ctx={ctx} />;
      default: return <DayScreen ctx={ctx} />;
    }
  }
}

function ToastLayer({ ctx }: { ctx: ReturnType<typeof useGameController> }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[60] flex -translate-x-1/2 flex-col items-center gap-1">
      {ctx.toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-fade-in rounded-full px-4 py-1.5 text-sm font-semibold shadow-lg ${
            t.kind === "coin"
              ? "bg-ember text-white"
              : t.kind === "achievement"
                ? "bg-fern text-night"
                : "bg-dusk text-parchment"
          }`}
        >
          {t.kind === "achievement" ? "🏅 " : t.kind === "coin" ? "🪙 " : ""}
          {t.text}
        </div>
      ))}
    </div>
  );
}
