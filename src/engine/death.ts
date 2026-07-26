import type { Cat, RoleId } from "./types";

// Reasons a death can/can't be reversed in multiplayer rescue rules.
export const IRREVERSIBLE_DEATHS = [
  "Lost to the infection",
  "Starvation",
  "Dehydration",
  "Fatal environmental destruction",
];

export function isTreatableDeath(cause: string | undefined): boolean {
  if (!cause) return false;
  return !IRREVERSIBLE_DEATHS.some((c) => cause.toLowerCase().includes(c.toLowerCase()));
}

// Kills a cat with a cause, unless already dead. Pure.
export function killCat(cat: Cat, cause: string): Cat {
  if (!cat.alive) return cat;
  return {
    ...cat,
    alive: false,
    causeOfDeath: cause,
    onMission: false,
    controllerId: null,
    meters: { ...cat.meters, health: 0 },
  };
}

// Determine the death cause implied by a cat's meters, if any.
export function lethalCauseFromMeters(cat: Cat): string | null {
  if (!cat.alive) return null;
  if (cat.meters.health <= 0) {
    if (cat.meters.hunger <= 0) return "Starvation";
    if (cat.meters.thirst <= 0) return "Dehydration";
    return "Succumbed to wounds";
  }
  if (cat.meters.infection >= 100) return "Lost to the infection";
  return null;
}

// Order of succession when the leader is lost.
const SUCCESSION_ORDER: RoleId[] = ["Deputy", "Warrior", "Medicine", "Kit"];

export interface SuccessionResult {
  cats: Cat[];
  newLeaderId: string | null;
  changed: boolean;
}

// Promote a new leader if the current leader is dead/turned. Deputy first, then order.
// Also promotes a new deputy from remaining eligible cats.
export function resolveSuccession(cats: Cat[]): SuccessionResult {
  const living = cats.filter((c) => c.alive);
  const hasLivingLeader = living.some((c) => c.role === "Leader");
  if (hasLivingLeader) {
    return { cats, newLeaderId: living.find((c) => c.role === "Leader")!.id, changed: false };
  }
  // Find successor by order.
  let successor: Cat | undefined;
  for (const role of SUCCESSION_ORDER) {
    successor = living.find((c) => c.role === role);
    if (successor) break;
  }
  if (!successor) {
    return { cats, newLeaderId: null, changed: false };
  }
  const promotedId = successor.id;
  let next = cats.map((c) =>
    c.id === promotedId ? { ...c, role: "Leader" as RoleId } : c,
  );

  // If the promoted cat was the deputy, promote a new deputy.
  const needsDeputy = !next.some((c) => c.alive && c.role === "Deputy");
  if (needsDeputy) {
    const eligible = next.find(
      (c) => c.alive && c.id !== promotedId && (c.role === "Warrior" || c.role === "Medicine"),
    );
    if (eligible) {
      next = next.map((c) =>
        c.id === eligible.id ? { ...c, role: "Deputy" as RoleId } : c,
      );
    }
  }
  return { cats: next, newLeaderId: promotedId, changed: true };
}
