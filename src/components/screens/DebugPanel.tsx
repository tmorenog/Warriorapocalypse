"use client";

import React, { useState } from "react";
import type { GameController } from "@/game/useGameController";
import { addItem, updateCat } from "@/engine/gameState";
import { exposeCat, recomputeStage } from "@/engine/infection";
import { injureCat } from "@/engine/meters";
import { Button } from "@/components/ui/primitives";

// Only rendered in development (see GameShell). Lets a developer poke the systems.
export function DebugPanel({ ctx }: { ctx: GameController }) {
  const [open, setOpen] = useState(false);
  const run = ctx.run;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-16 right-2 z-40 rounded-full bg-purple-900/80 px-3 py-1 text-[11px] text-white sm:bottom-2"
      >
        🐞 Debug
      </button>
    );
  }

  const firstAlive = run?.cats.find((c) => c.alive);

  return (
    <div className="fixed bottom-16 right-2 z-40 w-64 rounded-lg border border-purple-500/50 bg-night/95 p-2 text-xs sm:bottom-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-purple-300">Debug Panel</span>
        <button onClick={() => setOpen(false)} className="text-parchment/60">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Dbg label="Advance Day" onClick={() => ctx.doAdvanceDay()} disabled={!run || run.phase !== "day"} />
        <Dbg label="Add Supplies" onClick={() => run && ctx.setRun((r) => (r ? addItem(addItem(addItem(r, "mouse", 3), "fresh_water", 3), "herb_kit", 2) : r))} disabled={!run} />
        <Dbg label="Injure Cat" onClick={() => run && firstAlive && ctx.setRun((r) => (r ? updateCat(r, firstAlive.id, (c) => injureCat(c, 25)) : r))} disabled={!run} />
        <Dbg label="Infect Cat" onClick={() => run && firstAlive && ctx.setRun((r) => (r ? updateCat(r, firstAlive.id, (c) => recomputeStage(exposeCat(c, 30))) : r))} disabled={!run} />
        <Dbg label="Trigger Event" onClick={() => run && ctx.setRun((r) => {
          if (!r) return r;
          // Force an event next tick by clearing time.
          return { ...r, dayTimeRemainingMs: 0 };
        })} disabled={!run} />
        <Dbg label="Trigger Battle" onClick={() => ctx.startBattle("rat")} disabled={!run || run.phase !== "day"} />
        <Dbg label="Award 20 Coins" onClick={() => ctx.awardCoins(20, "debug")} />
        <Dbg label="Test Ending" onClick={() => run && ctx.setRun((r) => (r ? { ...r, ended: true, endingId: "hundred_days", phase: "ended" } : r))} disabled={!run} />
        <Dbg label="Sim Disconnect" onClick={() => run && firstAlive && ctx.setRun((r) => (r ? updateCat(r, firstAlive.id, (c) => ({ ...c, controllerId: null })) : r))} disabled={!run} />
        <Dbg label="Clear Save" onClick={() => ctx.resetAllData()} />
      </div>
    </div>
  );
}

function Dbg({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button className="px-1 py-1 text-[10px]" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}
