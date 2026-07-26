import { describe, it, expect } from "vitest";
import { Rng } from "./rng";
import { applyDailyDrain, applyRest, injureCat, feedCat } from "./meters";
import { stageForValue, growInfection, exposeCat, treatInfection, turnCat } from "./infection";
import { difficultyTier, difficultyScaling } from "./difficulty";
import { coinsForDayProgress, achievementCoins } from "./coins";
import { resolveMission, estimateMission } from "./missions";
import { createBattle, applyAction, escapeChance, autoRunEnemyTurns } from "./battle";
import { resolveSuccession, killCat, isTreatableDeath, lethalCauseFromMeters } from "./death";
import { assignPlayerToCat, releasePlayerCats, kitMissionAllowed, canKitLeaveShelter } from "./multiplayer";
import { makeCat, createRun, advanceDay } from "./gameState";
import { evaluateAchievements } from "./achievements";
import { BOOK_CHARACTERS_BY_ID } from "@/data/characters";
import { ACHIEVEMENTS } from "@/data/achievements";
import { BALANCE } from "@/config/balance";
import type { Cat, Difficulty } from "./types";

function testCat(overrides: Partial<Cat> = {}): Cat {
  const base = makeCat(BOOK_CHARACTERS_BY_ID["firestar"], null);
  return { ...base, ...overrides, meters: { ...base.meters, ...overrides.meters } };
}

describe("meters", () => {
  it("drains hunger and thirst each day", () => {
    const cat = testCat();
    const after = applyDailyDrain(cat, { difficulty: "Normal" });
    expect(after.meters.hunger).toBeLessThan(cat.meters.hunger);
    expect(after.meters.thirst).toBeLessThan(cat.meters.thirst);
  });

  it("severe thirst damages health", () => {
    const cat = testCat({ meters: { health: 100, hunger: 100, thirst: 5, infection: 0, energy: 100 } });
    const after = applyDailyDrain(cat, { difficulty: "Normal" });
    expect(after.meters.health).toBeLessThan(100);
  });

  it("low hunger reduces rest energy recovery", () => {
    const hungry = testCat({ meters: { health: 100, hunger: 10, thirst: 100, infection: 0, energy: 10 } });
    const fed = testCat({ meters: { health: 100, hunger: 100, thirst: 100, infection: 0, energy: 10 } });
    const restedHungry = applyRest(hungry);
    const restedFed = applyRest(fed);
    expect(restedFed.meters.energy - 10).toBeGreaterThan(restedHungry.meters.energy - 10);
  });

  it("clamps meters within 0-100", () => {
    const cat = testCat({ meters: { health: 100, hunger: 95, thirst: 100, infection: 0, energy: 100 } });
    expect(feedCat(cat, 50).meters.hunger).toBe(100);
    expect(injureCat(cat, 500).meters.health).toBe(0);
  });
});

describe("infection progression", () => {
  it("maps values to stages", () => {
    expect(stageForValue(0)).toBe("None");
    expect(stageForValue(5)).toBe("Exposed");
    expect(stageForValue(25)).toBe("Early");
    expect(stageForValue(50)).toBe("Worsening");
    expect(stageForValue(75)).toBe("Severe");
    expect(stageForValue(100)).toBe("Turning");
  });

  it("grows infection over time when present", () => {
    const cat = exposeCat(testCat(), 20);
    const grown = growInfection(cat, "Normal");
    expect(grown.meters.infection).toBeGreaterThan(cat.meters.infection);
  });

  it("does not grow infection when none", () => {
    const cat = testCat();
    expect(growInfection(cat, "Normal").meters.infection).toBe(0);
  });

  it("turns a cat into an enemy", () => {
    const turned = turnCat(exposeCat(testCat(), 100));
    expect(turned.alive).toBe(false);
    expect(turned.isEnemyTurned).toBe(true);
  });
});

describe("medicine treatment", () => {
  it("succeeds on a low roll and reduces infection", () => {
    const cat = exposeCat(testCat(), 25); // Early
    const res = treatInfection(cat, 18, 20, 0.15, 0.0);
    expect(res.success).toBe(true);
    expect(res.cat.meters.infection).toBeLessThan(cat.meters.infection);
  });

  it("severe infection is harder (high roll fails)", () => {
    const cat = exposeCat(testCat(), 75); // Severe
    const res = treatInfection(cat, 0, 0, 0, 0.99);
    expect(res.success).toBe(false);
  });
});

describe("difficulty scaling", () => {
  it("computes tiers every ten days", () => {
    expect(difficultyTier(1)).toBe(0);
    expect(difficultyTier(10)).toBe(0);
    expect(difficultyTier(11)).toBe(1);
    expect(difficultyTier(21)).toBe(2);
  });

  it("increases enemy strength and reduces prey at higher tiers", () => {
    const s0 = difficultyScaling(1);
    const s2 = difficultyScaling(21);
    expect(s2.enemyStrengthMultiplier).toBeGreaterThan(s0.enemyStrengthMultiplier);
    expect(s2.preyScarcityMultiplier).toBeLessThan(s0.preyScarcityMultiplier);
  });
});

describe("coins", () => {
  it("awards coins at ten-day milestones", () => {
    expect(coinsForDayProgress(9, 10, "Normal")).toBe(10);
    expect(coinsForDayProgress(10, 11, "Normal")).toBe(0);
    expect(coinsForDayProgress(19, 20, "Normal")).toBe(10);
  });

  it("handles crossing multiple milestones", () => {
    expect(coinsForDayProgress(9, 21, "Normal")).toBe(20);
  });

  it("clamps achievement coins to the max", () => {
    expect(achievementCoins(99)).toBe(BALANCE.coins.maxPerAchievement);
  });
});

describe("achievement coin limits", () => {
  it("no achievement awards more than the cap", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.coins).toBeLessThanOrEqual(BALANCE.coins.maxPerAchievement);
    }
  });
});

describe("missions", () => {
  it("more cats increase success chance", () => {
    const one = estimateMission("hunt_food", [testCat()], 1, "Normal");
    const three = estimateMission("hunt_food", [testCat(), testCat(), testCat()], 1, "Normal");
    expect(three.successChance).toBeGreaterThan(one.successChance);
  });

  it("resolves deterministically for a fixed seed", () => {
    const a = resolveMission(new Rng(42), "hunt_food", [testCat()], 1, "Normal");
    const b = resolveMission(new Rng(42), "hunt_food", [testCat()], 1, "Normal");
    expect(a.kind).toBe(b.kind);
    expect(a.itemsGained.length).toBe(b.itemsGained.length);
  });
});

describe("battle", () => {
  it("creates a battle with clan and enemy combatants", () => {
    const battle = createBattle(new Rng(1), [testCat()], "rat", 1, "Normal");
    expect(battle.combatants.some((c) => c.side === "clan")).toBe(true);
    expect(battle.combatants.some((c) => c.side === "enemy")).toBe(true);
  });

  it("attack reduces target health", () => {
    let battle = createBattle(new Rng(5), [testCat()], "rat", 1, "Normal");
    const enemy = battle.combatants.find((c) => c.side === "enemy")!;
    const before = enemy.health;
    const clan = battle.combatants.find((c) => c.side === "clan")!;
    battle = applyAction({ ...battle, turnOrder: [clan.id, enemy.id], turnIndex: 0 }, {
      type: "attack",
      actorId: clan.id,
      targetId: enemy.id,
    });
    const after = battle.combatants.find((c) => c.id === enemy.id)!;
    expect(after.health).toBeLessThan(before);
  });

  it("battle eventually resolves when auto-run", () => {
    let battle = createBattle(new Rng(9), [testCat({ meters: { health: 100, hunger: 100, thirst: 100, infection: 0, energy: 100 } })], "rat", 1, "Story");
    // Force clan to keep attacking.
    let guard = 0;
    while (!battle.over && guard < 200) {
      const actorId = battle.turnOrder[battle.turnIndex];
      const actor = battle.combatants.find((c) => c.id === actorId)!;
      if (actor.side === "clan") {
        const target = battle.combatants.find((c) => c.side === "enemy" && c.alive);
        battle = applyAction(battle, { type: "attack", actorId, targetId: target?.id });
      } else {
        battle = autoRunEnemyTurns(battle);
      }
      guard++;
    }
    expect(battle.over).toBe(true);
  });

  it("escape chance falls with more enemies and when kit present", () => {
    const noKit = escapeChance([testCat()], 1, 1);
    const manyEnemies = escapeChance([testCat()], 4, 1);
    expect(manyEnemies).toBeLessThan(noKit);
    const kit = testCat({ role: "Kit" });
    expect(escapeChance([kit], 1, 1)).toBeLessThan(escapeChance([testCat()], 1, 1));
  });
});

describe("death & succession", () => {
  it("detects lethal meter causes", () => {
    const starving = testCat({ meters: { health: 0, hunger: 0, thirst: 50, infection: 0, energy: 0 } });
    expect(lethalCauseFromMeters(starving)).toBe("Starvation");
  });

  it("promotes deputy to leader when leader dies", () => {
    const leader = killCat(testCat({ role: "Leader" }), "Succumbed to wounds");
    const deputy = testCat({ role: "Deputy" });
    const warrior = testCat({ role: "Warrior" });
    const res = resolveSuccession([leader, deputy, warrior]);
    expect(res.changed).toBe(true);
    const newLeader = res.cats.find((c) => c.id === res.newLeaderId)!;
    expect(newLeader.role).toBe("Leader");
    // A new deputy is chosen.
    expect(res.cats.some((c) => c.alive && c.role === "Deputy")).toBe(true);
  });

  it("classifies treatable vs irreversible deaths", () => {
    expect(isTreatableDeath("Succumbed to wounds")).toBe(true);
    expect(isTreatableDeath("Lost to the infection")).toBe(false);
    expect(isTreatableDeath("Starvation")).toBe(false);
  });
});

describe("multiplayer transfer", () => {
  it("assigns a joining player to an NPC cat", () => {
    const cats = [testCat({ controllerId: "host", role: "Leader" }), testCat({ controllerId: null, role: "Warrior" })];
    const { cats: next, assignedCatId } = assignPlayerToCat(cats, "p2", "Warrior");
    expect(assignedCatId).not.toBeNull();
    const assigned = next.find((c) => c.id === assignedCatId)!;
    expect(assigned.controllerId).toBe("p2");
    expect(assigned.role).toBe("Warrior");
  });

  it("releases a disconnected player's cats to NPC", () => {
    const cats = [testCat({ controllerId: "p2" })];
    const next = releasePlayerCats(cats, "p2");
    expect(next[0].controllerId).toBeNull();
  });
});

describe("kit protection rules", () => {
  it("kit cannot go on a mission alone", () => {
    const kit = testCat({ role: "Kit" });
    expect(kitMissionAllowed([kit])).toBe(false);
  });

  it("kit can go with a guardian", () => {
    const kit = testCat({ role: "Kit" });
    const warrior = testCat({ role: "Warrior" });
    expect(kitMissionAllowed([kit, warrior])).toBe(true);
  });

  it("kit cannot leave shelter without a living adult", () => {
    const kit = testCat({ role: "Kit" });
    const deadWarrior = killCat(testCat({ role: "Warrior" }), "Succumbed to wounds");
    expect(canKitLeaveShelter(kit, [deadWarrior])).toBe(false);
    expect(canKitLeaveShelter(kit, [testCat({ role: "Leader" })])).toBe(true);
  });
});

describe("achievements evaluation", () => {
  it("unlocks day milestones and awards clamped coins", () => {
    const run = createRun({
      mainCatDef: BOOK_CHARACTERS_BY_ID["firestar"],
      clanmateDefs: [
        BOOK_CHARACTERS_BY_ID["graystripe"],
        BOOK_CHARACTERS_BY_ID["sandstorm"],
        BOOK_CHARACTERS_BY_ID["cinderpelt"],
        BOOK_CHARACTERS_BY_ID["firestar"],
      ],
      difficulty: "Normal",
      meta: null,
      seed: 1,
    });
    run.day = 12;
    const { newlyUnlocked, coinsAwarded } = evaluateAchievements(run, []);
    expect(newlyUnlocked).toContain("first_night");
    expect(newlyUnlocked).toContain("day_10");
    expect(coinsAwarded).toBeGreaterThan(0);
  });
});

describe("day advancement integration", () => {
  it("advances the day and applies drain", () => {
    const run = createRun({
      mainCatDef: BOOK_CHARACTERS_BY_ID["firestar"],
      clanmateDefs: [
        BOOK_CHARACTERS_BY_ID["graystripe"],
        BOOK_CHARACTERS_BY_ID["sandstorm"],
        BOOK_CHARACTERS_BY_ID["yellowfang"],
        BOOK_CHARACTERS_BY_ID["squirrelflight"],
      ],
      difficulty: "Normal",
      meta: null,
      seed: 7,
    });
    const { run: next } = advanceDay({ ...run, phase: "day" }, null);
    expect(next.day).toBe(run.day + 1);
  });

  it("ends the run when the main cat dies", () => {
    const run = createRun({
      mainCatDef: BOOK_CHARACTERS_BY_ID["firestar"],
      clanmateDefs: [
        BOOK_CHARACTERS_BY_ID["graystripe"],
        BOOK_CHARACTERS_BY_ID["sandstorm"],
        BOOK_CHARACTERS_BY_ID["yellowfang"],
        BOOK_CHARACTERS_BY_ID["squirrelflight"],
      ],
      difficulty: "Normal",
      meta: null,
      seed: 3,
    });
    // Kill the main cat directly.
    const dying: Difficulty = "Normal";
    const withDeadMain = {
      ...run,
      phase: "day" as const,
      cats: run.cats.map((c) =>
        c.id === run.mainCatId ? killCat(c, "Succumbed to wounds") : c,
      ),
      difficulty: dying,
    };
    const { run: next } = advanceDay(withDeadMain, null);
    expect(next.ended).toBe(true);
  });
});
