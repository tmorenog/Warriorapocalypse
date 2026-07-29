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
function patternDark(pattern: string, x: number, y: number, bw: number): boolean {
  switch (pattern) {
    case "stripe":
      return x % 16 < 5;
    case "tabby":
      return (x + y) % 18 < 5;
    case "spotted": {
      const gx = (x % 15) - 7;
      const gy = (y % 15) - 7;
      return gx * gx + gy * gy < 9;
    }
    case "patched":
      return x > bw * 0.52;
    default:
      return false;
  }
}

const cache = new Map<string, string>();
const PROC_MAX = 440; // cap processing resolution for speed

// Recolour Aina's white line-art:
//  • keep the ink outline
//  • fill the body solidly via a morphological close (dilate → flood → erode),
//    which closes small gaps in loose sketches without eating thin limbs
//  • colour the eyes (small enclosed regions up in the head) with the eye colour
//  • leave stray strokes like tail movement-lines as lines (not filled)
//  • transparent background, cropped tight to the cat
function recolor(img: HTMLImageElement, furHex: string, eyeHex: string, pattern: string): string {
  const scale = Math.min(1, PROC_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const N = w * h;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const im = ctx.getImageData(0, 0, w, h);
  const px = im.data;
  const lum = (i: number) => {
    const p = i * 4;
    return px[p] * 0.299 + px[p + 1] * 0.587 + px[p + 2] * 0.114;
  };
  const LINE = 125;

  const wall = new Uint8Array(N);
  for (let i = 0; i < N; i++) wall[i] = lum(i) <= LINE ? 1 : 0;

  // ink bounding box → closing radius
  let mnx = w, mny = h, mxx = 0, mxy = 0;
  for (let i = 0; i < N; i++) {
    if (wall[i]) {
      const x = i % w, y = (i / w) | 0;
      if (x < mnx) mnx = x;
      if (x > mxx) mxx = x;
      if (y < mny) mny = y;
      if (y > mxy) mxy = y;
    }
  }
  const bw = Math.max(1, mxx - mnx + 1);
  const bh = Math.max(1, mxy - mny + 1);
  const K = Math.max(5, Math.min(10, Math.round(Math.max(bw, bh) * 0.035)));

  const dilate = (m: Uint8Array, R: number) => {
    const o = new Uint8Array(N);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!m[i]) continue;
        for (let dy = -R; dy <= R; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          const rr = R - Math.abs(dy);
          for (let dx = -rr; dx <= rr; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            o[ny * w + nx] = 1;
          }
        }
      }
    }
    return o;
  };
  const floodOutside = (barrier: Uint8Array) => {
    const o = new Uint8Array(N);
    const st: number[] = [];
    const pu = (i: number) => {
      if (!o[i] && !barrier[i]) {
        o[i] = 1;
        st.push(i);
      }
    };
    for (let x = 0; x < w; x++) {
      pu(x);
      pu((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      pu(y * w);
      pu(y * w + w - 1);
    }
    while (st.length) {
      const i = st.pop()!;
      const x = i % w, y = (i / w) | 0;
      if (x > 0) pu(i - 1);
      if (x < w - 1) pu(i + 1);
      if (y > 0) pu(i - w);
      if (y < h - 1) pu(i + w);
    }
    return o;
  };

  // Body: close the outline (dilate K → flood exterior → invert → erode K back).
  const closed = dilate(wall, K);
  const outC = floodOutside(closed);
  const insideC = new Uint8Array(N);
  for (let i = 0; i < N; i++) insideC[i] = outC[i] ? 0 : 1;
  const dist = new Int16Array(N).fill(-1);
  const q: number[] = [];
  for (let i = 0; i < N; i++) if (outC[i]) { dist[i] = 0; q.push(i); }
  let hd = 0;
  while (hd < q.length) {
    const i = q[hd++];
    const d = dist[i];
    if (d >= K) continue;
    const x = i % w, y = (i / w) | 0;
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
    for (const n of nb) if (n >= 0 && dist[n] === -1 && insideC[n]) { dist[n] = d + 1; q.push(n); }
  }
  const sil = new Uint8Array(N);
  for (let i = 0; i < N; i++) sil[i] = insideC[i] && dist[i] === -1 ? 1 : 0;

  // Eyes: cleanly enclosed small regions in the upper head (from the thin-line flood).
  const out0 = floodOutside(wall);
  const inside0 = new Uint8Array(N);
  for (let i = 0; i < N; i++) inside0[i] = out0[i] || wall[i] ? 0 : 1;
  const lab = new Int32Array(N);
  let nl = 0;
  const sz = [0];
  const cySum = [0];
  for (let i = 0; i < N; i++) {
    if (!inside0[i] || lab[i]) continue;
    nl++;
    sz.push(0);
    cySum.push(0);
    const s = [i];
    lab[i] = nl;
    while (s.length) {
      const j = s.pop()!;
      sz[nl]++;
      cySum[nl] += (j / w) | 0;
      const x = j % w, y = (j / w) | 0;
      const nb = [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1];
      for (const n of nb) if (n >= 0 && inside0[n] && !lab[n]) { lab[n] = nl; s.push(n); }
    }
  }
  const area = bw * bh;
  const cand: [number, number][] = [];
  for (let k = 1; k <= nl; k++) {
    const cy = cySum[k] / sz[k];
    if (sz[k] > area * 0.0006 && sz[k] < area * 0.035 && cy < mny + bh * 0.58) cand.push([sz[k], k]);
  }
  cand.sort((a, b) => b[0] - a[0]);
  const eyeLab = new Set<number>(cand.slice(0, 3).map(([, k]) => k));

  const fur = hex2rgb(furHex);
  const dk = darken(fur, 0.22);
  const eye = hex2rgb(eyeHex);
  for (let i = 0; i < N; i++) {
    const p = i * 4;
    if (wall[i]) {
      px[p] = 34; px[p + 1] = 28; px[p + 2] = 22; px[p + 3] = 255;
    } else if (inside0[i] && eyeLab.has(lab[i])) {
      px[p] = eye.r; px[p + 1] = eye.g; px[p + 2] = eye.b; px[p + 3] = 255;
    } else if (sil[i]) {
      const x = (i % w) - mnx;
      const y = ((i / w) | 0) - mny;
      const c = patternDark(pattern, x, y, bw) ? dk : fur;
      px[p] = c.r; px[p + 1] = c.g; px[p + 2] = c.b; px[p + 3] = 255;
    } else {
      px[p + 3] = 0;
    }
  }
  ctx.putImageData(im, 0, 0);

  // crop tight to visible pixels
  let ax = w, ay = h, bx = 0, by = 0;
  for (let i = 0; i < N; i++) {
    if (px[i * 4 + 3] > 0) {
      const x = i % w, y = (i / w) | 0;
      if (x < ax) ax = x;
      if (x > bx) bx = x;
      if (y < ay) ay = y;
      if (y > by) by = y;
    }
  }
  if (bx < ax) { ax = 0; ay = 0; bx = w - 1; by = h - 1; }
  const cw0 = bx - ax + 1;
  const ch0 = by - ay + 1;
  const m = Math.round(Math.max(cw0, ch0) * 0.04) + 2;
  const cx = Math.max(0, ax - m);
  const cy = Math.max(0, ay - m);
  const cw = Math.min(w - cx, cw0 + 2 * m);
  const ch = Math.min(h - cy, ch0 + 2 * m);
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  out.getContext("2d")!.drawImage(cv, cx, cy, cw, ch, 0, 0, cw, ch);
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
  const eyeColor = turned ? "#c94a4a" : appearance.eyeColor;
  const pattern = appearance.furPattern || "solid";
  const key = `${src}|${color}|${eyeColor}|${pattern}`;
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
        const u = recolor(img, color, eyeColor, pattern);
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
  }, [key, src, color, eyeColor, pattern]);

  return (
    <div className={className} style={{ width: size, height: size, display: "inline-block", lineHeight: 0 }}>
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
