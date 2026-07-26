"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RunState,
  MetaProfile,
  BattleState,
  Difficulty,
  CharacterDef,
  GameSettings,
  Cat,
  BattleAction,
} from "@/engine/types";
import {
  createRun,
  advanceDay,
  digShelter as digShelterEngine,
  abandonShelter as abandonShelterEngine,
  startMission as startMissionEngine,
  resolveDecision as resolveDecisionEngine,
  addItem,
  removeItem,
  updateCat,
  computeUpgradeEffects,
  type CreateRunConfig,
} from "@/engine/gameState";
import { Rng } from "@/engine/rng";
import {
  createBattle,
  applyAction,
  autoRunEnemyTurns,
  isClanTurn,
  escapeChance,
  applyBattleResultsToCats,
  enemiesDefeatedCount,
} from "@/engine/battle";
import { treatInfection } from "@/engine/infection";
import { HERBS_BY_ID } from "@/data/herbs";
import { ITEMS_BY_ID } from "@/data/items";
import { SHELTER_UPGRADES_BY_ID } from "@/data/shelters";
import { UPGRADES_BY_ID, upgradePrice } from "@/data/upgrades";
import { COSMETICS_BY_ID } from "@/data/cosmetics";
import { evaluateAchievements, type AchievementContext } from "@/engine/achievements";
import { ACHIEVEMENTS_BY_ID } from "@/data/achievements";
import { WEATHER_EFFECTS } from "@/config/balance";
import {
  loadMeta,
  saveMeta,
  loadRun,
  saveRun,
  deleteRun,
  hasSavedRun,
  resetAll,
  importRun,
} from "@/persistence/storage";

export type Screen =
  | "title"
  | "newGame"
  | "customCat"
  | "collection"
  | "shop"
  | "achievements"
  | "howToPlay"
  | "settings"
  | "credits"
  | "multiplayer"
  | "playing";

export interface Toast {
  id: number;
  text: string;
  kind: "coin" | "achievement" | "info";
}

const DAY_TICK_MS = 200;

export function useGameController() {
  const [screen, setScreen] = useState<Screen>("title");
  const [meta, setMeta] = useState<MetaProfile | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasSave, setHasSave] = useState(false);

  const flawlessRef = useRef(true);
  const toastId = useRef(0);
  const metaRef = useRef<MetaProfile | null>(null);
  metaRef.current = meta;

  // ---- init ----
  useEffect(() => {
    const m = loadMeta();
    setMeta(m);
    setHasSave(hasSavedRun());
  }, []);

  // ---- settings -> DOM ----
  useEffect(() => {
    if (!meta) return;
    const s = meta.settings;
    const html = document.documentElement;
    html.dataset.textscale = s.textScale;
    html.dataset.contrast = s.highContrast ? "high" : "normal";
    html.dataset.motion = s.reducedMotion ? "reduced" : "full";
  }, [meta]);

  const pushToast = useCallback((text: string, kind: Toast["kind"]) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const persistMeta = useCallback((next: MetaProfile) => {
    setMeta(next);
    saveMeta(next);
  }, []);

  const awardCoins = useCallback(
    (amount: number, reason?: string) => {
      const m = metaRef.current;
      if (!m || amount <= 0) return;
      const next = {
        ...m,
        coins: m.coins + amount,
        stats: { ...m.stats, totalCoinsEarned: m.stats.totalCoinsEarned + amount },
      };
      persistMeta(next);
      pushToast(`+${amount} coins${reason ? ` — ${reason}` : ""}`, "coin");
    },
    [persistMeta, pushToast],
  );

  // Evaluate & unlock achievements, awarding clamped coins.
  const checkAchievements = useCallback(
    (r: RunState, ctx: AchievementContext = {}) => {
      const m = metaRef.current;
      if (!m) return;
      const { newlyUnlocked } = evaluateAchievements(r, m.achievements, ctx);
      if (newlyUnlocked.length === 0) return;
      let coins = 0;
      for (const id of newlyUnlocked) {
        coins += ACHIEVEMENTS_BY_ID[id]?.coins ?? 0;
        pushToast(`Achievement: ${ACHIEVEMENTS_BY_ID[id]?.name}`, "achievement");
      }
      const next: MetaProfile = {
        ...m,
        achievements: [...m.achievements, ...newlyUnlocked],
        coins: m.coins + coins,
        stats: { ...m.stats, totalCoinsEarned: m.stats.totalCoinsEarned + coins },
      };
      persistMeta(next);
    },
    [persistMeta, pushToast],
  );

  // ---- run lifecycle ----
  const startNewRun = useCallback(
    (config: Omit<CreateRunConfig, "meta">) => {
      const m = metaRef.current;
      const r = createRun({ ...config, meta: m });
      setRun(r);
      setBattle(null);
      setScreen("playing");
      saveRun(r);
      setHasSave(true);
      if (m) {
        persistMeta({ ...m, stats: { ...m.stats, totalRuns: m.stats.totalRuns + 1 } });
      }
    },
    [persistMeta],
  );

  const continueRun = useCallback(() => {
    const r = loadRun();
    if (r) {
      setRun(r);
      setScreen("playing");
    }
  }, []);

  const saveNow = useCallback(() => {
    if (run) {
      const ts = saveRun(run);
      setRun((r) => (r ? { ...r, lastSavedAt: ts } : r));
      setHasSave(true);
    }
  }, [run]);

  const deleteSave = useCallback(() => {
    deleteRun();
    setHasSave(false);
    setRun(null);
  }, []);

  // Autosave whenever run changes (debounced-ish via effect).
  useEffect(() => {
    if (run && !battle) {
      const t = setTimeout(() => saveRun(run), 400);
      return () => clearTimeout(t);
    }
  }, [run, battle]);

  // ---- battle orchestration ----
  const startBattle = useCallback(
    (enemyId: string, participants?: Cat[]) => {
      setRun((r) => {
        if (!r) return r;
        const cats = (participants ?? r.cats).filter((c) => c.alive && !c.isEnemyTurned && !c.onMission);
        const rng = new Rng(r.rngState + 55);
        const b = createBattle(rng, cats, enemyId, r.day, r.difficulty, true);
        flawlessRef.current = true;
        setBattle(autoRunEnemyTurns(b));
        return { ...r, phase: "battle", paused: true, rngState: rng.state };
      });
    },
    [],
  );

  const finishBattle = useCallback(
    (finished: BattleState) => {
      setRun((r) => {
        if (!r) return r;
        let cats = applyBattleResultsToCats(r.cats, finished);
        const won = finished.result === "won";
        const escaped = finished.result === "escaped";
        const defeated = enemiesDefeatedCount(finished);
        let next: RunState = {
          ...r,
          cats,
          phase: "day",
          paused: false,
          stats: {
            ...r.stats,
            enemiesDefeated: r.stats.enemiesDefeated + defeated,
            battlesWon: r.stats.battlesWon + (won ? 1 : 0),
          },
          log: [
            {
              id: `log_${Date.now()}`,
              day: r.day,
              kind: "battle" as const,
              text: won
                ? `The group won the battle, defeating ${defeated} enem${defeated === 1 ? "y" : "ies"}.`
                : escaped
                  ? "The group escaped the battle."
                  : "The battle was lost.",
            },
            ...r.log,
          ].slice(0, 60),
        };

        // Main cat death ends the run.
        const main = next.cats.find((c) => c.id === next.mainCatId);
        if (main && !main.alive) {
          next = { ...next, ended: true, phase: "ended" };
        }

        // Achievements from the battle.
        const ctx: AchievementContext = {
          flawlessBattle: won && flawlessRef.current,
          escapedUnwinnable: escaped,
          defeatedSwarm: won && finished.enemyGroupId === "rat_swarm",
        };
        setTimeout(() => checkAchievements(next, ctx), 0);
        return next;
      });
      setBattle(null);
    },
    [checkAchievements],
  );

  const doBattleAction = useCallback(
    (action: BattleAction) => {
      setBattle((b) => {
        if (!b || b.over) return b;
        // Track flawless: compare clan health before/after.
        const beforeClan = b.combatants.filter((c) => c.side === "clan").reduce((s, c) => s + c.health, 0);
        let next = applyAction(b, action);
        if (!next.over) next = autoRunEnemyTurns(next);
        const afterClan = next.combatants.filter((c) => c.side === "clan").reduce((s, c) => s + c.health, 0);
        if (afterClan < beforeClan) flawlessRef.current = false;
        if (next.over) {
          const finished = next;
          setTimeout(() => finishBattle(finished), 600);
        }
        return next;
      });
    },
    [finishBattle],
  );

  const tryEscape = useCallback(() => {
    setBattle((b) => {
      if (!b || b.over || !run) return b;
      const clanCats = run.cats.filter((c) => b.combatants.some((cb) => cb.catId === c.id && cb.alive));
      const enemyCount = b.combatants.filter((c) => c.side === "enemy" && c.alive).length;
      const eff = computeUpgradeEffects(metaRef.current);
      const vis = WEATHER_EFFECTS[run.weather].visibility;
      const chance = escapeChance(clanCats, enemyCount, vis, 0);
      const rng = new Rng(b.rngState + 3);
      if (rng.chance(chance)) {
        const finished: BattleState = { ...b, over: true, result: "escaped", log: [...b.log, "The group slips away to safety!"] };
        setTimeout(() => finishBattle(finished), 600);
        return finished;
      }
      let next: BattleState = { ...b, log: [...b.log, "The escape fails! The enemy presses in."], rngState: rng.state };
      next = autoRunEnemyTurns(next);
      if (next.over) {
        const finished = next;
        setTimeout(() => finishBattle(finished), 600);
      }
      return next;
    });
  }, [run, finishBattle]);

  // ---- day advancement ----
  const finalizeRun = useCallback((r: RunState) => {
    const m = metaRef.current;
    if (!m) return;
    const best = Math.max(m.stats.bestDays, r.day - 1);
    persistMeta({ ...m, stats: { ...m.stats, bestDays: best } });
    deleteRun();
    setHasSave(false);
  }, [persistMeta]);

  const doAdvanceDay = useCallback(() => {
    setRun((r) => {
      if (!r || r.ended || r.phase !== "day" || r.pendingDecision) return r;
      const { run: next, coinsEarned, triggeredBattleEnemyId, droughtSurvived } = advanceDay(r, metaRef.current);
      if (coinsEarned > 0) awardCoins(coinsEarned, `day ${next.day}`);
      setTimeout(() => checkAchievements(next, { survivedDrought: droughtSurvived }), 0);
      if (triggeredBattleEnemyId) {
        setTimeout(() => startBattle(triggeredBattleEnemyId), 50);
      }
      if (next.ended) {
        finalizeRun(next);
      }
      return next;
    });
  }, [awardCoins, checkAchievements, startBattle, finalizeRun]);

  // Day countdown timer.
  useEffect(() => {
    if (!run || run.phase !== "day" || run.paused || run.pendingDecision || run.ended || battle) return;
    const interval = setInterval(() => {
      setRun((r) => {
        if (!r || r.phase !== "day" || r.paused || r.pendingDecision || r.ended) return r;
        const remaining = r.dayTimeRemainingMs - DAY_TICK_MS;
        if (remaining <= 0) {
          setTimeout(() => doAdvanceDay(), 0);
          return { ...r, dayTimeRemainingMs: 0 };
        }
        return { ...r, dayTimeRemainingMs: remaining };
      });
    }, DAY_TICK_MS);
    return () => clearInterval(interval);
  }, [run, battle, doAdvanceDay]);

  // ---- decisions ----
  const resolveDecision = useCallback(
    (optionId: string) => {
      setRun((r) => {
        if (!r || !r.pendingDecision) return r;
        const { run: next, battleEnemyId, abandonPrompt } = resolveDecisionEngine(r, optionId);
        if (battleEnemyId) setTimeout(() => startBattle(battleEnemyId), 50);
        if (abandonPrompt) pushToast("The group may need to abandon the shelter (Shelter panel).", "info");
        setTimeout(() => checkAchievements(next), 0);
        return next;
      });
    },
    [startBattle, pushToast, checkAchievements],
  );

  // ---- player actions ----
  const setPaused = useCallback((paused: boolean) => {
    setRun((r) => (r ? { ...r, paused } : r));
  }, []);

  const selectCat = useCallback((catId: string) => {
    setRun((r) => (r ? { ...r, selectedCatId: catId } : r));
  }, []);

  const digShelter = useCallback(() => {
    setRun((r) => (r ? digShelterEngine(r) : r));
  }, []);

  const finishScavenge = useCallback((collected: { itemId: string; quantity: number }[]) => {
    setRun((r) => {
      if (!r) return r;
      let next = r;
      for (const it of collected) next = addItem(next, it.itemId, it.quantity);
      return { ...next, phase: "digShelter" };
    });
  }, []);

  const startMission = useCallback(
    (missionId: string, catIds: string[]) => {
      setRun((r) => {
        if (!r) return r;
        const next = startMissionEngine(r, missionId, catIds, metaRef.current);
        // A same-day mission may have triggered a battle need — handled via next-day for simplicity.
        return next;
      });
    },
    [],
  );

  const buildShelterUpgrade = useCallback((upgradeId: string) => {
    setRun((r) => {
      if (!r) return r;
      const def = SHELTER_UPGRADES_BY_ID[upgradeId];
      if (!def || r.shelter.upgrades.includes(upgradeId)) return r;
      // Check materials.
      for (const c of def.cost) {
        const have = r.inventory.filter((i) => i.itemId === c.itemId).reduce((s, i) => s + i.quantity, 0);
        if (have < c.quantity) return r;
      }
      let next = r;
      for (const c of def.cost) next = removeItem(next, c.itemId, c.quantity);
      next = {
        ...next,
        shelter: { ...next.shelter, upgrades: [...next.shelter.upgrades, upgradeId], integrity: Math.min(100, next.shelter.integrity + 8) },
        cats: next.cats.map((c) => (c.id === next.selectedCatId ? { ...c, meters: { ...c.meters, energy: Math.max(0, c.meters.energy - def.energy) } } : c)),
        log: [{ id: `log_${Date.now()}`, day: next.day, kind: "system" as const, text: `Built shelter upgrade: ${def.name}.` }, ...next.log].slice(0, 60),
      };
      return next;
    });
  }, []);

  const abandonShelter = useCallback(() => {
    setRun((r) => {
      if (!r) return r;
      const next = abandonShelterEngine(r);
      setTimeout(() => checkAchievements(next, { relocated: true }), 0);
      return next;
    });
  }, [checkAchievements]);

  const treatCat = useCallback(
    (patientId: string, herbId?: string) => {
      setRun((r) => {
        if (!r) return r;
        const medic = r.cats.find((c) => c.alive && c.role === "Medicine") ?? r.cats.find((c) => c.alive);
        const patient = r.cats.find((c) => c.id === patientId);
        if (!medic || !patient || patient.meters.infection <= 0) return r;
        const rng = new Rng(r.rngState + 77);
        const herb = herbId ? HERBS_BY_ID[herbId] : null;
        const eff = computeUpgradeEffects(metaRef.current);
        const wasInfected = patient.infectionStage;
        const res = treatInfection(
          patient,
          medic.stats.medicine,
          herb?.infectionCure ?? 20,
          herb?.treatmentBonus ?? 0,
          rng.float(),
          eff.medicineBonus,
        );
        let next = updateCat(r, patientId, () => res.cat);
        if (herbId) next = removeItem(next, "herb_kit", 0); // herbs are conceptual; keep herb_kit item optional
        next = {
          ...next,
          rngState: rng.state,
          log: [{ id: `log_${Date.now()}`, day: next.day, kind: "event" as const, text: `${medic.name} treats ${patient.name}: ${res.message}` }, ...next.log].slice(0, 60),
        };
        if (res.success && wasInfected !== "None") {
          next = { ...next, stats: { ...next.stats, infectedCatsSaved: next.stats.infectedCatsSaved + 1 } };
          setTimeout(() => checkAchievements(next, { savedInfected: true }), 0);
        }
        return next;
      });
    },
    [checkAchievements],
  );

  const feedGroup = useCallback(() => {
    setRun((r) => {
      if (!r) return r;
      // Consume one food item, feeding the hungriest cat.
      const foodItem = r.inventory.find((i) => ITEMS_BY_ID[i.itemId]?.foodValue);
      if (!foodItem) return r;
      const def = ITEMS_BY_ID[foodItem.itemId];
      const hungriest = [...r.cats].filter((c) => c.alive).sort((a, b) => a.meters.hunger - b.meters.hunger)[0];
      if (!hungriest) return r;
      let next = updateCat(r, hungriest.id, (c) => ({ ...c, meters: { ...c.meters, hunger: Math.min(100, c.meters.hunger + (def.foodValue ?? 12)) } }));
      next = removeItem(next, foodItem.itemId, 1);
      return next;
    });
  }, []);

  const giveWater = useCallback(() => {
    setRun((r) => {
      if (!r) return r;
      const waterItem = r.inventory.find((i) => ITEMS_BY_ID[i.itemId]?.waterValue);
      if (!waterItem) return r;
      const def = ITEMS_BY_ID[waterItem.itemId];
      const thirstiest = [...r.cats].filter((c) => c.alive).sort((a, b) => a.meters.thirst - b.meters.thirst)[0];
      if (!thirstiest) return r;
      let next = updateCat(r, thirstiest.id, (c) => ({ ...c, meters: { ...c.meters, thirst: Math.min(100, c.meters.thirst + (def.waterValue ?? 20)) } }));
      next = removeItem(next, waterItem.itemId, 1);
      return next;
    });
  }, []);

  // ---- meta: shop / cosmetics / settings ----
  const purchaseUpgrade = useCallback(
    (upgradeId: string) => {
      const m = metaRef.current;
      if (!m) return;
      const level = m.upgrades[upgradeId] ?? 0;
      const price = upgradePrice(upgradeId, level);
      if (price === null || m.coins < price) return;
      persistMeta({
        ...m,
        coins: m.coins - price,
        upgrades: { ...m.upgrades, [upgradeId]: level + 1 },
      });
      pushToast(`Upgraded ${UPGRADES_BY_ID[upgradeId]?.name}!`, "info");
    },
    [persistMeta, pushToast],
  );

  const unlockCosmetic = useCallback(
    (cosmeticId: string) => {
      const m = metaRef.current;
      if (!m || m.cosmeticsUnlocked.includes(cosmeticId)) return;
      const def = COSMETICS_BY_ID[cosmeticId];
      if (!def || m.coins < def.price) return;
      persistMeta({
        ...m,
        coins: m.coins - def.price,
        cosmeticsUnlocked: [...m.cosmeticsUnlocked, cosmeticId],
      });
      pushToast(`Unlocked ${def.name}!`, "info");
    },
    [persistMeta, pushToast],
  );

  const updateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      const m = metaRef.current;
      if (!m) return;
      persistMeta({ ...m, settings: { ...m.settings, ...patch } });
    },
    [persistMeta],
  );

  const resetAllData = useCallback(() => {
    resetAll();
    const fresh = loadMeta();
    setMeta(fresh);
    setRun(null);
    setHasSave(false);
    setScreen("title");
  }, []);

  const importSave = useCallback((json: string): boolean => {
    const r = importRun(json);
    if (!r) return false;
    setRun(r);
    saveRun(r);
    setHasSave(true);
    setScreen("playing");
    return true;
  }, []);

  const exitToMenu = useCallback(() => {
    if (run && !run.ended) saveRun(run);
    setScreen("title");
    setBattle(null);
  }, [run]);

  const endRunToMenu = useCallback(() => {
    setRun(null);
    setBattle(null);
    setScreen("title");
  }, []);

  return {
    // state
    screen, meta, run, battle, toasts, hasSave,
    // nav
    setScreen, exitToMenu, endRunToMenu,
    // run lifecycle
    startNewRun, continueRun, saveNow, deleteSave, importSave, resetAllData,
    // gameplay
    setPaused, selectCat, digShelter, finishScavenge, startMission,
    buildShelterUpgrade, abandonShelter, treatCat, feedGroup, giveWater,
    resolveDecision, doAdvanceDay,
    // battle
    startBattle, doBattleAction, tryEscape, isClanTurn,
    // meta
    purchaseUpgrade, unlockCosmetic, updateSettings, awardCoins,
    // debug
    setRun, pushToast,
  };
}

export type GameController = ReturnType<typeof useGameController>;
