"use client";

import React, { useEffect, useState } from "react";
import type { GameController } from "@/game/useGameController";
import { Scene } from "@/components/art/Scene";
import { ClanCat } from "@/components/art/ClanCat";
import { Button } from "@/components/ui/primitives";

// Scripted cutscenes. Currently: Mapleshade settling her old score with Appledusk.
export function Cutscene({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1600);
    const t2 = setTimeout(() => setStage(2), 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (run.pendingCutscene !== "mapleshade_appledusk") {
    // Unknown cutscene — just dismiss.
    return null;
  }

  const maple = run.cats.find((c) => c.defId === "mapleshade");
  const apple = run.cats.find((c) => c.defId === "appledusk");
  const texts = [
    "Deep in the den, two old wounds meet in the dark…",
    "Mapleshade has not forgotten what was taken from her.",
    "A warrior has been found dead. Appledusk will trouble the clan no more.",
  ];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-night p-4 animate-fade-in">
      <div className="w-full max-w-lg">
        <h2 className="mb-2 text-center font-display text-xl text-blood">An Old Score</h2>
        <Scene weather="Fog" variant="den" night height={260}>
          <div className="relative h-full">
            {maple && (
              <div
                className="absolute bottom-3"
                style={{ left: stage >= 1 ? "42%" : "12%", transition: "left 1.1s cubic-bezier(.5,0,.75,1)" }}
              >
                <div className={stage >= 1 ? "a-pounce spr" : ""} style={{ transformOrigin: "center" }}>
                  <ClanCat role="Warrior" appearance={maple.appearance} size={126} facing="right" />
                </div>
              </div>
            )}
            {apple && (
              <div
                className="absolute bottom-3"
                style={{
                  left: "60%",
                  transform: stage >= 2 ? "rotate(80deg) translateY(24px)" : "none",
                  opacity: stage >= 2 ? 0.55 : 1,
                  transition: "transform .6s ease, opacity .8s ease",
                }}
              >
                <div className={stage === 1 ? "a-hit spr" : ""} style={{ transformOrigin: "center" }}>
                  <ClanCat role="Warrior" appearance={apple.appearance} size={112} facing="left" dimmed={stage >= 2} />
                </div>
              </div>
            )}
          </div>
        </Scene>
        <p className="mt-3 min-h-[3rem] text-center text-sm italic text-parchment/90">{texts[stage]}</p>
        <Button variant="primary" className="mt-2 w-full" disabled={stage < 2} onClick={ctx.clearCutscene}>
          {stage < 2 ? "…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
