import React from "react";
import type { Appearance } from "@/engine/types";
import { COSMETICS_BY_ID } from "@/data/cosmetics";

interface Props {
  appearance: Appearance;
  cosmetics?: string[];
  size?: number;
  dimmed?: boolean;
  turned?: boolean;
}

// Fully original, procedurally drawn cat portrait built from simple layered shapes.
// No external assets. Uses appearance descriptors to vary the look.
export function CatPortrait({ appearance, cosmetics = [], size = 72, dimmed, turned }: Props) {
  const fur = turned ? "#4a3a55" : appearance.furColor;
  const furDark = shade(fur, -0.25);
  const eye = turned ? "#c94a4a" : appearance.eyeColor;
  const earTuft = appearance.earShape === "tufted";
  const rounded = appearance.earShape === "rounded";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Cat portrait"
      style={{ opacity: dimmed ? 0.45 : 1, filter: turned ? "grayscale(0.3)" : undefined }}
    >
      <defs>
        <radialGradient id={`bg-${hashId(fur)}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#2b3540" />
          <stop offset="100%" stopColor="#141a22" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#bg-${hashId(fur)})`} stroke={shade(fur, 0.1)} strokeWidth="2" />

      {/* Ears (twitch) */}
      <g className="spr a-ear" style={{ transformOrigin: "50px 30px" }}>
        <polygon points={rounded ? "26,44 34,20 46,40" : "24,46 32,16 46,40"} fill={fur} stroke={furDark} strokeWidth="1" />
        <polygon points={rounded ? "74,44 66,20 54,40" : "76,46 68,16 54,40"} fill={fur} stroke={furDark} strokeWidth="1" />
        <polygon points="30,40 34,26 41,38" fill={shade(fur, 0.15)} />
        <polygon points="70,40 66,26 59,38" fill={shade(fur, 0.15)} />
        {earTuft && (
          <>
            <path d="M32,18 q-4,-4 -1,-8" stroke={furDark} strokeWidth="1.5" fill="none" />
            <path d="M68,18 q4,-4 1,-8" stroke={furDark} strokeWidth="1.5" fill="none" />
          </>
        )}
      </g>

      {/* Head */}
      <ellipse cx="50" cy="56" rx="30" ry="27" fill={fur} stroke={furDark} strokeWidth="1.5" />

      {/* Pattern */}
      {appearance.furPattern === "tabby" && (
        <g stroke={furDark} strokeWidth="2" fill="none" opacity="0.7">
          <path d="M50,32 v10" />
          <path d="M42,34 q3,6 0,12" />
          <path d="M58,34 q-3,6 0,12" />
        </g>
      )}
      {appearance.furPattern === "stripe" && (
        <path d="M50,30 v22" stroke={furDark} strokeWidth="4" opacity="0.6" />
      )}
      {appearance.furPattern === "spotted" && (
        <g fill={furDark} opacity="0.5">
          <circle cx="38" cy="48" r="2.5" />
          <circle cx="62" cy="48" r="2.5" />
          <circle cx="50" cy="42" r="2.5" />
        </g>
      )}
      {appearance.furPattern === "patched" && (
        <path d="M50,30 q20,4 22,26 q-14,6 -22,2 z" fill={shade(fur, -0.4)} opacity="0.55" />
      )}

      {/* Muzzle */}
      <ellipse cx="50" cy="66" rx="13" ry="10" fill={shade(fur, 0.22)} />
      {/* Eyes (blink) */}
      <g className="spr a-blink" style={{ transformOrigin: "50px 55px" }}>
        <ellipse cx="40" cy="55" rx="6" ry="7" fill="#0d0f12" />
        <ellipse cx="60" cy="55" rx="6" ry="7" fill="#0d0f12" />
        <ellipse cx="40" cy="55" rx="4.5" ry="5.5" fill={eye} />
        <ellipse cx="60" cy="55" rx="4.5" ry="5.5" fill={eye} />
        <ellipse cx="40" cy="55" rx="1.4" ry="4.5" fill="#0b0d10" />
        <ellipse cx="60" cy="55" rx="1.4" ry="4.5" fill="#0b0d10" />
        <circle cx="41.5" cy="53" r="1" fill="#fff" opacity="0.8" />
        <circle cx="61.5" cy="53" r="1" fill="#fff" opacity="0.8" />
      </g>

      {/* Nose + mouth */}
      <polygon points="50,62 46,65 54,65" fill="#caa" />
      <path d="M50,65 q-3,4 -7,3 M50,65 q3,4 7,3" stroke={furDark} strokeWidth="1" fill="none" />

      {/* Whiskers */}
      <g stroke="#e8e0cf" strokeWidth="0.7" opacity="0.7">
        <path d="M38,66 h-16" /><path d="M38,69 h-15" />
        <path d="M62,66 h16" /><path d="M62,69 h15" />
      </g>

      {/* Scars */}
      {appearance.scars === "eye" && <path d="M60,47 l4,14" stroke="#d8c7b0" strokeWidth="1.4" />}
      {appearance.scars === "muzzle" && <path d="M46,64 l8,4" stroke="#d8c7b0" strokeWidth="1.4" />}
      {appearance.scars === "ear" && <path d="M74,28 l4,4" stroke="#d8c7b0" strokeWidth="2" />}

      {/* Cosmetics */}
      {cosmetics.map((cId) => {
        const cos = COSMETICS_BY_ID[cId];
        if (!cos) return null;
        return <CosmeticLayer key={cId} slot={cos.slot} color={cos.color} />;
      })}

      {turned && (
        <g opacity="0.85">
          <path d="M30,74 q20,8 40,0" stroke="#c94a4a" strokeWidth="1.5" fill="none" />
        </g>
      )}
    </svg>
  );
}

function CosmeticLayer({ slot, color }: { slot: string; color: string }) {
  switch (slot) {
    case "head":
      return <path d="M32,28 q18,-12 36,0 q-8,6 -18,6 q-10,0 -18,-6 z" fill={color} opacity="0.9" />;
    case "ear":
      return <path d="M70,22 q8,-6 10,-14 q4,8 -2,16 z" fill={color} />;
    case "neck":
      return <path d="M30,78 q20,10 40,0 l-2,6 q-18,8 -36,0 z" fill={color} opacity="0.9" />;
    case "body":
      return <path d="M24,84 q26,12 52,0 l0,8 q-26,10 -52,0 z" fill={color} opacity="0.85" />;
    case "tail":
      return <circle cx="84" cy="80" r="6" fill={color} opacity="0.9" />;
    case "marking":
      return <path d="M50,40 l-4,8 h8 z" fill={color} opacity="0.8" />;
    default:
      return null;
  }
}

function hashId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

// Lighten/darken a hex color.
function shade(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const adj = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  r = adj(r);
  g = adj(g);
  b = adj(b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
