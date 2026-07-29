import React from "react";
import { shade } from "./color";
import type { SpriteAction } from "./CatSprite";

interface Props {
  enemyDefId: string;
  size?: number;
  facing?: "left" | "right";
  action?: SpriteAction;
  dimmed?: boolean;
}

interface Look {
  body: string;
  bodyRx: number;
  bodyRy: number;
  earStyle: "small" | "pointed" | "round" | "none";
  tail: "thin" | "bushy" | "stub" | "none";
  eye: string;
  scale: number;
}

// Broad visual archetypes so every enemy reads as a distinct creature — all
// drawn from original layered SVG silhouettes. No emoji.
function lookFor(id: string): Look {
  switch (id) {
    case "rat":
    case "rat_swarm":
      return { body: "#6b6560", bodyRx: 26, bodyRy: 13, earStyle: "round", tail: "thin", eye: "#c94a4a", scale: 0.8 };
    case "infected_cat":
      return { body: "#5a4a66", bodyRx: 34, bodyRy: 16, earStyle: "pointed", tail: "thin", eye: "#b06cff", scale: 1 };
    case "infected_prey":
      return { body: "#6a6255", bodyRx: 24, bodyRy: 12, earStyle: "small", tail: "stub", eye: "#b06cff", scale: 0.78 };
    case "dire_infected":
      return { body: "#4a3a55", bodyRx: 40, bodyRy: 20, earStyle: "pointed", tail: "thin", eye: "#d94a4a", scale: 1.2 };
    case "dog":
      return { body: "#8a6a3a", bodyRx: 40, bodyRy: 19, earStyle: "round", tail: "thin", eye: "#3a2a1a", scale: 1.15 };
    case "fox":
      return { body: "#c9622a", bodyRx: 36, bodyRy: 15, earStyle: "pointed", tail: "bushy", eye: "#3a2a1a", scale: 1.05 };
    case "badger":
      return { body: "#3a3a40", bodyRx: 44, bodyRy: 22, earStyle: "small", tail: "stub", eye: "#1a1a1a", scale: 1.3 };
    case "hostile_survivor":
      return { body: "#7a7268", bodyRx: 34, bodyRy: 16, earStyle: "pointed", tail: "thin", eye: "#c8a13a", scale: 1 };
    default:
      return { body: "#6b6560", bodyRx: 30, bodyRy: 15, earStyle: "pointed", tail: "thin", eye: "#c94a4a", scale: 1 };
  }
}

export function EnemySprite({ enemyDefId, size = 96, facing = "left", action = "idle", dimmed }: Props) {
  const look = lookFor(enemyDefId);
  const dark = shade(look.body, -0.3);
  const light = shade(look.body, 0.15);
  const belly = shade(look.body, 0.28);
  const walking = action === "walk" || action === "idle"; // enemies always prowl a little
  const rootAnim = action === "pounce" ? "a-pounce" : action === "hit" || action === "hurt" ? "a-hit" : "";
  const badger = enemyDefId === "badger";

  const Leg = ({ x, cls, back }: { x: number; cls: string; back?: boolean }) => (
    <g className={`spr ${cls}`} style={{ transformOrigin: `${x}px 58px` }}>
      <rect x={x - 4} y={58} width={8} height={20} rx={4} fill={back ? dark : look.body} />
      <ellipse cx={x} cy={78} rx={5} ry={3} fill={dark} />
    </g>
  );

  return (
    <svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 120 94"
      role="img"
      aria-label={`Enemy: ${enemyDefId}`}
      style={{ opacity: dimmed ? 0.4 : 1, overflow: "visible" }}
    >
      <defs>
        <filter id={`ewob-${enemyDefId}`} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={enemyDefId.length * 7 + 3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <ellipse cx="60" cy="86" rx="40" ry="6" fill="#000" opacity="0.3" />
      <g transform={facing === "left" ? "translate(120,0) scale(-1,1)" : undefined}>
        <g className={`spr ${rootAnim}`} style={{ transformOrigin: "60px 60px" }} filter={`url(#ewob-${enemyDefId})`}>
          <g transform={`translate(60 56) scale(${look.scale}) translate(-60 -56)`}>
            {/* Tail */}
            {look.tail !== "none" && (
              <g className={`spr ${walking ? "a-tail-fast" : "a-tail"}`} style={{ transformOrigin: "26px 50px" }}>
                {look.tail === "thin" && <path d="M26,50 C8,50 4,40 2,52" stroke={look.body} strokeWidth="4" fill="none" strokeLinecap="round" />}
                {look.tail === "bushy" && <path d="M28,50 C6,52 0,30 -2,46 C6,50 14,52 30,52 Z" fill={light} stroke={dark} strokeWidth="1" />}
                {look.tail === "stub" && <ellipse cx="22" cy="50" rx="7" ry="5" fill={look.body} />}
              </g>
            )}

            <Leg x={40} cls={walking ? "a-leg-b" : ""} back />
            <Leg x={50} cls={walking ? "a-leg-a" : ""} back />

            {/* Body */}
            <g className={`spr ${walking ? "a-bob" : "a-breathe"}`} style={{ transformOrigin: "58px 48px" }}>
              <ellipse cx="58" cy="48" rx={look.bodyRx} ry={look.bodyRy} fill={look.body} stroke={dark} strokeWidth="1.2" />
              <ellipse cx="58" cy="56" rx={look.bodyRx - 6} ry={look.bodyRy - 6} fill={belly} opacity="0.6" />
              {badger && <path d="M78,30 L78,66" stroke="#e8e8e8" strokeWidth="6" opacity="0.85" />}
            </g>

            <Leg x={76} cls={walking ? "a-leg-a" : ""} />
            <Leg x={86} cls={walking ? "a-leg-b" : ""} />

            {/* Head */}
            <g className="spr a-head" style={{ transformOrigin: "94px 40px" }}>
              {look.earStyle === "pointed" && (
                <>
                  <polygon points="84,30 82,14 95,26" fill={look.body} stroke={dark} strokeWidth="1" />
                  <polygon points="100,26 106,10 112,28" fill={look.body} stroke={dark} strokeWidth="1" />
                </>
              )}
              {look.earStyle === "round" && (
                <>
                  <circle cx="86" cy="24" r="7" fill={look.body} stroke={dark} strokeWidth="1" />
                  <circle cx="104" cy="22" r="7" fill={look.body} stroke={dark} strokeWidth="1" />
                </>
              )}
              {look.earStyle === "small" && (
                <>
                  <circle cx="88" cy="28" r="4" fill={look.body} />
                  <circle cx="102" cy="27" r="4" fill={look.body} />
                </>
              )}
              {/* snout differs: fox/dog longer */}
              <ellipse cx="96" cy="40" rx="17" ry="14" fill={look.body} stroke={dark} strokeWidth="1.2" />
              {(enemyDefId === "fox" || enemyDefId === "dog" || enemyDefId === "rat" || enemyDefId === "rat_swarm") && (
                <path d="M108,38 L120,44 L108,48 Z" fill={belly} stroke={dark} strokeWidth="1" />
              )}
              <ellipse cx="103" cy="38" rx="8" ry="6" fill={belly} />
              {/* eye */}
              <ellipse cx="99" cy="36" rx="3.6" ry="4" fill="#0d0f12" />
              <ellipse cx="99" cy="36" rx="2.4" ry="2.8" fill={look.eye} />
              <ellipse cx="99" cy="36" rx="0.9" ry="2.4" fill="#0b0d10" />
              {/* nose */}
              <circle cx={enemyDefId === "fox" || enemyDefId === "dog" ? 120 : 111} cy={enemyDefId === "fox" || enemyDefId === "dog" ? 44 : 41} r="2.2" fill="#1a1a1a" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
