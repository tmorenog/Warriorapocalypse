// Permanent upgrades (8), purchasable with coins. Multiple levels, increasing prices.
export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  prices: number[]; // price for each level (index 0 = level 1)
  effectPerLevel: string;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "scavenge_time",
    name: "Scavenge Time",
    description: "More time during the opening scavenging phase.",
    maxLevel: 3, prices: [10, 20, 35],
    effectPerLevel: "+10s opening timer per level",
  },
  {
    id: "starting_inventory",
    name: "Bigger Starting Pack",
    description: "Begin each run with extra supplies.",
    maxLevel: 3, prices: [10, 20, 35],
    effectPerLevel: "+1 food & +1 water per level",
  },
  {
    id: "starting_shelter",
    name: "Sturdy Beginnings",
    description: "Start with a stronger shelter.",
    maxLevel: 2, prices: [15, 30],
    effectPerLevel: "+15 starting shelter integrity per level",
  },
  {
    id: "slow_hunger",
    name: "Iron Stomach",
    description: "Hunger drains more slowly.",
    maxLevel: 3, prices: [15, 30, 50],
    effectPerLevel: "-8% hunger loss per level",
  },
  {
    id: "slow_thirst",
    name: "Camel's Gift",
    description: "Thirst drains more slowly.",
    maxLevel: 3, prices: [15, 30, 50],
    effectPerLevel: "-8% thirst loss per level",
  },
  {
    id: "better_medicine",
    name: "Skilled Healers",
    description: "Treatments are more effective.",
    maxLevel: 3, prices: [20, 35, 55],
    effectPerLevel: "+6% treatment success per level",
  },
  {
    id: "reduced_infection",
    name: "Strong Blood",
    description: "Lower chance of catching the infection.",
    maxLevel: 3, prices: [20, 35, 55],
    effectPerLevel: "-8% infection chance per level",
  },
  {
    id: "better_missions",
    name: "Seasoned Scouts",
    description: "Missions succeed more often.",
    maxLevel: 3, prices: [20, 35, 55],
    effectPerLevel: "+6% mission success per level",
  },
];

export const UPGRADES_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);

export function upgradePrice(id: string, currentLevel: number): number | null {
  const def = UPGRADES_BY_ID[id];
  if (!def || currentLevel >= def.maxLevel) return null;
  return def.prices[currentLevel];
}
