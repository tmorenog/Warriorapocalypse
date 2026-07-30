import { Rng, makeSeed } from "./rng";
import { uid } from "./util";
import { BALANCE, WEATHER_EFFECTS } from "@/config/balance";
import type {
  RunState,
  Cat,
  CharacterDef,
  Difficulty,
  MetaProfile,
  WeatherId,
  InventoryItem,
  LogEntry,
  ActiveMission,
} from "./types";
import { CLANS } from "@/data/clans";
import { ITEMS_BY_ID, FOOD_ITEMS } from "@/data/items";
import { applyDailyDrain, applyRest, feedCat, waterCat, injureCat } from "./meters";
import { growInfection, exposeCat, recomputeStage, turnCat } from "./infection";
import { killCat, lethalCauseFromMeters, resolveSuccession } from "./death";
import { coinsForDayProgress } from "./coins";
import { resolveMission, estimateMission } from "./missions";
import { pickRandomEvent, eventToPendingDecision, resolveEventOption } from "./events";
import { checkEndings } from "./endings";
import type { EventEffect } from "@/data/events";

const RUN_VERSION = 1;
const ALL_WEATHER: WeatherId[] = [
  "Clear", "Rain", "HeavyRain", "Heat", "Cold", "Storm", "Snow", "Fog", "Drought", "Flooding",
];

// ---- Upgrade effects ----
export interface UpgradeEffects {
  scavengeBonusMs: number;
  extraFood: number;
  extraWater: number;
  shelterIntegrityBonus: number;
  hungerMultiplier: number;
  thirstMultiplier: number;
  medicineBonus: number;
  infectionReduction: number;
  missionSuccessBonus: number;
}

export function computeUpgradeEffects(meta: MetaProfile | null): UpgradeEffects {
  const lvl = (id: string) => meta?.upgrades[id] ?? 0;
  return {
    scavengeBonusMs: lvl("scavenge_time") * 10_000,
    extraFood: lvl("starting_inventory"),
    extraWater: lvl("starting_inventory"),
    shelterIntegrityBonus: lvl("starting_shelter") * 15,
    hungerMultiplier: 1 - lvl("slow_hunger") * 0.08,
    thirstMultiplier: 1 - lvl("slow_thirst") * 0.08,
    medicineBonus: lvl("better_medicine") * 0.06,
    infectionReduction: lvl("reduced_infection") * 0.08,
    missionSuccessBonus: lvl("better_missions") * 0.06,
  };
}

// ---- Cat creation ----
export function makeCat(def: CharacterDef, controllerId: string | null, cosmetics: string[] = []): Cat {
  return {
    id: uid("cat"),
    defId: def.id,
    name: def.name,
    clan: def.clan,
    role: def.role,
    meters: { ...def.baseMeters },
    stats: { ...def.baseStats },
    infectionStage: "None",
    passive: def.passive,
    battleAbility: def.battleAbility,
    appearance: { ...def.appearance },
    alive: true,
    isEnemyTurned: false,
    onMission: false,
    cosmetics,
    controllerId,
  };
}

const RESCUE_NAMES = ["Brackenfur", "Dustpelt", "Ferncloud", "Whitewing", "Berrynose", "Hollyleaf", "Ivypool", "Thornclaw"];

export function makeRescuedCat(rng: Rng): Cat {
  const name = rng.pick(RESCUE_NAMES) + "";
  const clans = Object.keys(CLANS) as (keyof typeof CLANS)[];
  const clan = rng.pick(clans);
  return {
    id: uid("cat"),
    defId: "rescued",
    name,
    clan,
    role: "Warrior",
    meters: { health: 70, hunger: 60, thirst: 60, infection: 0, energy: 70 },
    stats: { attack: 14, defense: 12, hunting: 13, medicine: 4, stealth: 11, speed: 13 },
    infectionStage: "None",
    passive: { id: "survivor_grit", name: "Survivor's Grit", description: "A rescued cat, grateful and hardy." },
    battleAbility: { id: "desperate_strike", name: "Desperate Strike", description: "A fierce, desperate attack." },
    appearance: { furColor: "#9a7a4a", furPattern: "tabby", eyeColor: "#6fae7a", scars: "none", accessory: "none", bodyType: "medium", earShape: "pointed", tailStyle: "medium" },
    alive: true,
    isEnemyTurned: false,
    onMission: false,
    cosmetics: [],
    controllerId: null,
  };
}

// ---- Run creation ----
export interface CreateRunConfig {
  mainCatDef: CharacterDef;
  clanmateDefs: CharacterDef[]; // exactly 4
  difficulty: Difficulty;
  meta: MetaProfile | null;
  seed?: number;
}

export function createRun(config: CreateRunConfig): RunState {
  const seed = makeSeed(config.seed);
  const rng = new Rng(seed);
  const eff = computeUpgradeEffects(config.meta);

  const mainCat = makeCat(config.mainCatDef, "local");
  const clanmates = config.clanmateDefs.map((d) => makeCat(d, null));
  const cats = [mainCat, ...clanmates];

  const clanDef = CLANS[config.mainCatDef.clan];

  const inventory: InventoryItem[] = [
    { itemId: "mouse", quantity: 3 + eff.extraFood, quality: "fresh" },
    { itemId: "fresh_water", quantity: 3 + eff.extraWater, quality: "fresh" },
    { itemId: "herb_kit", quantity: 1 },
    { itemId: "moss_bedding", quantity: 1 },
  ];

  const log: LogEntry[] = [
    {
      id: uid("log"),
      day: 1,
      kind: "system",
      text: `The sickness spreads. ${mainCat.name} of ${clanDef.name} must lead four clanmates to survive.`,
    },
  ];

  return {
    version: RUN_VERSION,
    seed,
    rngState: rng.state,
    difficulty: config.difficulty,
    day: 1,
    dayTimeRemainingMs: BALANCE.dayDurationMs,
    phase: "scavenging",
    weather: "Clear",
    location: clanDef.startingLocation,
    cats,
    selectedCatId: mainCat.id,
    mainCatId: mainCat.id,
    inventory,
    activeMissions: [],
    shelter: { built: false, upgrades: [], integrity: 50 + eff.shelterIntegrityBonus },
    log,
    pendingDecision: null,
    stats: {
      daysSurvived: 0,
      enemiesDefeated: 0,
      catsRescued: 0,
      infectedCatsSaved: 0,
      battlesWon: 0,
      coinsEarnedThisRun: 0,
      majorDecisions: [],
    },
    paused: false,
    ended: false,
    endingId: null,
    discoveries: [],
    startedAtDay: 1,
    lastSavedAt: null,
  };
}

// ---- Inventory helpers ----
export function addItem(run: RunState, itemId: string, quantity: number): RunState {
  if (quantity <= 0 || !ITEMS_BY_ID[itemId]) return run;
  const inventory = [...run.inventory];
  const existing = inventory.find((i) => i.itemId === itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    inventory.push({ itemId, quantity });
  }
  return { ...run, inventory };
}

export function removeItem(run: RunState, itemId: string, quantity: number): RunState {
  const inventory = run.inventory
    .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity - quantity } : i))
    .filter((i) => i.quantity > 0);
  return { ...run, inventory };
}

export function itemQuantity(run: RunState, itemId: string): number {
  return run.inventory.filter((i) => i.itemId === itemId).reduce((s, i) => s + i.quantity, 0);
}

function log(run: RunState, kind: LogEntry["kind"], text: string): RunState {
  const entry: LogEntry = { id: uid("log"), day: run.day, kind, text };
  return { ...run, log: [entry, ...run.log].slice(0, 60) };
}

// ---- Auto-consume food & water at day end (keeps the loop playable) ----
function autoConsume(run: RunState): RunState {
  let next = run;
  for (const cat of run.cats) {
    if (!cat.alive) continue;
    // Eat if hungry.
    if (cat.meters.hunger < 70) {
      const food = next.inventory.find((i) => FOOD_ITEMS.some((f) => f.id === i.itemId));
      if (food) {
        const def = ITEMS_BY_ID[food.itemId];
        next = updateCat(next, cat.id, (c) => feedCat(c, def.foodValue ?? 12));
        next = removeItem(next, food.itemId, 1);
      }
    }
    // Drink if thirsty.
    const liveCat = next.cats.find((c) => c.id === cat.id)!;
    if (liveCat.meters.thirst < 70) {
      const water = next.inventory.find((i) => ITEMS_BY_ID[i.itemId]?.waterValue);
      if (water) {
        const def = ITEMS_BY_ID[water.itemId];
        next = updateCat(next, cat.id, (c) => waterCat(c, def.waterValue ?? 20));
        next = removeItem(next, water.itemId, 1);
      }
    }
  }
  return next;
}

export function updateCat(run: RunState, catId: string, fn: (c: Cat) => Cat): RunState {
  return { ...run, cats: run.cats.map((c) => (c.id === catId ? fn(c) : c)) };
}

// ---- Weather ----
function rollWeather(rng: Rng, current: WeatherId): WeatherId {
  if (!rng.chance(0.4)) return current; // usually stable
  return rng.pick(ALL_WEATHER);
}

// ---- Day advancement ----
export interface DayAdvanceResult {
  run: RunState;
  coinsEarned: number;
  triggeredBattleEnemyId: string | null;
  droughtSurvived: boolean;
}

export function advanceDay(run: RunState, meta: MetaProfile | null): DayAdvanceResult {
  if (run.ended) return { run, coinsEarned: 0, triggeredBattleEnemyId: null, droughtSurvived: false };
  const rng = new Rng(run.rngState);
  const eff = computeUpgradeEffects(meta);
  const prevDay = run.day;
  let next: RunState = { ...run, day: run.day + 1, dayTimeRemainingMs: BALANCE.dayDurationMs };
  const droughtSurvived = run.weather === "Drought";

  // Weather transition.
  const newWeather = rollWeather(rng, next.weather);
  next = { ...next, weather: newWeather };
  const weatherEff = WEATHER_EFFECTS[newWeather];

  // Rainwater collector.
  if (next.shelter.upgrades.includes("rainwater_collector") && (newWeather === "Rain" || newWeather === "HeavyRain" || newWeather === "Storm")) {
    next = addItem(next, "rainwater", 1);
  }

  // Auto-consume, then drain.
  next = autoConsume(next);
  next = {
    ...next,
    cats: next.cats.map((c) =>
      applyDailyDrain(c, {
        difficulty: next.difficulty,
        hungerMultiplier: eff.hungerMultiplier,
        thirstMultiplier: eff.thirstMultiplier,
        weatherEnergyDrain: weatherEff.energyDrain,
        noHealthDamage: next.day <= 4, // grace period for the first few days
      }),
    ),
  };

  // Rest at shelter for cats not on missions.
  next = {
    ...next,
    cats: next.cats.map((c) => (!c.onMission ? applyRest(c) : c)),
  };

  // Infection growth + turning.
  next = { ...next, cats: next.cats.map((c) => growInfection(c, next.difficulty)) };
  // Without a living Elder there is no skilled healer, so wounds fester and the
  // sickness spreads faster — you can survive, but not for as long.
  const hasElder = next.cats.some((c) => c.alive && c.role === "Elder");
  if (!hasElder) {
    next = {
      ...next,
      cats: next.cats.map((c) => {
        if (!c.alive) return c;
        let { health, infection } = c.meters;
        if (infection > 0) infection = Math.min(100, infection + 5);
        if (health > 0 && health < 55) health = Math.max(1, health - 3); // wounds fester
        return recomputeStage({ ...c, meters: { ...c.meters, health, infection } });
      }),
    };
  }
  for (const cat of next.cats) {
    if (cat.alive && cat.meters.infection >= 100) {
      next = updateCat(next, cat.id, (c) => turnCat(c));
      next = log(next, "death", `${cat.name} has been lost to the infection and turned.`);
    }
  }

  // Meter deaths.
  for (const cat of next.cats) {
    if (!cat.alive) continue;
    const cause = lethalCauseFromMeters(cat);
    if (cause) {
      next = updateCat(next, cat.id, (c) => killCat(c, cause));
      next = log(next, "death", `${cat.name} has died: ${cause}.`);
    }
  }

  // Progress missions.
  let battleEnemy: string | null = null;
  const finished: ActiveMission[] = [];
  const stillActive: ActiveMission[] = [];
  for (const m of next.activeMissions) {
    const remaining = m.daysRemaining - 1;
    if (remaining <= 0) finished.push({ ...m, daysRemaining: 0 });
    else stillActive.push({ ...m, daysRemaining: remaining });
  }
  next = { ...next, activeMissions: stillActive };
  for (const m of finished) {
    const result = completeMission(next, m, meta, rng);
    next = result.run;
    if (result.battleEnemyId && !battleEnemy) battleEnemy = result.battleEnemyId;
  }

  // Succession if leader lost.
  const succ = resolveSuccession(next.cats);
  if (succ.changed) {
    next = { ...next, cats: succ.cats };
    const leader = next.cats.find((c) => c.id === succ.newLeaderId);
    if (leader) next = log(next, "system", `${leader.name} becomes the new leader.`);
  }

  // Mapleshade's grudge: if Appledusk shelters in the same den as Mapleshade,
  // there is a chance she settles an old score in the dark of the bunker. It's a
  // slow-burn: the resentment festers for a while before it boils over, so it
  // never fires in the first few days and stays rare after that.
  if (!next.pendingCutscene && next.shelter.built && next.day >= 6) {
    const maple = next.cats.find((c) => c.defId === "mapleshade" && c.alive && !c.onMission);
    const apple = next.cats.find((c) => c.defId === "appledusk" && c.alive && !c.onMission);
    if (maple && apple && rng.chance(0.12)) {
      next = updateCat(next, apple.id, (c) => killCat(c, "Killed by Mapleshade"));
      next = log(next, "death", "A warrior has been found dead. Appledusk lies still in the den — Mapleshade watches from the shadows.");
      next = { ...next, pendingCutscene: "mapleshade_appledusk" };
    }
  }

  // Coins for milestones.
  const coinsEarned = coinsForDayProgress(prevDay, next.day, next.difficulty);
  if (coinsEarned > 0) {
    next = { ...next, stats: { ...next.stats, coinsEarnedThisRun: next.stats.coinsEarnedThisRun + coinsEarned } };
    next = log(next, "reward", `Survived to day ${next.day}. Earned ${coinsEarned} coins.`);
  }
  next = { ...next, stats: { ...next.stats, daysSurvived: next.day - 1 } };

  // Main cat death ends the run.
  const mainCat = next.cats.find((c) => c.id === next.mainCatId);
  if (mainCat && !mainCat.alive) {
    next = { ...next, ended: true, phase: "ended" };
    next = log(next, "system", `${mainCat.name} has fallen. The run ends after ${next.day - 1} days.`);
  }

  // Ending check.
  const endingId = checkEndings(next);
  if (endingId && !next.ended) {
    next = { ...next, ended: true, endingId, phase: "ended" };
  }

  // Random event (as a pending decision) if not ended and no battle triggered.
  if (!next.ended && !battleEnemy && !next.pendingDecision && !next.pendingCutscene) {
    if (rng.chance(0.7)) {
      const eventId = pickRandomEvent(rng, next.day);
      next = { ...next, pendingDecision: eventToPendingDecision(eventId), paused: true };
    }
  }

  next = { ...next, rngState: rng.state };
  return { run: next, coinsEarned, triggeredBattleEnemyId: battleEnemy, droughtSurvived };
}

// ---- Missions ----
export function startMission(
  run: RunState,
  missionId: string,
  catIds: string[],
  meta: MetaProfile | null,
): RunState {
  const cats = run.cats.filter((c) => catIds.includes(c.id));
  const est = estimateMission(missionId, cats, run.day, run.difficulty, computeUpgradeEffects(meta).missionSuccessBonus);
  const rng = new Rng(run.rngState + 13);
  const mission: ActiveMission = {
    id: uid("mission"),
    missionId,
    catIds,
    daysRemaining: Math.max(est.days, 0),
    totalDays: Math.max(est.days, 0),
    seed: rng.int(1, 1e9),
  };
  let next = { ...run, activeMissions: [...run.activeMissions, mission] };
  next = { ...next, cats: next.cats.map((c) => (catIds.includes(c.id) ? { ...c, onMission: true } : c)) };
  // Spend energy immediately.
  next = { ...next, cats: next.cats.map((c) => (catIds.includes(c.id) ? { ...c, meters: { ...c.meters, energy: Math.max(0, c.meters.energy - BALANCE.missionEnergyCost) } } : c)) };
  next = log(next, "mission", `${cats.map((c) => c.name).join(", ")} set out on a mission.`);

  // Same-day missions resolve immediately.
  if (mission.daysRemaining === 0) {
    const result = completeMission(next, mission, meta, new Rng(mission.seed));
    next = { ...result.run, activeMissions: result.run.activeMissions.filter((m) => m.id !== mission.id) };
  }
  return next;
}

export interface CompleteMissionResult {
  run: RunState;
  battleEnemyId: string | null;
}

export function completeMission(
  run: RunState,
  mission: ActiveMission,
  meta: MetaProfile | null,
  rng: Rng,
): CompleteMissionResult {
  const cats = run.cats.filter((c) => mission.catIds.includes(c.id) && c.alive);
  let next = { ...run };
  // Free the cats.
  next = { ...next, cats: next.cats.map((c) => (mission.catIds.includes(c.id) ? { ...c, onMission: false } : c)) };
  next = { ...next, activeMissions: next.activeMissions.filter((m) => m.id !== mission.id) };

  if (cats.length === 0) {
    return { run: next, battleEnemyId: null };
  }

  const eff = computeUpgradeEffects(meta);
  const res = resolveMission(rng, mission.missionId, cats, run.day, run.difficulty, eff.missionSuccessBonus, eff.infectionReduction);

  if (res.kind === "battle" && res.battleEnemyId) {
    next = log(next, "mission", res.narrative);
    return { run: next, battleEnemyId: res.battleEnemyId };
  }

  for (const item of res.itemsGained) {
    next = addItem(next, item.itemId, item.quantity);
  }
  for (const catId of res.woundedCatIds) {
    next = updateCat(next, catId, (c) => injureCat(c, 14));
    const c = next.cats.find((x) => x.id === catId);
    next = log(next, "injury", `${c?.name ?? "A cat"} returned wounded.`);
  }
  for (const catId of res.infectedCatIds) {
    next = updateCat(next, catId, (c) => exposeCat(c, BALANCE.infection.exposureGain, eff.infectionReduction));
    const c = next.cats.find((x) => x.id === catId);
    next = log(next, "injury", `${c?.name ?? "A cat"} may have been exposed to the infection.`);
  }
  if (res.rescuedSurvivor) {
    const rescued = makeRescuedCat(rng);
    next = { ...next, cats: [...next.cats, rescued], stats: { ...next.stats, catsRescued: next.stats.catsRescued + 1 } };
    next = log(next, "discovery", `${rescued.name} was rescued and joined the group!`);
  }
  next = log(next, "mission", res.narrative);
  return { run: next, battleEnemyId: null };
}

// ---- Shelter ----
export function digShelter(run: RunState): RunState {
  let next: RunState = { ...run, shelter: { ...run.shelter, built: true }, phase: "day" };
  next = { ...next, cats: next.cats.map((c) => ({ ...c, meters: { ...c.meters, energy: Math.max(0, c.meters.energy - 10) } })) };
  next = log(next, "system", "The group digs a protected den. Shelter established.");
  return next;
}

export function abandonShelter(run: RunState): RunState {
  let next: RunState = { ...run, shelter: { built: true, upgrades: [], integrity: 40 } };
  next = log(next, "system", "The group abandons the old shelter and digs anew.");
  return next;
}

// ---- Event effect application ----
export interface EffectApplyResult {
  run: RunState;
  battleEnemyId: string | null;
  abandonPrompt: boolean;
}

export function applyEventEffects(
  run: RunState,
  effects: EventEffect[],
  rng: Rng,
): EffectApplyResult {
  let next = run;
  let battleEnemyId: string | null = null;
  let abandonPrompt = false;
  const living = () => next.cats.filter((c) => c.alive);

  for (const e of effects) {
    switch (e.kind) {
      case "log":
        next = log(next, e.entry ?? "event", e.text);
        break;
      case "meterGroup":
        next = { ...next, cats: next.cats.map((c) => (c.alive ? { ...c, meters: { ...c.meters, [e.meter]: Math.max(0, Math.min(100, c.meters[e.meter] + e.delta)) } } : c)) };
        break;
      case "meterMain":
        next = updateCat(next, next.mainCatId, (c) => ({ ...c, meters: { ...c.meters, [e.meter]: Math.max(0, Math.min(100, c.meters[e.meter] + e.delta)) } }));
        break;
      case "addItem":
        next = addItem(next, e.itemId, e.quantity);
        next = log(next, "resource", `Gained ${e.quantity} ${ITEMS_BY_ID[e.itemId]?.name ?? e.itemId}.`);
        break;
      case "removeItem":
        next = removeItem(next, e.itemId, e.quantity);
        break;
      case "injureRandom": {
        const pool = living();
        if (pool.length) {
          const victim = rng.pick(pool);
          next = updateCat(next, victim.id, (c) => injureCat(c, e.amount));
          next = log(next, "injury", `${victim.name} is injured.`);
        }
        break;
      }
      case "infectRandom": {
        const pool = living();
        if (pool.length) {
          const victim = rng.pick(pool);
          next = updateCat(next, victim.id, (c) => recomputeStage(exposeCat(c, e.amount)));
          next = log(next, "injury", `${victim.name} shows signs of infection.`);
        }
        break;
      }
      case "battle":
        battleEnemyId = e.enemyId;
        break;
      case "rescueCat": {
        const rescued = makeRescuedCat(rng);
        next = { ...next, cats: [...next.cats, rescued], stats: { ...next.stats, catsRescued: next.stats.catsRescued + 1 } };
        next = log(next, "discovery", `${rescued.name} joins the group.`);
        break;
      }
      case "discovery":
        if (!next.discoveries.includes(e.id)) next = { ...next, discoveries: [...next.discoveries, e.id] };
        next = log(next, "discovery", e.text);
        break;
      case "coins":
        next = { ...next, stats: { ...next.stats, coinsEarnedThisRun: next.stats.coinsEarnedThisRun + e.amount } };
        break;
      case "shelterIntegrity":
        next = { ...next, shelter: { ...next.shelter, integrity: Math.max(0, Math.min(100, next.shelter.integrity + e.delta)) } };
        break;
      case "abandonShelterPrompt":
        abandonPrompt = true;
        break;
    }
  }
  return { run: next, battleEnemyId, abandonPrompt };
}

export function resolveDecision(
  run: RunState,
  optionId: string,
): { run: RunState; battleEnemyId: string | null; abandonPrompt: boolean } {
  const decision = run.pendingDecision;
  if (!decision || !decision.eventId) {
    return { run: { ...run, pendingDecision: null, paused: false }, battleEnemyId: null, abandonPrompt: false };
  }
  const rng = new Rng(run.rngState + 101);
  const resolved = resolveEventOption(rng, decision.eventId, optionId);
  let next: RunState = { ...run, pendingDecision: null, paused: false };
  if (!resolved) return { run: next, battleEnemyId: null, abandonPrompt: false };
  next = log(next, "decision", resolved.outcome.text);
  next = { ...next, stats: { ...next.stats, majorDecisions: [...next.stats.majorDecisions, `${decision.title}: ${resolved.option.label}`] } };
  const applied = applyEventEffects(next, resolved.outcome.effects, rng);
  return { run: { ...applied.run, rngState: rng.state }, battleEnemyId: applied.battleEnemyId, abandonPrompt: applied.abandonPrompt };
}

export { WEATHER_EFFECTS };
