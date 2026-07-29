import type { Cat, InfectionStage, Difficulty } from "./types";
import { BALANCE, DIFFICULTY_PRESETS } from "@/config/balance";
import { clampMeters } from "./meters";

export function stageForValue(v: number): InfectionStage {
  const inf = BALANCE.infection;
  if (v <= 0) return "None";
  if (v >= inf.turningAt) return "Turning";
  if (v >= inf.severeAt) return "Severe";
  if (v >= inf.worseningAt) return "Worsening";
  if (v >= inf.earlyAt) return "Early";
  if (v >= inf.exposedAt) return "Exposed";
  return "None";
}

export function recomputeStage(cat: Cat): Cat {
  return { ...cat, infectionStage: stageForValue(cat.meters.infection) };
}

// Grows infection for one day if the cat carries any. Returns a new cat.
export function growInfection(cat: Cat, difficulty: Difficulty): Cat {
  if (!cat.alive || cat.meters.infection <= 0) return cat;
  const mult = DIFFICULTY_PRESETS[difficulty].infectionMultiplier;
  const grown = cat.meters.infection + BALANCE.infection.growthPerDay * mult;
  const meters = clampMeters({ ...cat.meters, infection: grown });
  return recomputeStage({ ...cat, meters });
}

// Adds infection exposure (e.g. from an encounter). reduction is 0-1 from upgrades.
export function exposeCat(cat: Cat, amount: number, reduction = 0): Cat {
  if (!cat.alive) return cat;
  const applied = amount * (1 - reduction);
  const meters = clampMeters({
    ...cat.meters,
    infection: cat.meters.infection + applied,
  });
  return recomputeStage({ ...cat, meters });
}

export interface TreatmentResult {
  cat: Cat;
  success: boolean;
  message: string;
}

// Attempts to treat infection with the Elder's skill + optional herb bonus.
// Returns success flag and the updated cat. RNG roll is supplied by the caller (0-1).
export function treatInfection(
  patient: Cat,
  medicineSkill: number,
  herbCure: number,
  herbBonus: number,
  roll: number,
  upgradeBonus = 0,
): TreatmentResult {
  const stage = patient.infectionStage;
  const base = (BALANCE.treatment as Record<string, number>)[stage];
  if (base === undefined || patient.meters.infection <= 0) {
    return { cat: patient, success: false, message: "There is nothing to treat." };
  }
  const chance = Math.min(
    0.98,
    base +
      medicineSkill * BALANCE.treatment.medicineSkillFactor +
      herbBonus +
      upgradeBonus,
  );
  const success = roll < chance;
  if (success) {
    const cure = Math.max(herbCure, 20);
    const meters = clampMeters({
      ...patient.meters,
      infection: patient.meters.infection - cure,
    });
    const cat = recomputeStage({ ...patient, meters });
    return {
      cat,
      success: true,
      message: `The treatment takes hold — the infection recedes.`,
    };
  }
  return {
    cat: patient,
    success: false,
    message: `The treatment fails to stop the infection this time.`,
  };
}

// When a cat reaches "Turning", it becomes an enemy.
export function turnCat(cat: Cat): Cat {
  return {
    ...cat,
    alive: false,
    isEnemyTurned: true,
    causeOfDeath: "Lost to the infection",
    controllerId: null,
  };
}
