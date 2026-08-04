"use client";

import React, { useEffect, useRef, useState } from "react";

// Aina's hand-drawn hunt, played as a tiny game: hold the joystick toward the
// mouse to sneak closer (push harder = creep faster), then POUNCE at the right
// moment. Pounce too early or sneak too far and the mouse gets away — no prey.
const FRAMES = Array.from({ length: 12 }, (_, i) => `/art/gallery/anim-hunt2/frame${i + 1}.jpg`);

// Frames 1..9 are the creep toward the mouse; 10 is the mid-air leap, 11 the
// landing on it, 12 the catch. Walk shows frames 1..9; pounce plays the leap.
const WALK_MAX = 8; // walk step 8 = frame 9 (closest creep); one more = too far
const POUNCE_MIN = 6; // pounce window: frames 7..9, once the cat is near enough
const POUNCE_MAX = 8;
// Pounce → caught plays frames 10..11 (leap + landing), then lands on frame 12.
const POUNCE_FRAMES = [9, 10];
const FPS = 5;

// Joystick feel.
const STICK_R = 52; // px the knob can travel from centre
const DEADZONE = 0.28; // fraction of travel before the cat starts creeping
const CREEP_SPEED = 3.4; // frames per second at a full rightward push

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
  const [knob, setKnob] = useState({ x: 0, y: 0 }); // joystick knob offset (px)

  const baseRef = useRef<HTMLDivElement>(null);
  const pushRef = useRef(0); // rightward push after deadzone, 0..1
  const progRef = useRef(0); // accumulated creep distance (in frames)
  const lastRef = useRef(0);

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

  // The joystick drives the creep: while it's pushed toward the mouse, advance
  // the walk frames over time. Push past the closest creep frame and the mouse
  // bolts, just like sneaking too far.
  useEffect(() => {
    if (phase !== "walk") return;
    let raf = 0;
    let alive = true;
    const tick = (t: number) => {
      if (!alive) return;
      const dt = lastRef.current ? (t - lastRef.current) / 1000 : 0;
      lastRef.current = t;
      if (pushRef.current > 0) {
        progRef.current += pushRef.current * CREEP_SPEED * dt;
        const s = Math.floor(progRef.current);
        if (s > WALK_MAX) {
          alive = false;
          setPhase("missed");
          return;
        }
        setStep(s);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      lastRef.current = 0;
    };
  }, [phase]);

  const moveKnob = (clientX: number, clientY: number) => {
    const b = baseRef.current?.getBoundingClientRect();
    if (!b) return;
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, STICK_R);
    if (dist > 0) {
      dx = (dx / dist) * clamped;
      dy = (dy / dist) * clamped;
    }
    setKnob({ x: dx, y: dy });
    const right = Math.max(0, dx) / STICK_R; // 0..1 toward the mouse
    pushRef.current = right > DEADZONE ? (right - DEADZONE) / (1 - DEADZONE) : 0;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "walk") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveKnob(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (phase !== "walk" || e.buttons === 0) return;
    moveKnob(e.clientX, e.clientY);
  };
  const releaseKnob = () => {
    setKnob({ x: 0, y: 0 });
    pushRef.current = 0;
  };

  const pounce = () => {
    if (phase !== "walk") return;
    if (step >= POUNCE_MIN && step <= POUNCE_MAX) {
      setPhase("pouncing");
      setPi(0);
    } else {
      setPhase("missed"); // pounced too soon (or, in theory, too far)
    }
  };

  let frame = Math.min(step, WALK_MAX);
  if (phase === "pouncing") frame = POUNCE_FRAMES[pi];
  else if (phase === "caught") frame = 11;
  else if (phase === "missed") frame = 0;

  const ready = step >= POUNCE_MIN && step <= POUNCE_MAX;
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
          <p className="mt-2 text-xs text-parchment/60">
            Hold the stick toward the mouse to creep… then pounce when you&apos;re close!
          </p>
          <div className="mt-3 flex w-full max-w-lg items-center justify-between gap-4 px-2">
            {/* Roblox-style joystick: hold/drag toward the mouse to sneak. */}
            <div
              ref={baseRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={releaseKnob}
              onPointerCancel={releaseKnob}
              onLostPointerCapture={releaseKnob}
              className="relative shrink-0 select-none rounded-full border border-parchment/25 bg-black/40"
              style={{ width: STICK_R * 2 + 36, height: STICK_R * 2 + 36, touchAction: "none" }}
              aria-label="Movement joystick — hold toward the mouse to creep closer"
              role="button"
            >
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg opacity-70">
                🐾
              </span>
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-parchment/85 shadow-lg"
                style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
              >
                🐈
              </span>
            </div>

            <button
              className={`btn btn-primary h-24 w-24 shrink-0 rounded-full text-base ${ready ? "ring-4 ring-ember/70 animate-pulse-soft" : ""}`}
              onClick={pounce}
            >
              POUNCE!
            </button>
          </div>
          <p className="mt-2 text-[11px] text-parchment/45">
            {ready ? "Close enough — pounce now!" : "Push the stick right to sneak forward."}
          </p>
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
