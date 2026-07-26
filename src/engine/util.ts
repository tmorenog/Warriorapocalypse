import { Rng } from "./rng";

export interface Weighted<T> {
  value: T;
  weight: number;
}

export function weightedPick<T>(rng: Rng, items: Weighted<T>[]): T {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return items[0].value;
  let r = rng.float() * total;
  for (const item of items) {
    r -= Math.max(0, item.weight);
    if (r < 0) return item.value;
  }
  return items[items.length - 1].value;
}

export function id(prefix: string, rng: Rng): string {
  return `${prefix}_${Math.floor(rng.float() * 1e9).toString(36)}`;
}

export function uid(prefix: string): string {
  // Non-deterministic id for UI-only purposes (log rows, etc.).
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  return `${prefix}_${rand}`;
}
