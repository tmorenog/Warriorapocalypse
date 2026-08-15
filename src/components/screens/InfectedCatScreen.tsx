"use client";

import React, { useMemo, useState } from "react";
import type { GameController } from "@/game/useGameController";
import type { InfectedWound } from "@/engine/types";
import { Rng } from "@/engine/rng";
import {
  clearInfectedCat,
  infectedCatHealed,
  infectedCatSicknessSpreads,
  removeItem,
  updateCat,
} from "@/engine/gameState";
import { exposeCat } from "@/engine/infection";

const ART = "/art/scenes/infected-cat.jpg";
const ART_ASPECT = 1904 / 1447;

// Which herb heals which wound. Remember it: a bleeding gash wants cobwebs, an
// infected wound wants marigold. The wrong herb makes things worse.
const HERB_FOR: Record<InfectedWound["kind"], string> = {
  bleeding: "cobwebs",
  infected: "marigold",
};
const HERBS = [
  { id: "cobwebs", name: "Cobwebs", emoji: "🕸️", treats: "bleeding gashes" },
  { id: "marigold", name: "Marigold", emoji: "🌼", treats: "infected wounds" },
] as const;

type View = "choose" | "attack" | "heal" | "result";

export function InfectedCatScreen({ ctx }: { ctx: GameController }) {
  const run = ctx.run!;
  const enc = run.pendingInfectedCat!;
  const [view, setView] = useState<View>("choose");
  const [wounds, setWounds] = useState<InfectedWound[]>(enc.wounds);
  const [selHerb, setSelHerb] = useState<string | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [flash, setFlash] = useState<{ wound: string; ok: boolean } | null>(null);
  const [result, setResult] = useState<{ title: string; body: string; tone: "good" | "bad" | "neutral" } | null>(null);

  // Herbs on hand right now (updated as we spend them).
  const herbCount = (id: string) => run.inventory.find((i) => i.itemId === id)?.quantity ?? 0;
  const totalHerbs = herbCount("cobwebs") + herbCount("marigold");

  // The clan's best healer nudges the odds a treatment takes.
  const medicineBonus = useMemo(() => {
    const best = Math.max(0, ...run.cats.filter((c) => c.alive).map((c) => c.stats.medicine));
    return Math.min(0.18, best * 0.01);
  }, [run.cats]);

  const untreated = wounds.filter((w) => !w.treated);

  const finish = (r: { title: string; body: string; tone: "good" | "bad" | "neutral" }, mutate: () => void) => {
    mutate();
    setResult(r);
    setView("result");
  };

  // ---- Leave ---- (the result screen clears the encounter on dismiss)
  const leave = () => {
    finish(
      { title: "You left the stray", body: `${enc.catName} watches you go, then limps back into the trees.`, tone: "neutral" },
      () => {},
    );
  };

  // ---- Attack (press the button to drive it off) ----
  const strike = () => {
    const n = strikes + 1;
    setStrikes(n);
    if (n >= 3) {
      finish(
        {
          title: "You drove it off",
          body: `The sick stray flees. Fighting a diseased cat is risky, though — you keep your distance from the wounds.`,
          tone: "neutral",
        },
        () =>
          ctx.setRun((rr) => {
            if (!rr) return rr;
            let nx = rr;
            // 40% chance a clanmate who fought it is exposed to the sickness.
            const rng = new Rng(rr.rngState + 13);
            if (rng.chance(0.4)) {
              const here = nx.cats.filter((c) => c.alive && !c.onMission);
              if (here.length) {
                const v = rng.pick(here);
                nx = updateCat(nx, v.id, (c) => exposeCat(c, 8));
              }
            }
            return { ...nx, rngState: rng.state };
          }),
      );
    }
  };

  // ---- Heal: apply the selected herb to a wound ----
  const applyHerb = (wound: InfectedWound) => {
    if (!selHerb || wound.treated) return;
    if (herbCount(selHerb) <= 0) return;
    // Spend the herb.
    ctx.setRun((rr) => (rr ? removeItem(rr, selHerb, 1) : rr));

    const correct = HERB_FOR[wound.kind] === selHerb;
    if (!correct) {
      // Wrong herb — the wound reacts badly and the sickness takes hold.
      setFlash({ wound: wound.id, ok: false });
      setTimeout(() => {
        finish(
          {
            title: `${enc.catName} didn't make it`,
            body: `The wrong herb on a ${wound.kind} wound — the stray worsens fast and slips away. Worse, the sickness spreads to the den.`,
            tone: "bad",
          },
          () => ctx.setRun((rr) => (rr ? infectedCatSicknessSpreads(rr, new Rng(rr.rngState + 21)) : rr)),
        );
      }, 450);
      return;
    }

    // Right herb — but a poultice doesn't always take.
    const success = Math.random() < 0.7 + medicineBonus;
    if (success) {
      setFlash({ wound: wound.id, ok: true });
      const nextWounds = wounds.map((w) => (w.id === wound.id ? { ...w, treated: true } : w));
      setWounds(nextWounds);
      setTimeout(() => {
        setFlash(null);
        if (nextWounds.every((w) => w.treated)) {
          finish(
            { title: `${enc.catName} pulls through!`, body: `Every wound is dressed and clean. The grateful stray joins your group.`, tone: "good" },
            () => ctx.setRun((rr) => (rr ? infectedCatHealed(rr, enc) : rr)),
          );
        }
      }, 450);
    } else {
      // The treatment slipped — the wound is still open. Try again if you have herbs.
      setFlash({ wound: wound.id, ok: false });
      setTimeout(() => setFlash(null), 450);
    }
  };

  // If the player runs out of the herbs still needed, the stray can't be saved.
  const stuck =
    view === "heal" &&
    untreated.length > 0 &&
    untreated.every((w) => herbCount(HERB_FOR[w.kind]) <= 0);
  const giveUp = () => {
    finish(
      { title: `${enc.catName} slipped away`, body: `Without the right herbs, the wounds were too much. The stray didn't survive — but the sickness stayed with it.`, tone: "bad" },
      () => {},
    );
  };

  return (
    <div className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-night/95 p-4 animate-fade-in">
      <h2 className="mb-1 font-display text-xl text-blood">A sick stray</h2>
      <p className="mb-3 max-w-md text-center text-xs text-parchment/60">
        {view === "choose" && `${enc.catName} lies wounded and feverish near the den. What do you do?`}
        {view === "attack" && "Drive the diseased cat away before it infects anyone."}
        {view === "heal" && "Pick a herb, then tap a wound. The wrong herb will kill them — remember what heals what."}
      </p>

      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-fern/25 bg-white">
        <div className="relative w-full" style={{ aspectRatio: `${ART_ASPECT}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ART} alt="A wounded, sick cat" className="absolute inset-0 h-full w-full object-contain" />

          {/* Clickable dashed-circle wounds while healing. */}
          {view === "heal" &&
            wounds.map((w) => {
              const isFlash = flash?.wound === w.id;
              const ring = w.treated
                ? "border-fern bg-fern/20"
                : isFlash
                  ? flash!.ok
                    ? "border-fern bg-fern/30"
                    : "border-blood bg-blood/30"
                  : "border-white/90 bg-white/5 hover:bg-white/20";
              return (
                <button
                  key={w.id}
                  onClick={() => applyHerb(w)}
                  disabled={w.treated || !selHerb || herbCount(selHerb) <= 0}
                  aria-label={`Treat ${w.kind} wound`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed transition ${ring}`}
                  style={{ left: `${w.x * 100}%`, top: `${w.y * 100}%`, width: "18%", height: "22%" }}
                >
                  {w.treated && <span className="text-lg">✔️</span>}
                </button>
              );
            })}
        </div>
      </div>

      {/* ---- Choose ---- */}
      {view === "choose" && (
        <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-2">
          <button className="btn py-3 text-sm" onClick={leave}>
            🚶 Leave
          </button>
          <button className="btn py-3 text-sm" onClick={() => setView("attack")}>
            ⚔️ Attack
          </button>
          <button
            className="btn btn-primary py-3 text-sm disabled:opacity-40"
            disabled={totalHerbs <= 0}
            onClick={() => setView("heal")}
          >
            🌿 Heal
          </button>
          {totalHerbs <= 0 && (
            <p className="col-span-3 mt-1 text-center text-[11px] text-parchment/45">
              You have no healing herbs — gather cobwebs and marigold from a herb patch first.
            </p>
          )}
        </div>
      )}

      {/* ---- Attack ---- */}
      {view === "attack" && (
        <div className="mt-4 flex w-full max-w-md flex-col items-center gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full bg-blood transition-all" style={{ width: `${(strikes / 3) * 100}%` }} />
          </div>
          <button className="btn btn-primary h-16 w-40 text-base" onClick={strike}>
            🐾 Strike! ({strikes}/3)
          </button>
          <button className="text-[11px] text-parchment/50 underline" onClick={() => setView("choose")}>
            back
          </button>
        </div>
      )}

      {/* ---- Heal ---- */}
      {view === "heal" && (
        <div className="mt-3 w-full max-w-md">
          <div className="flex justify-center gap-2">
            {HERBS.map((h) => {
              const count = herbCount(h.id);
              const sel = selHerb === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => setSelHerb(h.id)}
                  disabled={count <= 0}
                  className={`flex flex-1 flex-col items-center rounded-lg border px-2 py-2 text-xs transition disabled:opacity-35 ${
                    sel ? "border-ember bg-ember/20 ring-2 ring-ember/60" : "border-parchment/20 bg-black/30 hover:bg-black/50"
                  }`}
                >
                  <span className="text-xl">{h.emoji}</span>
                  <span className="font-semibold text-parchment">{h.name} ×{count}</span>
                  <span className="text-[10px] text-parchment/50">for {h.treats}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-parchment/50">
            {untreated.length} wound{untreated.length === 1 ? "" : "s"} left · {selHerb ? "tap a dashed circle to treat" : "select a herb first"}
          </p>
          {stuck && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <p className="text-center text-[11px] text-blood/80">You&apos;re out of the herbs these wounds need.</p>
              <button className="btn px-5 py-2 text-sm" onClick={giveUp}>
                Give up
              </button>
            </div>
          )}
          <button className="mt-2 block w-full text-center text-[11px] text-parchment/40 underline" onClick={() => setView("choose")}>
            back
          </button>
        </div>
      )}

      {/* ---- Result ---- */}
      {view === "result" && result && (
        <div className="mt-4 flex w-full max-w-md flex-col items-center gap-2">
          <h3 className={`font-display text-lg ${result.tone === "good" ? "text-fern" : result.tone === "bad" ? "text-blood" : "text-parchment"}`}>
            {result.title}
          </h3>
          <p className="text-center text-xs text-parchment/70">{result.body}</p>
          <button className="btn btn-primary mt-1 px-6 py-2" onClick={() => ctx.setRun((rr) => (rr ? clearInfectedCat(rr) : rr))}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
