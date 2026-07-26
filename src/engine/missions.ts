import { Rng } from "./rng";
import { weightedPick } from "./util";
import { BALANCE } from "@/config/balance";
import { MISSIONS_BY_ID } from "@/data/missions";
import { CLANS } from "@/data/clans";
import { difficultyScaling } from "./difficulty";
import type { Cat, Difficulty } from "./types";

export interface MissionEstimate {
  days: number;
  successChance: number;
  energyCost: number;
}

function relevantSkillValue(cat: Cat, skill: string): number {
  const stats = cat.stats as unknown as Record<string, number>;
  return stats[skill] ?? 10;
}

// Compute an estimate shown to the player before confirming.
export function estimateMission(
  missionId: string,
  cats: Cat[],
  day: number,
  difficulty: Difficulty,
  missionSuccessBonus = 0,
): MissionEstimate {
  const def = MISSIONS_BY_ID[missionId];
  const scaling = difficultyScaling(day);
  const clan = cats[0] ? CLANS[cats[0].clan] : null;

  let days = Math.max(0, def.baseDays);
  // Open-terrain clan bonus reduces duration.
  if (clan?.bonuses.openTerrainDuration && (def.terrain === "open" || def.terrain === "any")) {
    days = Math.round(days * clan.bonuses.openTerrainDuration);
  }
  if (clan?.bonuses.travelSpeed) {
    days = Math.max(def.baseDays === 0 ? 0 : 1, Math.round(days / clan.bonuses.travelSpeed));
  }
  days = Math.round(days * scaling.missionDurationMultiplier);
  if (def.baseDays === 0) days = Math.min(days, 1) === 0 ? 0 : Math.min(days, 1);

  const skillTotal = cats.reduce((s, c) => s + relevantSkillValue(c, def.relevantSkill), 0);
  const avgSkill = cats.length ? skillTotal / cats.length : 10;

  let successChance =
    BALANCE.mission.baseSuccess +
    (cats.length - 1) * BALANCE.mission.perExtraCatSuccess +
    avgSkill * BALANCE.mission.skillSuccessFactor +
    missionSuccessBonus;
  successChance = Math.max(0.1, Math.min(0.97, successChance));

  const energyCost = Math.round(
    BALANCE.missionEnergyCost * cats.length * BALANCE.mission.multiCatEnergyMultiplier,
  );

  return { days: Math.max(0, days), successChance, energyCost };
}

export type MissionOutcomeKind =
  | "success"
  | "partial"
  | "wounded"
  | "infected"
  | "missing"
  | "battle";

export interface MissionResolution {
  kind: MissionOutcomeKind;
  itemsGained: { itemId: string; quantity: number }[];
  woundedCatIds: string[];
  infectedCatIds: string[];
  missingCatIds: string[];
  battleEnemyId: string | null;
  rescuedSurvivor: boolean;
  narrative: string;
}

// Resolve a completed mission. Deterministic given rng state.
export function resolveMission(
  rng: Rng,
  missionId: string,
  cats: Cat[],
  day: number,
  difficulty: Difficulty,
  missionSuccessBonus = 0,
  infectionReduction = 0,
): MissionResolution {
  const def = MISSIONS_BY_ID[missionId];
  const est = estimateMission(missionId, cats, day, difficulty, missionSuccessBonus);
  const scaling = difficultyScaling(day);

  const res: MissionResolution = {
    kind: "success",
    itemsGained: [],
    woundedCatIds: [],
    infectedCatIds: [],
    missingCatIds: [],
    battleEnemyId: null,
    rescuedSurvivor: false,
    narrative: "",
  };

  // Battle-capable missions can trigger a fight before resolution.
  if (def.canBattle && rng.chance(0.22 * scaling.enemyStrengthMultiplier)) {
    res.kind = "battle";
    res.battleEnemyId = rng.chance(0.5) ? "rat" : "infected_cat";
    res.narrative = `The mission is interrupted by a threat!`;
    return res;
  }

  const success = rng.chance(est.successChance);

  // Risk rolls.
  if (rng.chance(BALANCE.mission.injuryChance)) {
    const victim = rng.pick(cats);
    res.woundedCatIds.push(victim.id);
  }
  if (rng.chance(BALANCE.mission.infectionChance * (1 - infectionReduction))) {
    const victim = rng.pick(cats);
    res.infectedCatIds.push(victim.id);
  }
  if (rng.chance(BALANCE.mission.missingChance)) {
    const victim = rng.pick(cats);
    res.missingCatIds.push(victim.id);
  }

  if (success) {
    // Loot 1-2 items scaled by prey scarcity.
    const count = rng.chance(0.5 * scaling.preyScarcityMultiplier) ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const itemId = weightedPick(
        rng,
        def.loot.map((l) => ({ value: l.itemId, weight: l.weight })),
      );
      if (itemId !== "nothing") {
        res.itemsGained.push({ itemId, quantity: 1 });
      }
    }
    if (missionId === "search_survivors" || missionId === "rescue_missing") {
      res.rescuedSurvivor = rng.chance(0.6);
    }
    res.kind = res.woundedCatIds.length || res.infectedCatIds.length ? "partial" : "success";
    res.narrative = res.itemsGained.length
      ? "The mission succeeds and the cats return with supplies."
      : "The cats return, tired but unharmed.";
  } else {
    res.kind = res.woundedCatIds.length
      ? "wounded"
      : res.infectedCatIds.length
        ? "infected"
        : res.missingCatIds.length
          ? "missing"
          : "partial";
    res.narrative = "The mission does not go as planned.";
  }

  return res;
}
