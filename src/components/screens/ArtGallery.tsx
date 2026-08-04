"use client";

import React, { useEffect, useState } from "react";

// All artwork here is hand-drawn by Aina. Three sections: her original characters,
// her Warriors fan art, and a frame-by-frame animation.
const OCS = [
  "/art/gallery/heart-cat.jpg",
  "/art/gallery/cocoa-kit.jpg",
  "/art/gallery/snow-cat.jpg",
  "/art/gallery/angel-cat.jpg",
];
const FAN_ART = [
  "/art/gallery/fanart/fan-gray.jpg",
  "/art/gallery/fanart/fan-orange-kit.jpg",
  "/art/gallery/fanart/fan-black.jpg",
  "/art/gallery/fanart/fan-gray-tabby.jpg",
];
// Aina's animation, played at 4 fps.
const ANIM_FRAMES = [
  "/art/gallery/anim/frame1.jpg",
  "/art/gallery/anim/frame2.jpg",
  "/art/gallery/anim/frame3.jpg",
  "/art/gallery/anim/frame4.jpg",
  "/art/gallery/anim/frame5.jpg",
];
const ANIM_FPS = 4;

function Grid({ images, onOpen }: { images: string[]; onOpen: (src: string) => void }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {images.map((src) => (
        <button
          key={src}
          onClick={() => onOpen(src)}
          className="overflow-hidden rounded-lg border border-fern/20 bg-white/5"
          aria-label="View artwork"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Aina's artwork" className="aspect-square w-full object-cover transition duration-200 hover:scale-105" loading="lazy" />
        </button>
      ))}
    </div>
  );
}

// Plays Aina's hand-drawn frames as a loop at 4 fps, with a play/pause toggle.
function AnimationPlayer({ onOpen }: { onOpen: (src: string) => void }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % ANIM_FRAMES.length), 1000 / ANIM_FPS);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div className="mt-2">
      <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg border border-fern/20 bg-white">
        <button onClick={() => onOpen(ANIM_FRAMES[frame])} className="block w-full" aria-label="Enlarge animation frame">
          {/* Stack all frames so they're preloaded; show only the current one. */}
          <div className="relative aspect-square w-full">
            {ANIM_FRAMES.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt="Aina's animation"
                className="absolute inset-0 h-full w-full object-contain"
                style={{ opacity: i === frame ? 1 : 0 }}
              />
            ))}
          </div>
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button className="btn px-3 py-1 text-xs" onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <span className="text-[11px] text-parchment/45">4 fps · frame {frame + 1}/{ANIM_FRAMES.length}</span>
      </div>
    </div>
  );
}

export function ArtGallery() {
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <section className="mt-4 rounded-xl border border-fern/20 bg-black/25 p-3">
      <h2 className="font-display text-lg text-fern">Art by Aina</h2>
      <p className="text-[11px] text-parchment/50">Every drawing in this game is hand-made by Aina. A few of her pieces:</p>

      <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-parchment/70">My OCs</h3>
      <Grid images={OCS} onOpen={setZoom} />

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-parchment/70">Fan Art</h3>
      <Grid images={FAN_ART} onOpen={setZoom} />

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-parchment/70">Animation</h3>
      <AnimationPlayer onOpen={setZoom} />

      {zoom && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-night/95 p-4 animate-fade-in"
          onClick={() => setZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Aina's artwork, enlarged" className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
          <button className="absolute right-4 top-4 btn px-3 py-1" onClick={() => setZoom(null)} aria-label="Close">
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
