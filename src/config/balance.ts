// Centralized balance configuration.
// All tunable gameplay constants live here — do NOT scatter magic numbers in components.

import type { Difficulty, WeatherId } from "@/engine/types";

export const BALANCE = {
  // Time
  dayDurationMs: 60_000, // one in-game day = one real minute
  openingScavengeMs: 60_000, // one minute opening phase (before upgrades)
  scavengeSearchMs: 6_000, // per-location search duration

  // Meter drain per day (Normal baseline), applied at day tick
  hungerLossPerDay: 9,
  thirstLossPerDay: 11,
  energyLossPerDay: 6,

  // Meter thresholds
  lowHungerThreshold: 30, // below this, energy recovery reduced
  severeThirstThreshold: 15, // below this, thirst damages health
  thirstHealthDamage: 6,
  starvationThreshold: 0,
  starvationHealthDamage: 8,

  // Energy
  restEnergyGain: 40,
  missionEnergyCost: 20,
  shelterWorkEnergyCost: 15,
  lowHungerEnergyPenalty: 0.5, // multiplier on energy recovery when hungry

  // Infection (numeric 0-100 mapped to stages)
  infection: {
    exposedAt: 1,
    earlyAt: 20,
    worseningAt: 45,
    severeAt: 70,
    turningAt: 100,
    growthPerDay: 7, // untreated growth per day
    exposureGain: 12, // gained on an infecting encounter
    biteGain: 22,
  },

  // Treatment probabilities by stage (base, before medicine skill / herbs)
  treatment: {
    Early: 0.85,
    Worsening: 0.6,
    Severe: 0.35,
    Turning: 0.15,
    medicineSkillFactor: 0.004, // + per point of medicine stat
    herbBonus: 0.15,
  },

  // Missions
  mission: {
    baseSuccess: 0.6,
    perExtraCatSuccess: 0.08,
    skillSuccessFactor: 0.005, // + per relevant skill point
    injuryChance: 0.18,
    infectionChance: 0.12,
    missingChance: 0.05,
    multiCatEnergyMultiplier: 1.0, // energy cost per cat
  },

  // Battle
  battle: {
    baseDamage: 10,
    attackVariance: 0.35,
    defendReduction: 0.5,
    critChance: 0.12,
    critMultiplier: 1.6,
    healAmount: 24,
    distractDefenseDebuff: 6,
  },

  // Escape
  escape: {
    baseChance: 0.4,
    speedFactor: 0.01,
    perEnemyPenalty: 0.08,
    kitPresentPenalty: 0.08,
    injuredPenalty: 0.1,
  },

  // Coins
  coins: {
    perTenDays: 10,
    maxPerAchievement: 3,
  },

  // Difficulty scaling — recomputed every 10 days
  difficulty: {
    scaleEveryDays: 10,
    infectionRiskPerTier: 0.04,
    enemyStrengthPerTier: 0.08,
    preyScarcityPerTier: 0.05,
    missionDurationPerTier: 0.04,
  },
} as const;

// Multiplier presets applied to drain / risk based on difficulty.
export const DIFFICULTY_PRESETS: Record<
  Difficulty,
  {
    drainMultiplier: number;
    infectionMultiplier: number;
    enemyMultiplier: number;
    coinMultiplier: number;
    label: string;
    description: string;
  }
> = {
  Story: {
    drainMultiplier: 0.7,
    infectionMultiplier: 0.6,
    enemyMultiplier: 0.7,
    coinMultiplier: 0.8,
    label: "Story",
    description: "Gentle pace for learning the systems.",
  },
  Normal: {
    drainMultiplier: 1,
    infectionMultiplier: 1,
    enemyMultiplier: 1,
    coinMultiplier: 1,
    label: "Normal",
    description: "Challenging but fair. Recommended.",
  },
  Hard: {
    drainMultiplier: 1.3,
    infectionMultiplier: 1.35,
    enemyMultiplier: 1.3,
    coinMultiplier: 1.3,
    label: "Hard",
    description: "Resources are tight and enemies hit harder.",
  },
  EndlessNightmare: {
    drainMultiplier: 1.6,
    infectionMultiplier: 1.7,
    enemyMultiplier: 1.6,
    coinMultiplier: 1.6,
    label: "Endless Nightmare",
    description: "Relentless. The forest wants you gone.",
  },
};

// Weather gameplay modifiers.
export const WEATHER_EFFECTS: Record<
  WeatherId,
  {
    label: string;
    description: string;
    waterAvailability: number; // multiplier
    preyAvailability: number;
    missionDuration: number;
    injuryRisk: number;
    infectionRisk: number;
    energyDrain: number;
    visibility: number;
  }
> = {
  Clear: {
    label: "Clear",
    description: "Calm skies over the forest.",
    waterAvailability: 1,
    preyAvailability: 1,
    missionDuration: 1,
    injuryRisk: 1,
    infectionRisk: 1,
    energyDrain: 1,
    visibility: 1,
  },
  Rain: {
    label: "Rain",
    description: "Steady rain fills the puddles.",
    waterAvailability: 1.3,
    preyAvailability: 0.9,
    missionDuration: 1.1,
    injuryRisk: 1.05,
    infectionRisk: 1.1,
    energyDrain: 1.05,
    visibility: 0.85,
  },
  HeavyRain: {
    label: "Heavy Rain",
    description: "Sheets of rain hammer the canopy.",
    waterAvailability: 1.5,
    preyAvailability: 0.7,
    missionDuration: 1.3,
    injuryRisk: 1.2,
    infectionRisk: 1.2,
    energyDrain: 1.15,
    visibility: 0.6,
  },
  Heat: {
    label: "Heat",
    description: "The air shimmers with heat.",
    waterAvailability: 0.7,
    preyAvailability: 0.9,
    missionDuration: 1.1,
    injuryRisk: 1.05,
    infectionRisk: 1.15,
    energyDrain: 1.25,
    visibility: 1,
  },
  Cold: {
    label: "Cold",
    description: "A biting chill settles in.",
    waterAvailability: 0.9,
    preyAvailability: 0.8,
    missionDuration: 1.15,
    injuryRisk: 1.1,
    infectionRisk: 1,
    energyDrain: 1.2,
    visibility: 0.95,
  },
  Storm: {
    label: "Storm",
    description: "Thunder rolls and lightning splits the dark.",
    waterAvailability: 1.4,
    preyAvailability: 0.6,
    missionDuration: 1.4,
    injuryRisk: 1.35,
    infectionRisk: 1.15,
    energyDrain: 1.2,
    visibility: 0.5,
  },
  Snow: {
    label: "Snow",
    description: "Snow blankets the ground and muffles sound.",
    waterAvailability: 0.8,
    preyAvailability: 0.6,
    missionDuration: 1.35,
    injuryRisk: 1.15,
    infectionRisk: 1,
    energyDrain: 1.3,
    visibility: 0.7,
  },
  Fog: {
    label: "Fog",
    description: "Thick fog hides everything beyond a whisker.",
    waterAvailability: 1,
    preyAvailability: 0.85,
    missionDuration: 1.2,
    injuryRisk: 1.2,
    infectionRisk: 1.05,
    energyDrain: 1,
    visibility: 0.4,
  },
  Drought: {
    label: "Drought",
    description: "The streams have dwindled to cracked mud.",
    waterAvailability: 0.4,
    preyAvailability: 0.7,
    missionDuration: 1.1,
    injuryRisk: 1.05,
    infectionRisk: 1.2,
    energyDrain: 1.15,
    visibility: 1,
  },
  Flooding: {
    label: "Flooding",
    description: "Rising water threatens the low ground.",
    waterAvailability: 1.6,
    preyAvailability: 0.5,
    missionDuration: 1.4,
    injuryRisk: 1.3,
    infectionRisk: 1.3,
    energyDrain: 1.2,
    visibility: 0.7,
  },
};
