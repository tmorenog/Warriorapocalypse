// Shelter upgrades (8+). Require supplies + energy + days.
export interface ShelterUpgradeDef {
  id: string;
  name: string;
  description: string;
  cost: { itemId: string; quantity: number }[];
  days: number;
  energy: number;
  effect: string;
}

export const SHELTER_UPGRADES: ShelterUpgradeDef[] = [
  {
    id: "larger_den",
    name: "Larger Den",
    description: "Dig out more space so the whole group rests comfortably.",
    cost: [{ itemId: "sticks", quantity: 2 }, { itemId: "moss_bedding", quantity: 1 }],
    days: 1,
    energy: 15,
    effect: "Improves nightly energy recovery.",
  },
  {
    id: "medicine_storage",
    name: "Medicine Storage",
    description: "A dry nook to keep herbs fresh and organized.",
    cost: [{ itemId: "leaves", quantity: 2 }, { itemId: "sticks", quantity: 1 }],
    days: 1,
    energy: 12,
    effect: "Herbs and medicine keep longer; better treatment.",
  },
  {
    id: "food_storage",
    name: "Food Storage",
    description: "A cool store to slow prey from spoiling.",
    cost: [{ itemId: "leaves", quantity: 2 }, { itemId: "stones", quantity: 1 }],
    days: 1,
    energy: 12,
    effect: "Food spoils more slowly.",
  },
  {
    id: "water_storage",
    name: "Water Storage",
    description: "A hollow to keep gathered water clean.",
    cost: [{ itemId: "water_container", quantity: 1 }, { itemId: "stones", quantity: 1 }],
    days: 1,
    energy: 12,
    effect: "Store more water safely.",
  },
  {
    id: "rainwater_collector",
    name: "Rainwater Collector",
    description: "Broad leaves funnel rain into a basin.",
    cost: [{ itemId: "leaves", quantity: 3 }, { itemId: "sticks", quantity: 1 }],
    days: 1,
    energy: 14,
    effect: "Gathers water automatically when it rains.",
  },
  {
    id: "thorn_defenses",
    name: "Thorn Defenses",
    description: "A ring of thorns to slow anything that comes close.",
    cost: [{ itemId: "thorns", quantity: 3 }, { itemId: "sticks", quantity: 2 }],
    days: 1,
    energy: 16,
    effect: "Reduces the danger of shelter events.",
  },
  {
    id: "reinforced_entrance",
    name: "Reinforced Entrance",
    description: "Stones and sticks to guard the way in.",
    cost: [{ itemId: "stones", quantity: 2 }, { itemId: "sticks", quantity: 2 }],
    days: 1,
    energy: 16,
    effect: "Raises shelter integrity and defense.",
  },
  {
    id: "escape_tunnel",
    name: "Escape Tunnel",
    description: "A hidden way out if the shelter is discovered.",
    cost: [{ itemId: "sticks", quantity: 2 }, { itemId: "stones", quantity: 1 }],
    days: 2,
    energy: 20,
    effect: "Improves escape chance in shelter battles.",
  },
  {
    id: "kit_nursery",
    name: "Kit Nursery",
    description: "A soft, sheltered corner to keep the kit safe.",
    cost: [{ itemId: "moss_bedding", quantity: 2 }, { itemId: "feathers", quantity: 2 }],
    days: 1,
    energy: 12,
    effect: "The kit is safer and morale improves.",
  },
  {
    id: "observation_point",
    name: "Observation Point",
    description: "A raised spot to watch for danger.",
    cost: [{ itemId: "sticks", quantity: 2 }, { itemId: "stones", quantity: 2 }],
    days: 1,
    energy: 14,
    effect: "Warns of danger earlier; fewer surprise events.",
  },
];

export const SHELTER_UPGRADES_BY_ID: Record<string, ShelterUpgradeDef> = Object.fromEntries(
  SHELTER_UPGRADES.map((s) => [s.id, s]),
);
