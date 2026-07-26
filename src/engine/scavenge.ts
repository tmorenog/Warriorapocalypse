import { Rng } from "./rng";
import { weightedPick } from "./util";
import { LOCATIONS_BY_ID } from "@/data/locations";
import { CLANS } from "@/data/clans";
import type { ClanId } from "./types";

export type ScavengeRisk =
  | "none"
  | "wound"
  | "rat"
  | "infected"
  | "survivor"
  | "contaminated"
  | "clue";

export interface ScavengeResult {
  locationId: string;
  itemId: string | null; // null = nothing found
  risk: ScavengeRisk;
  text: string;
}

const RISK_TABLE: { risk: ScavengeRisk; text: string; weight: number }[] = [
  { risk: "wound", text: "A hidden hazard leaves a nasty scratch.", weight: 3 },
  { risk: "rat", text: "A rat bursts out, teeth bared!", weight: 3 },
  { risk: "infected", text: "An infected cat lurches from the shadows!", weight: 2 },
  { risk: "survivor", text: "A frightened survivor is hiding here.", weight: 2 },
  { risk: "contaminated", text: "The food here smells foul and contaminated.", weight: 2 },
  { risk: "clue", text: "You find a strange clue about the sickness.", weight: 2 },
];

// Roll a single location search. Clan bonuses adjust risk/find quality.
export function searchLocation(
  rng: Rng,
  locationId: string,
  clan: ClanId,
): ScavengeResult {
  const loc = LOCATIONS_BY_ID[locationId];
  if (!loc) {
    return { locationId, itemId: null, risk: "none", text: "There is nothing here." };
  }
  const clanDef = CLANS[clan];

  // Determine risk chance, modified by clan detection/stealth bonuses.
  let riskChance = loc.riskChance;
  if (clanDef.bonuses.detectionChance) riskChance *= clanDef.bonuses.detectionChance;
  if (loc.terrain === "water" && clanDef.bonuses.floodRisk) riskChance *= clanDef.bonuses.floodRisk;

  if (rng.chance(riskChance)) {
    const risk = weightedPick(
      rng,
      RISK_TABLE.map((r) => ({ value: r, weight: r.weight })),
    );
    return { locationId, itemId: null, risk: risk.risk, text: risk.text };
  }

  // Otherwise roll loot.
  const picked = weightedPick(
    rng,
    loc.loot.map((l) => ({ value: l.itemId, weight: l.weight })),
  );
  if (picked === "nothing") {
    return { locationId, itemId: null, risk: "none", text: "You search but find nothing useful." };
  }
  return {
    locationId,
    itemId: picked,
    risk: "none",
    text: `You found something useful.`,
  };
}
