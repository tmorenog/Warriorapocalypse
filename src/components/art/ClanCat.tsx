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

const INK: RGB = { r: 32, g: 27, b: 22 };

// Whether a body pixel takes the darker pattern shade. Periods scale with the
// cat size so patterns look the same at any resolution.
function patternDark(pattern: string, rx: number, ry: number, bw: number): boolean {
  switch (pattern) {
    case "stripe": {
      const per = Math.max(8, bw * 0.14);
      return rx % per < per * 0.42;
    }
    case "tabby": {
      const per = Math.max(6, bw * 0.085);
      const s = rx + Math.sin(ry * 0.06) * per * 0.5;
      return (((s % per) + per) % per) < per * 0.34;
    }
    case "spotted": {
      const per = Math.max(10, bw * 0.13);
      const gx = (rx % per) - per / 2;
      const gy = (ry % per) - per / 2;
      const r = per * 0.22;
      return gx * gx + gy * gy < r * r;
    }
    case "patched":
      return rx > bw * 0.5;
    default:
      return false;
  }
}

// Returns which colour a body pixel takes: base fur, a darker shade, or the
// light marking colour (for bicolor cats — white belly/chest and a face blaze).
function patternZone(
  pattern: string,
  rx: number,
  ry: number,
  bw: number,
  bh: number,
  eyeCx: number,
  eyeTop: number,
): "base" | "dark" | "light" {
  if (pattern === "bicolor" || pattern === "tortoiseshell") {
    const dxc = Math.abs(rx - eyeCx);
    // white blaze from the face down the chest + white paws
    if (ry > eyeTop - bh * 0.03 && ry < eyeTop + bh * 0.5) {
      const t = Math.max(0, (ry - eyeTop) / (bh * 0.5));
      if (dxc < bw * (0.045 + 0.085 * t)) return "light";
    }
    if (ry > bh * 0.9) return "light";
    // tortoiseshell also gets dark dappled spots over the coloured areas
    if (pattern === "tortoiseshell" && patternDark("spotted", rx, ry, bw)) return "dark";
    return "base";
  }
  return patternDark(pattern, rx, ry, bw) ? "dark" : "base";
}

const cache = new Map<string, string>();
const PROC_MAX = 720; // processing resolution — higher = smoother, less pixelated

// Finished art (like Mapleshade) comes on a white page. Flood the outer white to
// transparent so only the cat shows — enclosed whites (belly, paws) stay because
// the flood can't cross her black outlines.
const artCache = new Map<string, string>();
function keyOutWhite(img: HTMLImageElement): string {
  const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  const n = w * h;
  const isBg = (i: number) => {
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    return Math.min(r, g, b) > 206;
  };
  const bg = new Uint8Array(n);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (bg[i] || !isBg(i)) return;
    bg[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const y = (i / w) | 0;
    const x = i - y * w;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  for (let i = 0; i < n; i++) if (bg[i]) d[i * 4 + 3] = 0;
  ctx.putImageData(id, 0, 0);
  return cv.toDataURL("image/png");
}

// Recolour Aina's white line-art, keeping her soft pencil lines:
//  • fill the body via a morphological close (dilate → flood → erode) so loose
//    sketches fill solidly without eating thin limbs
//  • colour the eyes (small enclosed regions up in the head) with the eye colour
//  • composite Aina's ANTI-ALIASED lines on top (no hard/binarised edges)
//  • NO colour outside the lines — the exterior stays transparent; only stray
//    strokes like tail movement-lines remain, drawn as lines
function recolor(img: HTMLImageElement, furHex: string, eyeHex: string, pattern: string, markingHex: string): string {
  const scale = Math.min(1, PROC_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const N = w * h;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);
  const im = ctx.getImageData(0, 0, w, h);
  const px = im.data;
  const lumAt = (i: number) => {
    const p = i * 4;
    return px[p] * 0.299 + px[p + 1] * 0.587 + px[p + 2] * 0.114;
  };
  const lumArr = new Float32Array(N);
  for (let i = 0; i < N; i++) lumArr[i] = lumAt(i);

  const LINE = 130; // topology threshold
  const wall = new Uint8Array(N);
  for (let i = 0; i < N; i++) wall[i] = lumArr[i] <= LINE ? 1 : 0;

  // ink bbox → closing radius
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
  const K = Math.max(6, Math.min(14, Math.round(Math.max(bw, bh) * 0.03)));

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

  // Body: close the outline then erode back (fills gaps, keeps thin limbs).
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

  // Eyes: cleanly enclosed small regions up in the head. Use a slightly dilated
  // barrier so an eye whose outline has a tiny gap still reads as enclosed
  // (otherwise only one eye would get coloured).
  const eyeBarrier = dilate(wall, 2);
  const out0 = floodOutside(eyeBarrier);
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

  // Eye anchor (relative to bbox) — used to place a face blaze on bicolor cats.
  let exSum = 0, eyN = 0, eyMinY = h;
  for (let i = 0; i < N; i++) {
    if (inside0[i] && eyeLab.has(lab[i])) {
      exSum += i % w;
      eyN++;
      const y = (i / w) | 0;
      if (y < eyMinY) eyMinY = y;
    }
  }
  const eyeCx = eyN ? exSum / eyN - mnx : bw / 2;
  const eyeTop = eyN ? eyMinY - mny : bh * 0.2;

  const fur = hex2rgb(furHex);
  const dk = darken(fur, 0.24);
  const eye = hex2rgb(eyeHex);
  const marking = hex2rgb(markingHex);

  for (let i = 0; i < N; i++) {
    const p = i * 4;
    const L = lumArr[i];
    // soft ink coverage → anti-aliased lines
    let a = (165 - L) / 90;
    a = a < 0 ? 0 : a > 1 ? 1 : a;
    const isEye = inside0[i] && eyeLab.has(lab[i]);
    if (isEye || sil[i]) {
      let base: RGB;
      if (isEye) base = eye;
      else {
        const rx = (i % w) - mnx;
        const ry = ((i / w) | 0) - mny;
        const zone = patternZone(pattern, rx, ry, bw, bh, eyeCx, eyeTop);
        base = zone === "light" ? marking : zone === "dark" ? dk : fur;
      }
      px[p] = Math.round(base.r * (1 - a) + INK.r * a);
      px[p + 1] = Math.round(base.g * (1 - a) + INK.g * a);
      px[p + 2] = Math.round(base.b * (1 - a) + INK.b * a);
      px[p + 3] = 255;
    } else if (a > 0.1) {
      // stray / boundary lines (e.g. movement lines): keep as ink, no colour
      px[p] = INK.r; px[p + 1] = INK.g; px[p + 2] = INK.b;
      px[p + 3] = Math.round(a * 255);
    } else {
      px[p + 3] = 0; // background — nothing outside the lines
    }
  }
  ctx.putImageData(im, 0, 0);

  // crop to visible pixels
  let ax = w, ay = h, bx = 0, by = 0;
  for (let i = 0; i < N; i++) {
    if (px[i * 4 + 3] > 8) {
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
  // When true the cat fills its parent box (used to seat cats onto Aina's den
  // drawing, where the perch size is controlled by a percentage-sized wrapper).
  fill?: boolean;
  dimmed?: boolean;
  turned?: boolean;
  facing?: "left" | "right";
  className?: string;
}

export function ClanCat({ role, appearance, size = 88, fill, dimmed, turned, facing = "right", className }: Props) {
  const src = ROLE_ART[role] ?? ROLE_ART.Warrior;
  const color = turned ? "#b9b2c6" : appearance.furColor;
  const eyeColor = turned ? "#c94a4a" : appearance.eyeColor;
  const pattern = appearance.furPattern || "solid";
  const marking = appearance.markingColor || "#eef0ee";
  const key = `${src}|${color}|${eyeColor}|${pattern}|${marking}`;
  const [url, setUrl] = useState<string | null>(() => cache.get(key) ?? null);

  // Cut the white page out of finished art (e.g. Mapleshade) so no white box shows.
  const artSrc = appearance.artSrc;
  const [artUrl, setArtUrl] = useState<string | null>(() => (artSrc ? artCache.get(artSrc) ?? null : null));
  useEffect(() => {
    if (!artSrc) return;
    if (artCache.has(artSrc)) {
      setArtUrl(artCache.get(artSrc)!);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const u = keyOutWhite(img);
        artCache.set(artSrc, u);
        setArtUrl(u);
      } catch {
        setArtUrl(artSrc);
      }
    };
    img.onerror = () => {
      if (!cancelled) setArtUrl(artSrc);
    };
    img.src = artSrc;
    return () => {
      cancelled = true;
    };
  }, [artSrc]);

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
        const u = recolor(img, color, eyeColor, pattern, marking);
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
  }, [key, src, color, eyeColor, pattern, marking]);

  // A character with finished, ready-coloured art (e.g. Mapleshade) uses it as-is
  // (background cut out) instead of the recoloured template.
  if (artSrc) {
    return (
      <div
        className={className}
        style={fill ? { width: "100%", height: "100%", lineHeight: 0 } : { width: size, height: size, display: "inline-block", lineHeight: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artUrl ?? artSrc}
          alt="cat"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom",
            opacity: artUrl ? (dimmed ? 0.4 : 1) : 0,
            transform: facing === "left" ? "scaleX(-1)" : undefined,
            transition: "opacity 0.2s",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={fill ? { width: "100%", height: "100%", lineHeight: 0 } : { width: size, height: size, display: "inline-block", lineHeight: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url ?? src}
        alt={`${role} cat`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "bottom",
          opacity: url ? (dimmed ? 0.4 : 1) : 0,
          transform: facing === "left" ? "scaleX(-1)" : undefined,
          filter: turned ? "grayscale(0.3)" : undefined,
          transition: "opacity 0.2s",
        }}
      />
    </div>
  );
}
