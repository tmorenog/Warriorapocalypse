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

// A hand-drawn, doodle-style sitting cat — loose wobbly black outlines, big
// expressive eyes, curvy tail. Matches the "Ainawarriors" sketch aesthetic.
// Fully original SVG; the wobble comes from a turbulence displacement filter.
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
  const line = turned ? "#3a2f47" : "#20242c"; // hand-drawn ink
  const belly = shade(fur, 0.5);
  const inner = shade(fur, -0.15);
  const eye = turned ? "#c94a4a" : appearance.eyeColor;
  const uid = hashId(fur + appearance.eyeColor + appearance.tailStyle + appearance.scars);
  const seed = (parseInt(uid, 36) % 90) + 1;

  const walking = action === "walk";
  const rootAnim = action === "pounce" ? "a-pounce" : action === "hit" || action === "hurt" ? "a-hit" : walking ? "a-bob" : "";
  const stroke = 2.4;

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
        <filter id={`wob-${uid}`} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="50" cy="93" rx="30" ry="5" fill="#000" opacity="0.22" />

      <g transform={facing === "left" ? "translate(100,0) scale(-1,1)" : undefined}>
        <g className={`spr ${rootAnim}`} style={{ transformOrigin: "50px 60px" }} filter={`url(#wob-${uid})`}>
          {/* Tail — long and curvy */}
          <g className={`spr ${walking ? "a-tail-fast" : "a-tail"}`} style={{ transformOrigin: "30px 78px" }}>
            <path
              d="M31,80 C10,80 6,54 16,44 C19,47 17,60 26,70 C29,73 33,76 34,78 Z"
              fill={fur}
              stroke={line}
              strokeWidth={stroke}
              strokeLinejoin="round"
            />
            {appearance.tailStyle === "tipped" && <circle cx="15" cy="45" r="4.5" fill="#f2f2ee" stroke={line} strokeWidth="1.6" />}
            {appearance.tailStyle === "fluffy" && <circle cx="15" cy="46" r="6" fill={belly} stroke={line} strokeWidth="1.6" />}
          </g>

          {/* Body — sitting pear shape */}
          <g className="spr a-breathe" style={{ transformOrigin: "50px 66px" }}>
            <path
              d="M50,40 C36,42 30,58 31,74 C32,84 40,90 50,90 C60,90 68,84 69,74 C70,58 64,42 50,40 Z"
              fill={fur}
              stroke={line}
              strokeWidth={stroke}
              strokeLinejoin="round"
            />
            {/* belly */}
            <path d="M50,58 C43,60 40,72 43,82 C46,86 54,86 57,82 C60,72 57,60 50,58 Z" fill={belly} opacity="0.85" />
            {/* front paws */}
            <ellipse cx="44" cy="88" rx="6" ry="4.5" fill={fur} stroke={line} strokeWidth={stroke} />
            <ellipse cx="56" cy="88" rx="6" ry="4.5" fill={fur} stroke={line} strokeWidth={stroke} />
            <path d="M44,85 v6 M56,85 v6" stroke={line} strokeWidth="1.4" />
            {/* pattern */}
            {appearance.furPattern === "tabby" && (
              <g stroke={inner} strokeWidth="2.2" fill="none" opacity="0.7" strokeLinecap="round">
                <path d="M42,50 q3,8 1,16" /><path d="M58,50 q-3,8 -1,16" /><path d="M50,52 v14" />
              </g>
            )}
            {appearance.furPattern === "stripe" && <path d="M50,44 v40" stroke={inner} strokeWidth="4" opacity="0.55" strokeLinecap="round" />}
            {appearance.furPattern === "spotted" && (
              <g fill={inner} opacity="0.5">
                <circle cx="42" cy="62" r="2.6" /><circle cx="58" cy="62" r="2.6" /><circle cx="50" cy="74" r="2.6" />
              </g>
            )}
            {appearance.furPattern === "patched" && <path d="M52,44 q16,4 16,26 q-10,6 -18,2 z" fill={inner} opacity="0.5" />}
            <BodyCosmetics cosmetics={cosmetics} line={line} />
          </g>

          {/* Head */}
          <g className={`spr ${walking ? "" : "a-head"}`} style={{ transformOrigin: "50px 30px" }}>
            {/* Ears */}
            <g className={`spr ${walking ? "" : "a-ear"}`} style={{ transformOrigin: "50px 22px" }}>
              <path d="M38,24 L33,7 L51,19 Z" fill={fur} stroke={line} strokeWidth={stroke} strokeLinejoin="round" />
              <path d="M62,24 L67,7 L49,19 Z" fill={fur} stroke={line} strokeWidth={stroke} strokeLinejoin="round" />
              <path d="M40,20 L37,11 L46,18 Z" fill="#e6a6ad" opacity="0.85" />
              <path d="M60,20 L63,11 L54,18 Z" fill="#e6a6ad" opacity="0.85" />
              {appearance.earShape === "tufted" && (
                <>
                  <path d="M35,8 q-3,-4 -6,-4" stroke={line} strokeWidth="1.6" fill="none" />
                  <path d="M65,8 q3,-4 6,-4" stroke={line} strokeWidth="1.6" fill="none" />
                </>
              )}
            </g>

            {/* Head shape */}
            <ellipse cx="50" cy="32" rx="17" ry="15" fill={fur} stroke={line} strokeWidth={stroke} />

            {/* Eyes — big and a touch worried */}
            <g className="spr a-blink" style={{ transformOrigin: "50px 32px" }}>
              <ellipse cx="43" cy="32" rx="4.2" ry="5.2" fill="#fbfbf7" stroke={line} strokeWidth="1.8" />
              <ellipse cx="57" cy="32" rx="4.2" ry="5.2" fill="#fbfbf7" stroke={line} strokeWidth="1.8" />
              <circle cx="43.5" cy="33" r="2" fill={eye} />
              <circle cx="56.5" cy="33" r="2" fill={eye} />
              <circle cx="43.5" cy="33" r="1" fill="#0b0d10" />
              <circle cx="56.5" cy="33" r="1" fill="#0b0d10" />
              {/* slightly worried upper lids */}
              <path d="M39,29 q4,-2 8,-0.5" stroke={line} strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d="M61,29 q-4,-2 -8,-0.5" stroke={line} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </g>

            {/* Nose + worried mouth */}
            <path d="M48,38 L52,38 L50,41 Z" fill="#c77" stroke={line} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M50,41 q-3,3 -6,1 M50,41 q3,3 6,1" stroke={line} strokeWidth="1.4" fill="none" strokeLinecap="round" />

            {/* Whiskers */}
            <g stroke={line} strokeWidth="1" opacity="0.6" strokeLinecap="round">
              <path d="M36,38 q-8,-1 -12,1" /><path d="M36,41 q-8,1 -12,4" />
              <path d="M64,38 q8,-1 12,1" /><path d="M64,41 q8,1 12,4" />
            </g>

            {/* Scars */}
            {appearance.scars === "eye" && <path d="M57,25 l1.5,13" stroke={line} strokeWidth="1.4" />}
            {appearance.scars === "muzzle" && <path d="M45,39 l7,2" stroke={line} strokeWidth="1.4" />}
            {appearance.scars === "ear" && <path d="M64,10 l3,4" stroke={line} strokeWidth="1.8" />}

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
        if (cos.slot === "body") return <path key={id} d="M34,60 q16,8 32,0 l-2,9 q-14,7 -28,0 z" fill={cos.color} stroke={line} strokeWidth="1.2" opacity="0.85" />;
        if (cos.slot === "neck") return <path key={id} d="M40,52 q10,6 20,0 l-1,5 q-9,5 -18,0 z" fill={cos.color} stroke={line} strokeWidth="1.2" />;
        if (cos.slot === "marking") return <path key={id} d="M50,46 l-3,7 h6 z" fill={cos.color} opacity="0.85" />;
        if (cos.slot === "tail") return <circle key={id} cx="15" cy="47" r="4" fill={cos.color} stroke={line} strokeWidth="1.2" />;
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
        if (cos.slot === "head") return <path key={id} d="M36,22 q14,-9 28,0 q-7,5 -14,5 q-7,0 -14,-5 z" fill={cos.color} stroke={line} strokeWidth="1.2" opacity="0.92" />;
        if (cos.slot === "ear") return <path key={id} d="M64,10 q6,-4 8,-9 q3,7 -2,12 z" fill={cos.color} stroke={line} strokeWidth="1.2" />;
        return null;
      })}
    </>
  );
}
