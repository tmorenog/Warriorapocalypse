import { BALANCE } from "@/config/balance";

// Achievements (10+). Each awards at most 3 coins (enforced by clamp).
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  coins: number;
}

function clampCoins(n: number): number {
  return Math.min(n, BALANCE.coins.maxPerAchievement);
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_night", name: "Survive the First Night", description: "Live to see day 2.", coins: 1 },
  { id: "day_10", name: "Reach Day 10", description: "Survive ten days.", coins: 2 },
  { id: "day_25", name: "Reach Day 25", description: "Survive twenty-five days.", coins: 3 },
  { id: "day_50", name: "Reach Day 50", description: "Survive fifty days.", coins: 3 },
  { id: "save_infected", name: "Save an Infected Cat", description: "Cure a cat of the infection.", coins: 2 },
  { id: "rescue_clanmate", name: "Rescue a Missing Clanmate", description: "Bring a lost cat home.", coins: 2 },
  { id: "defeat_swarm", name: "Defeat a Rat Swarm", description: "Win a battle against a rat swarm.", coins: 2 },
  { id: "survive_drought", name: "Survive a Drought", description: "Get through a drought alive.", coins: 2 },
  { id: "relocate_group", name: "Relocate the Entire Group", description: "Abandon a shelter and rebuild.", coins: 2 },
  { id: "discover_cure", name: "Discover the Cure", description: "Find a cure for the infection.", coins: 3 },
  { id: "all_five_20", name: "Together Through Hardship", description: "Keep all five cats alive for 20 days.", coins: 3 },
  { id: "flawless_battle", name: "Untouched", description: "Win a battle without taking damage.", coins: 2 },
  { id: "escape_unwinnable", name: "Live to Fight Again", description: "Escape a battle you could not win.", coins: 2 },
  { id: "find_settlement", name: "Find a Safe Settlement", description: "Discover a protected settlement.", coins: 3 },
].map((a) => ({ ...a, coins: clampCoins(a.coins) }));

export const ACHIEVEMENTS_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);
