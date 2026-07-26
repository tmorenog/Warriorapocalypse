import React, { useState } from "react";
import type { GameController } from "@/game/useGameController";
import type { CharacterDef, Difficulty, RoleId } from "@/engine/types";
import { BOOK_CHARACTERS } from "@/data/characters";
import { CLANS } from "@/data/clans";
import { DIFFICULTY_PRESETS } from "@/config/balance";
import { CatPortrait } from "@/components/art/CatPortrait";
import { Button, Panel, Badge, Modal } from "@/components/ui/primitives";
import { CustomCatCreator } from "./CustomCatCreator";

const REQUIRED: RoleId[] = ["Leader", "Deputy", "Warrior", "Medicine", "Kit"];

function assignRoles(defs: CharacterDef[]): CharacterDef[] {
  const used = new Array(defs.length).fill(false);
  const result: (RoleId | null)[] = new Array(defs.length).fill(null);
  const remaining = new Set<RoleId>(REQUIRED);
  for (const role of REQUIRED) {
    const idx = defs.findIndex((d, i) => !used[i] && d.role === role);
    if (idx >= 0) {
      used[idx] = true;
      result[idx] = role;
      remaining.delete(role);
    }
  }
  const leftover = [...remaining];
  for (let i = 0; i < defs.length; i++) {
    if (!used[i]) {
      result[i] = leftover.shift() ?? defs[i].role;
      used[i] = true;
    }
  }
  return defs.map((d, i) => ({ ...d, role: result[i]! }));
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

  const canStart = mainCat && clanmates.length === 4;

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
        <CharacterGrid
          characters={BOOK_CHARACTERS.filter((c) => c.id !== mainCat?.id)}
          selectedIds={clanmates.map((c) => c.id)}
          onPick={toggleClanmate}
        />
      </Panel>

      {canStart && (
        <Panel title="Group Roles" className="mb-4">
          <div className="flex flex-wrap gap-2">
            {assignRoles([mainCat!, ...clanmates]).map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-fern/20 bg-black/20 p-2">
                <CatPortrait appearance={c.appearance} size={34} />
                <div className="text-xs">
                  <div className="font-semibold text-parchment">{c.name}</div>
                  <Badge color={CLANS[c.clan].color}>{c.role}</Badge>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-parchment/60">Roles are auto-assigned to fill Leader, Deputy, Warrior, Medicine, and Kit.</p>
        </Panel>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-fern/20 bg-night/95 px-4 py-3">
        <Button variant="primary" className="w-full" disabled={!canStart} onClick={start}>
          {canStart ? "Begin the Struggle to Survive" : "Pick your cat and 4 clanmates"}
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
            <CatPortrait appearance={c.appearance} size={40} />
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
