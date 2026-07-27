import React from "react";
import type { Appearance } from "@/engine/types";
import { COSMETICS_BY_ID } from "@/data/cosmetics";
import { shade, hashId } from "./color";

export type SpriteAction = "idle" | "walk" | "pounce" | "hit" | "hurt";

interface Props {
  appearance: Appearance;
  cosmetics?: string[];
  size?: number;
  facing?: "left" | "right";
  action?: SpriteAction;
  dimmed?: boolean;
  turned?: boolean;
}

// A fully original, side-view full-body cat drawn from layered SVG shapes.
// It is alive: it breathes, blinks, flicks its tail and ears when idle, and
// its legs step + body bobs when walking. No emoji, no external assets.
export function CatSprite({
  appearance,
  cosmetics = [],
  size = 96,
  facing = "right",
  action = "idle",
  dimmed,
  turned,
}: Props) {
  const fur = turned ? "#4a3a55" : appearance.furColor;
  const furDark = shade(fur, -0.28);
  const furLight = shade(fur, 0.18);
  const belly = shade(fur, 0.35);
  const eye = turned ? "#c94a4a" : appearance.eyeColor;
  const walking = action === "walk";
  const uid = hashId(fur + appearance.eyeColor + appearance.tailStyle);

  const legAnim = walking ? "a-leg-a" : "";
  const legAnimB = walking ? "a-leg-b" : "";
  const bodyAnim = walking ? "a-bob" : "a-breathe";
  const tailAnim = walking || action === "pounce" ? "a-tail-fast" : "a-tail";
  const rootAnim = action === "pounce" ? "a-pounce" : action === "hit" || action === "hurt" ? "a-hit" : "";

  // Leg helper — a rounded limb rotating about its hip.
  const Leg = ({ x, hipY, len, cls, back }: { x: number; hipY: number; len: number; cls: string; back?: boolean }) => (
    <g className={`spr ${cls}`} style={{ transformOrigin: `${x}px ${hipY}px` }}>
      <rect x={x - 4} y={hipY} width={8} height={len} rx={4} fill={back ? furDark : fur} />
      <ellipse cx={x} cy={hipY + len} rx={5.5} ry={3.5} fill={shade(fur, back ? -0.35 : -0.1)} />
    </g>
  );

  return (
    <svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 120 94"
      role="img"
      aria-label="Cat"
      style={{ opacity: dimmed ? 0.4 : 1, overflow: "visible", filter: turned ? "grayscale(0.25)" : undefined }}
    >
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={furLight} />
          <stop offset="100%" stopColor={fur} />
        </linearGradient>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="60" cy="86" rx="42" ry="6" fill="#000" opacity="0.28" />

      <g transform={facing === "left" ? "translate(120,0) scale(-1,1)" : undefined}>
        <g className={`spr ${rootAnim}`} style={{ transformOrigin: "60px 60px" }}>
          {/* Tail (behind body) */}
          <g className={`spr ${tailAnim}`} style={{ transformOrigin: "26px 50px" }}>
            <path
              d="M26,50 C6,46 2,28 14,20 C16,26 18,34 30,44 Z"
              fill={fur}
              stroke={furDark}
              strokeWidth="1"
            />
            {appearance.tailStyle === "tipped" && <circle cx="12" cy="21" r="5" fill="#eef0ee" />}
            {appearance.tailStyle === "fluffy" && <circle cx="12" cy="22" r="7" fill={furLight} />}
          </g>

          {/* Back legs */}
          <Leg x={40} hipY={58} len={22} cls={legAnimB} back />
          <Leg x={50} hipY={58} len={22} cls={legAnim} back />

          {/* Body */}
          <g className={`spr ${bodyAnim}`} style={{ transformOrigin: "58px 50px" }}>
            <ellipse cx="58" cy="50" rx="36" ry="18" fill={`url(#body-${uid})`} stroke={furDark} strokeWidth="1.2" />
            <ellipse cx="58" cy="60" rx="30" ry="9" fill={belly} opacity="0.7" />
            {/* pattern */}
            {appearance.furPattern === "tabby" && (
              <g stroke={furDark} strokeWidth="2" opacity="0.55" fill="none">
                <path d="M46,36 q3,8 0,16" /><path d="M58,35 q3,9 0,18" /><path d="M70,37 q3,7 0,14" />
              </g>
            )}
            {appearance.furPattern === "stripe" && <path d="M30,44 h56" stroke={furDark} strokeWidth="4" opacity="0.5" />}
            {appearance.furPattern === "spotted" && (
              <g fill={furDark} opacity="0.45">
                <circle cx="48" cy="46" r="3" /><circle cx="62" cy="44" r="3" /><circle cx="74" cy="48" r="3" />
              </g>
            )}
            {appearance.furPattern === "patched" && <path d="M60,34 q26,2 28,20 q-16,6 -28,2 z" fill={shade(fur, -0.4)} opacity="0.5" />}
            <CosmeticBody cosmetics={cosmetics} color={fur} />
          </g>

          {/* Front legs */}
          <Leg x={78} hipY={58} len={22} cls={legAnim} />
          <Leg x={88} hipY={58} len={22} cls={legAnimB} />

          {/* Head */}
          <g className={`spr ${walking ? "" : "a-head"}`} style={{ transformOrigin: "96px 34px" }}>
            {/* ears */}
            <g className={`spr ${walking ? "" : "a-ear"}`} style={{ transformOrigin: "90px 24px" }}>
              <polygon points="84,26 82,8 96,20" fill={fur} stroke={furDark} strokeWidth="1" />
              <polygon points="85,24 84,13 93,20" fill={shade(fur, 0.2)} />
            </g>
            <g className={`spr ${walking ? "" : "a-ear"}`} style={{ transformOrigin: "104px 22px" }}>
              <polygon points="100,22 106,6 112,24" fill={fur} stroke={furDark} strokeWidth="1" />
              <polygon points="102,22 106,11 109,23" fill={shade(fur, 0.2)} />
            </g>
            {appearance.earShape === "tufted" && (
              <>
                <path d="M88,10 q-3,-4 -1,-8" stroke={furDark} strokeWidth="1.4" fill="none" />
                <path d="M106,8 q3,-4 1,-8" stroke={furDark} strokeWidth="1.4" fill="none" />
              </>
            )}

            {/* head shape */}
            <ellipse cx="96" cy="36" rx="18" ry="16" fill={`url(#body-${uid})`} stroke={furDark} strokeWidth="1.2" />
            {/* muzzle */}
            <ellipse cx="107" cy="40" rx="8" ry="7" fill={belly} />
            {/* eye (blinks) */}
            <g className={`spr a-blink`} style={{ transformOrigin: "101px 33px" }}>
              <ellipse cx="101" cy="33" rx="4.5" ry="5" fill="#0d0f12" />
              <ellipse cx="101" cy="33" rx="3.2" ry="3.8" fill={eye} />
              <ellipse cx="101" cy="33" rx="1.1" ry="3.2" fill="#0b0d10" />
              <circle cx="102" cy="31.5" r="0.9" fill="#fff" opacity="0.85" />
            </g>
            {/* nose + mouth */}
            <polygon points="113,39 109,41 113,43" fill="#caa" />
            <path d="M113,43 q-2,3 -5,2" stroke={furDark} strokeWidth="0.9" fill="none" />
            {/* whiskers */}
            <g stroke="#e8e0cf" strokeWidth="0.6" opacity="0.7">
              <path d="M109,40 h14" /><path d="M109,43 h13" />
            </g>
            {/* scars */}
            {appearance.scars === "eye" && <path d="M101,26 l1.5,12" stroke="#d8c7b0" strokeWidth="1.2" />}
            {appearance.scars === "muzzle" && <path d="M104,40 l7,2" stroke="#d8c7b0" strokeWidth="1.2" />}
            {appearance.scars === "ear" && <path d="M108,8 l3,4" stroke="#d8c7b0" strokeWidth="1.6" />}
            <CosmeticHead cosmetics={cosmetics} />
          </g>
        </g>
      </g>
    </svg>
  );
}

function CosmeticBody({ cosmetics, color }: { cosmetics: string[]; color: string }) {
  return (
    <>
      {cosmetics.map((id) => {
        const cos = COSMETICS_BY_ID[id];
        if (!cos) return null;
        if (cos.slot === "body") return <path key={id} d="M34,44 q24,10 48,0 l0,10 q-24,10 -48,0 z" fill={cos.color} opacity="0.75" />;
        if (cos.slot === "neck") return <path key={id} d="M78,44 q10,6 4,14 l-6,-2 q4,-6 -2,-10 z" fill={cos.color} />;
        if (cos.slot === "marking") return <path key={id} d="M58,40 l-3,7 h6 z" fill={cos.color} opacity="0.8" />;
        return null;
      })}
    </>
  );
}

function CosmeticHead({ cosmetics }: { cosmetics: string[] }) {
  return (
    <>
      {cosmetics.map((id) => {
        const cos = COSMETICS_BY_ID[id];
        if (!cos) return null;
        if (cos.slot === "head") return <path key={id} d="M84,26 q12,-10 24,-2 q-6,5 -12,5 q-7,0 -12,-3 z" fill={cos.color} opacity="0.9" />;
        if (cos.slot === "ear") return <path key={id} d="M106,10 q6,-4 8,-10 q3,7 -2,13 z" fill={cos.color} />;
        return null;
      })}
    </>
  );
}
