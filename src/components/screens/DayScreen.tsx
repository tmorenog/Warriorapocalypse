import React, { useMemo, useState } from "react";
import type { GameController } from "@/game/useGameController";
import type { Cat } from "@/engine/types";
import { CLANS } from "@/data/clans";
import { ITEMS_BY_ID } from "@/data/items";
import { MISSIONS, MISSIONS_BY_ID } from "@/data/missions";
import { SHELTER_UPGRADES, SHELTER_UPGRADES_BY_ID } from "@/data/shelters";
import { HERBS } from "@/data/herbs";
import { WEATHER_EFFECTS } from "@/config/balance";
import { estimateMission } from "@/engine/missions";
import { kitMissionAllowed } from "@/engine/multiplayer";
import { computeUpgradeEffects } from "@/engine/gameState";
import { Scene } from "@/components/art/Scene";
import { CatPortrait } from "@/components/art/CatPortrait";
import { MeterBar } from "@/components/ui/MeterBar";
import { Button, Panel, Badge, Modal } from "@/components/ui/primitives";

type Tab = "cats" | "missions" | "shelter" | "inventory" | "log";

export function DayScreen({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const [tab, setTab] = useState<Tab>("cats");
  const [modal, setModal] = useState<null | "missions" | "shelter" | "inventory">(null);

  const selected = run.cats.find((c) => c.id === run.selectedCatId) ?? run.cats[0];
  const timePct = (run.dayTimeRemainingMs / 60000) * 100;

  const openModal = (m: "missions" | "shelter" | "inventory") => {
    ctx.setPaused(true);
    setModal(m);
  };
  const closeModal = () => {
    setModal(null);
    ctx.setPaused(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-3 pb-24 sm:pb-3">
      <TopBar ctx={ctx} timePct={timePct} />

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
        {/* Left: scene + roster + selected */}
        <div className="space-y-3">
          <Scene weather={run.weather} variant={run.shelter.built ? "den" : "forest"} height={180}>
            <div className="flex h-full flex-col justify-between p-3">
              <div className="flex flex-wrap gap-1">
                <Badge color={CLANS[selected.clan].color}>{WEATHER_EFFECTS[run.weather].label}</Badge>
                <Badge>{run.shelter.built ? "Sheltered" : "Exposed"}</Badge>
              </div>
              <p className="max-w-md rounded bg-black/45 px-2 py-1 text-xs text-parchment/90">
                {WEATHER_EFFECTS[run.weather].description} {run.log[0]?.text}
              </p>
            </div>
          </Scene>

          {/* Cat roster (scrollable) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {run.cats.map((c) => (
              <CatChip key={c.id} cat={c} selected={c.id === run.selectedCatId} onSelect={() => ctx.selectCat(c.id)} />
            ))}
          </div>

          {/* Desktop-visible panels */}
          <div className="hidden gap-3 sm:grid sm:grid-cols-2">
            <SelectedCatPanel ctx={ctx} cat={selected} />
            <ActionsPanel ctx={ctx} openModal={openModal} />
          </div>

          {/* Mobile tab content */}
          <div className="sm:hidden">
            {tab === "cats" && <SelectedCatPanel ctx={ctx} cat={selected} />}
            {tab === "missions" && <MissionsInline ctx={ctx} />}
            {tab === "shelter" && <ShelterInline ctx={ctx} />}
            {tab === "inventory" && <InventoryInline ctx={ctx} />}
            {tab === "log" && <EventLogPanel ctx={ctx} />}
          </div>
        </div>

        {/* Right: log + resources (desktop) */}
        <div className="hidden space-y-3 lg:block">
          <ResourceSummary ctx={ctx} />
          <EventLogPanel ctx={ctx} />
        </div>
      </div>

      {/* Desktop resources under actions on md */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:hidden">
        <ResourceSummary ctx={ctx} />
        <div className="hidden sm:block"><EventLogPanel ctx={ctx} /></div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-fern/25 bg-night/95 sm:hidden">
        {(["cats", "missions", "shelter", "inventory", "log"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[11px] capitalize ${tab === t ? "text-ember" : "text-parchment/60"}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Management modals (pause the game) */}
      {modal === "missions" && (
        <Modal title="Missions" onClose={closeModal} wide><MissionsInline ctx={ctx} /></Modal>
      )}
      {modal === "shelter" && (
        <Modal title="Shelter" onClose={closeModal} wide><ShelterInline ctx={ctx} /></Modal>
      )}
      {modal === "inventory" && (
        <Modal title="Inventory" onClose={closeModal}><InventoryInline ctx={ctx} /></Modal>
      )}

      {/* Decision modal */}
      {run.pendingDecision && (
        <Modal title={run.pendingDecision.title}>
          <p className="mb-4 text-sm text-parchment/90">{run.pendingDecision.text}</p>
          <div className="space-y-2">
            {run.pendingDecision.options.map((o) => (
              <Button key={o.id} className="w-full justify-start" onClick={() => ctx.resolveDecision(o.id)}>
                {o.label}
              </Button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function TopBar({ ctx, timePct }: { ctx: GameController; timePct: number }) {
  const run = ctx.run!;
  return (
    <div className="panel flex flex-wrap items-center gap-2 p-2">
      <div className="flex items-center gap-2">
        <span className="rounded bg-black/40 px-2 py-1 text-sm font-bold text-parchment">Day {run.day}</span>
        <span className="text-xs text-parchment/70">{WEATHER_EFFECTS[run.weather].label}</span>
      </div>
      <div className="mx-2 h-2 flex-1 overflow-hidden rounded-full bg-black/40" title="Time left in the day">
        <div className="h-full bg-fern transition-all" style={{ width: `${timePct}%` }} />
      </div>
      <span className="rounded-full bg-ember/20 px-2 py-1 text-xs font-semibold text-ember">🪙 {ctx.meta?.coins ?? 0}</span>
      <Button className="px-3 py-1 text-xs" onClick={() => ctx.setPaused(!run.paused)}>
        {run.paused ? "▶ Resume" : "⏸ Pause"}
      </Button>
      <Button className="px-3 py-1 text-xs" onClick={ctx.saveNow}>Save</Button>
      <Button className="px-3 py-1 text-xs" onClick={ctx.exitToMenu}>Menu</Button>
    </div>
  );
}

function CatChip({ cat, selected, onSelect }: { cat: Cat; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex min-w-[92px] flex-col items-center rounded-lg border p-1.5 ${
        selected ? "border-ember bg-ember/20" : "border-fern/20 bg-black/25"
      } ${!cat.alive ? "opacity-40" : ""}`}
    >
      <CatPortrait appearance={cat.appearance} cosmetics={cat.cosmetics} size={44} dimmed={!cat.alive} turned={cat.isEnemyTurned} />
      <span className="mt-0.5 truncate text-[11px] font-semibold text-parchment">{cat.name}</span>
      <span className="text-[9px] text-parchment/60">{cat.role}{cat.onMission ? " · away" : ""}</span>
      <div className="mt-1 w-full"><MeterBar kind="health" value={cat.meters.health} compact /></div>
    </button>
  );
}

function SelectedCatPanel({ ctx, cat }: { ctx: GameController; cat: Cat }) {
  return (
    <Panel title={`${cat.name} — ${cat.role} of ${cat.clan}`}>
      <div className="flex gap-3">
        <CatPortrait appearance={cat.appearance} cosmetics={cat.cosmetics} size={70} dimmed={!cat.alive} turned={cat.isEnemyTurned} />
        <div className="flex-1 space-y-1">
          <MeterBar kind="health" value={cat.meters.health} />
          <MeterBar kind="hunger" value={cat.meters.hunger} />
          <MeterBar kind="thirst" value={cat.meters.thirst} />
          <MeterBar kind="energy" value={cat.meters.energy} />
          {cat.meters.infection > 0 && <MeterBar kind="infection" value={cat.meters.infection} />}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
        <Badge color="#8bab6a">Passive: {cat.passive.name}</Badge>
        <Badge color="#c76b3b">Battle: {cat.battleAbility.name}</Badge>
        {cat.infectionStage !== "None" && <Badge color="#8a5cc4">{cat.infectionStage}</Badge>}
      </div>
      {cat.meters.infection > 0 && cat.alive && (
        <div className="mt-2">
          <p className="mb-1 text-[11px] text-parchment/70">Treat infection with the medicine cat:</p>
          <div className="flex flex-wrap gap-1">
            <Button className="px-2 py-1 text-xs" onClick={() => ctx.treatCat(cat.id)}>Basic care</Button>
            {HERBS.slice(0, 4).map((h) => (
              <Button key={h.id} className="px-2 py-1 text-xs" onClick={() => ctx.treatCat(cat.id, h.id)}>{h.name}</Button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-2 text-[11px] italic text-parchment/60">{cat.passive.description}</p>
    </Panel>
  );
}

function ActionsPanel({ ctx, openModal }: { ctx: GameController; openModal: (m: "missions" | "shelter" | "inventory") => void }) {
  return (
    <Panel title="Actions">
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => openModal("missions")}>🐾 Missions</Button>
        <Button onClick={() => openModal("shelter")}>🏕 Shelter</Button>
        <Button onClick={() => openModal("inventory")}>🎒 Inventory</Button>
        <Button onClick={ctx.feedGroup}>🍖 Feed</Button>
        <Button onClick={ctx.giveWater}>💧 Water</Button>
        <Button onClick={ctx.doAdvanceDay}>⏭ Next Day</Button>
      </div>
      <p className="mt-2 text-[11px] text-parchment/60">
        One day lasts one minute. Manage your group before the day ends — or advance early.
      </p>
    </Panel>
  );
}

function ResourceSummary({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const food = run.inventory.filter((i) => ITEMS_BY_ID[i.itemId]?.foodValue).reduce((s, i) => s + i.quantity, 0);
  const water = run.inventory.filter((i) => ITEMS_BY_ID[i.itemId]?.waterValue).reduce((s, i) => s + i.quantity, 0);
  const herbs = run.inventory.filter((i) => ITEMS_BY_ID[i.itemId]?.category === "medicine").reduce((s, i) => s + i.quantity, 0);
  const living = run.cats.filter((c) => c.alive).length;
  return (
    <Panel title="Group Condition">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Cats alive" value={`${living}/${run.cats.length}`} />
        <Stat label="Shelter" value={`${run.shelter.integrity}%`} />
        <Stat label="Food" value={food} />
        <Stat label="Water" value={water} />
        <Stat label="Medicine" value={herbs} />
        <Stat label="Missions" value={run.activeMissions.length} />
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded bg-black/30 p-2">
      <div className="text-[10px] uppercase text-parchment/50">{label}</div>
      <div className="text-sm font-semibold text-parchment">{value}</div>
    </div>
  );
}

function EventLogPanel({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  return (
    <Panel title="Event Log">
      <ul className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin text-[11px]">
        {run.log.map((e) => (
          <li key={e.id} className="rounded bg-black/25 px-2 py-1">
            <span className="mr-1 text-parchment/40">D{e.day}</span>
            <span className={logColor(e.kind)}>{e.text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function logColor(kind: string): string {
  switch (kind) {
    case "death": return "text-red-300";
    case "reward": return "text-ember";
    case "discovery": return "text-fern";
    case "battle": return "text-orange-300";
    case "injury": return "text-yellow-300";
    default: return "text-parchment/80";
  }
}

function MissionsInline({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const available = run.cats.filter((c) => c.alive && !c.onMission && !c.isEnemyTurned);
  const chosen = run.cats.filter((c) => selectedCats.includes(c.id));
  const missionDef = MISSIONS_BY_ID[missionId];

  const kitOk = kitMissionAllowed(chosen);
  const est = chosen.length > 0
    ? estimateMission(missionId, chosen, run.day, run.difficulty, computeUpgradeEffects(ctx.meta).missionSuccessBonus)
    : null;

  const toggle = (id: string) =>
    setSelectedCats((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const confirm = () => {
    if (chosen.length === 0 || !kitOk) return;
    ctx.startMission(missionId, selectedCats);
    setSelectedCats([]);
  };

  return (
    <div className="space-y-3">
      {run.activeMissions.length > 0 && (
        <div className="rounded-lg bg-black/25 p-2 text-xs">
          <div className="mb-1 font-semibold text-fern">Active Missions</div>
          {run.activeMissions.map((m) => (
            <div key={m.id} className="flex justify-between text-parchment/80">
              <span>{MISSIONS_BY_ID[m.missionId]?.name}</span>
              <span>{m.daysRemaining === 0 ? "resolving" : `${m.daysRemaining}d left`}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-parchment/70">Mission Type</label>
        <select value={missionId} onChange={(e) => setMissionId(e.target.value)} className="w-full rounded-lg border border-fern/30 bg-dusk px-2 py-2 text-sm text-parchment">
          {MISSIONS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-parchment/60">{missionDef.description}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
          <Badge>Reward: {missionDef.rewardHint}</Badge>
          <Badge color="#c15a5a">Risk: {missionDef.riskHint}</Badge>
          <Badge color="#8bab6a">Skill: {missionDef.relevantSkill}</Badge>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-parchment/70">Send cats ({chosen.length})</label>
        <div className="grid grid-cols-2 gap-1">
          {available.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`flex items-center gap-1 rounded border p-1 text-left text-[11px] ${selectedCats.includes(c.id) ? "border-ember bg-ember/20" : "border-fern/20 bg-black/20"}`}
            >
              <CatPortrait appearance={c.appearance} size={26} />
              <span className="truncate">{c.name} <span className="text-parchment/50">({c.role})</span></span>
            </button>
          ))}
        </div>
      </div>

      {est && (
        <div className="rounded-lg bg-black/25 p-2 text-xs text-parchment/80">
          <div>Estimated duration: <b>{est.days === 0 ? "same day" : `${est.days} day(s)`}</b></div>
          <div>Success chance: <b>{Math.round(est.successChance * 100)}%</b> · Energy: <b>{est.energyCost}</b></div>
          <div className="text-parchment/50">Exact outcomes are never guaranteed.</div>
        </div>
      )}
      {!kitOk && <p className="text-xs text-red-300">The kit cannot go without a Leader, Deputy, Warrior, or Medicine cat.</p>}

      <Button variant="primary" className="w-full" disabled={chosen.length === 0 || !kitOk} onClick={confirm}>
        Send on Mission
      </Button>
    </div>
  );
}

function ShelterInline({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const has = (id: string) => run.shelter.upgrades.includes(id);
  const canAfford = (id: string) => {
    const def = SHELTER_UPGRADES_BY_ID[id];
    return def.cost.every((c) => run.inventory.filter((i) => i.itemId === c.itemId).reduce((s, i) => s + i.quantity, 0) >= c.quantity);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-black/25 p-2 text-xs">
        <span>Shelter integrity: <b>{run.shelter.integrity}%</b></span>
        <Button className="px-2 py-1 text-xs btn-danger" onClick={ctx.abandonShelter}>Abandon & Rebuild</Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SHELTER_UPGRADES.map((u) => {
          const built = has(u.id);
          const afford = canAfford(u.id);
          return (
            <div key={u.id} className={`rounded-lg border p-2 text-xs ${built ? "border-fern/40 bg-fern/10" : "border-fern/20 bg-black/20"}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-parchment">{u.name}</span>
                {built && <Badge color="#8bab6a">Built</Badge>}
              </div>
              <p className="text-parchment/60">{u.effect}</p>
              <div className="mt-1 text-[10px] text-parchment/50">
                Cost: {u.cost.map((c) => `${c.quantity}× ${ITEMS_BY_ID[c.itemId]?.name}`).join(", ")} · {u.energy} energy
              </div>
              {!built && (
                <Button className="mt-1 w-full px-2 py-1 text-xs" disabled={!afford} onClick={() => ctx.buildShelterUpgrade(u.id)}>
                  {afford ? "Build" : "Need materials"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryInline({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button className="flex-1" onClick={ctx.feedGroup}>🍖 Feed hungriest</Button>
        <Button className="flex-1" onClick={ctx.giveWater}>💧 Water thirstiest</Button>
      </div>
      {run.inventory.length === 0 ? (
        <p className="text-xs text-parchment/50">Your stores are empty.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-1">
          {run.inventory.map((i) => (
            <li key={i.itemId} className="rounded bg-black/25 px-2 py-1 text-xs">
              <span className="font-semibold text-parchment">{ITEMS_BY_ID[i.itemId]?.name ?? i.itemId}</span>
              <span className="text-parchment/50"> ×{i.quantity}</span>
              <div className="text-[10px] text-parchment/40">{ITEMS_BY_ID[i.itemId]?.description}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
