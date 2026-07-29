import React from "react";
import type { Cat } from "@/engine/types";
import { DoodleCat } from "./DoodleCat";

// Recreates the hand-drawn "camp" reference: a muddy clearing with tree-stump
// perches, a rock nest, a kit's bucket, torches and sprouts — with the day
// counter and coin tally drawn in. Cats are the player's own, in their colors.
interface Props {
  cats: Cat[];
  day: number;
  coins: number;
  selectedCatId: string;
  onSelectCat: (id: string) => void;
}

interface Spot {
  left: number;
  top: number;
  width: number;
  pose: "sit" | "curl";
  facing: "left" | "right";
}

// Perches, in placement order (kit gets the bucket separately).
// Positions tuned so each cat's paws rest on its perch (viewBox 731x470).
const ADULT_SPOTS: Spot[] = [
  { left: 36.8, top: 35, width: 20, pose: "sit", facing: "right" }, // middle cushion stump (main)
  { left: 11, top: 40, width: 17, pose: "sit", facing: "right" }, // left stump
  { left: 66, top: 55, width: 20, pose: "curl", facing: "right" }, // rock nest
  { left: 23, top: 73, width: 14, pose: "sit", facing: "left" }, // ground
];
const KIT_SPOT: Spot = { left: 60.5, top: 76, width: 14, pose: "sit", facing: "right" };

export function CampScene({ cats, day, coins, selectedCatId, onSelectCat }: Props) {
  const alive = cats.filter((c) => c.alive && !c.onMission && !c.isEnemyTurned);
  const kit = alive.find((c) => c.role === "Kit");
  const adults = alive.filter((c) => c.id !== kit?.id);

  const placed: { cat: Cat; spot: Spot }[] = [];
  adults.slice(0, ADULT_SPOTS.length).forEach((cat, i) => placed.push({ cat, spot: ADULT_SPOTS[i] }));
  if (kit) placed.push({ cat: kit, spot: KIT_SPOT });

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-black/40"
      style={{ aspectRatio: "731 / 470", background: "linear-gradient(180deg,#4a423d 0%,#443c37 60%,#3c352f 100%)" }}
    >
      {/* Scene furniture */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 731 470" preserveAspectRatio="xMidYMid slice">
        {/* faint ground */}
        <ellipse cx="365" cy="450" rx="420" ry="60" fill="#000" opacity="0.12" />

        <Torch x={52} y={250} />
        <Torch x={672} y={255} flip />

        {/* Left stump — dirt/moss top */}
        <Stump cx={143} topY={300} halfW={56} bottomY={432} topFill="#5f7a3a" topEdge="#41331f" />
        {/* Middle stump — pink cushion top */}
        <CushionStump cx={342} topY={298} halfW={78} bottomY={448} />
        {/* Rock nest */}
        <g>
          <ellipse cx="575" cy="360" rx="82" ry="40" fill="#8f8f8f" stroke="#4a4a4a" strokeWidth="2.5" />
          <ellipse cx="575" cy="352" rx="58" ry="26" fill="#a8a8a8" />
        </g>

        {/* sprouts */}
        {[[210, 424], [150, 445], [505, 452], [618, 452], [682, 458]].map(([x, y], i) => (
          <Sprout key={i} x={x} y={y} />
        ))}

        {/* distant tiny cats */}
        <TinyCat x={600} y={418} />
        <TinyCat x={662} y={438} small />
      </svg>

      {/* Coins (top-left) */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="12" fill="#f1c33c" stroke="#b98a1e" strokeWidth="2" />
          <circle cx="15" cy="15" r="8" fill="none" stroke="#d9a92a" strokeWidth="1.5" />
          <path d="M11,13 h8 M11,17 h8" stroke="#b98a1e" strokeWidth="1.6" />
        </svg>
        <div className="leading-none">
          <div className="text-sm font-bold text-parchment drop-shadow">{coins}</div>
          <div className="text-[9px] uppercase tracking-wide text-parchment/70">coins</div>
        </div>
      </div>

      {/* Day counter (top-right), handwritten */}
      <div
        className="absolute right-3 top-2 text-parchment"
        style={{ fontFamily: "'Bradley Hand','Segoe Print','Comic Sans MS',cursive", fontSize: "1.6rem", fontWeight: 700 }}
      >
        Day:&nbsp;<span style={{ textDecoration: "underline" }}>{day}</span>
      </div>

      {/* Cats */}
      {placed.map(({ cat, spot }) => (
        <button
          key={cat.id}
          onClick={() => onSelectCat(cat.id)}
          className={`campcat absolute ${cat.id === selectedCatId ? "rounded-lg ring-2 ring-ember" : ""}`}
          style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, aspectRatio: "1" }}
          aria-label={`${cat.name}, ${cat.role}`}
          title={`${cat.name} — ${cat.role}`}
        >
          <DoodleCat
            appearance={cat.appearance}
            cosmetics={cat.cosmetics}
            facing={spot.facing}
            pose={spot.pose}
            action="idle"
            turned={cat.isEnemyTurned}
          />
        </button>
      ))}

      {/* Foreground: the bucket is drawn on top so the kit tucks inside it. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 731 470" preserveAspectRatio="xMidYMid slice">
        <Bucket cx={490} topY={428} halfW={44} bottomY={470} />
      </svg>
    </div>
  );
}

function Stump({ cx, topY, halfW, bottomY, topFill, topEdge }: { cx: number; topY: number; halfW: number; bottomY: number; topFill: string; topEdge: string }) {
  return (
    <g stroke="#2f2114" strokeWidth="2.5" strokeLinejoin="round">
      <path d={`M${cx - halfW},${topY} L${cx - halfW},${bottomY} Q${cx},${bottomY + 16} ${cx + halfW},${bottomY} L${cx + halfW},${topY} Z`} fill="#6b4a2e" />
      <path d={`M${cx - halfW + 8},${topY + 10} q${halfW - 8},14 ${2 * (halfW - 8)},0`} fill="none" stroke="#4a3320" strokeWidth="2" />
      <ellipse cx={cx} cy={topY} rx={halfW} ry={16} fill={topFill} stroke={topEdge} strokeWidth="2.5" />
    </g>
  );
}

function CushionStump({ cx, topY, halfW, bottomY }: { cx: number; topY: number; halfW: number; bottomY: number }) {
  return (
    <g stroke="#2f2114" strokeWidth="2.5" strokeLinejoin="round">
      <path d={`M${cx - halfW},${topY} L${cx - halfW},${bottomY} Q${cx},${bottomY + 18} ${cx + halfW},${bottomY} L${cx + halfW},${topY} Z`} fill="#6f4d30" />
      <ellipse cx={cx} cy={topY} rx={halfW} ry={18} fill="#d7a7b0" stroke="#a76f7c" strokeWidth="2.5" />
      {/* radiating cushion lines */}
      <g stroke="#b98793" strokeWidth="1.4" opacity="0.8">
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <line key={i} x1={cx} y1={topY} x2={cx + Math.cos(a) * halfW * 0.9} y2={topY + Math.sin(a) * 15} />;
        })}
      </g>
    </g>
  );
}

function Bucket({ cx, topY, halfW, bottomY }: { cx: number; topY: number; halfW: number; bottomY: number }) {
  return (
    <g stroke="#3a2a18" strokeWidth="2.4" strokeLinejoin="round">
      <path d={`M${cx - halfW},${topY} L${cx - halfW + 6},${bottomY} Q${cx},${bottomY + 8} ${cx + halfW - 6},${bottomY} L${cx + halfW},${topY} Z`} fill="#7a5630" />
      <ellipse cx={cx} cy={topY} rx={halfW} ry={9} fill="#6aa6c2" stroke="#3a2a18" strokeWidth="2.4" />
      <ellipse cx={cx} cy={topY} rx={halfW - 8} ry={5} fill="#8fc4da" />
      {/* barrel bands */}
      <path d={`M${cx - halfW + 2},${topY + 14} h${2 * halfW - 4}`} stroke="#5a3d22" strokeWidth="2" />
    </g>
  );
}

function Torch({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  const lean = flip ? -10 : 10;
  return (
    <g>
      <line x1={x} y1={y} x2={x + lean} y2={y - 60} stroke="#5a3d22" strokeWidth="6" strokeLinecap="round" />
      <g className="a-flame" style={{ transformOrigin: `${x + lean}px ${y - 60}px` }}>
        <path d={`M${x + lean},${y - 92} C${x + lean - 10},${y - 72} ${x + lean - 6},${y - 60} ${x + lean},${y - 58} C${x + lean + 6},${y - 60} ${x + lean + 10},${y - 74} ${x + lean},${y - 92} Z`} fill="#e8792a" />
        <path d={`M${x + lean},${y - 84} C${x + lean - 5},${y - 72} ${x + lean - 3},${y - 62} ${x + lean},${y - 60} C${x + lean + 3},${y - 62} ${x + lean + 5},${y - 72} ${x + lean},${y - 84} Z`} fill="#f6d24a" />
      </g>
    </g>
  );
}

function Sprout({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#5f7a3a" strokeWidth="2.4" fill="#6f8f45" strokeLinecap="round">
      <path d={`M${x},${y} q-8,-6 -12,-2 q4,6 12,2`} />
      <path d={`M${x},${y} q8,-8 13,-3 q-4,7 -13,3`} />
      <line x1={x} y1={y} x2={x} y2={y + 8} />
    </g>
  );
}

function TinyCat({ x, y, small }: { x: number; y: number; small?: boolean }) {
  const s = small ? 0.7 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#c9c4bd" stroke="#4a4640" strokeWidth="1.5" opacity="0.8">
      <path d="M0,0 C-6,0 -9,7 -8,13 C-3,16 5,16 8,13 C9,7 6,0 0,0 Z" />
      <path d="M-5,-1 L-7,-8 L0,-3 Z" />
      <path d="M5,-1 L7,-8 L0,-3 Z" />
      <path d="M-9,10 C-14,9 -13,4 -9,5" fill="none" />
    </g>
  );
}
