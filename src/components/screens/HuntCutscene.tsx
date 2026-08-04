"use client";

import React, { useEffect, useState } from "react";

// Aina's hand-drawn hunt: the cat stalks, pounces, and catches the mouse. Plays
// once at 4 fps, then rests on the final "caught it!" frame.
const FRAMES = Array.from({ length: 12 }, (_, i) => `/art/gallery/anim-hunt/frame${i + 1}.jpg`);
const FPS = 4;

// Warm the cache so the animation plays smoothly the first time.
if (typeof window !== "undefined") {
  FRAMES.forEach((src) => {
    const img = new window.Image();
    img.src = src;
  });
}

export function HuntCutscene({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const done = i >= FRAMES.length - 1;
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setI((v) => v + 1), 1000 / FPS);
    return () => clearTimeout(t);
  }, [i, done]);

  return (
    <div className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-night/95 p-4 animate-fade-in">
      <h2 className="mb-2 font-display text-xl text-parchment">{done ? "Fresh prey!" : "On the hunt…"}</h2>
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-fern/25 bg-white">
        <div className="relative aspect-[4/3] w-full">
          {FRAMES.map((src, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt="A cat hunting a mouse"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: idx === i ? 1 : 0 }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3">
        {done ? (
          <button className="btn btn-primary px-5 py-2" onClick={onDone}>
            Continue
          </button>
        ) : (
          <button className="btn px-3 py-1 text-xs" onClick={onDone}>
            Skip ⏭
          </button>
        )}
      </div>
    </div>
  );
}
