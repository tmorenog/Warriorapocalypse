import { BALANCE } from "@/config/balance";

// The game becomes harder every 10 days. Tier 0 = days 1-10, tier 1 = 11-20, etc.
export function difficultyTier(day: number): number {
  return Math.floor((Math.max(1, day) - 1) / BALANCE.difficulty.scaleEveryDays);
}

export interface DifficultyScaling {
  tier: number;
  infectionRiskMultiplier: number;
  enemyStrengthMultiplier: number;
  preyScarcityMultiplier: number; // <1 means less prey
  missionDurationMultiplier: number;
}

export function difficultyScaling(day: number): DifficultyScaling {
  const tier = difficultyTier(day);
  const d = BALANCE.difficulty;
  return {
    tier,
    infectionRiskMultiplier: 1 + tier * d.infectionRiskPerTier,
    enemyStrengthMultiplier: 1 + tier * d.enemyStrengthPerTier,
    preyScarcityMultiplier: Math.max(0.3, 1 - tier * d.preyScarcityPerTier),
    missionDurationMultiplier: 1 + tier * d.missionDurationPerTier,
  };
}
