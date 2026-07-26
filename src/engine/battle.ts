import { Rng } from "./rng";
import { BALANCE } from "@/config/balance";
import { ENEMIES_BY_ID } from "@/data/enemies";
import { difficultyScaling } from "./difficulty";
import type {
  BattleState,
  Combatant,
  Cat,
  Difficulty,
  BattleAction,
} from "./types";

let battleCounter = 0;

export interface EnemySpawn {
  enemyDefId: string;
  count: number;
}

export function buildEnemyGroup(
  rng: Rng,
  primaryEnemyId: string,
  day: number,
  difficulty: Difficulty,
): Combatant[] {
  const def = ENEMIES_BY_ID[primaryEnemyId];
  const scaling = difficultyScaling(day);
  const count = rng.int(def.minGroup, def.maxGroup);
  const combatants: Combatant[] = [];
  const strength = scaling.enemyStrengthMultiplier;
  for (let i = 0; i < count; i++) {
    const maxHealth = Math.round(def.health * strength);
    combatants.push({
      id: `enemy_${primaryEnemyId}_${i}_${rng.int(1000, 9999)}`,
      name: count > 1 ? `${def.name} ${i + 1}` : def.name,
      side: "enemy",
      enemyDefId: def.id,
      health: maxHealth,
      maxHealth,
      attack: Math.round(def.attack * strength),
      defense: def.defense,
      speed: def.speed,
      defending: false,
      alive: true,
      infectionRisk: def.infectionRisk,
      statuses: [],
      controllerId: null,
    });
  }
  return combatants;
}

export function catToCombatant(cat: Cat): Combatant {
  return {
    id: `c_${cat.id}`,
    name: cat.name,
    side: "clan",
    catId: cat.id,
    health: cat.meters.health,
    maxHealth: 100,
    attack: cat.stats.attack,
    defense: cat.stats.defense,
    speed: cat.stats.speed,
    defending: false,
    alive: cat.alive && cat.meters.health > 0,
    infectionRisk: 0,
    statuses: [],
    controllerId: cat.controllerId,
  };
}

export function createBattle(
  rng: Rng,
  clanCats: Cat[],
  primaryEnemyId: string,
  day: number,
  difficulty: Difficulty,
  canEscape = true,
): BattleState {
  const clan = clanCats
    .filter((c) => c.alive && c.meters.health > 0)
    .map(catToCombatant);
  const enemies = buildEnemyGroup(rng, primaryEnemyId, day, difficulty);
  const all = [...clan, ...enemies];
  const turnOrder = [...all]
    .sort((a, b) => b.speed - a.speed)
    .map((c) => c.id);

  battleCounter += 1;
  return {
    id: `battle_${battleCounter}_${rng.int(1000, 9999)}`,
    combatants: all,
    turnOrder,
    turnIndex: 0,
    round: 1,
    log: [`A battle begins against ${ENEMIES_BY_ID[primaryEnemyId].name}!`],
    seed: rng.state,
    rngState: rng.state,
    canEscape,
    over: false,
    result: null,
    enemyGroupId: primaryEnemyId,
  };
}

function findCombatant(b: BattleState, id: string): Combatant | undefined {
  return b.combatants.find((c) => c.id === id);
}

function livingEnemies(b: BattleState): Combatant[] {
  return b.combatants.filter((c) => c.side === "enemy" && c.alive);
}
function livingClan(b: BattleState): Combatant[] {
  return b.combatants.filter((c) => c.side === "clan" && c.alive);
}

function computeDamage(rng: Rng, attacker: Combatant, target: Combatant): { dmg: number; crit: boolean } {
  const base = BALANCE.battle.baseDamage + attacker.attack;
  const variance = 1 + (rng.float() * 2 - 1) * BALANCE.battle.attackVariance;
  let dmg = base * variance - target.defense * 0.5;
  let crit = false;
  if (rng.chance(BALANCE.battle.critChance)) {
    crit = true;
    dmg *= BALANCE.battle.critMultiplier;
  }
  if (target.defending) dmg *= 1 - BALANCE.battle.defendReduction;
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

// Advance turnIndex to the next living combatant; increment round when wrapping.
function advanceTurn(b: BattleState): BattleState {
  let idx = b.turnIndex;
  let round = b.round;
  for (let i = 0; i < b.turnOrder.length + 1; i++) {
    idx += 1;
    if (idx >= b.turnOrder.length) {
      idx = 0;
      round += 1;
      // Reset defending at the start of a new round.
      b = {
        ...b,
        combatants: b.combatants.map((c) => ({ ...c, defending: false })),
      };
    }
    const c = findCombatant(b, b.turnOrder[idx]);
    if (c && c.alive) break;
  }
  return { ...b, turnIndex: idx, round };
}

function checkOver(b: BattleState): BattleState {
  if (livingEnemies(b).length === 0) {
    return { ...b, over: true, result: "won", log: [...b.log, "The enemies are defeated!"] };
  }
  if (livingClan(b).length === 0) {
    return { ...b, over: true, result: "lost", log: [...b.log, "The group has fallen..."] };
  }
  return b;
}

export function currentActorId(b: BattleState): string {
  return b.turnOrder[b.turnIndex];
}

export function isClanTurn(b: BattleState): boolean {
  const actor = findCombatant(b, currentActorId(b));
  return actor?.side === "clan" && actor.alive;
}

// Escape probability given the party & context.
export function escapeChance(
  clanCats: Cat[],
  enemyCount: number,
  weatherVisibility: number,
  escapeBonus = 0,
): number {
  const avgSpeed =
    clanCats.reduce((s, c) => s + c.stats.speed, 0) / Math.max(1, clanCats.length);
  const anyInjured = clanCats.some((c) => c.meters.health < 40);
  const kitPresent = clanCats.some((c) => c.role === "Kit");
  let chance =
    BALANCE.escape.baseChance +
    avgSpeed * BALANCE.escape.speedFactor -
    (enemyCount - 1) * BALANCE.escape.perEnemyPenalty +
    escapeBonus;
  if (anyInjured) chance -= BALANCE.escape.injuredPenalty;
  if (kitPresent) chance -= BALANCE.escape.kitPresentPenalty;
  chance *= 0.7 + 0.3 * weatherVisibility;
  return Math.max(0.05, Math.min(0.95, chance));
}

// Apply a single battle action. Returns a new battle state.
export function applyAction(state: BattleState, action: BattleAction): BattleState {
  if (state.over) return state;
  const rng = new Rng(state.rngState);
  let b: BattleState = { ...state, combatants: state.combatants.map((c) => ({ ...c })) };
  const actor = findCombatant(b, action.actorId);
  if (!actor || !actor.alive) return advanceAndCheck(b, rng);

  const log: string[] = [];

  switch (action.type) {
    case "attack":
    case "roleAbility":
    case "charAbility": {
      const target = action.targetId ? findCombatant(b, action.targetId) : livingEnemies(b)[0];
      if (target && target.alive) {
        let { dmg, crit } = computeDamage(rng, actor, target);
        // Ability flavor: role/char abilities hit a bit harder.
        if (action.type !== "attack") dmg = Math.round(dmg * 1.3);
        target.health = Math.max(0, target.health - dmg);
        log.push(
          `${actor.name} ${action.type === "attack" ? "attacks" : "uses an ability on"} ${target.name} for ${dmg}${crit ? " (critical!)" : ""}.`,
        );
        if (target.health <= 0) {
          target.alive = false;
          log.push(`${target.name} is defeated.`);
        } else if (target.side === "clan" && actor.side === "enemy" && rng.chance(actor.infectionRisk)) {
          target.statuses = Array.from(new Set([...target.statuses, "infected"]));
          log.push(`${target.name} is exposed to the infection!`);
        }
      }
      break;
    }
    case "defend": {
      actor.defending = true;
      log.push(`${actor.name} braces defensively.`);
      break;
    }
    case "protect": {
      const ally = action.targetId ? findCombatant(b, action.targetId) : null;
      if (ally) {
        ally.statuses = Array.from(new Set([...ally.statuses, `guarded_by_${actor.id}`]));
        actor.statuses = Array.from(new Set([...actor.statuses, "guarding"]));
        log.push(`${actor.name} moves to protect ${ally.name}.`);
      }
      break;
    }
    case "heal": {
      const ally = action.targetId ? findCombatant(b, action.targetId) : actor;
      if (ally) {
        ally.health = Math.min(ally.maxHealth, ally.health + BALANCE.battle.healAmount);
        ally.statuses = ally.statuses.filter((s) => s !== "infected");
        log.push(`${actor.name} tends ${ally.name}'s wounds (+${BALANCE.battle.healAmount}).`);
      }
      break;
    }
    case "distract": {
      const target = action.targetId ? findCombatant(b, action.targetId) : livingEnemies(b)[0];
      if (target) {
        target.defense = Math.max(0, target.defense - BALANCE.battle.distractDefenseDebuff);
        log.push(`${actor.name} distracts ${target.name}, lowering its guard.`);
      }
      break;
    }
    case "item": {
      const ally = action.targetId ? findCombatant(b, action.targetId) : actor;
      if (ally) {
        ally.health = Math.min(ally.maxHealth, ally.health + BALANCE.battle.healAmount);
        log.push(`${actor.name} uses an item on ${ally.name}.`);
      }
      break;
    }
    case "escape": {
      // Escape resolved by caller via escapeChance; here we mark escaped.
      b = { ...b, over: true, result: "escaped", log: [...b.log, `${actor.name} leads a retreat!`] };
      return { ...b, rngState: rng.state };
    }
  }

  b = { ...b, log: [...b.log, ...log], rngState: rng.state };
  b = checkOver(b);
  if (b.over) return b;
  return advanceAndCheck(b, rng);
}

function advanceAndCheck(b: BattleState, rng: Rng): BattleState {
  b = advanceTurn(b);
  b = { ...b, rngState: rng.state };
  return b;
}

// Choose an action for an enemy combatant (simple AI). Returns the action.
export function enemyAction(state: BattleState): BattleAction {
  const rng = new Rng(state.rngState + 7);
  const actor = findCombatant(state, currentActorId(state))!;
  const targets = livingClan(state);
  // Prefer the weakest clan cat.
  const target = [...targets].sort((a, b) => a.health - b.health)[0];
  // Occasionally defend if low.
  if (actor.health < actor.maxHealth * 0.25 && rng.chance(0.3)) {
    return { type: "defend", actorId: actor.id };
  }
  return { type: "attack", actorId: actor.id, targetId: target?.id };
}

// Run all consecutive enemy turns until it's a clan turn or the battle ends.
export function autoRunEnemyTurns(state: BattleState): BattleState {
  let b = state;
  let guard = 0;
  while (!b.over && !isClanTurn(b) && guard < 50) {
    const actor = findCombatant(b, currentActorId(b));
    if (!actor || !actor.alive) {
      b = advanceTurn(b);
    } else {
      b = applyAction(b, enemyAction(b));
    }
    guard += 1;
  }
  return b;
}

// Sync battle results back onto the cats (health + infection exposure).
export function applyBattleResultsToCats(cats: Cat[], battle: BattleState): Cat[] {
  return cats.map((cat) => {
    const combatant = battle.combatants.find((c) => c.catId === cat.id);
    if (!combatant) return cat;
    const alive = combatant.alive && combatant.health > 0;
    const exposed = combatant.statuses.includes("infected");
    return {
      ...cat,
      meters: {
        ...cat.meters,
        health: combatant.health,
        infection: exposed ? Math.min(100, cat.meters.infection + BALANCE.infection.biteGain) : cat.meters.infection,
      },
      alive: alive ? cat.alive : false,
      causeOfDeath: alive ? cat.causeOfDeath : "Succumbed to wounds",
    };
  });
}

export function enemiesDefeatedCount(battle: BattleState): number {
  return battle.combatants.filter((c) => c.side === "enemy" && !c.alive).length;
}
