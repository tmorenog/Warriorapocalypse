"use client";

import React, { useEffect, useState } from "react";
import type { Appearance, RoleId } from "@/engine/types";

// Aina's five hand-drawn clan-cat line-art templates, one per role/pose.
export const ROLE_ART: Record<RoleId, string> = {
  Leader: "/art/cats/leader.jpg",
  Deputy: "/art/cats/deputy.jpg",
  Warrior: "/art/cats/warrior.jpg",
  Elder: "/art/cats/elder.jpg",
  Kit: "/art/cats/kit.jpg",
};

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hex2rgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function darken(c: RGB, amt: number): RGB {
  return { r: Math.round(c.r * (1 - amt)), g: Math.round(c.g * (1 - amt)), b: Math.round(c.b * (1 - amt)) };
}

// Decide whether a body pixel should use the darker pattern shade.
function patternDark(pattern: string, x: number, y: number, bw: number): boolean {
  switch (pattern) {
    case "stripe":
      return x % 18 < 5;
    case "tabby":
      return (x + y) % 20 < 5;
    case "spotted": {
      const gx = (x % 16) - 8;
      const gy = (y % 16) - 8;
      return gx * gx + gy * gy < 10;
    }
    case "patched":
      return x > bw * 0.52;
    default:
      return false;
  }
}

// Cache recoloured results so we only process each (art, colour, pattern) once.
const cache = new Map<string, string>();

// Recolour a white line-art drawing: keep the ink outline, flood-fill the
// interior with the chosen colour/pattern, make the background transparent,
// and crop tightly to the cat. Runs in the browser (canvas).
function recolor(img: HTMLImageElement, hex: string, pattern: string): string {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const im = ctx.getImageData(0, 0, w, h);
  const px = im.data;
  const N = w * h;
  const lum = (i: number) => {
    const p = i * 4;
    return px[p] * 0.299 + px[p + 1] * 0.587 + px[p + 2] * 0.114;
  };

  const LINE = 125;
  const R = 4; // dilation radius to bridge small gaps in the outline

  const wall = new Uint8Array(N);
  for (let i = 0; i < N; i++) wall[i] = lum(i) <= LINE ? 1 : 0;

  // Dilate the ink so small gaps in the outline don't let the fill leak out.
  const wall2 = new Uint8Array(N);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!wall[i]) continue;
      for (let dy = -R; dy <= R; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        const rr = R - Math.abs(dy);
        for (let dx = -rr; dx <= rr; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          wall2[ny * w + nx] = 1;
        }
      }
    }
  }

  // Flood the exterior from the borders.
  const outside = new Uint8Array(N);
  const stack: number[] = [];
  const push = (i: number) => {
    if (!outside[i] && !wall2[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }

  // Bounding box over the cat (outline + interior).
  let minx = w, miny = h, maxx = 0, maxy = 0, any = false;
  for (let i = 0; i < N; i++) {
    if (wall[i] || !outside[i]) {
      const x = i % w;
      const y = (i / w) | 0;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
      any = true;
    }
  }
  if (!any) {
    minx = 0; miny = 0; maxx = w - 1; maxy = h - 1;
  }
  const bw = maxx - minx + 1;

  const col = hex2rgb(hex);
  const dk = darken(col, 0.22);
  for (let i = 0; i < N; i++) {
    const p = i * 4;
    if (wall[i]) {
      px[p] = 34; px[p + 1] = 28; px[p + 2] = 22; px[p + 3] = 255; // ink
    } else if (outside[i]) {
      px[p + 3] = 0; // transparent background
    } else {
      const x = (i % w) - minx;
      const y = ((i / w) | 0) - miny;
      const c = patternDark(pattern, x, y, bw) ? dk : col;
      px[p] = c.r; px[p + 1] = c.g; px[p + 2] = c.b; px[p + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);

  // Crop tightly (with a small margin) so every pose is sized consistently.
  const m = Math.round(Math.max(bw, maxy - miny + 1) * 0.05) + 2;
  const cx = Math.max(0, minx - m);
  const cy = Math.max(0, miny - m);
  const cw = Math.min(w - cx, bw + 2 * m);
  const ch = Math.min(h - cy, maxy - miny + 1 + 2 * m);
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  out.getContext("2d")!.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
  return out.toDataURL("image/png");
}

interface Props {
  role: RoleId;
  appearance: Appearance;
  cosmetics?: string[];
  size?: number;
  dimmed?: boolean;
  turned?: boolean;
  facing?: "left" | "right";
  className?: string;
}

export function ClanCat({ role, appearance, size = 88, dimmed, turned, facing = "right", className }: Props) {
  const src = ROLE_ART[role] ?? ROLE_ART.Warrior;
  const color = turned ? "#b9b2c6" : appearance.furColor;
  const pattern = appearance.furPattern || "solid";
  const key = `${src}|${color}|${pattern}`;
  const [url, setUrl] = useState<string | null>(() => cache.get(key) ?? null);

  useEffect(() => {
    if (cache.has(key)) {
      setUrl(cache.get(key)!);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const u = recolor(img, color, pattern);
        cache.set(key, u);
        setUrl(u);
      } catch {
        setUrl(src);
      }
    };
    img.onerror = () => {
      if (!cancelled) setUrl(src);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [key, src, color, pattern]);

  return (
    <div
      className={className}
      style={{ width: size, height: size, display: "inline-block", lineHeight: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url ?? src}
        alt={`${role} cat`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: url ? (dimmed ? 0.4 : 1) : 0,
          transform: facing === "left" ? "scaleX(-1)" : undefined,
          filter: turned ? "grayscale(0.3)" : undefined,
          transition: "opacity 0.2s",
        }}
      />
    </div>
  );
}
