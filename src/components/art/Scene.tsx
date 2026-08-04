"use client";

import React, { useEffect, useState } from "react";
import type { WeatherId } from "@/engine/types";

interface SceneProps {
  weather: WeatherId;
  variant?: "forest" | "water" | "den" | "rocky" | "camp";
  night?: boolean;
  children?: React.ReactNode;
  height?: number | string;
  // Appearance for each cat Aina drew, in DEN_CAT_BOXES order (undefined = leave
  // white). Used to tint her drawing so the den cats show the player's colours,
  // eyes, and pattern.
  denCats?: (DenCatLook | undefined)[];
  // Live values written into the drawing's "coins" box and "Day:" blank.
  day?: number;
  coins?: number;
}

export interface DenCatLook {
  fur?: string;
  eye?: string;
  pattern?: string;
  marking?: string;
  // Erase this spot's drawn cat (paint it out with the den background) instead of
  // tinting it — used where a finished-art cat (Mapleshade) draws her own art.
  erase?: boolean;
}

// Aina's exact den drawing, used as the den background. The den scene is locked
// to this image's aspect ratio so the cats line up on the perches on any screen.
export const DEN_IMAGE = "/art/scenes/den-aina.jpg";
export const DEN_ASPECT = 1462 / 1110;

// Bounding boxes (as fractions of the image) enclosing each white cat Aina drew,
// in the same order as the den tap-spots: centre log, left stump, right rock,
// barrel, ground. Used to tint just that cat's white fur.
export const DEN_CAT_BOXES: [number, number, number, number][] = [
  [0.37, 0.35, 0.55, 0.62], // centre cut-log (sitting)
  [0.03, 0.44, 0.31, 0.64], // left mossy stump (standing, big tail)
  [0.69, 0.55, 0.88, 0.69], // right rock (curled)
  [0.6, 0.7, 0.74, 0.88], // water barrel
  [0.74, 0.85, 0.84, 0.97], // tiny ground cat
];

// To remove an old drawn cat cleanly while keeping the log: above the perch the
// area is plain taupe, so paint it out fully (removes the cat's head/ears/tail
// and its outline); on the perch, remove only the white fill (keep the log's
// colour), and the new cat's art covers the rest. {x0,x1,top,perchY,bot} in
// image fractions. perchY == top means "all on-perch" (e.g. the rock).
interface DenErase {
  x0: number;
  x1: number;
  top: number;
  perchY: number;
  bot: number;
}
const DEN_ERASE: Record<number, DenErase> = {
  0: { x0: 0.35, x1: 0.575, top: 0.31, perchY: 0.52, bot: 0.6 }, // centre log
  1: { x0: 0.0, x1: 0.335, top: 0.41, perchY: 0.57, bot: 0.72 }, // stump
  2: { x0: 0.66, x1: 0.9, top: 0.52, perchY: 0.52, bot: 0.7 }, // rock (all on-perch)
  3: { x0: 0.565, x1: 0.7, top: 0.66, perchY: 0.9, bot: 0.9 }, // barrel (all taupe, off the rock)
  4: { x0: 0.71, x1: 0.87, top: 0.83, perchY: 0.97, bot: 0.97 }, // ground (all taupe)
};


function hex2rgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

const denCache = new Map<string, string>();

// Warm the browser cache so the first recolour is quick (no lingering white cats).
if (typeof window !== "undefined") {
  const pre = new window.Image();
  pre.src = DEN_IMAGE;
}

// Does this fur pixel take the darker pattern (marking) colour? Periods scale
// with the cat's box so patterns look right at any size.
function denPatternDark(pattern: string, x: number, y: number, w: number): boolean {
  switch (pattern) {
    case "stripe": {
      const per = Math.max(8, w * 0.16);
      return x % per < per * 0.4;
    }
    case "tabby": {
      const per = Math.max(6, w * 0.12);
      const s = x + Math.sin(y * 0.05) * per * 0.5;
      return (((s % per) + per) % per) < per * 0.34;
    }
    case "spotted":
    case "tortoiseshell": {
      const per = Math.max(10, w * 0.2);
      const gx = (x % per) - per / 2;
      const gy = (y % per) - per / 2;
      const r = per * 0.26;
      return gx * gx + gy * gy < r * r;
    }
    case "patched": {
      const cell = w * 0.42;
      return (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
    }
    default:
      return false;
  }
}

// Tint the white cats in Aina's drawing to each clan cat's colours, keeping her
// black ink lines. Fur takes the fur colour + pattern; the small enclosed white
// regions (the eyes) take the eye colour.
function recolorDen(img: HTMLImageElement, cats: (DenCatLook | undefined)[]): string {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  // Sample the empty background (top-centre of the drawing) so an erased spot
  // blends in seamlessly.
  const bgPix = ctx.getImageData(Math.floor(W * 0.5), Math.floor(H * 0.22), 1, 1).data;
  const bgCss = `rgb(${bgPix[0]},${bgPix[1]},${bgPix[2]})`;

  DEN_CAT_BOXES.forEach((box, i) => {
    const look = cats[i];
    if (!look) return;

    // Erase: paint the whole spot (drawn cat + its perch) out with the background
    // so a finished-art cat can stand there with nothing peeking behind.
    if (look.erase) {
      const r = DEN_ERASE[i];
      const X0 = Math.max(0, Math.floor((r ? r.x0 : box[0]) * W));
      const X1 = Math.min(W, Math.ceil((r ? r.x1 : box[2]) * W));
      const TOP = Math.max(0, Math.floor((r ? r.top : box[1]) * H));
      const MID = Math.max(0, Math.floor((r ? r.perchY : box[1]) * H));
      const BOT = Math.min(H, Math.ceil((r ? r.bot : box[3] + 0.12) * H));
      // Above the perch (plain taupe): paint the whole strip out — removes the
      // old cat's upper body AND its outline.
      if (MID > TOP && X1 > X0) {
        ctx.fillStyle = bgCss;
        ctx.fillRect(X0, TOP, X1 - X0, MID - TOP);
      }
      // On the perch: remove only the old cat's near-white fill AND its dark
      // outline pixels that are thin (the cat's ink) — but keep the perch. We do
      // this by replacing near-white with the perch colour sampled just below.
      if (BOT > MID && X1 > X0) {
        const eid = ctx.getImageData(X0, MID, X1 - X0, BOT - MID);
        const ed = eid.data;
        const cnt = (X1 - X0) * (BOT - MID);
        for (let k = 0; k < cnt; k++) {
          if (Math.min(ed[k * 4], ed[k * 4 + 1], ed[k * 4 + 2]) > 198) {
            ed[k * 4] = bgPix[0];
            ed[k * 4 + 1] = bgPix[1];
            ed[k * 4 + 2] = bgPix[2];
          }
        }
        ctx.putImageData(eid, X0, MID);
      }
      return;
    }

    const fur = hex2rgb(look.fur || "#cccccc");
    const eye = hex2rgb(look.eye || "#4d7fb0");
    const mark = hex2rgb(look.marking || "#efeee9");
    const pattern = look.pattern || "solid";

    const x0 = Math.max(0, Math.floor(box[0] * W));
    const y0 = Math.max(0, Math.floor(box[1] * H));
    const x1 = Math.min(W, Math.ceil(box[2] * W));
    const y1 = Math.min(H, Math.ceil(box[3] * H));
    const w = x1 - x0;
    const h = y1 - y0;
    const id = ctx.getImageData(x0, y0, w, h);
    const d = id.data;
    const n = w * h;

    // Mask of near-white (fur/eye) pixels.
    const mask = new Uint8Array(n);
    const shade = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const R = d[k * 4];
      const G = d[k * 4 + 1];
      const B = d[k * 4 + 2];
      const mn = Math.min(R, G, B);
      if (mn > 196 && Math.max(R, G, B) - mn < 34) {
        mask[k] = 1;
        shade[k] = 0.62 + 0.38 * (mn / 255);
      }
    }

    // Label connected white regions (4-connectivity) to separate eyes from fur.
    const label = new Int32Array(n);
    const sizes: number[] = [0];
    const touch: boolean[] = [false];
    const stack: number[] = [];
    let nextLabel = 1;
    for (let s = 0; s < n; s++) {
      if (!mask[s] || label[s]) continue;
      const lb = nextLabel++;
      sizes[lb] = 0;
      touch[lb] = false;
      stack.push(s);
      label[s] = lb;
      while (stack.length) {
        const c = stack.pop()!;
        const cy = (c / w) | 0;
        const cx = c - cy * w;
        sizes[lb]++;
        if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) touch[lb] = true;
        if (cx > 0 && mask[c - 1] && !label[c - 1]) { label[c - 1] = lb; stack.push(c - 1); }
        if (cx < w - 1 && mask[c + 1] && !label[c + 1]) { label[c + 1] = lb; stack.push(c + 1); }
        if (cy > 0 && mask[c - w] && !label[c - w]) { label[c - w] = lb; stack.push(c - w); }
        if (cy < h - 1 && mask[c + w] && !label[c + w]) { label[c + w] = lb; stack.push(c + w); }
      }
    }
    // Fur is the largest white region.
    let furLabel = 0;
    let furSize = 0;
    for (let lb = 1; lb < nextLabel; lb++) {
      if (sizes[lb] > furSize) { furSize = sizes[lb]; furLabel = lb; }
    }

    for (let k = 0; k < n; k++) {
      if (!mask[k]) continue;
      const lb = label[k];
      const f = shade[k];
      // Small enclosed white blobs that aren't the fur = eyes.
      const isEye = lb !== furLabel && !touch[lb] && sizes[lb] < furSize * 0.16 && sizes[lb] > 3;
      let col = fur;
      if (isEye) {
        col = eye;
      } else if (denPatternDark(pattern, k % w, (k / w) | 0, w)) {
        col = mark;
      }
      const ef = isEye ? 0.85 + 0.15 * (f - 0.62) / 0.38 : f;
      d[k * 4] = Math.round(col.r * ef);
      d[k * 4 + 1] = Math.round(col.g * ef);
      d[k * 4 + 2] = Math.round(col.b * ef);
    }
    ctx.putImageData(id, x0, y0);
  });
  return cv.toDataURL("image/png");
}

function DenBackground({ cats }: { cats: (DenCatLook | undefined)[] }) {
  const key = cats.map((c) => (c ? `${c.fur}:${c.eye}:${c.pattern}:${c.marking}` : "-")).join("|");
  const [url, setUrl] = useState<string | null>(() => denCache.get(key) ?? null);
  useEffect(() => {
    if (denCache.has(key)) {
      setUrl(denCache.get(key)!);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const u = recolorDen(img, cats);
        denCache.set(key, u);
        setUrl(u);
      } catch {
        setUrl(DEN_IMAGE);
      }
    };
    img.onerror = () => {
      if (!cancelled) setUrl(DEN_IMAGE);
    };
    img.src = DEN_IMAGE;
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url ?? DEN_IMAGE} alt="The clan's den" className="absolute inset-0 h-full w-full object-cover" />;
}

// Reusable illustrated scene: layered SVG silhouettes + CSS gradients + weather.
// The "den" variant is Aina's hand-drawn torch-lit cave, with her cats tinted to
// the player's chosen colours.
export function Scene({ weather, variant = "forest", night, children, height = 220, denCats, day, coins }: SceneProps) {
  const isCave = variant === "den";
  if (isCave) {
    // The den IS Aina's drawing. Lock the box to the image's aspect ratio so the
    // cats line up; the taupe matches her paper so any letterbox blends in.
    return (
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-fern/20"
        style={{ background: "#5a4f4f", aspectRatio: `${DEN_ASPECT}`, maxHeight: "72vh" }}
      >
        <DenBackground cats={denCats ?? []} />
        {/* Live values written into the coins box and the "Day:" blank she drew. */}
        {typeof coins === "number" && (
          <span
            className="absolute z-20 font-display font-bold text-[#3a2f26]"
            style={{ left: "7.5%", top: "1.6%", fontSize: "clamp(9px,1.6vw,15px)" }}
          >
            {coins}
          </span>
        )}
        {typeof day === "number" && (
          <span
            className="absolute z-20 font-display font-bold text-parchment"
            style={{ left: "85.5%", top: "2.5%", fontSize: "clamp(11px,2vw,20px)" }}
          >
            {day}
          </span>
        )}
        <div className="relative z-10 h-full">{children}</div>
      </div>
    );
  }
  const sky = night
    ? "linear-gradient(180deg,#0a0e17 0%,#141b2a 60%,#1c2433 100%)"
    : skyFor(weather);
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-fern/20"
      style={{ height, background: sky }}
    >
      <SunMoon night={night} weather={weather} />
      <SceneSilhouette variant={variant} />
      <WeatherOverlay weather={weather} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function skyFor(weather: WeatherId): string {
  switch (weather) {
    case "Storm":
    case "HeavyRain":
      return "linear-gradient(180deg,#20242c 0%,#2c333d 100%)";
    case "Rain":
    case "Fog":
      return "linear-gradient(180deg,#3a424c 0%,#4a5560 100%)";
    case "Snow":
      return "linear-gradient(180deg,#5c6672 0%,#8a94a0 100%)";
    case "Heat":
    case "Drought":
      return "linear-gradient(180deg,#caa15a 0%,#a8763c 100%)";
    case "Cold":
      return "linear-gradient(180deg,#6a7a8a 0%,#93a4b4 100%)";
    case "Flooding":
      return "linear-gradient(180deg,#4a5560 0%,#3a4a5a 100%)";
    default:
      return "linear-gradient(180deg,#3d5a6c 0%,#7a9a6c 100%)";
  }
}

function SunMoon({ night, weather }: { night?: boolean; weather: WeatherId }) {
  const hidden = weather === "Storm" || weather === "HeavyRain" || weather === "Fog";
  if (hidden) return null;
  return (
    <div
      className="absolute rounded-full"
      style={{
        top: 18,
        right: 40,
        width: 42,
        height: 42,
        background: night
          ? "radial-gradient(circle,#e8e8d0,#c8c8b0)"
          : "radial-gradient(circle,#ffe9a8,#f0b64c)",
        boxShadow: night ? "0 0 24px #d8d8c0aa" : "0 0 34px #ffcf6faa",
      }}
    />
  );
}

function SceneSilhouette({ variant }: { variant: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice">
      {/* distant hills */}
      <path d="M0,150 Q100,110 200,140 T400,130 L400,220 L0,220 Z" fill="#2a3a30" opacity="0.7" />
      {variant === "water" && (
        <path d="M0,175 L400,175 L400,220 L0,220 Z" fill="#2f4a5a" opacity="0.85" />
      )}
      {variant === "rocky" && (
        <>
          <polygon points="40,220 110,120 180,220" fill="#3a3a42" />
          <polygon points="150,220 240,100 330,220" fill="#33333b" />
        </>
      )}
      {(variant === "forest" || variant === "camp") && (
        <g>
          {[30, 90, 150, 210, 270, 330, 380].map((x, i) => (
            <g key={x}>
              <rect x={x - 3} y={150 - (i % 3) * 8} width="6" height="70" fill="#1f2a22" />
              <polygon
                points={`${x},${100 - (i % 3) * 10} ${x - 26},${170} ${x + 26},${170}`}
                fill={i % 2 ? "#243a28" : "#1c2e20"}
              />
            </g>
          ))}
        </g>
      )}
      {variant === "camp" && (
        <ellipse cx="200" cy="210" rx="120" ry="26" fill="#1a130e" opacity="0.6" />
      )}
      <path d="M0,190 Q120,175 240,192 T400,188 L400,220 L0,220 Z" fill="#16201a" />
    </svg>
  );
}

export function WeatherOverlay({ weather }: { weather: WeatherId }) {
  if (weather === "Rain" || weather === "HeavyRain" || weather === "Storm") {
    const count = weather === "Rain" ? 26 : 46;
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="absolute animate-rain-fall"
            style={{
              left: `${(i * 97) % 100}%`,
              top: `-10%`,
              width: 1.5,
              height: weather === "Storm" ? 18 : 12,
              background: "linear-gradient(#cfe0ff88,#cfe0ff22)",
              animationDelay: `${(i % 10) * 0.08}s`,
              animationDuration: `${weather === "Storm" ? 0.55 : 0.8}s`,
            }}
          />
        ))}
        {weather === "Storm" && (
          <div className="absolute inset-0 animate-pulse-soft" style={{ background: "radial-gradient(circle at 60% 20%, #ffffff22, transparent 40%)" }} />
        )}
      </div>
    );
  }
  if (weather === "Snow") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 34 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-rain-fall"
            style={{
              left: `${(i * 89) % 100}%`,
              top: "-10%",
              width: 4,
              height: 4,
              background: "#ffffffcc",
              animationDelay: `${(i % 12) * 0.2}s`,
              animationDuration: `${2.2 + (i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>
    );
  }
  if (weather === "Fog") {
    return <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg,#c8d0d833,#c8d0d866)" }} />;
  }
  if (weather === "Heat" || weather === "Drought") {
    return <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, #ffcf6f33, transparent 55%)" }} />;
  }
  if (weather === "Flooding") {
    return <div className="pointer-events-none absolute bottom-0 left-0 right-0" style={{ height: "40%", background: "linear-gradient(180deg,#3a5a6a55,#2a4a5aaa)" }} />;
  }
  return null;
}
