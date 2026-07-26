import { BALANCE, DIFFICULTY_PRESETS } from "@/config/balance";
import type { Difficulty } from "./types";

// Coins are awarded at each 10-day milestone. This returns coins earned when
// moving from `prevDay` to `newDay` (handles crossing multiple milestones).
export function coinsForDayProgress(
  prevDay: number,
  newDay: number,
  difficulty: Difficulty,
): number {
  const step = BALANCE.difficulty.scaleEveryDays;
  const prevMilestones = Math.floor(prevDay / step);
  const newMilestones = Math.floor(newDay / step);
  const crossed = Math.max(0, newMilestones - prevMilestones);
  const mult = DIFFICULTY_PRESETS[difficulty].coinMultiplier;
  return Math.round(crossed * BALANCE.coins.perTenDays * mult);
}

// Clamp achievement coins to the configured maximum.
export function achievementCoins(base: number): number {
  return Math.min(base, BALANCE.coins.maxPerAchievement);
}
