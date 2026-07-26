import type { ClanId } from "@/engine/types";

export interface ClanDef {
  id: ClanId;
  name: string;
  color: string; // theme accent
  advantage: string;
  // Gameplay multipliers applied by the engine.
  bonuses: {
    forestHunting?: number;
    fishing?: number;
    waterGathering?: number;
    floodRisk?: number;
    travelSpeed?: number;
    rabbitHunting?: number;
    openTerrainDuration?: number;
    stealth?: number;
    nightMission?: number;
    detectionChance?: number;
    climbing?: number;
    escapeChance?: number;
  };
  startingLocation: string; // location id
}

export const CLANS: Record<ClanId, ClanDef> = {
  ThunderClan: {
    id: "ThunderClan",
    name: "ThunderClan",
    color: "#c76b3b",
    advantage: "Better forest hunting; more success finding mice, squirrels, and woodland supplies.",
    bonuses: { forestHunting: 1.25 },
    startingLocation: "hollow_tree",
  },
  RiverClan: {
    id: "RiverClan",
    name: "RiverClan",
    color: "#4a90c2",
    advantage: "Better swimming and fishing; gathers water and fish efficiently; lower flood risk.",
    bonuses: { fishing: 1.3, waterGathering: 1.3, floodRisk: 0.6 },
    startingLocation: "riverbank",
  },
  WindClan: {
    id: "WindClan",
    name: "WindClan",
    color: "#9bbf5a",
    advantage: "Faster travel, better rabbit hunting, and reduced mission duration in open terrain.",
    bonuses: { travelSpeed: 1.25, rabbitHunting: 1.3, openTerrainDuration: 0.8 },
    startingLocation: "rabbit_burrow",
  },
  ShadowClan: {
    id: "ShadowClan",
    name: "ShadowClan",
    color: "#7b6fa8",
    advantage: "Better stealth, lower detection chance, and better success on nighttime missions.",
    bonuses: { stealth: 1.3, detectionChance: 0.7, nightMission: 1.25 },
    startingLocation: "marsh_edge",
  },
  SkyClan: {
    id: "SkyClan",
    name: "SkyClan",
    color: "#5fae8f",
    advantage: "Better climbing and jumping; reaches elevated supplies; improved escape chance.",
    bonuses: { climbing: 1.3, escapeChance: 1.25 },
    startingLocation: "rocky_ledge",
  },
};

export const CLAN_LIST = Object.values(CLANS);
