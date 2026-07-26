import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameController } from "@/game/useGameController";
import { LOCATIONS } from "@/data/locations";
import { ITEMS_BY_ID } from "@/data/items";
import { Rng } from "@/engine/rng";
import { searchLocation } from "@/engine/scavenge";
import { computeUpgradeEffects } from "@/engine/gameState";
import { BALANCE } from "@/config/balance";
import { CLANS } from "@/data/clans";
import { Scene } from "@/components/art/Scene";
import { Button } from "@/components/ui/primitives";

export function ScavengingScreen({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const clan = run.cats.find((c) => c.id === run.mainCatId)?.clan ?? "ThunderClan";
  const effMs = useMemo(
    () => BALANCE.openingScavengeMs + computeUpgradeEffects(ctx.meta).scavengeBonusMs,
    [ctx.meta],
  );
  const [timeLeft, setTimeLeft] = useState(effMs);
  const [searching, setSearching] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [collected, setCollected] = useState<{ itemId: string; quantity: number }[]>([]);
  const [feed, setFeed] = useState<string[]>(["The infection spreads. Grab what you can before you must dig in."]);
  const rngRef = useRef(new Rng(run.seed + 999));
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    ctx.finishScavenge(collected);
  };

  // Countdown.
  useEffect(() => {
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const t = setInterval(() => setTimeLeft((v) => Math.max(0, v - 100)), 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft > 0]);

  useEffect(() => {
    if (timeLeft <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const doSearch = (locId: string) => {
    if (searching || timeLeft <= 0) return;
    setSearching(locId);
    setSearchProgress(0);
    const dur = BALANCE.scavengeSearchMs;
    const started = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - started;
      setSearchProgress(Math.min(1, elapsed / dur));
      if (elapsed >= dur) {
        clearInterval(interval);
        const result = searchLocation(rngRef.current, locId, clan);
        const locName = LOCATIONS.find((l) => l.id === locId)?.name ?? locId;
        if (result.itemId) {
          const item = ITEMS_BY_ID[result.itemId];
          setCollected((c) => {
            const found = c.find((x) => x.itemId === result.itemId);
            if (found) return c.map((x) => (x.itemId === result.itemId ? { ...x, quantity: x.quantity + 1 } : x));
            return [...c, { itemId: result.itemId!, quantity: 1 }];
          });
          setFeed((f) => [`${locName}: found ${item?.name ?? result.itemId}.`, ...f].slice(0, 6));
        } else {
          setFeed((f) => [`${locName}: ${result.text}`, ...f].slice(0, 6));
          if (result.risk === "clue") {
            setCollected((c) => {
              const found = c.find((x) => x.itemId === "infection_clue");
              if (found) return c.map((x) => (x.itemId === "infection_clue" ? { ...x, quantity: x.quantity + 1 } : x));
              return [...c, { itemId: "infection_clue", quantity: 1 }];
            });
          }
        }
        setSearching(null);
        setSearchProgress(0);
      }
    }, 80);
  };

  const seconds = Math.ceil(timeLeft / 1000);
  const urgent = seconds <= 15;

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-parchment">Scavenge!</h1>
          <p className="text-xs" style={{ color: CLANS[clan].color }}>
            {CLANS[clan].name} — {CLANS[clan].advantage}
          </p>
        </div>
        <div className={`rounded-lg px-4 py-2 font-mono text-2xl font-bold ${urgent ? "animate-pulse-soft text-red-400" : "text-parchment"}`}>
          {seconds}s
        </div>
      </div>

      <Scene weather={run.weather} variant="forest" height={120}>
        <div className="flex h-full items-end p-3">
          <div className="rounded bg-black/50 px-2 py-1 text-xs text-parchment/90">{feed[0]}</div>
        </div>
      </Scene>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LOCATIONS.map((loc) => {
          const isSearching = searching === loc.id;
          const disabled = (!!searching && !isSearching) || timeLeft <= 0;
          return (
            <button
              key={loc.id}
              disabled={disabled}
              onClick={() => doSearch(loc.id)}
              className={`relative overflow-hidden rounded-lg border p-2 text-left text-xs transition ${
                isSearching ? "border-ember bg-ember/20" : "border-fern/25 bg-black/25 hover:bg-black/40"
              } ${disabled && !isSearching ? "opacity-40" : ""}`}
            >
              <div className="font-semibold text-parchment">{loc.name}</div>
              <div className="mt-0.5 text-parchment/60">{terrainLabel(loc.terrain)}</div>
              {isSearching && (
                <div className="absolute bottom-0 left-0 h-1 bg-ember" style={{ width: `${searchProgress * 100}%` }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="panel p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase text-fern">Collected</h3>
          {collected.length === 0 ? (
            <p className="text-xs text-parchment/50">Nothing yet — search a location!</p>
          ) : (
            <ul className="flex flex-wrap gap-1">
              {collected.map((c) => (
                <li key={c.itemId} className="rounded bg-black/40 px-2 py-1 text-xs text-parchment">
                  {ITEMS_BY_ID[c.itemId]?.name ?? c.itemId} ×{c.quantity}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase text-fern">Log</h3>
          <ul className="space-y-0.5 text-[11px] text-parchment/70">
            {feed.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3">
        <Button variant="primary" className="w-full" onClick={finish}>
          Take Shelter Now →
        </Button>
      </div>
    </div>
  );
}

function terrainLabel(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
