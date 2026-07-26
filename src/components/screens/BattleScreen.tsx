import React, { useState } from "react";
import type { GameController } from "@/game/useGameController";
import type { BattleAction, BattleActionType, Combatant } from "@/engine/types";
import { Scene } from "@/components/art/Scene";
import { Button, Panel } from "@/components/ui/primitives";
import { ENEMIES_BY_ID } from "@/data/enemies";

const ACTIONS: { type: BattleActionType; label: string; needsTarget: "enemy" | "ally" | "none" }[] = [
  { type: "attack", label: "Attack", needsTarget: "enemy" },
  { type: "charAbility", label: "Ability", needsTarget: "enemy" },
  { type: "defend", label: "Defend", needsTarget: "none" },
  { type: "heal", label: "Heal", needsTarget: "ally" },
  { type: "protect", label: "Protect", needsTarget: "ally" },
  { type: "distract", label: "Distract", needsTarget: "enemy" },
];

export function BattleScreen({ ctx }: { ctx: GameController }) {
  const battle = ctx.battle;
  const run = ctx.run!;
  const [pendingAction, setPendingAction] = useState<BattleActionType | null>(null);

  if (!battle) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-parchment/70">Resolving battle…</p>
      </div>
    );
  }

  const actorId = battle.turnOrder[battle.turnIndex];
  const actor = battle.combatants.find((c) => c.id === actorId);
  const clanTurn = actor?.side === "clan" && actor.alive && !battle.over;
  const enemies = battle.combatants.filter((c) => c.side === "enemy");
  const clan = battle.combatants.filter((c) => c.side === "clan");

  const submit = (type: BattleActionType, targetId?: string) => {
    if (!actor) return;
    const action: BattleAction = { type, actorId: actor.id, targetId };
    ctx.doBattleAction(action);
    setPendingAction(null);
  };

  const onActionClick = (type: BattleActionType) => {
    const def = ACTIONS.find((a) => a.type === type)!;
    if (def.needsTarget === "none") submit(type);
    else setPendingAction(type);
  };

  const targetSide = pendingAction ? ACTIONS.find((a) => a.type === pendingAction)?.needsTarget : null;

  return (
    <div className="mx-auto max-w-4xl px-3 py-4">
      <h1 className="mb-2 text-center font-display text-xl text-parchment">
        Battle · {ENEMIES_BY_ID[battle.enemyGroupId]?.name ?? "Enemies"}
      </h1>

      <Scene weather={run.weather} variant="forest" height={150}>
        <div className="flex h-full items-center justify-between px-6">
          <div className="flex gap-2">
            {clan.filter((c) => c.alive).map((c) => (
              <CombatantBadge key={c.id} c={c} active={c.id === actorId} />
            ))}
          </div>
          <div className="text-2xl">⚔</div>
          <div className="flex gap-2">
            {enemies.filter((e) => e.alive).map((e) => (
              <CombatantBadge key={e.id} c={e} active={e.id === actorId} enemy />
            ))}
          </div>
        </div>
      </Scene>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel title={`Round ${battle.round} · ${clanTurn ? `${actor?.name}'s turn` : "Enemy turn"}`}>
          {pendingAction && targetSide && targetSide !== "none" ? (
            <div>
              <p className="mb-2 text-xs text-parchment/70">Choose a {targetSide === "enemy" ? "target" : "ally"}:</p>
              <div className="flex flex-wrap gap-1">
                {(targetSide === "enemy" ? enemies : clan).filter((c) => c.alive).map((c) => (
                  <Button key={c.id} className="px-2 py-1 text-xs" onClick={() => submit(pendingAction, c.id)}>
                    {c.name}
                  </Button>
                ))}
                <Button className="px-2 py-1 text-xs" onClick={() => setPendingAction(null)}>Cancel</Button>
              </div>
            </div>
          ) : clanTurn ? (
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map((a) => (
                <Button key={a.type} onClick={() => onActionClick(a.type)}>{a.label}</Button>
              ))}
              {battle.canEscape && (
                <Button variant="danger" className="col-span-2" onClick={ctx.tryEscape}>Attempt Escape</Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-parchment/60">The enemy acts…</p>
          )}
        </Panel>

        <Panel title="Battle Log">
          <ul className="max-h-48 space-y-1 overflow-y-auto scrollbar-thin text-[11px]">
            {[...battle.log].reverse().map((l, i) => (
              <li key={i} className="rounded bg-black/25 px-2 py-1 text-parchment/80">{l}</li>
            ))}
          </ul>
        </Panel>
      </div>

      {battle.over && (
        <div className="mt-3 text-center text-sm text-fern">
          {battle.result === "won" ? "Victory!" : battle.result === "escaped" ? "Escaped!" : "Defeat…"} Returning…
        </div>
      )}
    </div>
  );
}

function CombatantBadge({ c, active, enemy }: { c: Combatant; active?: boolean; enemy?: boolean }) {
  const pct = Math.max(0, (c.health / c.maxHealth) * 100);
  return (
    <div className={`w-16 rounded-lg border p-1 text-center text-[10px] ${active ? "border-ember bg-ember/20" : "border-fern/20 bg-black/30"}`}>
      <div className="text-lg">{enemy ? "🐀" : "🐈"}</div>
      <div className="truncate text-parchment">{c.name}</div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/50">
        <div className="h-full" style={{ width: `${pct}%`, background: enemy ? "#c15a5a" : "#8bab6a" }} />
      </div>
      {c.defending && <div className="text-[8px] text-blue-300">defending</div>}
      {c.statuses.includes("infected") && <div className="text-[8px] text-infect">infected</div>}
    </div>
  );
}
