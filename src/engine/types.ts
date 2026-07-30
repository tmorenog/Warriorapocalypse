// Central type definitions for Warrior Apocalypse.
// Kept framework-agnostic so the engine can be unit-tested without React.

export type ClanId =
  | "ThunderClan"
  | "RiverClan"
  | "WindClan"
  | "ShadowClan"
  | "SkyClan";

export type RoleId = "Leader" | "Deputy" | "Warrior" | "Elder" | "Kit";

export type Difficulty = "Story" | "Normal" | "Hard" | "EndlessNightmare";

export type InfectionStage =
  | "None"
  | "Exposed"
  | "Early"
  | "Worsening"
  | "Severe"
  | "Turning";

export type WeatherId =
  | "Clear"
  | "Rain"
  | "HeavyRain"
  | "Heat"
  | "Cold"
  | "Storm"
  | "Snow"
  | "Fog"
  | "Drought"
  | "Flooding";

export type FoodQuality = "fresh" | "aging" | "spoiled" | "contaminated";
export type WaterQuality = "fresh" | "questionable" | "contaminated";

export interface CatStats {
  attack: number;
  defense: number;
  hunting: number;
  medicine: number;
  stealth: number;
  speed: number;
}

export interface CatMeters {
  health: number;
  hunger: number;
  thirst: number;
  infection: number; // 0-100 numeric backing the InfectionStage
  energy: number;
}

export interface Appearance {
  furColor: string;
  furPattern: string;
  eyeColor: string;
  scars: string;
  accessory: string;
  bodyType: string;
  earShape: string;
  tailStyle: string;
  markingColor?: string; // secondary colour for bicolor/marked patterns (e.g. white)
}

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
}

// Definition (template) for a book character or custom-cat archetype.
export interface CharacterDef {
  id: string;
  name: string;
  clan: ClanId;
  role: RoleId;
  baseMeters: CatMeters;
  baseStats: CatStats;
  passive: AbilityDef;
  battleAbility: AbilityDef;
  description: string;
  appearance: Appearance;
  isCustom?: boolean;
}

// A live cat instance inside a run.
export interface Cat {
  id: string;
  defId: string;
  name: string;
  clan: ClanId;
  role: RoleId;
  meters: CatMeters;
  stats: CatStats;
  infectionStage: InfectionStage;
  passive: AbilityDef;
  battleAbility: AbilityDef;
  appearance: Appearance;
  alive: boolean;
  isEnemyTurned: boolean; // turned into an enemy after full infection
  onMission: boolean;
  cosmetics: string[]; // equipped cosmetic ids
  controllerId: string | null; // player id in multiplayer, null = NPC
  causeOfDeath?: string;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  quality?: FoodQuality | WaterQuality;
}

export interface ActiveMission {
  id: string;
  missionId: string;
  catIds: string[];
  daysRemaining: number;
  totalDays: number;
  seed: number;
}

export interface LogEntry {
  id: string;
  day: number;
  kind:
    | "event"
    | "decision"
    | "mission"
    | "injury"
    | "death"
    | "discovery"
    | "resource"
    | "battle"
    | "system"
    | "reward";
  text: string;
}

export interface ShelterState {
  built: boolean;
  upgrades: string[]; // ids of built shelter upgrades
  integrity: number; // 0-100
}

export interface RunStats {
  daysSurvived: number;
  enemiesDefeated: number;
  catsRescued: number;
  infectedCatsSaved: number;
  battlesWon: number;
  coinsEarnedThisRun: number;
  majorDecisions: string[];
}

export interface PendingDecision {
  id: string;
  title: string;
  text: string;
  options: DecisionOption[];
  eventId?: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  // resolution is handled by the engine event resolver via optionId
}

export interface RunState {
  version: number;
  seed: number;
  rngState: number;
  difficulty: Difficulty;
  day: number;
  dayTimeRemainingMs: number;
  phase: RunPhase;
  weather: WeatherId;
  location: string; // location id
  cats: Cat[];
  selectedCatId: string;
  mainCatId: string; // the player's chosen cat; its death ends single player
  inventory: InventoryItem[];
  activeMissions: ActiveMission[];
  shelter: ShelterState;
  log: LogEntry[];
  pendingDecision: PendingDecision | null;
  stats: RunStats;
  paused: boolean;
  ended: boolean;
  endingId: string | null;
  discoveries: string[];
  startedAtDay: number;
  lastSavedAt: number | null;
  pendingCutscene?: string | null; // id of a scripted cutscene to play
}

export type RunPhase =
  | "scavenging"
  | "digShelter"
  | "day"
  | "battle"
  | "ended";

// ---- Battle ----
export interface Combatant {
  id: string;
  name: string;
  side: "clan" | "enemy";
  catId?: string; // for clan cats
  enemyDefId?: string; // for enemies
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  defending: boolean;
  alive: boolean;
  infectionRisk: number;
  statuses: string[];
  controllerId: string | null;
}

export interface BattleState {
  id: string;
  combatants: Combatant[];
  turnOrder: string[];
  turnIndex: number;
  round: number;
  log: string[];
  seed: number;
  rngState: number;
  canEscape: boolean;
  over: boolean;
  result: "won" | "lost" | "escaped" | null;
  enemyGroupId: string;
}

export type BattleActionType =
  | "attack"
  | "defend"
  | "roleAbility"
  | "charAbility"
  | "item"
  | "protect"
  | "heal"
  | "distract"
  | "escape";

export interface BattleAction {
  type: BattleActionType;
  actorId: string;
  targetId?: string;
  itemId?: string;
}

// ---- Persistent (across runs) meta profile ----
export interface MetaProfile {
  version: number;
  coins: number;
  upgrades: Record<string, number>; // upgradeId -> level
  cosmeticsUnlocked: string[];
  achievements: string[]; // unlocked achievement ids
  settings: GameSettings;
  stats: {
    totalRuns: number;
    bestDays: number;
    totalCoinsEarned: number;
  };
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
  textScale: "small" | "normal" | "large";
  highContrast: boolean;
  confirmDangerous: boolean;
}
