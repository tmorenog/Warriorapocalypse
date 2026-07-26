// Scavenging / world locations (8). Each has a loot table used by the scavenge engine.
export interface LocationDef {
  id: string;
  name: string;
  description: string;
  terrain: "forest" | "water" | "open" | "twoleg" | "rocky" | "marsh";
  // Weighted loot: itemId -> weight. Special "nothing" allowed.
  loot: { itemId: string; weight: number }[];
  riskChance: number; // base chance of a bad outcome
}

export const LOCATIONS: LocationDef[] = [
  {
    id: "riverbank",
    name: "Riverbank",
    description: "Water laps at the muddy bank. Fish flicker below the surface.",
    terrain: "water",
    loot: [
      { itemId: "fish", weight: 4 },
      { itemId: "fresh_water", weight: 4 },
      { itemId: "reeds", weight: 3 },
      { itemId: "water_container", weight: 1 },
      { itemId: "nothing", weight: 2 },
    ],
    riskChance: 0.18,
  },
  {
    id: "abandoned_nest",
    name: "Abandoned Twoleg Nest",
    description: "A silent, crumbling Twoleg den. Strange objects lie everywhere.",
    terrain: "twoleg",
    loot: [
      { itemId: "useful_twoleg_object", weight: 3 },
      { itemId: "water_container", weight: 2 },
      { itemId: "mysterious_medicine", weight: 1 },
      { itemId: "shiny_trinket", weight: 2 },
      { itemId: "map_fragment", weight: 1 },
      { itemId: "nothing", weight: 3 },
    ],
    riskChance: 0.28,
  },
  {
    id: "herb_patch",
    name: "Herb Patch",
    description: "A tangle of green — the scent of healing herbs is unmistakable.",
    terrain: "forest",
    loot: [
      { itemId: "herb_kit", weight: 4 },
      { itemId: "cobwebs", weight: 3 },
      { itemId: "leaves", weight: 2 },
      { itemId: "nothing", weight: 2 },
    ],
    riskChance: 0.12,
  },
  {
    id: "rabbit_burrow",
    name: "Rabbit Burrow",
    description: "Open ground pocked with burrows. Rabbits bolt at the slightest sound.",
    terrain: "open",
    loot: [
      { itemId: "rabbit", weight: 3 },
      { itemId: "vole", weight: 3 },
      { itemId: "moss_bedding", weight: 2 },
      { itemId: "nothing", weight: 3 },
    ],
    riskChance: 0.2,
  },
  {
    id: "hollow_tree",
    name: "Hollow Tree",
    description: "A great fallen tree, hollow and dry inside — a natural hiding place.",
    terrain: "forest",
    loot: [
      { itemId: "squirrel", weight: 3 },
      { itemId: "mouse", weight: 3 },
      { itemId: "sticks", weight: 3 },
      { itemId: "feathers", weight: 2 },
      { itemId: "nothing", weight: 2 },
    ],
    riskChance: 0.16,
  },
  {
    id: "ruined_camp",
    name: "Ruined Clan Camp",
    description: "The remains of another clan's camp. Something terrible happened here.",
    terrain: "forest",
    loot: [
      { itemId: "herb_kit", weight: 2 },
      { itemId: "defensive_materials", weight: 2 },
      { itemId: "moss_bedding", weight: 2 },
      { itemId: "infection_clue", weight: 2 },
      { itemId: "nothing", weight: 2 },
    ],
    riskChance: 0.35,
  },
  {
    id: "rocky_ledge",
    name: "Rocky Ledge",
    description: "A high stone ledge. Supplies caught in the crags — if you can reach them.",
    terrain: "rocky",
    loot: [
      { itemId: "bird", weight: 3 },
      { itemId: "stones", weight: 3 },
      { itemId: "feathers", weight: 2 },
      { itemId: "shiny_trinket", weight: 1 },
      { itemId: "nothing", weight: 3 },
    ],
    riskChance: 0.24,
  },
  {
    id: "marsh_edge",
    name: "Marsh Edge",
    description: "Soft, sucking ground at the marsh's rim. Good cover, bad footing.",
    terrain: "marsh",
    loot: [
      { itemId: "thorns", weight: 3 },
      { itemId: "reeds", weight: 3 },
      { itemId: "vole", weight: 2 },
      { itemId: "nothing", weight: 3 },
    ],
    riskChance: 0.26,
  },
];

export const LOCATIONS_BY_ID: Record<string, LocationDef> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
);
