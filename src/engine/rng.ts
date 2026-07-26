// Deterministic, seedable pseudo-random number generator (mulberry32).
// Using an explicit state lets us reproduce runs and keep multiplayer clients in sync:
// the host advances the state and distributes results; clients never roll independently.

export interface RngResult<T> {
  value: T;
  state: number;
}

export function nextFloat(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) | 0;
  const s = t >>> 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: s };
}

// Stateless helper class wrapping a mutable numeric state for ergonomic use in the engine.
export class Rng {
  state: number;

  constructor(seed: number) {
    // Normalize to a 32-bit-ish integer.
    this.state = Math.floor(seed) | 0;
  }

  float(): number {
    const r = nextFloat(this.state);
    this.state = r.state + 1;
    return r.value;
  }

  int(minInclusive: number, maxInclusive: number): number {
    return Math.floor(this.float() * (maxInclusive - minInclusive + 1)) + minInclusive;
  }

  chance(probability: number): boolean {
    return this.float() < probability;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.float() * arr.length)];
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.float() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

export function makeSeed(base?: number): number {
  // Deterministic-friendly seed. Callers may pass a fixed base for tests.
  if (typeof base === "number") return base;
  return Math.floor(Math.random() * 2 ** 31);
}
