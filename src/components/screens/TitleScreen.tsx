import React from "react";
import type { GameController } from "@/game/useGameController";
import { Scene } from "@/components/art/Scene";
import { CatPortrait } from "@/components/art/CatPortrait";

const MENU: { key: string; label: string; screen?: string; action?: string; primary?: boolean }[] = [
  { label: "New Single-Player Game", action: "new", key: "new", primary: true },
  { label: "Continue Single-Player Game", action: "continue", key: "continue" },
  { label: "Host Multiplayer Game", screen: "multiplayer", key: "host" },
  { label: "Join Multiplayer Game", screen: "multiplayer", key: "join" },
  { label: "Cat Collection", screen: "collection", key: "collection" },
  { label: "Shop & Upgrades", screen: "shop", key: "shop" },
  { label: "Achievements", screen: "achievements", key: "achievements" },
  { label: "How to Play", screen: "howToPlay", key: "howto" },
  { label: "Settings", screen: "settings", key: "settings" },
  { label: "Credits", screen: "credits", key: "credits" },
];

export function TitleScreen({ ctx }: { ctx: GameController }) {
  const coins = ctx.meta?.coins ?? 0;
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <Scene weather="Fog" variant="forest" night height={190}>
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h1 className="font-display text-4xl font-bold tracking-wide text-parchment drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-5xl">
            Warrior Apocalypse
          </h1>
          <p className="mt-1 text-sm text-fern">Survive the infection. Protect your clan.</p>
          <div className="mt-2 flex gap-3">
            <CatPortrait appearance={{ furColor: "#d9622a", furPattern: "solid", eyeColor: "#4a8f3c", scars: "none", accessory: "none", bodyType: "medium", earShape: "pointed", tailStyle: "medium" }} size={44} />
            <CatPortrait appearance={{ furColor: "#5a5b60", furPattern: "solid", eyeColor: "#d67a2a", scars: "ear", accessory: "none", bodyType: "large", earShape: "pointed", tailStyle: "medium" }} size={44} />
          </div>
        </div>
      </Scene>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-sm text-parchment/70">
          Best: {ctx.meta?.stats.bestDays ?? 0} days
        </span>
        <span className="rounded-full bg-ember/20 px-3 py-1 text-sm font-semibold text-ember">
          🪙 {coins} coins
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MENU.map((item) => {
          const disabled = item.action === "continue" && !ctx.hasSave;
          return (
            <button
              key={item.key}
              className={`btn ${item.primary ? "btn-primary" : ""} justify-start text-left ${disabled ? "" : ""}`}
              disabled={disabled}
              onClick={() => {
                if (item.action === "new") ctx.setScreen("newGame");
                else if (item.action === "continue") ctx.continueRun();
                else if (item.screen) ctx.setScreen(item.screen as never);
              }}
            >
              {item.label}
              {disabled && <span className="ml-auto text-[11px] opacity-60">no save</span>}
            </button>
          );
        })}
      </div>

      <p className="mt-6 rounded-lg border border-fern/20 bg-black/30 p-3 text-center text-[11px] leading-relaxed text-parchment/60">
        <strong>Disclaimer:</strong> This is an unofficial, fan-created game inspired by the world of
        the <em>Warriors</em> books. It is not affiliated with, endorsed by, or sponsored by the
        books&rsquo; authors or publishers. All artwork here is original and procedurally generated;
        no official illustrations, logos, or text are used.
      </p>
    </div>
  );
}
