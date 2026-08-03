import React from "react";
import type { WeatherId } from "@/engine/types";

interface SceneProps {
  weather: WeatherId;
  variant?: "forest" | "water" | "den" | "rocky" | "camp";
  night?: boolean;
  children?: React.ReactNode;
  height?: number | string;
}

// Aina's exact den drawing, used as the den background. The den scene is locked
// to this image's aspect ratio so the cats line up on the perches on any screen.
export const DEN_IMAGE = "/art/scenes/den-aina.jpg";
export const DEN_ASPECT = 1462 / 1110;

// Where each recoloured cat sits ON Aina's drawing, covering her placeholder
// cats. (x, y) is the cat's feet as a % of the box; h is its height as a % of
// the box height so it scales with the drawing.
export interface DenPerch {
  x: number;
  y: number;
  h: number;
  facing: "left" | "right";
}
export const DEN_PERCHES: DenPerch[] = [
  { x: 48, y: 62, h: 40, facing: "right" }, // centre cut-log (sitting)
  { x: 17, y: 65, h: 34, facing: "right" }, // left mossy stump (standing)
  { x: 82, y: 66, h: 27, facing: "left" }, // right rock (curled)
  { x: 68, y: 88, h: 26, facing: "right" }, // water barrel
  { x: 79, y: 94, h: 15, facing: "left" }, // tiny ground cat
];

// Reusable illustrated scene: layered SVG silhouettes + CSS gradients + weather.
// The "den" variant is a hand-drawn torch-lit cave with stump / log / rock / barrel
// perches, recreating Aina's reference art.
export function Scene({ weather, variant = "forest", night, children, height = 220 }: SceneProps) {
  const isCave = variant === "den";
  if (isCave) {
    // The den IS Aina's drawing. Lock the box to the image's aspect ratio so the
    // recoloured cats sit exactly on her perches; the taupe matches her paper so
    // any letterbox blends in.
    return (
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-fern/20"
        style={{ background: "#5a4f4f", aspectRatio: `${DEN_ASPECT}`, maxHeight: "72vh" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DEN_IMAGE} alt="The clan's den" className="absolute inset-0 h-full w-full object-cover" />
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
