// Herbs & medical supplies (10). Used by the medicine-cat treatment system.
export interface HerbDef {
  id: string;
  name: string;
  description: string;
  healValue: number;
  infectionCure: number; // reduces infection meter
  treatmentBonus: number; // added to treatment probability (0-1)
}

export const HERBS: HerbDef[] = [
  { id: "marigold", name: "Marigold", description: "Prevents infection in wounds.", healValue: 8, infectionCure: 14, treatmentBonus: 0.12 },
  { id: "horsetail", name: "Horsetail", description: "Treats infections and strengthens wounds.", healValue: 10, infectionCure: 16, treatmentBonus: 0.14 },
  { id: "goldenrod", name: "Goldenrod", description: "A strong poultice for healing wounds.", healValue: 16, infectionCure: 6, treatmentBonus: 0.05 },
  { id: "chamomile", name: "Chamomile", description: "Soothes and strengthens a weary heart.", healValue: 6, infectionCure: 4, treatmentBonus: 0.04 },
  { id: "burdock_root", name: "Burdock Root", description: "Fights infection from rat bites.", healValue: 8, infectionCure: 20, treatmentBonus: 0.18 },
  { id: "poppy_seeds", name: "Poppy Seeds", description: "Eases pain and lets a cat rest.", healValue: 12, infectionCure: 0, treatmentBonus: 0.02 },
  { id: "watermint", name: "Watermint", description: "Settles the belly after bad prey.", healValue: 6, infectionCure: 8, treatmentBonus: 0.06 },
  { id: "comfrey", name: "Comfrey", description: "Mends wounds and eases aches.", healValue: 18, infectionCure: 4, treatmentBonus: 0.05 },
  { id: "yarrow", name: "Yarrow", description: "Expels toxins from contaminated food.", healValue: 4, infectionCure: 18, treatmentBonus: 0.15 },
  { id: "catmint", name: "Catmint", description: "The best defense against the worst sickness.", healValue: 14, infectionCure: 28, treatmentBonus: 0.25 },
];

export const HERBS_BY_ID: Record<string, HerbDef> = Object.fromEntries(
  HERBS.map((h) => [h.id, h]),
);
