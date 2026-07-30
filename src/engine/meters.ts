import type { Cat, CatMeters, Difficulty } from "./types";
import { BALANCE, DIFFICULTY_PRESETS } from "@/config/balance";

export function clampMeter(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function clampMeters(m: CatMeters): CatMeters {
  return {
    health: clampMeter(m.health),
    hunger: clampMeter(m.hunger),
    thirst: clampMeter(m.thirst),
    infection: Math.max(0, Math.min(100, Math.round(m.infection))),
    energy: clampMeter(m.energy),
  };
}

export interface DrainContext {
  difficulty: Difficulty;
  hungerMultiplier?: number; // from upgrades (lower = slower)
  thirstMultiplier?: number;
  weatherEnergyDrain?: number;
  noHealthDamage?: boolean; // grace period: skip hunger/thirst health damage
}

// Applies one day's passive drain to a single living cat and returns a NEW cat.
export function applyDailyDrain(cat: Cat, ctx: DrainContext): Cat {
  if (!cat.alive) return cat;
  const preset = DIFFICULTY_PRESETS[ctx.difficulty];
  const drain = preset.drainMultiplier;

  const hungerLoss =
    BALANCE.hungerLossPerDay * drain * (ctx.hungerMultiplier ?? 1);
  const thirstLoss =
    BALANCE.thirstLossPerDay * drain * (ctx.thirstMultiplier ?? 1);
  const energyLoss = BALANCE.energyLossPerDay * (ctx.weatherEnergyDrain ?? 1);

  let { health, hunger, thirst, energy } = cat.meters;

  hunger -= hungerLoss;
  thirst -= thirstLoss;
  energy -= energyLoss;

  // Consequences (skipped during the early grace period so new players can't be
  // wiped out before they've established food and water).
  if (!ctx.noHealthDamage) {
    if (thirst <= BALANCE.severeThirstThreshold) {
      health -= BALANCE.thirstHealthDamage * drain;
    }
    if (hunger <= BALANCE.starvationThreshold) {
      health -= BALANCE.starvationHealthDamage * drain;
    }
  }

  const meters = clampMeters({ ...cat.meters, health, hunger, thirst, energy });
  return { ...cat, meters };
}

// Rest restores energy; hunger reduces recovery. Optionally requires a guard (handled by caller).
export function applyRest(cat: Cat): Cat {
  if (!cat.alive) return cat;
  let gain = BALANCE.restEnergyGain;
  if (cat.meters.hunger < BALANCE.lowHungerThreshold) {
    gain *= BALANCE.lowHungerEnergyPenalty;
  }
  const meters = clampMeters({
    ...cat.meters,
    energy: cat.meters.energy + gain,
  });
  return { ...cat, meters };
}

export function feedCat(cat: Cat, foodValue: number): Cat {
  const meters = clampMeters({ ...cat.meters, hunger: cat.meters.hunger + foodValue });
  return { ...cat, meters };
}

export function waterCat(cat: Cat, waterValue: number): Cat {
  const meters = clampMeters({ ...cat.meters, thirst: cat.meters.thirst + waterValue });
  return { ...cat, meters };
}

export function injureCat(cat: Cat, amount: number): Cat {
  const meters = clampMeters({ ...cat.meters, health: cat.meters.health - amount });
  return { ...cat, meters };
}

export function healCat(cat: Cat, amount: number): Cat {
  const meters = clampMeters({ ...cat.meters, health: cat.meters.health + amount });
  return { ...cat, meters };
}
