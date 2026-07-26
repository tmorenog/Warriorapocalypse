import type { MetaProfile, RunState, GameSettings } from "@/engine/types";

const META_KEY = "wa_meta_v1";
const RUN_KEY = "wa_run_v1";

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.6,
  reducedMotion: false,
  textScale: "normal",
  highContrast: false,
  confirmDangerous: true,
};

export function defaultMeta(): MetaProfile {
  return {
    version: 1,
    coins: 0,
    upgrades: {},
    cosmeticsUnlocked: [],
    achievements: [],
    settings: { ...DEFAULT_SETTINGS },
    stats: { totalRuns: 0, bestDays: 0, totalCoinsEarned: 0 },
  };
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable (private mode / quota) */
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ---- Meta profile ----
export function loadMeta(): MetaProfile {
  const raw = safeGet(META_KEY);
  if (!raw) return defaultMeta();
  try {
    const parsed = JSON.parse(raw) as Partial<MetaProfile>;
    return { ...defaultMeta(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta: MetaProfile): void {
  safeSet(META_KEY, JSON.stringify(meta));
}

// ---- Run save ----
export function loadRun(): RunState | null {
  const raw = safeGet(RUN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RunState;
    if (!validateRun(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRun(run: RunState): number {
  const now = Date.now();
  const withStamp = { ...run, lastSavedAt: now };
  safeSet(RUN_KEY, JSON.stringify(withStamp));
  return now;
}

export function deleteRun(): void {
  safeRemove(RUN_KEY);
}

export function hasSavedRun(): boolean {
  return safeGet(RUN_KEY) !== null;
}

export function resetAll(): void {
  safeRemove(RUN_KEY);
  safeRemove(META_KEY);
}

// ---- Import / export & validation ----
export function validateRun(run: unknown): run is RunState {
  if (!run || typeof run !== "object") return false;
  const r = run as Record<string, unknown>;
  return (
    typeof r.version === "number" &&
    typeof r.day === "number" &&
    Array.isArray(r.cats) &&
    typeof r.mainCatId === "string" &&
    Array.isArray(r.inventory) &&
    typeof r.difficulty === "string"
  );
}

export function exportRun(run: RunState): string {
  return JSON.stringify(run, null, 2);
}

export function importRun(json: string): RunState | null {
  try {
    const parsed = JSON.parse(json);
    if (!validateRun(parsed)) return null;
    return parsed as RunState;
  } catch {
    return null;
  }
}
