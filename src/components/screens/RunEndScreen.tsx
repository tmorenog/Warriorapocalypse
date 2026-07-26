import React from "react";
import type { GameController } from "@/game/useGameController";
import { ENDINGS_BY_ID } from "@/data/endings";
import { CatPortrait } from "@/components/art/CatPortrait";
import { Button, Panel } from "@/components/ui/primitives";
import { Scene } from "@/components/art/Scene";

export function RunEndScreen({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const ending = run.endingId ? ENDINGS_BY_ID[run.endingId] : null;
  const survivors = run.cats.filter((c) => c.alive);
  const mainCat = run.cats.find((c) => c.id === run.mainCatId);
  const victory = !!ending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Scene weather={victory ? "Clear" : "Storm"} variant={victory ? "forest" : "camp"} night={!victory} height={160}>
        <div className="flex h-full items-center justify-center">
          <h1 className="text-center font-display text-3xl font-bold text-parchment drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            {victory ? ending!.name : "The Run Ends"}
          </h1>
        </div>
      </Scene>

      {ending && <p className="mt-3 rounded-lg bg-fern/10 p-3 text-center text-sm text-fern">{ending.description}</p>}
      {!ending && (
        <p className="mt-3 text-center text-sm text-parchment/80">
          {mainCat?.name} has fallen: {mainCat?.causeOfDeath ?? "unknown"}. The group&rsquo;s struggle is over.
        </p>
      )}

      <Panel title="Run Summary" className="mt-4">
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <Stat label="Days survived" value={run.day - 1} />
          <Stat label="Coins earned" value={run.stats.coinsEarnedThisRun} />
          <Stat label="Enemies defeated" value={run.stats.enemiesDefeated} />
          <Stat label="Battles won" value={run.stats.battlesWon} />
          <Stat label="Cats rescued" value={run.stats.catsRescued} />
          <Stat label="Infected saved" value={run.stats.infectedCatsSaved} />
        </div>
      </Panel>

      <Panel title={`Surviving Clanmates (${survivors.length})`} className="mt-3">
        {survivors.length === 0 ? (
          <p className="text-xs text-parchment/50">None survived.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {survivors.map((c) => (
              <div key={c.id} className="flex items-center gap-1 rounded bg-black/25 p-1 text-xs">
                <CatPortrait appearance={c.appearance} cosmetics={c.cosmetics} size={30} />
                <span>{c.name} <span className="text-parchment/50">({c.role})</span></span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {run.stats.majorDecisions.length > 0 && (
        <Panel title="Major Decisions" className="mt-3">
          <ul className="space-y-1 text-[11px] text-parchment/70">
            {run.stats.majorDecisions.slice(-8).map((d, i) => <li key={i}>• {d}</li>)}
          </ul>
        </Panel>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" className="flex-1" onClick={() => ctx.setScreen("newGame")}>New Run</Button>
        <Button className="flex-1" onClick={ctx.endRunToMenu}>Main Menu</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded bg-black/30 p-2 text-center">
      <div className="text-lg font-bold text-parchment">{value}</div>
      <div className="text-[10px] uppercase text-parchment/50">{label}</div>
    </div>
  );
}
