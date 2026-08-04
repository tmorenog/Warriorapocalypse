import React, { useMemo, useState } from "react";
import type { GameController } from "@/game/useGameController";
import type { Cat } from "@/engine/types";
import { CLANS } from "@/data/clans";
import { roleLabel } from "@/data/roles";
import { ITEMS_BY_ID } from "@/data/items";
import { MISSIONS, MISSIONS_BY_ID } from "@/data/missions";
import { SHELTER_UPGRADES, SHELTER_UPGRADES_BY_ID } from "@/data/shelters";
import { HERBS } from "@/data/herbs";
import { WEATHER_EFFECTS } from "@/config/balance";
import { estimateMission } from "@/engine/missions";
import { kitMissionAllowed } from "@/engine/multiplayer";
import { computeUpgradeEffects } from "@/engine/gameState";
import { Scene } from "@/components/art/Scene";
import { HuntCutscene } from "./HuntCutscene";
import { CatPortrait } from "@/components/art/CatPortrait";
import { CatSprite } from "@/components/art/CatSprite";
import { MeterBar } from "@/components/ui/MeterBar";
import { Button, Panel, Badge, Modal } from "@/components/ui/primitives";

type Tab = "cats" | "missions" | "shelter" | "inventory" | "log";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "cats", label: "Cats", icon: "🐱" },
  { id: "missions", label: "Missions", icon: "🐾" },
  { id: "shelter", label: "Shelter", icon: "🏕" },
  { id: "inventory", label: "Stores", icon: "🎒" },
  { id: "log", label: "Log", icon: "📜" },
];

export function DayScreen({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const [tab, setTab] = useState<Tab>("cats");
  const [modal, setModal] = useState<null | "missions" | "shelter" | "inventory">(null);
  const [viewCatId, setViewCatId] = useState<string | null>(null);

  const selected = run.cats.find((c) => c.id === run.selectedCatId) ?? run.cats[0];
  const timePct = (run.dayTimeRemainingMs / 60000) * 100;
  // In the den, seat cats on Aina's drawing by role (leader on the log, etc.).
  const denSpots = run.shelter.built ? assignDenSpots(run.cats) : null;

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
          <Scene
            weather={run.weather}
            variant={run.shelter.built ? "den" : "forest"}
            height="clamp(260px, 48vh, 460px)"
            day={run.shelter.built ? run.day : undefined}
            coins={run.shelter.built ? ctx.meta?.coins : undefined}
            denCats={
              denSpots
                ? denSpots.map((c) =>
                    !c
                      ? undefined
                      : c.appearance.artSrc
                        ? { erase: true } // erase the drawn cat; Mapleshade draws her own art here
                        : c.alive
                          ? { fur: c.appearance.furColor, eye: c.appearance.eyeColor, pattern: c.appearance.furPattern, marking: c.appearance.markingColor }
                          : { fur: "#9a9a9a", eye: "#6b6b6b" },
                  )
                : undefined
            }
          >
            {denSpots ? (
              /* The den IS Aina's drawing, tinted to the clan's colours. Her cats
                 ARE the clan, seated by role — tap one to select/view it. */
              <DenClan
                spots={denSpots}
                selectedCatId={run.selectedCatId}
                onView={(id) => { ctx.selectCat(id); setViewCatId(id); }}
              />
            ) : (
              <div className="flex h-full flex-col justify-between p-2">
                <div className="flex flex-wrap gap-1">
                  <Badge color={CLANS[selected.clan].color}>{WEATHER_EFFECTS[run.weather].label}</Badge>
                  <Badge>Exposed</Badge>
                </div>
                <SceneCats
                  cats={run.cats}
                  selectedCatId={run.selectedCatId}
                  onView={(id) => { ctx.selectCat(id); setViewCatId(id); }}
                />
                <p className="mt-auto rounded bg-black/45 px-2 py-1 text-[11px] text-parchment/90">
                  {WEATHER_EFFECTS[run.weather].description} {run.log[0]?.text}
                </p>
              </div>
            )}
          </Scene>

          {/* Cat roster — only before shelter; in the den the clan IS the drawing. */}
          {!run.shelter.built && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {run.cats.map((c) => (
                <CatChip key={c.id} cat={c} selected={c.id === run.selectedCatId} onSelect={() => ctx.selectCat(c.id)} />
              ))}
            </div>
          )}

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

      {/* Mobile bottom nav — icon + label tabs with live badges */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-fern/30 bg-night/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.45)] sm:hidden">
        {TABS.map((t) => {
          const active = tab === t.id;
          const badge = t.id === "missions" ? run.activeMissions.length : 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                active ? "text-ember" : "text-parchment/60"
              }`}
            >
              {active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-ember" />}
              <span className="relative text-lg leading-none">
                {t.icon}
                {badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-night">
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          );
        })}
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

      {/* Fullscreen cat viewer */}
      {viewCatId && <FullscreenCat ctx={ctx} catId={viewCatId} onClose={() => setViewCatId(null)} />}
    </div>
  );
}

function FullscreenCat({ ctx, catId, onClose }: { ctx: GameController; catId: string; onClose: () => void }) {
  const cat = ctx.run!.cats.find((c) => c.id === catId);
  if (!cat) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-night/95 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center">
          <CatPortrait appearance={cat.appearance} role={cat.role} cosmetics={cat.cosmetics} size={300} dimmed={!cat.alive} turned={cat.isEnemyTurned} />
        </div>
        <div className="mt-1 text-center">
          <div className="font-display text-2xl text-parchment">{cat.name}</div>
          <div className="mt-1 flex justify-center gap-1">
            <Badge color={CLANS[cat.clan].color}>{roleLabel(cat.role)}</Badge>
            <Badge>{cat.clan}</Badge>
            {cat.infectionStage !== "None" && <Badge color="#8a5cc4">{cat.infectionStage}</Badge>}
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-xs space-y-1">
          <MeterBar kind="health" value={cat.meters.health} />
          <MeterBar kind="hunger" value={cat.meters.hunger} />
          <MeterBar kind="thirst" value={cat.meters.thirst} />
          <MeterBar kind="energy" value={cat.meters.energy} />
          {cat.meters.infection > 0 && <MeterBar kind="infection" value={cat.meters.infection} />}
        </div>
        <Button className="mt-4 w-full" onClick={onClose}>Close</Button>
      </div>
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
      <CatPortrait appearance={cat.appearance} role={cat.role} cosmetics={cat.cosmetics} size={44} dimmed={!cat.alive} turned={cat.isEnemyTurned} />
      <span className="mt-0.5 truncate text-[11px] font-semibold text-parchment">{cat.name}</span>
      <span className="text-[9px] text-parchment/60">{roleLabel(cat.role)}{cat.onMission ? " · away" : ""}</span>
      <div className="mt-1 w-full"><MeterBar kind="health" value={cat.meters.health} compact /></div>
    </button>
  );
}

// Tap targets sitting over the cats Aina drew in the den, in DEN_CAT_BOXES order:
// centre log, left stump, right rock, barrel, ground. Tapping selects/opens that
// cat; each shows a small name + health so the den works without a separate roster.
const DEN_SPOTS = [
  { left: 38, top: 34, width: 17, height: 28 }, // centre cut-log
  { left: 3, top: 42, width: 27, height: 22 }, // left mossy stump
  { left: 67, top: 54, width: 20, height: 16 }, // right rock
  { left: 61, top: 68, width: 12, height: 20 }, // water barrel
  { left: 73, top: 84, width: 10, height: 13 }, // tiny ground cat
];

// Placement of a finished-art cat on each den spot: centre x, feet line, and
// size (all % of the scene). Tuned so each stands on its perch.
// Positioned directly over the old drawn cat so the new art covers it (including
// its outline). Feet on the perch surface.
const DEN_ART_PLACEMENT: Record<number, { cx: number; feet: number; size: number }> = {
  0: { cx: 46, feet: 58, size: 29 }, // on the centre log
  1: { cx: 17, feet: 62, size: 31 }, // on the left stump
  2: { cx: 78, feet: 65, size: 24 }, // on the right rock
  3: { cx: 66, feet: 91, size: 28 }, // on the barrel
  4: { cx: 79, feet: 96, size: 18 }, // on the ground
};

// Seat cats on the drawing BY ROLE, not by pick order, so the leader takes the
// centre log, the deputy the stump, the elder curls on the rock, a warrior sits
// in the barrel, and the kit is on the ground. Leftover cats (e.g. a second
// warrior when there's no elder) fill any open spot.
const DEN_SPOT_ROLES = ["Leader", "Deputy", "Elder", "Warrior", "Kit"] as const;
function assignDenSpots(cats: Cat[]): (Cat | null)[] {
  const spots: (Cat | null)[] = [null, null, null, null, null];
  const used = new Set<number>();
  DEN_SPOT_ROLES.forEach((role, i) => {
    const idx = cats.findIndex((c, ci) => !used.has(ci) && c.role === role);
    if (idx >= 0) {
      spots[i] = cats[idx];
      used.add(idx);
    }
  });
  const leftover = cats.map((_, ci) => ci).filter((ci) => !used.has(ci));
  for (let i = 0; i < spots.length && leftover.length; i++) {
    if (!spots[i]) {
      const ci = leftover.shift()!;
      spots[i] = cats[ci];
      used.add(ci);
    }
  }
  return spots;
}

function DenClan({
  spots,
  selectedCatId,
  onView,
}: {
  spots: (Cat | null)[];
  selectedCatId: string;
  onView: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0">
      {spots.map((c, i) => {
        if (!c) return null;
        const s = DEN_SPOTS[i];
        const away = c.onMission || c.isEnemyTurned;
        return (
          <React.Fragment key={c.id}>
            {/* Cats with finished art (Mapleshade) show that drawing on their
                spot, instead of the plain den cat. */}
            {c.appearance.artSrc && (() => {
              // Where the finished-art cat stands on its spot: centre x, feet line,
              // and size — tuned per spot so it sits on the perch, not off-screen.
              const place = DEN_ART_PLACEMENT[i] ?? { cx: s.left + s.width / 2, feet: s.top + s.height, size: 30 };
              return (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${place.cx}%`,
                    top: `${place.feet - place.size}%`,
                    width: `${place.size}%`,
                    height: `${place.size}%`,
                    transform: "translateX(-50%)",
                    zIndex: 30 + Math.round(s.top),
                    opacity: c.alive ? 1 : 0.5,
                  }}
                >
                  <CatSprite role={c.role} appearance={c.appearance} fill dimmed={!c.alive} />
                </div>
              );
            })()}
            <button
              onClick={() => onView(c.id)}
              aria-label={`View ${c.name}`}
              style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, height: `${s.height}%` }}
              className={`group absolute rounded-xl transition ${!c.alive ? "opacity-50" : ""} ${
                c.id === selectedCatId ? "ring-2 ring-ember/80" : "hover:ring-2 hover:ring-parchment/40"
              }`}
            >
              <span className="pointer-events-none absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center gap-0.5">
                <span className={`whitespace-nowrap rounded bg-black/65 px-1 text-[9px] font-semibold text-parchment transition ${c.id === selectedCatId ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {c.name}
                  {!c.alive ? " ✝" : away ? " (away)" : ""}
                </span>
                <span className="h-1 w-8 overflow-hidden rounded-full bg-black/55">
                  <span className="block h-full rounded-full" style={{ width: `${c.meters.health}%`, background: c.meters.health > 45 ? "#8bab6a" : "#c15a5a" }} />
                </span>
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// The clan shown large in the forest scene (pre-shelter), standing along the
// floor. Tap a cat to view it fullscreen.
function SceneCats({
  cats,
  selectedCatId,
  onView,
}: {
  cats: Cat[];
  selectedCatId: string;
  onView: (id: string) => void;
}) {
  const present = cats.filter((c) => c.alive && !c.onMission && !c.isEnemyTurned);
  const n = present.length;
  const size = n <= 3 ? 128 : n === 4 ? 112 : n === 5 ? 96 : 84;
  return (
    <div className="relative flex-1">
      {present.map((c, i) => {
        const left = ((i + 1) / (n + 1)) * 100;
        return (
          <button
            key={c.id}
            onClick={() => onView(c.id)}
            aria-label={`View ${c.name}`}
            style={{ left: `${left}%`, bottom: 0, zIndex: 10 + i }}
            className={`absolute flex -translate-x-1/2 flex-col items-center rounded-lg p-0.5 transition ${
              c.id === selectedCatId ? "ring-2 ring-ember/70" : ""
            }`}
          >
            <CatSprite
              appearance={c.appearance}
              role={c.role}
              cosmetics={c.cosmetics}
              size={size}
              facing={i % 2 ? "left" : "right"}
            />
            <span className="-mt-1 rounded bg-black/50 px-1.5 text-[10px] font-semibold text-parchment">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SelectedCatPanel({ ctx, cat }: { ctx: GameController; cat: Cat }) {
  return (
    <Panel title={`${cat.name} — ${roleLabel(cat.role)} of ${cat.clan}`}>
      <div className="flex gap-3">
        <CatPortrait appearance={cat.appearance} role={cat.role} cosmetics={cat.cosmetics} size={70} dimmed={!cat.alive} turned={cat.isEnemyTurned} />
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
          <p className="mb-1 text-[11px] text-parchment/70">Treat infection with the Med Cat:</p>
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
  const run = ctx.run!;
  const activeMissions = run.activeMissions.length;
  return (
    <Panel title="Actions">
      {/* Management actions stand out from routine care */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="primary"
          className="relative flex-col items-center gap-0.5 py-3"
          onClick={() => openModal("missions")}
        >
          <span className="text-lg leading-none">🐾</span>
          <span className="text-xs font-semibold">Missions</span>
          {activeMissions > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-night px-1 text-[9px] font-bold text-ember">
              {activeMissions}
            </span>
          )}
        </Button>
        <Button className="flex-col items-center gap-0.5 py-3" onClick={() => openModal("shelter")}>
          <span className="text-lg leading-none">🏕</span>
          <span className="text-xs font-semibold">Shelter</span>
        </Button>
        <Button className="flex-col items-center gap-0.5 py-3" onClick={() => openModal("inventory")}>
          <span className="text-lg leading-none">🎒</span>
          <span className="text-xs font-semibold">Stores</span>
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
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

  const [showHunt, setShowHunt] = useState(false);

  const beginMission = () => {
    ctx.startMission(missionId, selectedCats);
    setSelectedCats([]);
  };
  const confirm = () => {
    if (chosen.length === 0 || !kitOk) return;
    // Hunting plays Aina's hunt animation first, then the mission runs.
    if (missionId === "hunt_food") {
      setShowHunt(true);
      return;
    }
    beginMission();
  };

  return (
    <div className="space-y-3">
      {showHunt && (
        <HuntCutscene
          onCatch={() => {
            setShowHunt(false);
            beginMission(); // caught it — the hunt goes ahead
          }}
          onMiss={() => {
            setShowHunt(false); // missed — the cats stay; try again
          }}
        />
      )}
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
              <CatPortrait appearance={c.appearance} role={c.role} size={26} />
              <span className="truncate">{c.name} <span className="text-parchment/50">({roleLabel(c.role)})</span></span>
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
      {!kitOk && <p className="text-xs text-red-300">The kit cannot go without a Leader, Deputy, Warrior, or Med Cat.</p>}

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
