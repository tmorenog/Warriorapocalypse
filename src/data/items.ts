export type ItemCategory =
  | "food"
  | "water"
  | "container"
  | "medicine"
  | "material"
  | "tool"
  | "special";

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  // effect hints used by the engine
  foodValue?: number;
  waterValue?: number;
  healValue?: number;
  infectionCure?: number;
  icon: string; // emoji-free simple glyph label used by SVG rendering
}

export const ITEMS: ItemDef[] = [
  // Food
  { id: "mouse", name: "Mouse", category: "food", description: "A small woodland mouse.", foodValue: 14, icon: "mouse" },
  { id: "vole", name: "Vole", category: "food", description: "A plump vole.", foodValue: 18, icon: "vole" },
  { id: "rabbit", name: "Rabbit", category: "food", description: "A large rabbit — plenty of meat.", foodValue: 34, icon: "rabbit" },
  { id: "fish", name: "Fish", category: "food", description: "A fresh river fish.", foodValue: 22, icon: "fish" },
  { id: "squirrel", name: "Squirrel", category: "food", description: "A bushy-tailed squirrel.", foodValue: 24, icon: "squirrel" },
  { id: "bird", name: "Bird", category: "food", description: "A small bird — quick to catch, quick to eat.", foodValue: 16, icon: "bird" },
  // Water
  { id: "fresh_water", name: "Fresh Water", category: "water", description: "Clean drinking water.", waterValue: 30, icon: "water" },
  { id: "water_container", name: "Water Container", category: "container", description: "A Twoleg object that holds water.", icon: "container" },
  { id: "rainwater", name: "Rainwater", category: "water", description: "Collected rainwater.", waterValue: 22, icon: "water" },
  // Medicine
  { id: "herb_kit", name: "Herb Kit", category: "medicine", description: "A bundle of common healing herbs.", healValue: 20, infectionCure: 15, icon: "herb" },
  { id: "cobwebs", name: "Cobwebs", category: "medicine", description: "Stops bleeding from wounds.", healValue: 10, icon: "web" },
  { id: "mysterious_medicine", name: "Mysterious Medicine", category: "medicine", description: "An unfamiliar Twoleg medicine. Powerful, but uncertain.", healValue: 30, infectionCure: 30, icon: "vial" },
  // Materials
  { id: "moss_bedding", name: "Moss Bedding", category: "material", description: "Soft moss for sleeping.", icon: "moss" },
  { id: "sticks", name: "Sticks", category: "material", description: "Sturdy sticks for building.", icon: "stick" },
  { id: "thorns", name: "Thorns", category: "material", description: "Sharp thorns for defenses.", icon: "thorn" },
  { id: "cobweb_bundle", name: "Cobweb Bundle", category: "material", description: "A large gathering of cobwebs.", icon: "web" },
  { id: "reeds", name: "Reeds", category: "material", description: "River reeds, good for weaving.", icon: "reed" },
  { id: "leaves", name: "Broad Leaves", category: "material", description: "Wide leaves for wrapping and roofing.", icon: "leaf" },
  { id: "stones", name: "Stones", category: "material", description: "Smooth stones for reinforcing.", icon: "stone" },
  { id: "feathers", name: "Feathers", category: "material", description: "Soft feathers for bedding and warmth.", icon: "feather" },
  // Tools / special
  { id: "map_fragment", name: "Map Fragment", category: "special", description: "A torn piece of a map. Hints at distant places.", icon: "map" },
  { id: "defensive_materials", name: "Defensive Materials", category: "material", description: "Assorted materials for fortifying the shelter.", icon: "shield" },
  { id: "useful_twoleg_object", name: "Useful Twoleg Object", category: "tool", description: "A strange but useful Twoleg thing.", icon: "gear" },
  { id: "shiny_trinket", name: "Shiny Trinket", category: "special", description: "A glittering Twoleg trinket. Lifts spirits.", icon: "gem" },
  { id: "infection_clue", name: "Infection Clue", category: "special", description: "A clue about the source of the infection.", icon: "clue" },
  { id: "cure_sample", name: "Cure Sample", category: "special", description: "A rare sample that may lead to a cure.", icon: "cure" },
];

export const ITEMS_BY_ID: Record<string, ItemDef> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);

export const FOOD_ITEMS = ITEMS.filter((i) => i.category === "food");
export const WATER_ITEMS = ITEMS.filter((i) => i.category === "water");
