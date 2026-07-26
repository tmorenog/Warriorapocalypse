// Alternative endings (3 required; several provided). Checked by the engine each day.
export interface EndingDef {
  id: string;
  name: string;
  description: string;
  // Conditions are checked in engine/endings.ts; this is descriptive data + flags.
  requires: {
    minDay?: number;
    discovery?: string;
    hasItem?: string;
    itemQuantity?: number;
    minSurvivors?: number;
  };
}

export const ENDINGS: EndingDef[] = [
  {
    id: "cure_found",
    name: "The Cure",
    description:
      "Through clues, samples, and sacrifice, your group unravels the sickness and brews a cure. The forest may yet heal.",
    requires: { discovery: "cure_lead", hasItem: "cure_sample", itemQuantity: 2, minSurvivors: 3 },
  },
  {
    id: "safe_settlement",
    name: "The Safe Haven",
    description:
      "Following a fragment of a map, you lead the survivors to a hidden, protected settlement untouched by the sickness.",
    requires: { hasItem: "map_fragment", itemQuantity: 2, minSurvivors: 3, minDay: 15 },
  },
  {
    id: "hundred_days",
    name: "A Hundred Days",
    description:
      "One hundred days. Against every odds, your group has endured long enough for the worst to pass.",
    requires: { minDay: 100 },
  },
  {
    id: "new_territory",
    name: "New Territory",
    description:
      "With supplies gathered and survivors gathered close, you lead your group across the ridge to claim new, untainted territory.",
    requires: { minDay: 30, minSurvivors: 4, hasItem: "map_fragment", itemQuantity: 1 },
  },
];

export const ENDINGS_BY_ID: Record<string, EndingDef> = Object.fromEntries(
  ENDINGS.map((e) => [e.id, e]),
);
