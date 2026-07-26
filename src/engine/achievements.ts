import { ACHIEVEMENTS_BY_ID } from "@/data/achievements";
import { achievementCoins } from "./coins";
import type { RunState } from "./types";

export interface AchievementContext {
  flawlessBattle?: boolean;
  escapedUnwinnable?: boolean;
  savedInfected?: boolean;
  rescuedClanmate?: boolean;
  defeatedSwarm?: boolean;
  survivedDrought?: boolean;
  relocated?: boolean;
  discoveredCure?: boolean;
  foundSettlement?: boolean;
}

// Evaluate which achievements should now be unlocked given run state + event flags.
// `already` is the set of previously-unlocked achievement ids.
export function evaluateAchievements(
  run: RunState,
  already: string[],
  ctx: AchievementContext = {},
): { newlyUnlocked: string[]; coinsAwarded: number } {
  const unlocked = new Set(already);
  const newly: string[] = [];

  const tryUnlock = (id: string, cond: boolean) => {
    if (cond && !unlocked.has(id)) {
      unlocked.add(id);
      newly.push(id);
    }
  };

  const livingCount = run.cats.filter((c) => c.alive).length;

  tryUnlock("first_night", run.day >= 2);
  tryUnlock("day_10", run.day >= 10);
  tryUnlock("day_25", run.day >= 25);
  tryUnlock("day_50", run.day >= 50);
  tryUnlock("all_five_20", run.day >= 20 && run.cats.length >= 5 && livingCount >= 5);
  tryUnlock("save_infected", !!ctx.savedInfected);
  tryUnlock("rescue_clanmate", !!ctx.rescuedClanmate || run.stats.catsRescued > 0);
  tryUnlock("defeat_swarm", !!ctx.defeatedSwarm);
  tryUnlock("survive_drought", !!ctx.survivedDrought);
  tryUnlock("relocate_group", !!ctx.relocated);
  tryUnlock("discover_cure", !!ctx.discoveredCure || run.discoveries.includes("cure_lead"));
  tryUnlock("flawless_battle", !!ctx.flawlessBattle);
  tryUnlock("escape_unwinnable", !!ctx.escapedUnwinnable);
  tryUnlock("find_settlement", !!ctx.foundSettlement);

  const coinsAwarded = newly.reduce(
    (s, id) => s + achievementCoins(ACHIEVEMENTS_BY_ID[id]?.coins ?? 0),
    0,
  );
  return { newlyUnlocked: newly, coinsAwarded };
}
