import React, { useState } from "react";
import type { GameController } from "@/game/useGameController";
import type { CharacterDef, Difficulty } from "@/engine/types";
import { BOOK_CHARACTERS } from "@/data/characters";
import { CLANS } from "@/data/clans";
import { DIFFICULTY_PRESETS } from "@/config/balance";
import { CatPortrait } from "@/components/art/CatPortrait";
import { CatSprite } from "@/components/art/CatSprite";
import { Button, Panel, Badge, Modal } from "@/components/ui/primitives";
import { CustomCatCreator } from "./CustomCatCreator";

// Every cat keeps its OWN canonical role — no reassignment. (So a warrior like
// Ravenpaw is never turned into a Leader.) The player builds a proper clan with
// one cat of each role.
function assignRoles(defs: CharacterDef[]): CharacterDef[] {
  return defs.map((d) => ({ ...d }));
}

// A valid clan needs a Leader, Deputy, Kit, and at least one Warrior. An Elder
// (the healer) is OPTIONAL — you can go without one, but survival is harder, so
// the fifth cat is either an Elder or a second Warrior. The player's own cat
// counts toward these roles too, so picking a Leader as your cat already fills
// the Leader slot.
function groupValidity(
  main: CharacterDef | null,
  mates: CharacterDef[],
): { ok: boolean; reason: string; noElder?: boolean } {
  if (!main || mates.length !== 4) return { ok: false, reason: "Pick your cat and 4 clanmates." };
  const counts: Record<string, number> = {};
  for (const c of [main, ...mates]) counts[c.role] = (counts[c.role] ?? 0) + 1;
  const L = counts.Leader ?? 0;
  const D = counts.Deputy ?? 0;
  const K = counts.Kit ?? 0;
  const W = counts.Warrior ?? 0;
  const E = counts.Elder ?? 0;

  // Missing required roles come first — tell the player exactly what to add.
  const need: string[] = [];
  if (L === 0) need.push("a Leader");
  if (D === 0) need.push("a Deputy");
  if (K === 0) need.push("a Kit");
  if (W === 0) need.push("a Warrior");
  if (need.length) return { ok: false, reason: `Your clan still needs ${need.join(", ")}.` };

  // Then over-filled single-cat roles — say you have too many, not that you need one.
  const tooMany: string[] = [];
  if (L > 1) tooMany.push(`Leaders (${L})`);
  if (D > 1) tooMany.push(`Deputies (${D})`);
  if (K > 1) tooMany.push(`Kits (${K})`);
  if (E > 1) tooMany.push(`Elders (${E})`);
  if (tooMany.length) {
    return { ok: false, reason: `A clan has just one of each — swap out the extra ${tooMany.join(", ")}.` };
  }

  return { ok: true, reason: "", noElder: !E };
}

export function NewGameScreen({ ctx }: { ctx: GameController }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [mainCat, setMainCat] = useState<CharacterDef | null>(null);
  const [clanmates, setClanmates] = useState<CharacterDef[]>([]);
  const [showCustom, setShowCustom] = useState(false);

  const toggleClanmate = (def: CharacterDef) => {
    setClanmates((prev) => {
      if (prev.some((c) => c.id === def.id)) return prev.filter((c) => c.id !== def.id);
      if (prev.length >= 4) return prev;
      return [...prev, def];
    });
  };

  const validity = groupValidity(mainCat, clanmates);
  const canStart = validity.ok;

  const start = () => {
    if (!mainCat || clanmates.length !== 4) return;
    const group = assignRoles([mainCat, ...clanmates]);
    const [assignedMain, ...assignedMates] = group;
    ctx.startNewRun({ mainCatDef: assignedMain, clanmateDefs: assignedMates, difficulty });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-parchment">New Game</h1>
        <Button onClick={() => ctx.setScreen("title")}>← Menu</Button>
      </header>

      <Panel title="Difficulty" className="mb-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(DIFFICULTY_PRESETS) as Difficulty[]).map((d) => {
            const p = DIFFICULTY_PRESETS[d];
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border p-2 text-left text-xs ${difficulty === d ? "border-ember bg-ember/20" : "border-fern/25 bg-black/20"}`}
              >
                <div className="font-semibold text-parchment">{p.label}</div>
                <div className="text-parchment/60">{p.description}</div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title={`Your Cat ${mainCat ? `— ${mainCat.name}` : "(choose one or create custom)"}`} className="mb-4">
        <div className="mb-3">
          <Button variant="primary" onClick={() => setShowCustom(true)}>+ Create Custom Cat</Button>
          {mainCat?.isCustom && <span className="ml-2 text-sm text-fern">Custom cat selected ✓</span>}
        </div>
        <CharacterGrid
          characters={BOOK_CHARACTERS}
          selectedIds={mainCat && !mainCat.isCustom ? [mainCat.id] : []}
          disabledIds={clanmates.map((c) => c.id)}
          onPick={(def) => setMainCat(def)}
        />
      </Panel>

      <Panel title={`Choose 4 Clanmates (${clanmates.length}/4)`} className="mb-4">
        <p className="mb-2 text-xs text-parchment/60">
          A clan needs a <strong className="text-fern">Leader, Deputy, Warrior, and Kit</strong>. An
          <strong className="text-fern"> Elder</strong> (your healer) is optional — bring one, or take a
          second Warrior instead and survive on grit. <strong className="text-parchment/80">Your own cat
          counts too</strong> — if you picked a Leader, that slot is already filled.
        </p>
        {mainCat && <RoleCoverage main={mainCat} mates={clanmates} />}
        <CharacterGrid
          characters={BOOK_CHARACTERS.filter((c) => c.id !== mainCat?.id)}
          selectedIds={clanmates.map((c) => c.id)}
          onPick={toggleClanmate}
        />
      </Panel>

      {mainCat && clanmates.length === 4 && (
        <Panel title="Your Clan" className="mb-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {assignRoles([mainCat, ...clanmates]).map((c) => (
              <div key={c.id} className="flex flex-col items-center rounded-lg border border-fern/20 bg-black/20 p-2">
                <CatSprite appearance={c.appearance} role={c.role} size={72} />
                <div className="mt-1 text-center text-xs">
                  <div className="font-semibold text-parchment">{c.name}</div>
                  <Badge color={CLANS[c.clan].color}>{c.role}</Badge>
                </div>
              </div>
            ))}
          </div>
          {!validity.ok && <p className="mt-2 text-xs text-ember">{validity.reason}</p>}
          {validity.ok && validity.noElder && (
            <p className="mt-2 text-xs text-yellow-300">
              No Elder — with no skilled healer, wounds fester and the sickness spreads faster. You&rsquo;ll survive, but not as long.
            </p>
          )}
        </Panel>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-fern/20 bg-night/95 px-4 py-3">
        <Button variant="primary" className="w-full" disabled={!canStart} onClick={start}>
          {canStart ? "Begin the Struggle to Survive" : validity.reason}
        </Button>
      </div>

      {showCustom && (
        <Modal title="Create Custom Cat" onClose={() => setShowCustom(false)} wide>
          <CustomCatCreator
            onConfirm={(def) => {
              setMainCat(def);
              setShowCustom(false);
            }}
            onCancel={() => setShowCustom(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// Live checklist of which clan roles are covered by the current picks (the
// player's own cat included), so it's clear what's filled and what's still open.
function RoleCoverage({ main, mates }: { main: CharacterDef; mates: CharacterDef[] }) {
  const counts: Record<string, number> = {};
  for (const c of [main, ...mates]) counts[c.role] = (counts[c.role] ?? 0) + 1;
  const rows: { role: string; label: string; need: "one" | "some" | "opt" }[] = [
    { role: "Leader", label: "Leader", need: "one" },
    { role: "Deputy", label: "Deputy", need: "one" },
    { role: "Warrior", label: "Warrior", need: "some" },
    { role: "Kit", label: "Kit", need: "one" },
    { role: "Elder", label: "Elder", need: "opt" },
  ];
  return (
    <div className="mb-2 flex flex-wrap gap-1">
      {rows.map((r) => {
        const n = counts[r.role] ?? 0;
        const over = (r.role === "Leader" || r.role === "Deputy" || r.role === "Kit" || r.role === "Elder") && n > 1;
        const ok = r.need === "opt" ? !over : r.need === "some" ? n >= 1 && !over : n === 1;
        const color = over ? "#c15a5a" : ok ? "#8bab6a" : "#c8a24a";
        const mark = over ? "⚠" : ok ? "✓" : "○";
        return (
          <span
            key={r.role}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
            style={{ borderColor: color + "66", color, background: color + "1a" }}
          >
            {mark} {r.label}
            {n > 1 ? ` ×${n}` : ""}
            {r.need === "opt" && n === 0 ? " (optional)" : ""}
          </span>
        );
      })}
    </div>
  );
}

function CharacterGrid({
  characters,
  selectedIds,
  disabledIds = [],
  onPick,
}: {
  characters: CharacterDef[];
  selectedIds: string[];
  disabledIds?: string[];
  onPick: (def: CharacterDef) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {characters.map((c) => {
        const selected = selectedIds.includes(c.id);
        const disabled = disabledIds.includes(c.id);
        return (
          <button
            key={c.id}
            disabled={disabled}
            onClick={() => onPick(c)}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left transition ${
              selected ? "border-ember bg-ember/20" : "border-fern/20 bg-black/20 hover:bg-black/40"
            } ${disabled ? "opacity-30" : ""}`}
          >
            <CatPortrait appearance={c.appearance} role={c.role} size={40} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-parchment">{c.name}</div>
              <div className="truncate text-[11px]" style={{ color: CLANS[c.clan].color }}>
                {c.clan} · {c.role}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
