import type { RoleId, CatStats, CatMeters } from "@/engine/types";

export interface RoleDef {
  id: RoleId;
  name: string;
  summary: string;
  abilities: string[];
  // Stat/meter offsets used when generating custom cats.
  statBias: Partial<CatStats>;
  meterBias: Partial<CatMeters>;
}

export const ROLES: Record<RoleId, RoleDef> = {
  Leader: {
    id: "Leader",
    name: "Leader",
    summary: "Makes final major decisions and coordinates the group.",
    abilities: [
      "Makes final major decisions",
      "Can inspire allies",
      "Commands an extra action in battle",
      "Provides a morale/coordination bonus",
    ],
    statBias: { attack: 3, defense: 3, hunting: 2 },
    meterBias: { health: 5, energy: 5 },
  },
  Deputy: {
    id: "Deputy",
    name: "Deputy",
    summary: "Organizes missions and shields clanmates.",
    abilities: [
      "Protects another cat",
      "Improves mission organization",
      "Can take over as leader",
      "Can redirect damage in battle",
    ],
    statBias: { attack: 2, defense: 4, speed: 2 },
    meterBias: { health: 4 },
  },
  Warrior: {
    id: "Warrior",
    name: "Warrior",
    summary: "The strongest standard combat role.",
    abilities: [
      "Highest normal attack power",
      "Better hunting and defense",
      "Can guard weaker cats",
      "Strongest standard combat role",
    ],
    statBias: { attack: 5, defense: 3, hunting: 3 },
    meterBias: { health: 8 },
  },
  Medicine: {
    id: "Medicine",
    name: "Medicine Cat",
    summary: "Treats wounds and reduces infection.",
    abilities: [
      "Treats wounds",
      "Reduces early infection",
      "Identifies contaminated food and water",
      "Uses herbs during and outside battle",
    ],
    statBias: { medicine: 6, defense: 1 },
    meterBias: { energy: 4 },
  },
  Kit: {
    id: "Kit",
    name: "Kit",
    summary: "Vulnerable but clever — must be protected.",
    abilities: [
      "Hides and distracts",
      "Finds narrow escape paths",
      "Detects sounds and hidden objects",
      "Raises morale",
      "Must be protected",
    ],
    statBias: { attack: -4, defense: -3, stealth: 5, speed: 3 },
    meterBias: { health: -15, energy: 5 },
  },
};

export const ROLE_LIST = Object.values(ROLES);
export const REQUIRED_ROLES: RoleId[] = ["Leader", "Deputy", "Warrior", "Medicine", "Kit"];

// Roles that can protect / escort a kit on a mission.
export const KIT_GUARDIAN_ROLES: RoleId[] = ["Leader", "Deputy", "Warrior", "Medicine"];
