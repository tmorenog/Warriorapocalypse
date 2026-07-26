import type { RoleId } from "@/engine/types";

// Mission types (10). Duration/success scale with cat abilities & clan bonuses.
export interface MissionDef {
  id: string;
  name: string;
  description: string;
  baseDays: number;
  relevantSkill: "hunting" | "medicine" | "stealth" | "speed" | "attack" | "defense";
  rewardHint: string;
  riskHint: string;
  recommendedRoles: RoleId[];
  terrain: "forest" | "water" | "open" | "twoleg" | "any";
  canBattle: boolean;
  loot: { itemId: string; weight: number }[];
}

export const MISSIONS: MissionDef[] = [
  {
    id: "hunt_food",
    name: "Hunt for Food",
    description: "Track and catch prey to feed the group.",
    baseDays: 0, relevantSkill: "hunting", rewardHint: "Fresh prey",
    riskHint: "Wounds, rats", recommendedRoles: ["Warrior", "Leader"], terrain: "forest", canBattle: true,
    loot: [
      { itemId: "mouse", weight: 4 }, { itemId: "vole", weight: 3 },
      { itemId: "rabbit", weight: 2 }, { itemId: "squirrel", weight: 2 }, { itemId: "bird", weight: 2 },
    ],
  },
  {
    id: "find_water",
    name: "Find Water",
    description: "Seek out clean water for the group.",
    baseDays: 0, relevantSkill: "speed", rewardHint: "Fresh water",
    riskHint: "Contamination", recommendedRoles: ["Deputy", "Warrior"], terrain: "water", canBattle: false,
    loot: [{ itemId: "fresh_water", weight: 5 }, { itemId: "water_container", weight: 1 }],
  },
  {
    id: "gather_herbs",
    name: "Gather Herbs",
    description: "Collect healing herbs from the forest.",
    baseDays: 0, relevantSkill: "medicine", rewardHint: "Herbs",
    riskHint: "Unsafe herbs", recommendedRoles: ["Medicine"], terrain: "forest", canBattle: false,
    loot: [{ itemId: "herb_kit", weight: 4 }, { itemId: "cobwebs", weight: 3 }, { itemId: "leaves", weight: 2 }],
  },
  {
    id: "search_survivors",
    name: "Search for Survivors",
    description: "Look for other cats who may have survived.",
    baseDays: 1, relevantSkill: "stealth", rewardHint: "A rescued cat",
    riskHint: "Hostile survivors", recommendedRoles: ["Deputy", "Leader"], terrain: "any", canBattle: true,
    loot: [{ itemId: "map_fragment", weight: 1 }, { itemId: "moss_bedding", weight: 2 }],
  },
  {
    id: "scout_infected",
    name: "Scout for Infected Cats",
    description: "Watch the movements of the infected to plan safely.",
    baseDays: 1, relevantSkill: "stealth", rewardHint: "Infection clue",
    riskHint: "Infection, battle", recommendedRoles: ["Warrior", "Deputy"], terrain: "any", canBattle: true,
    loot: [{ itemId: "infection_clue", weight: 3 }, { itemId: "nothing", weight: 2 }],
  },
  {
    id: "explore_location",
    name: "Explore a New Location",
    description: "Venture into unknown territory for supplies and knowledge.",
    baseDays: 1, relevantSkill: "speed", rewardHint: "Varied supplies",
    riskHint: "The unknown", recommendedRoles: ["Warrior", "Leader"], terrain: "any", canBattle: true,
    loot: [
      { itemId: "useful_twoleg_object", weight: 2 }, { itemId: "shiny_trinket", weight: 2 },
      { itemId: "map_fragment", weight: 1 }, { itemId: "cure_sample", weight: 1 }, { itemId: "nothing", weight: 2 },
    ],
  },
  {
    id: "gather_materials",
    name: "Find Shelter Materials",
    description: "Collect sticks, stones, and thorns to build.",
    baseDays: 0, relevantSkill: "hunting", rewardHint: "Building materials",
    riskHint: "Minor injury", recommendedRoles: ["Warrior"], terrain: "forest", canBattle: false,
    loot: [
      { itemId: "sticks", weight: 4 }, { itemId: "stones", weight: 3 },
      { itemId: "thorns", weight: 2 }, { itemId: "leaves", weight: 2 }, { itemId: "reeds", weight: 1 },
    ],
  },
  {
    id: "investigate_sound",
    name: "Investigate a Sound",
    description: "Find the source of a strange noise near the territory.",
    baseDays: 0, relevantSkill: "stealth", rewardHint: "Answers",
    riskHint: "Ambush", recommendedRoles: ["Deputy", "Warrior"], terrain: "any", canBattle: true,
    loot: [{ itemId: "infection_clue", weight: 2 }, { itemId: "nothing", weight: 3 }],
  },
  {
    id: "rescue_missing",
    name: "Rescue a Missing Cat",
    description: "Bring back a clanmate who never returned.",
    baseDays: 1, relevantSkill: "speed", rewardHint: "A saved clanmate",
    riskHint: "Battle", recommendedRoles: ["Leader", "Warrior"], terrain: "any", canBattle: true,
    loot: [{ itemId: "nothing", weight: 1 }],
  },
  {
    id: "search_twoleg",
    name: "Search an Abandoned Twoleg Place",
    description: "Comb a Twoleg ruin for rare and useful things.",
    baseDays: 1, relevantSkill: "stealth", rewardHint: "Rare items",
    riskHint: "Dogs, traps", recommendedRoles: ["Deputy", "Warrior"], terrain: "twoleg", canBattle: true,
    loot: [
      { itemId: "mysterious_medicine", weight: 2 }, { itemId: "useful_twoleg_object", weight: 3 },
      { itemId: "water_container", weight: 2 }, { itemId: "cure_sample", weight: 1 },
    ],
  },
];

export const MISSIONS_BY_ID: Record<string, MissionDef> = Object.fromEntries(
  MISSIONS.map((m) => [m.id, m]),
);
