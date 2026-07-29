import React from "react";
import type { Appearance } from "@/engine/types";
import { COSMETICS_BY_ID } from "@/data/cosmetics";
import { shade, hashId } from "./color";

export type DoodleAction = "idle" | "walk" | "pounce" | "hit" | "hurt";

export interface DoodleCatProps {
  appearance: Appearance;
  cosmetics?: string[];
  size?: number;
  facing?: "left" | "right";
  action?: DoodleAction;
  dimmed?: boolean;
  turned?: boolean;
}

// A hand-drawn cat faithfully matching the shared reference sketch: a sitting
// cat with big worried white eyes + small pupils, tall pointed ears with pink
// inners, a smooth blob body, and a thin curvy tail. Loose wobbly ink outline.
// Fur COLOUR and PATTERN come from the player's chosen appearance.
export function DoodleCat({
  appearance,
  cosmetics = [],
  size = 88,
  facing = "right",
  action = "idle",
  dimmed,
  turned,
}: DoodleCatProps) {
  const fur = turned ? "#c9c2d6" : appearance.furColor;
  const line = turned ? "#3a2f47" : "#26221d"; // hand-drawn ink
  const inner = shade(fur, -0.16);
  const eye = turned ? "#c94a4a" : appearance.eyeColor;
  const uid = hashId(fur + appearance.eyeColor + appearance.tailStyle + appearance.scars);
  const seed = (parseInt(uid, 36) % 90) + 1;
  const earPink = "#e0a7ac";

  const walking = action === "walk";
  const rootAnim = action === "pounce" ? "a-pounce" : action === "hit" || action === "hurt" ? "a-hit" : walking ? "a-bob" : "";
  const sw = 2.1; // thin, sketchy outline

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Cat"
      style={{ opacity: dimmed ? 0.4 : 1, overflow: "visible", filter: turned ? "grayscale(0.15)" : undefined }}
    >
      <defs>
        <filter id={`wob-${uid}`} x="-18%" y="-18%" width="136%" height="136%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="50" cy="92" rx="26" ry="4.5" fill="#000" opacity="0.18" />

      <g transform={facing === "left" ? "translate(100,0) scale(-1,1)" : undefined}>
        <g className={`spr ${rootAnim}`} style={{ transformOrigin: "50px 60px" }} filter={`url(#wob-${uid})`}>
          {/* Tail — thin and curvy, sweeping up the left side */}
          <g className={`spr ${walking ? "a-tail-fast" : "a-tail"}`} style={{ transformOrigin: "33px 74px" }}>
            <path
              d="M34,74 C18,73 9,58 12,45 C13,40 17,40 18,45 C16,55 23,67 37,70 Z"
              fill={fur}
              stroke={line}
              strokeWidth={sw}
              strokeLinejoin="round"
            />
            {appearance.tailStyle === "tipped" && <circle cx="14.5" cy="45" r="4" fill="#f2f2ee" stroke={line} strokeWidth="1.4" />}
            {appearance.tailStyle === "fluffy" && <circle cx="14.5" cy="46" r="5.5" fill={shade(fur, 0.35)} stroke={line} strokeWidth="1.4" />}
          </g>

          {/* Body — a smooth sitting blob */}
          <g className="spr a-breathe" style={{ transformOrigin: "50px 66px" }}>
            <path
              d="M50,45 C34,45 29,63 33,79 C36,89 44,91 50,91 C56,91 64,89 67,79 C71,63 66,45 50,45 Z"
              fill={fur}
              stroke={line}
              strokeWidth={sw}
              strokeLinejoin="round"
            />
            {/* subtle front paw hints */}
            <path d="M45,89 q0,-4 0,-6 M55,89 q0,-4 0,-6" stroke={line} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* pattern (from player's chosen fur pattern) */}
            {appearance.furPattern === "tabby" && (
              <g stroke={inner} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round">
                <path d="M43,54 q3,8 1,15" /><path d="M57,54 q-3,8 -1,15" /><path d="M50,55 v13" />
              </g>
            )}
            {appearance.furPattern === "stripe" && <path d="M50,48 v38" stroke={inner} strokeWidth="3.6" opacity="0.5" strokeLinecap="round" />}
            {appearance.furPattern === "spotted" && (
              <g fill={inner} opacity="0.45">
                <circle cx="43" cy="64" r="2.4" /><circle cx="57" cy="64" r="2.4" /><circle cx="50" cy="75" r="2.4" />
              </g>
            )}
            {appearance.furPattern === "patched" && <path d="M52,48 q15,4 15,25 q-10,6 -17,2 z" fill={inner} opacity="0.45" />}
            <BodyCosmetics cosmetics={cosmetics} line={line} />
          </g>

          {/* Head */}
          <g className={`spr ${walking ? "" : "a-head"}`} style={{ transformOrigin: "50px 28px" }}>
            {/* Ears — tall pointed, pink inner */}
            <g className={`spr ${walking ? "" : "a-ear"}`} style={{ transformOrigin: "50px 20px" }}>
              <path d="M38,23 L33,4 L52,18 Z" fill={fur} stroke={line} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M62,23 L67,4 L48,18 Z" fill={fur} stroke={line} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M40,19 L37,9 L47,17 Z" fill={earPink} opacity="0.9" />
              <path d="M60,19 L63,9 L53,17 Z" fill={earPink} opacity="0.9" />
              {appearance.earShape === "tufted" && (
                <>
                  <path d="M34,6 q-3,-4 -6,-3" stroke={line} strokeWidth="1.4" fill="none" />
                  <path d="M66,6 q3,-4 6,-3" stroke={line} strokeWidth="1.4" fill="none" />
                </>
              )}
            </g>

            {/* Head shape */}
            <ellipse cx="50" cy="30" rx="17.5" ry="15" fill={fur} stroke={line} strokeWidth={sw} />

            {/* Big worried eyes — mostly white with small pupils */}
            <g className="spr a-blink" style={{ transformOrigin: "50px 30px" }}>
              <ellipse cx="43" cy="30" rx="5.4" ry="6.4" fill="#fcfcf8" stroke={line} strokeWidth="1.7" />
              <ellipse cx="57" cy="30" rx="5.4" ry="6.4" fill="#fcfcf8" stroke={line} strokeWidth="1.7" />
              {/* small iris + pupil, set low & inward for a worried look */}
              <circle cx="44" cy="32" r="2.1" fill={eye} opacity="0.8" />
              <circle cx="56" cy="32" r="2.1" fill={eye} opacity="0.8" />
              <circle cx="44" cy="32" r="1.2" fill="#141414" />
              <circle cx="56" cy="32" r="1.2" fill="#141414" />
              <circle cx="44.6" cy="31" r="0.7" fill="#fff" />
              <circle cx="56.6" cy="31" r="0.7" fill="#fff" />
              {/* worried upper lids */}
              <path d="M37.5,27 q5,-2.5 10,0.5" stroke={line} strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d="M62.5,27 q-5,-2.5 -10,0.5" stroke={line} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </g>

            {/* Nose + small worried mouth */}
            <path d="M48,36 L52,36 L50,39 Z" fill="#c86b6b" stroke={line} strokeWidth="1" strokeLinejoin="round" />
            <path d="M50,39 q-3,3 -6,1.5 M50,39 q3,3 6,1.5" stroke={line} strokeWidth="1.3" fill="none" strokeLinecap="round" />

            {/* Whiskers */}
            <g stroke={line} strokeWidth="0.9" opacity="0.55" strokeLinecap="round">
              <path d="M36,36 q-9,-1 -13,1" /><path d="M36,39 q-9,1 -13,4" />
              <path d="M64,36 q9,-1 13,1" /><path d="M64,39 q9,1 13,4" />
            </g>

            {/* Scars */}
            {appearance.scars === "eye" && <path d="M57,23 l1.5,13" stroke={line} strokeWidth="1.3" />}
            {appearance.scars === "muzzle" && <path d="M45,37 l7,2" stroke={line} strokeWidth="1.3" />}
            {appearance.scars === "ear" && <path d="M64,8 l3,4" stroke={line} strokeWidth="1.6" />}

            <HeadCosmetics cosmetics={cosmetics} line={line} />
          </g>
        </g>
      </g>
    </svg>
  );
}

function BodyCosmetics({ cosmetics, line }: { cosmetics: string[]; line: string }) {
  return (
    <>
      {cosmetics.map((id) => {
        const cos = COSMETICS_BY_ID[id];
        if (!cos) return null;
        if (cos.slot === "body") return <path key={id} d="M35,62 q15,7 30,0 l-2,8 q-13,6 -26,0 z" fill={cos.color} stroke={line} strokeWidth="1.1" opacity="0.85" />;
        if (cos.slot === "neck") return <path key={id} d="M41,54 q9,5 18,0 l-1,5 q-8,4 -16,0 z" fill={cos.color} stroke={line} strokeWidth="1.1" />;
        if (cos.slot === "marking") return <path key={id} d="M50,48 l-3,6 h6 z" fill={cos.color} opacity="0.85" />;
        if (cos.slot === "tail") return <circle key={id} cx="14.5" cy="47" r="3.5" fill={cos.color} stroke={line} strokeWidth="1.1" />;
        return null;
      })}
    </>
  );
}

function HeadCosmetics({ cosmetics, line }: { cosmetics: string[]; line: string }) {
  return (
    <>
      {cosmetics.map((id) => {
        const cos = COSMETICS_BY_ID[id];
        if (!cos) return null;
        if (cos.slot === "head") return <path key={id} d="M36,20 q14,-9 28,0 q-7,5 -14,5 q-7,0 -14,-5 z" fill={cos.color} stroke={line} strokeWidth="1.1" opacity="0.92" />;
        if (cos.slot === "ear") return <path key={id} d="M64,8 q6,-4 8,-8 q3,7 -2,11 z" fill={cos.color} stroke={line} strokeWidth="1.1" />;
        return null;
      })}
    </>
  );
}
