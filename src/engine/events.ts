import { Rng } from "./rng";
import { weightedPick } from "./util";
import { RANDOM_EVENTS, RANDOM_EVENTS_BY_ID } from "@/data/events";
import type { EventOption, EventOutcome } from "@/data/events";
import type { PendingDecision } from "./types";

export function pickRandomEvent(rng: Rng, day: number, livingRoles?: Set<string>): string {
  const eligible = RANDOM_EVENTS.filter(
    (e) =>
      (e.minDay ?? 0) <= day &&
      // A role-flavored event only fires while that role is alive to speak/act.
      (!e.requiresRole || !livingRoles || livingRoles.has(e.requiresRole)),
  );
  const chosen = weightedPick(
    rng,
    eligible.map((e) => ({ value: e, weight: e.weight })),
  );
  return chosen.id;
}

export function eventToPendingDecision(eventId: string): PendingDecision {
  const def = RANDOM_EVENTS_BY_ID[eventId];
  return {
    id: `decision_${eventId}`,
    title: def.title,
    text: def.text,
    eventId,
    options: def.options.map((o) => ({ id: o.id, label: o.label })),
  };
}

export function resolveEventOption(
  rng: Rng,
  eventId: string,
  optionId: string,
): { outcome: EventOutcome; option: EventOption } | null {
  const def = RANDOM_EVENTS_BY_ID[eventId];
  if (!def) return null;
  const option = def.options.find((o) => o.id === optionId);
  if (!option) return null;
  const outcome = weightedPick(
    rng,
    option.outcomes.map((o) => ({ value: o, weight: o.weight })),
  );
  return { outcome, option };
}
