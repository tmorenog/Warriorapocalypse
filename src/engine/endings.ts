import { ENDINGS } from "@/data/endings";
import type { RunState } from "./types";

function itemCount(run: RunState, itemId: string): number {
  return run.inventory
    .filter((i) => i.itemId === itemId)
    .reduce((s, i) => s + i.quantity, 0);
}

// Returns the id of the first satisfied special ending, or null.
export function checkEndings(run: RunState): string | null {
  const survivors = run.cats.filter((c) => c.alive).length;
  for (const ending of ENDINGS) {
    const r = ending.requires;
    if (r.minDay && run.day < r.minDay) continue;
    if (r.minSurvivors && survivors < r.minSurvivors) continue;
    if (r.discovery && !run.discoveries.includes(r.discovery)) continue;
    if (r.hasItem && itemCount(run, r.hasItem) < (r.itemQuantity ?? 1)) continue;
    return ending.id;
  }
  return null;
}
