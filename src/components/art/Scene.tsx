import React from "react";
import type { WeatherId } from "@/engine/types";

interface SceneProps {
  weather: WeatherId;
  variant?: "forest" | "water" | "den" | "rocky" | "camp";
  night?: boolean;
  children?: React.ReactNode;
  height?: number | string;
  day?: number;
  coins?: number;
}

// Where each cat stands in the den, matching Aina's drawing: the player's cats
// are seated on the perches in this order. (x, y) is where a cat's feet rest,
// as a percentage of the scene box, so it lines up on any screen size.
export interface DenPerch {
  x: number;
  y: number;
  size: number;
  facing: "left" | "right";
}
export const DEN_PERCHES: DenPerch[] = [
  { x: 46, y: 57, size: 116, facing: "right" }, // centre cut-log (hero spot)
  { x: 20, y: 60, size: 98, facing: "right" }, // left mossy stump
  { x: 79, y: 57, size: 98, facing: "left" }, // right rock
  { x: 63, y: 82, size: 78, facing: "right" }, // water barrel
  { x: 88, y: 93, size: 52, facing: "left" }, // ground
];

// Reusable illustrated scene: layered SVG silhouettes + CSS gradients + weather.
// The "den" variant is a hand-drawn torch-lit cave with stump / log / rock / barrel
// perches, recreating Aina's reference art.
export function Scene({ weather, variant = "forest", night, children, height = 220, day, coins }: SceneProps) {
  const isCave = variant === "den";
  const sky = isCave
    ? "linear-gradient(180deg,#5f5551 0%,#544a46 60%,#4a413d 100%)"
    : night
      ? "linear-gradient(180deg,#0a0e17 0%,#141b2a 60%,#1c2433 100%)"
      : skyFor(weather);
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-fern/20"
      style={{ height, background: sky }}
    >
      {isCave ? (
        <DenLayer day={day} coins={coins} />
      ) : (
        <>
          <SunMoon night={night} weather={weather} />
          <SceneSilhouette variant={variant} />
          <WeatherOverlay weather={weather} />
        </>
      )}
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

// ---- The den: Aina's torch-lit cave with stump, log, rock and barrel ----

const INK = "#191410";

// A furniture piece anchored by its top-centre, sized by height so its surface
// lands on the matching cat perch regardless of the scene's aspect ratio.
function Piece({
  x,
  top,
  h,
  vb,
  children,
  z = 2,
}: {
  x: number;
  top: number;
  h: number;
  vb: string;
  children: React.ReactNode;
  z?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${top}%`, height: `${h}%`, transform: "translateX(-50%)", zIndex: z }}
    >
      <svg viewBox={vb} className="h-full w-auto" style={{ overflow: "visible" }}>
        {children}
      </svg>
    </div>
  );
}

function Sprout() {
  return (
    <path
      d="M20,38 C20,25 12,21 7,19 C14,19 20,23 20,30 C20,23 26,19 33,19 C28,21 20,25 20,38 Z"
      fill="#4f8a3a"
      stroke={INK}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  );
}

function DenLayer({ day, coins }: { day?: number; coins?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* soft dark vignette like the reference */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(115% 85% at 50% 42%, transparent 52%, rgba(0,0,0,0.32))" }} />

      {/* wall torches, tilted in from each side */}
      <Torch x={7} y={40} tilt={-24} />
      <Torch x={91} y={42} tilt={22} />

      {/* left: mossy stump */}
      <Piece x={20} top={52} h={34} vb="0 0 100 96" z={2}>
        {/* trunk */}
        <path d="M15,30 C15,25 31,19 50,19 C69,19 85,25 85,30 L81,80 C81,88 66,93 50,93 C34,93 19,88 19,80 Z" fill="#6f4a2c" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M34,40 L31,74 M52,44 L52,80 M70,42 L72,74" stroke="#492f1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* moss cap */}
        <ellipse cx="50" cy="26" rx="37" ry="13" fill="#4f7d38" stroke={INK} strokeWidth="4" />
        <ellipse cx="40" cy="24" rx="9" ry="4" fill="#5f9143" />
        <ellipse cx="62" cy="28" rx="7" ry="3.4" fill="#3f6a2c" />
        {/* little sprout at the base */}
        <path d="M84,86 C90,80 96,80 99,82 C94,84 89,88 86,92 Z" fill="#4f8a3a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </Piece>

      {/* centre: cut log with a blue water puddle at its foot */}
      <Piece x={46} top={43} h={46} vb="0 0 124 108" z={3}>
        {/* puddle behind */}
        <ellipse cx="62" cy="95" rx="60" ry="10" fill="#a6c6d5" stroke="#7ba2b3" strokeWidth="2" />
        {/* trunk */}
        <path d="M26,44 C26,38 42,31 62,31 C82,31 98,38 98,44 L94,84 C94,92 80,97 62,97 C44,97 30,92 30,84 Z" fill="#6f4a2c" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M42,52 L39,80 M62,54 L62,86 M82,52 L85,80" stroke="#492f1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* cut surface with rings + rays */}
        <ellipse cx="62" cy="36" rx="37" ry="14" fill="#cbb089" stroke={INK} strokeWidth="4" />
        <ellipse cx="62" cy="36" rx="25" ry="9" fill="none" stroke="#a9855a" strokeWidth="2" />
        <ellipse cx="62" cy="36" rx="12" ry="4.4" fill="none" stroke="#a9855a" strokeWidth="2" />
        <path d="M62,36 L62,23 M62,36 L88,31 M62,36 L36,31 M62,36 L84,45 M62,36 L40,45" stroke="#b89a6a" strokeWidth="1.4" />
      </Piece>

      {/* right: grey rock the cat curls on */}
      <Piece x={79} top={49} h={30} vb="0 0 104 72" z={2}>
        <path d="M6,44 C6,23 27,12 52,12 C79,12 98,26 98,46 C98,61 78,68 52,68 C25,68 6,61 6,44 Z" fill="#8f9094" stroke={INK} strokeWidth="4" />
        <path d="M20,52 C40,60 68,60 86,49" stroke="#6f7074" strokeWidth="3" fill="none" strokeLinecap="round" />
      </Piece>

      {/* bottom: small water barrel */}
      <Piece x={63} top={74} h={26} vb="0 0 100 108" z={4}>
        <path d="M18,22 L14,86 C14,97 30,101 50,101 C70,101 86,97 86,86 L82,22 Z" fill="#6f4a2c" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M33,28 L30,92 M50,30 L50,95 M67,28 L70,92" stroke="#492f1a" strokeWidth="3" strokeLinecap="round" />
        {/* bluish water wash on the staves */}
        <path d="M15,60 C35,66 65,66 85,60 L86,86 C86,96 70,100 50,100 C30,100 14,96 14,86 Z" fill="#8fb6c6" opacity="0.5" />
        {/* water surface */}
        <ellipse cx="50" cy="22" rx="33" ry="11" fill="#a6c6d5" stroke={INK} strokeWidth="5" />
      </Piece>
      {/* a little spill from the barrel */}
      <div className="pointer-events-none absolute" style={{ left: "55%", top: "88%", width: "16%", height: "5%", zIndex: 3, background: "#9fc0cf", opacity: 0.55, borderRadius: "50%" }} />

      {/* scattered sprouts, bottom-right like the drawing */}
      <Piece x={92} top={90} h={9} vb="0 0 40 40" z={5}>
        <Sprout />
      </Piece>
      <Piece x={96} top={84} h={8} vb="0 0 40 40" z={5}>
        <Sprout />
      </Piece>

      {/* HUD corners, hand-drawn like the reference */}
      {typeof coins === "number" && (
        <div className="absolute left-2 top-2 z-[6] flex items-center gap-1">
          <span className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold" style={{ background: "#e9b93a", color: "#5a4a10", border: `2px solid ${INK}` }}>C</span>
          <span className="rounded border-2 px-1.5 text-[11px] font-bold text-parchment" style={{ borderColor: INK, background: "rgba(0,0,0,0.25)" }}>{coins}</span>
        </div>
      )}
      {typeof day === "number" && (
        <div className="absolute right-3 top-2 z-[6] font-display text-lg text-parchment" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
          Day: {day}
        </div>
      )}
    </div>
  );
}

function Torch({ x, y, tilt }: { x: number; y: number; tilt: number }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%`, height: "26%", transform: `translate(-50%,-50%) rotate(${tilt}deg)`, zIndex: 1 }}
    >
      <svg viewBox="0 0 40 96" className="h-full w-auto" style={{ overflow: "visible" }}>
        {/* handle */}
        <rect x="16" y="34" width="8" height="58" rx="4" fill="#6a4a28" stroke={INK} strokeWidth="2.5" />
        {/* flame */}
        <g className="a-flame" style={{ transformOrigin: "20px 30px" }}>
          <path d="M20,2 C6,24 11,35 20,37 C29,35 34,21 20,2 Z" fill="#ef8f2a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M20,13 C13,26 16,33 20,35 C24,33 27,23 20,13 Z" fill="#f6d24a" />
        </g>
      </svg>
      {/* warm glow */}
      <div className="absolute" style={{ left: "50%", top: "18%", width: 90, height: 90, transform: "translate(-50%,-50%)", background: "radial-gradient(circle,#ff9a3c55,transparent 68%)" }} />
    </div>
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
