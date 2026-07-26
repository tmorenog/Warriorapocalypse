// Enemy types (8+). Used by the battle engine.
export interface EnemyDef {
  id: string;
  name: string;
  description: string;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  infectionRisk: number; // 0-1 chance to infect on a successful hit
  fleeThreshold: number; // hp fraction at which it may flee
  minGroup: number;
  maxGroup: number;
}

export const ENEMIES: EnemyDef[] = [
  {
    id: "rat",
    name: "Rat",
    description: "A diseased rat with yellow teeth. Its bite festers.",
    health: 22, attack: 8, defense: 4, speed: 12, infectionRisk: 0.35, fleeThreshold: 0.15,
    minGroup: 1, maxGroup: 4,
  },
  {
    id: "rat_swarm",
    name: "Swarm Rat",
    description: "One of many — where there is one, there are dozens.",
    health: 16, attack: 6, defense: 3, speed: 13, infectionRisk: 0.4, fleeThreshold: 0.1,
    minGroup: 3, maxGroup: 6,
  },
  {
    id: "infected_cat",
    name: "Infected Cat",
    description: "A cat lost to the sickness, eyes clouded, moving wrong.",
    health: 40, attack: 14, defense: 8, speed: 11, infectionRisk: 0.45, fleeThreshold: 0,
    minGroup: 1, maxGroup: 3,
  },
  {
    id: "dog",
    name: "Dog",
    description: "A stray dog, ribs showing, half-wild with hunger.",
    health: 55, attack: 16, defense: 9, speed: 14, infectionRisk: 0.05, fleeThreshold: 0.25,
    minGroup: 1, maxGroup: 2,
  },
  {
    id: "fox",
    name: "Fox",
    description: "A red fox, cunning and quick, with a hungry gleam.",
    health: 48, attack: 15, defense: 8, speed: 16, infectionRisk: 0.1, fleeThreshold: 0.2,
    minGroup: 1, maxGroup: 1,
  },
  {
    id: "badger",
    name: "Badger",
    description: "A massive badger, slow but crushingly strong.",
    health: 70, attack: 20, defense: 14, speed: 7, infectionRisk: 0.05, fleeThreshold: 0.15,
    minGroup: 1, maxGroup: 1,
  },
  {
    id: "hostile_survivor",
    name: "Hostile Survivor",
    description: "A desperate loner who will fight to keep what little they have.",
    health: 44, attack: 13, defense: 10, speed: 12, infectionRisk: 0.15, fleeThreshold: 0.3,
    minGroup: 1, maxGroup: 2,
  },
  {
    id: "infected_prey",
    name: "Infected Prey",
    description: "Prey that should be dead but isn't. It moves toward you.",
    health: 18, attack: 7, defense: 3, speed: 10, infectionRisk: 0.5, fleeThreshold: 0,
    minGroup: 1, maxGroup: 3,
  },
  {
    id: "dire_infected",
    name: "Dire Infected",
    description: "An unusually dangerous infected creature, swollen and fast.",
    health: 60, attack: 18, defense: 10, speed: 15, infectionRisk: 0.55, fleeThreshold: 0,
    minGroup: 1, maxGroup: 1,
  },
];

export const ENEMIES_BY_ID: Record<string, EnemyDef> = Object.fromEntries(
  ENEMIES.map((e) => [e.id, e]),
);
