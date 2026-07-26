import React from "react";

type MeterKind = "health" | "hunger" | "thirst" | "infection" | "energy";

const META: Record<MeterKind, { label: string; color: string; icon: string; invert?: boolean }> = {
  health: { label: "Health", color: "#c15a5a", icon: "♥" },
  hunger: { label: "Hunger", color: "#c79a4a", icon: "🍖" },
  thirst: { label: "Thirst", color: "#4a90c2", icon: "💧" },
  energy: { label: "Energy", color: "#9bbf5a", icon: "⚡" },
  infection: { label: "Infection", color: "#8a5cc4", icon: "☣", invert: true },
};

interface Props {
  kind: MeterKind;
  value: number;
  compact?: boolean;
}

export function MeterBar({ kind, value, compact }: Props) {
  const meta = META[kind];
  const pct = Math.max(0, Math.min(100, value));
  // For most meters, low is bad. For infection, high is bad.
  const danger = meta.invert ? pct >= 70 : pct <= 20;
  const warn = meta.invert ? pct >= 45 : pct <= 40;
  return (
    <div className="w-full" aria-label={`${meta.label}: ${Math.round(pct)}%`}>
      {!compact && (
        <div className="mb-0.5 flex items-center justify-between text-[11px] text-parchment/80">
          <span aria-hidden>
            <span className="mr-1">{meta.icon}</span>
            {meta.label}
          </span>
          <span className={danger ? "font-bold text-red-300" : ""}>{Math.round(pct)}</span>
        </div>
      )}
      <div
        className={`h-2.5 w-full overflow-hidden rounded-full bg-black/40 ${danger ? "animate-pulse-soft" : ""}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: danger ? "#c0392b" : warn ? "#d9834f" : meta.color,
          }}
        />
      </div>
    </div>
  );
}
