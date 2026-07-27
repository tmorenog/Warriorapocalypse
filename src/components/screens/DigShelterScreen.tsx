import React, { useState } from "react";
import type { GameController } from "@/game/useGameController";
import { Scene } from "@/components/art/Scene";
import { CatSprite } from "@/components/art/CatSprite";
import { Button } from "@/components/ui/primitives";

export function DigShelterScreen({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const [digging, setDigging] = useState(false);
  const [stage, setStage] = useState(0);

  const startDig = () => {
    setDigging(true);
    const steps = [
      "The cats gather at a sheltered hollow...",
      "Paws work the earth, loosening soil and roots...",
      "A protected den takes shape beneath the roots...",
      "The shelter is ready. It will have to do.",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setStage(i);
      if (i >= steps.length) {
        clearInterval(interval);
        setTimeout(() => ctx.digShelter(), 700);
      }
    }, 750);
  };

  const steps = [
    "The cats gather at a sheltered hollow...",
    "Paws work the earth, loosening soil and roots...",
    "A protected den takes shape beneath the roots...",
    "The shelter is ready. It will have to do.",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-3 text-center font-display text-2xl text-parchment">Dig the Shelter</h1>
      <Scene weather={run.weather} variant="den" height={220}>
        <div className="flex h-full items-end justify-center gap-1 pb-3 sm:gap-2">
          {run.cats.filter((c) => c.alive).map((c, i) => (
            <div key={c.id} style={{ transform: `translateY(${(i % 2) * 3}px)` }}>
              <CatSprite
                appearance={c.appearance}
                cosmetics={c.cosmetics}
                size={74}
                facing={i % 2 ? "left" : "right"}
                action={digging ? "walk" : "idle"}
              />
            </div>
          ))}
        </div>
      </Scene>

      <p className="mt-4 min-h-[1.5rem] text-center text-sm text-parchment/80">
        {digging ? steps[Math.min(stage, steps.length - 1)] : "Your group needs a safe place to rest. Dig a den before nightfall."}
      </p>

      <div className="mt-4">
        {!digging ? (
          <Button variant="primary" className="w-full" onClick={startDig}>
            🐾 Dig Shelter
          </Button>
        ) : (
          <div className="text-center text-xs text-fern">Working...</div>
        )}
      </div>
    </div>
  );
}
