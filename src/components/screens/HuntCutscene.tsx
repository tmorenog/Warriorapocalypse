"use client";

import React, { useEffect, useState } from "react";

// Aina's hand-drawn hunt, played as a tiny game: press Walk to sneak closer, then
// press POUNCE at the right moment. Pounce too early or sneak too far and the
// mouse gets away — no prey.
const FRAMES = Array.from({ length: 12 }, (_, i) => `/art/gallery/anim-hunt2/frame${i + 1}.jpg`);

// Frames 1..9 are the creep toward the mouse; 10 is the mid-air leap, 11 the
// landing on it, 12 the catch. Walk shows frames 1..9; pounce plays the leap.
const WALK_MAX = 8; // walk step 8 = frame 9 (closest creep); one more = too far
const POUNCE_MIN = 6; // pounce window: frames 7..9, once the cat is near enough
const POUNCE_MAX = 8;
// Pounce → caught plays frames 10..11 (leap + landing), then lands on frame 12.
const POUNCE_FRAMES = [9, 10];
const FPS = 5;

if (typeof window !== "undefined") {
  FRAMES.forEach((src) => {
    const img = new window.Image();
    img.src = src;
  });
}

type Phase = "walk" | "pouncing" | "caught" | "missed";

export function HuntCutscene({ onCatch, onMiss }: { onCatch: () => void; onMiss: () => void }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("walk");
  const [pi, setPi] = useState(0); // index into POUNCE_FRAMES while pouncing

  // Play the pounce → caught frames once, then land on "caught".
  useEffect(() => {
    if (phase !== "pouncing") return;
    if (pi >= POUNCE_FRAMES.length - 1) {
      const t = setTimeout(() => setPhase("caught"), 1000 / FPS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPi((v) => v + 1), 1000 / FPS);
    return () => clearTimeout(t);
  }, [phase, pi]);

  const walk = () => {
    if (phase !== "walk") return;
    const next = step + 1;
    if (next > WALK_MAX) {
      setPhase("missed"); // snuck too far — the mouse bolts
    } else {
      setStep(next);
    }
  };
  const pounce = () => {
    if (phase !== "walk") return;
    if (step >= POUNCE_MIN && step <= POUNCE_MAX) {
      setPhase("pouncing");
      setPi(0);
    } else {
      setPhase("missed"); // pounced too soon
    }
  };

  let frame = Math.min(step, WALK_MAX);
  if (phase === "pouncing") frame = POUNCE_FRAMES[pi];
  else if (phase === "caught") frame = 11;
  else if (phase === "missed") frame = 0;

  const title =
    phase === "caught" ? "Fresh prey! 🐭" : phase === "missed" ? "The mouse got away…" : phase === "pouncing" ? "POUNCE!" : "On the hunt…";

  return (
    <div className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-night/95 p-4 animate-fade-in">
      <h2 className="mb-2 font-display text-xl text-parchment">{title}</h2>
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-fern/25 bg-white">
        <div className="relative aspect-[4/3] w-full">
          {FRAMES.map((src, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt="A cat hunting a mouse"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: idx === frame ? 1 : 0 }}
            />
          ))}
        </div>
      </div>

      {phase === "walk" && (
        <>
          <p className="mt-2 text-xs text-parchment/60">Sneak closer… then pounce at the right moment!</p>
          <div className="mt-3 flex gap-3">
            <button className="btn px-5 py-3 text-base" onClick={walk}>
              🐾 Walk
            </button>
            <button className="btn btn-primary px-5 py-3 text-base" onClick={pounce}>
              🐈 POUNCE!
            </button>
          </div>
        </>
      )}

      {phase === "pouncing" && <p className="mt-3 text-xs text-parchment/60">…</p>}

      {phase === "caught" && (
        <button className="btn btn-primary mt-3 px-6 py-2" onClick={onCatch}>
          Continue
        </button>
      )}
      {phase === "missed" && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-xs text-parchment/60">No prey this time.</p>
          <button className="btn mt-1 px-6 py-2" onClick={onMiss}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
