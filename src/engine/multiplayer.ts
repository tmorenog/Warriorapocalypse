import type { Cat, RoleId } from "./types";
import { KIT_GUARDIAN_ROLES } from "@/data/roles";

// ---- Player <-> NPC control transfer (pure) ----

// Assign a joining player to an available NPC-controlled cat (prefer a requested role).
export function assignPlayerToCat(
  cats: Cat[],
  playerId: string,
  preferredRole?: RoleId,
): { cats: Cat[]; assignedCatId: string | null } {
  const npcCats = cats.filter((c) => c.alive && c.controllerId === null && !c.isEnemyTurned);
  if (npcCats.length === 0) return { cats, assignedCatId: null };

  let target =
    (preferredRole && npcCats.find((c) => c.role === preferredRole)) || npcCats[0];

  const next = cats.map((c) =>
    c.id === target.id ? { ...c, controllerId: playerId } : c,
  );
  return { cats: next, assignedCatId: target.id };
}

// When a player disconnects, their cat becomes NPC-controlled.
export function releasePlayerCats(cats: Cat[], playerId: string): Cat[] {
  return cats.map((c) =>
    c.controllerId === playerId ? { ...c, controllerId: null } : c,
  );
}

// Return control to a reconnecting player if their original cat is still NPC and alive.
export function reclaimCat(
  cats: Cat[],
  playerId: string,
  catId: string,
): { cats: Cat[]; ok: boolean } {
  const cat = cats.find((c) => c.id === catId);
  if (!cat || !cat.alive || cat.controllerId !== null) {
    return { cats, ok: false };
  }
  const next = cats.map((c) => (c.id === catId ? { ...c, controllerId: playerId } : c));
  return { cats: next, ok: true };
}

export function catsControlledBy(cats: Cat[], playerId: string): Cat[] {
  return cats.filter((c) => c.controllerId === playerId);
}

// ---- Kit protection rules (pure) ----

// A kit may only be part of a mission if at least one guardian role is also present.
export function kitMissionAllowed(missionCats: Cat[]): boolean {
  const hasKit = missionCats.some((c) => c.role === "Kit");
  if (!hasKit) return true;
  return missionCats.some((c) => c.role !== "Kit" && KIT_GUARDIAN_ROLES.includes(c.role));
}

// A kit cannot leave the shelter (go on a mission) without a protecting adult.
export function canKitLeaveShelter(kit: Cat, escorts: Cat[]): boolean {
  if (kit.role !== "Kit") return true;
  return escorts.some((c) => c.alive && KIT_GUARDIAN_ROLES.includes(c.role));
}
