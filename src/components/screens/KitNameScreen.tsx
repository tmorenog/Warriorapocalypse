"use client";

import React, { useState } from "react";
import type { GameController } from "@/game/useGameController";

const SUFFIXES = ["paw", "kit", "fur", "pelt", "heart", "leap", "song", "claw", "storm", "leaf"];

export function KitNameScreen({ ctx }: { ctx: GameController }) {
  const birth = ctx.run!.pendingKitName!;
  const [name, setName] = useState("");

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    ctx.nameKit(n);
  };
  const suggest = () => {
    // A playful nudge: "Kit" + a warrior-name suffix.
    const s = SUFFIXES[Math.floor(name.length) % SUFFIXES.length] || "kit";
    setName((name.replace(/(paw|kit|fur|pelt|heart|leap|song|claw|storm|leaf)$/i, "") || "Little") + s);
  };

  return (
    <div className="fixed inset-0 z-[86] flex flex-col items-center justify-center bg-night/95 p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-xl border border-fern/25 bg-dusk/95 p-5 text-center">
        <div className="text-4xl">🐾</div>
        <h2 className="mt-2 font-display text-xl text-parchment">A kit is born!</h2>
        <p className="mt-1 text-xs text-parchment/70">
          {birth.parentNames.length >= 2
            ? `${birth.parentNames[0]} and ${birth.parentNames[1]} have a new kit.`
            : "The group has a new kit."}{" "}
          Give it a name — it&apos;ll grow into a warrior in time.
        </p>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 18))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Name the kit…"
          className="mt-4 w-full rounded-lg border border-parchment/25 bg-black/40 px-3 py-2 text-center text-lg text-parchment outline-none focus:border-ember"
        />
        <div className="mt-2 flex justify-center">
          <button className="text-[11px] text-parchment/50 underline" onClick={suggest}>
            suggest a warrior-style name
          </button>
        </div>

        <button
          className="btn btn-primary mt-4 w-full py-2.5 disabled:opacity-40"
          disabled={!name.trim()}
          onClick={submit}
        >
          Welcome {name.trim() || "the kit"} 🐈
        </button>
      </div>
    </div>
  );
}
