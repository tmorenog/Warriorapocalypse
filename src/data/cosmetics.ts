// Cosmetics (10). Visual only. Unlocked with coins. Original designs.
export interface CosmeticDef {
  id: string;
  name: string;
  description: string;
  price: number;
  slot: "head" | "body" | "neck" | "tail" | "ear" | "marking";
  color: string;
}

export const COSMETICS: CosmeticDef[] = [
  { id: "leaf_crown", name: "Leaf Crown", description: "A woven crown of green leaves.", price: 8, slot: "head", color: "#6fae7a" },
  { id: "feather_accessory", name: "Feather", description: "A single bright feather tucked behind the ear.", price: 6, slot: "ear", color: "#c76b3b" },
  { id: "vine_wrap", name: "Vine Wrap", description: "A trailing wrap of forest vine.", price: 8, slot: "body", color: "#5c7a4b" },
  { id: "moss_cape", name: "Moss Cape", description: "A soft cape of living moss.", price: 12, slot: "body", color: "#5c7a4b" },
  { id: "flower_collar", name: "Flower Collar", description: "A collar of tiny woven flowers.", price: 10, slot: "neck", color: "#c88ab0" },
  { id: "bandage", name: "Bandage", description: "A clean cobweb bandage, worn with pride.", price: 5, slot: "body", color: "#e8e0cf" },
  { id: "small_satchel", name: "Small Satchel", description: "A little Twoleg satchel for carrying treasures.", price: 12, slot: "body", color: "#8a6a3a" },
  { id: "winter_covering", name: "Winter Covering", description: "A warm covering for the cold moons.", price: 10, slot: "body", color: "#c9d2da" },
  { id: "clan_markings", name: "Clan Markings", description: "Bold markings in clan colors.", price: 14, slot: "marking", color: "#c76b3b" },
  { id: "tail_ribbon", name: "Tail Ribbon", description: "A decorative ribbon for the tail.", price: 8, slot: "tail", color: "#a23b6b" },
];

export const COSMETICS_BY_ID: Record<string, CosmeticDef> = Object.fromEntries(
  COSMETICS.map((c) => [c.id, c]),
);
