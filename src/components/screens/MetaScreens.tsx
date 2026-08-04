import React, { useState } from "react";
import type { GameController } from "@/game/useGameController";
import { BOOK_CHARACTERS } from "@/data/characters";
import { CLANS, CLAN_LIST } from "@/data/clans";
import { UPGRADES, upgradePrice } from "@/data/upgrades";
import { COSMETICS } from "@/data/cosmetics";
import { ACHIEVEMENTS } from "@/data/achievements";
import { roleLabel } from "@/data/roles";
import { CatPortrait } from "@/components/art/CatPortrait";
import { Button, Panel, Badge } from "@/components/ui/primitives";
import { exportRun } from "@/persistence/storage";

function Header({ ctx, title }: { ctx: GameController; title: string }) {
  return (
    <header className="mb-4 flex items-center justify-between">
      <h1 className="font-display text-2xl text-parchment">{title}</h1>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-ember/20 px-3 py-1 text-sm font-semibold text-ember">🪙 {ctx.meta?.coins ?? 0}</span>
        <Button onClick={() => ctx.setScreen("title")}>← Menu</Button>
      </div>
    </header>
  );
}

export function CollectionScreen({ ctx }: { ctx: GameController }) {
  const [detail, setDetail] = useState<string | null>(null);
  const cat = detail ? BOOK_CHARACTERS.find((c) => c.id === detail) : null;
  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <Header ctx={ctx} title="Cat Collection" />
      <p className="mb-3 text-xs text-parchment/60">Original interpretations of {BOOK_CHARACTERS.length} characters. Tap for details.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {BOOK_CHARACTERS.map((c) => (
          <button key={c.id} onClick={() => setDetail(c.id)} className="flex flex-col items-center rounded-lg border border-fern/20 bg-black/20 p-2 hover:bg-black/40">
            <CatPortrait appearance={c.appearance} role={c.role} size={56} />
            <span className="mt-1 text-sm font-semibold text-parchment">{c.name}</span>
            <span className="text-[10px]" style={{ color: CLANS[c.clan].color }}>{c.clan} · {roleLabel(c.role)}</span>
          </button>
        ))}
      </div>
      {cat && (
        <Panel title={`${cat.name} — ${roleLabel(cat.role)} of ${cat.clan}`} className="mt-4">
          <div className="flex gap-3">
            <CatPortrait appearance={cat.appearance} role={cat.role} size={80} />
            <div className="text-xs text-parchment/80">
              <p className="italic">{cat.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge color="#8bab6a">Passive: {cat.passive.name}</Badge>
                <Badge color="#c76b3b">Battle: {cat.battleAbility.name}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-parchment/60">{cat.passive.description}</p>
              <p className="text-[11px] text-parchment/60">{cat.battleAbility.description}</p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function ShopScreen({ ctx }: { ctx: GameController }) {
  const meta = ctx.meta;
  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <Header ctx={ctx} title="Shop & Upgrades" />
      <Panel title="Permanent Upgrades" className="mb-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {UPGRADES.map((u) => {
            const level = meta?.upgrades[u.id] ?? 0;
            const price = upgradePrice(u.id, level);
            const maxed = level >= u.maxLevel;
            const afford = price !== null && (meta?.coins ?? 0) >= price;
            return (
              <div key={u.id} className="rounded-lg border border-fern/20 bg-black/20 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-parchment">{u.name}</span>
                  <span className="text-parchment/50">Lv {level}/{u.maxLevel}</span>
                </div>
                <p className="text-parchment/60">{u.description}</p>
                <p className="text-[10px] text-fern">{u.effectPerLevel}</p>
                <Button className="mt-1 w-full px-2 py-1 text-xs" disabled={maxed || !afford} onClick={() => ctx.purchaseUpgrade(u.id)}>
                  {maxed ? "Maxed" : `Buy · 🪙 ${price}`}
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Cosmetics (visual only)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {COSMETICS.map((c) => {
            const owned = meta?.cosmeticsUnlocked.includes(c.id);
            const afford = (meta?.coins ?? 0) >= c.price;
            return (
              <div key={c.id} className="rounded-lg border border-fern/20 bg-black/20 p-2 text-center text-[11px]">
                <div className="mx-auto mb-1 h-6 w-6 rounded-full" style={{ background: c.color }} />
                <div className="font-semibold text-parchment">{c.name}</div>
                <div className="text-parchment/50">{c.slot}</div>
                <Button className="mt-1 w-full px-1 py-1 text-[10px]" disabled={owned || !afford} onClick={() => ctx.unlockCosmetic(c.id)}>
                  {owned ? "Owned" : `🪙 ${c.price}`}
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

export function AchievementsScreen({ ctx }: { ctx: GameController }) {
  const unlocked = ctx.meta?.achievements ?? [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <Header ctx={ctx} title="Achievements" />
      <p className="mb-3 text-xs text-parchment/60">{unlocked.length}/{ACHIEVEMENTS.length} unlocked</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.includes(a.id);
          return (
            <div key={a.id} className={`rounded-lg border p-2 text-xs ${got ? "border-fern/50 bg-fern/10" : "border-fern/15 bg-black/20 opacity-70"}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-parchment">{got ? "🏅 " : "🔒 "}{a.name}</span>
                <Badge color="#c76b3b">🪙 {a.coins}</Badge>
              </div>
              <p className="text-parchment/60">{a.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HowToPlayScreen({ ctx }: { ctx: GameController }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <Header ctx={ctx} title="How to Play" />
      <div className="space-y-3 text-sm text-parchment/85">
        <Section title="Goal">
          A sickness is spreading among the cats. Lead a group of five and survive as many days as
          possible. Rare discoveries can unlock alternative endings — a cure, a safe haven, or a new territory.
        </Section>
        <Section title="The Opening Minute">
          Every run begins with a one-minute scavenging phase. You control your chosen cat and search
          the forest for supplies. You can&rsquo;t search everything — choose wisely, then dig a shelter.
        </Section>
        <Section title="Days & Meters">
          Each day lasts one real minute. Watch five meters per cat: Health, Hunger, Thirst, Energy, and
          Infection. Cats eat and drink automatically from your stores at day&rsquo;s end — keep them stocked.
          Pause any time in single-player.
        </Section>
        <Section title="Missions">
          Send cats to hunt, gather herbs, find water, rescue survivors, and more. More cats mean better
          odds but more risk and energy. The kit can never leave without a Leader, Deputy, Warrior, or Med Cat.
        </Section>
        <Section title="Infection & Battles">
          Bites and contaminated food spread infection through five stages. Your Med Cat can treat it —
          early is easiest. Battles are turn-based: attack, defend, use abilities, heal, or escape.
        </Section>
        <Section title="Clans">
          {CLAN_LIST.map((c) => (
            <span key={c.id} className="mt-1 block text-xs"><b style={{ color: c.color }}>{c.name}:</b> {c.advantage}</span>
          ))}
        </Section>
        <Section title="Progression">
          Earn 10 coins every ten days survived, plus a little from achievements. Spend coins on permanent
          upgrades and cosmetics between runs. Everything is saved to your browser — no account needed.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-3">
      <h3 className="mb-1 font-display text-sm uppercase tracking-wide text-fern">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export function SettingsScreen({ ctx }: { ctx: GameController }) {
  const s = ctx.meta?.settings;
  const [confirmReset, setConfirmReset] = useState(false);
  if (!s) return null;
  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <Header ctx={ctx} title="Settings" />
      <Panel className="space-y-4">
        <Slider label="Music Volume" value={s.musicVolume} onChange={(v) => ctx.updateSettings({ musicVolume: v })} />
        <Slider label="Sound Effects Volume" value={s.sfxVolume} onChange={(v) => ctx.updateSettings({ sfxVolume: v })} />
        <Toggle label="Reduced Motion" value={s.reducedMotion} onChange={(v) => ctx.updateSettings({ reducedMotion: v })} />
        <Toggle label="High Contrast" value={s.highContrast} onChange={(v) => ctx.updateSettings({ highContrast: v })} />
        <Toggle label="Confirm Dangerous Decisions" value={s.confirmDangerous} onChange={(v) => ctx.updateSettings({ confirmDangerous: v })} />
        <div>
          <label className="mb-1 block text-xs text-parchment/70">Text Size</label>
          <div className="flex gap-2">
            {(["small", "normal", "large"] as const).map((t) => (
              <Button key={t} className={`flex-1 capitalize ${s.textScale === t ? "btn-primary" : ""}`} onClick={() => ctx.updateSettings({ textScale: t })}>{t}</Button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Save Data" className="mt-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => {
            if (!ctx.run) { ctx.pushToast("No active run to export.", "info"); return; }
            const data = exportRun(ctx.run);
            navigator.clipboard?.writeText(data).then(() => ctx.pushToast("Save copied to clipboard.", "info"));
          }}>Export Run (copy JSON)</Button>
          <ImportButton ctx={ctx} />
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset All Data</Button>
        </div>
        {confirmReset && (
          <div className="mt-2 rounded-lg border border-blood/40 bg-blood/10 p-2 text-xs">
            <p className="mb-2 text-parchment/80">This permanently deletes coins, upgrades, achievements, and your saved run. Are you sure?</p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => { ctx.resetAllData(); setConfirmReset(false); }}>Yes, delete everything</Button>
              <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function ImportButton({ ctx }: { ctx: GameController }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open) return <Button onClick={() => setOpen(true)}>Import Run (JSON)</Button>;
  return (
    <div className="w-full">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Paste run JSON here" className="w-full rounded border border-fern/30 bg-black/40 p-2 text-xs text-parchment" />
      <div className="mt-1 flex gap-2">
        <Button variant="primary" onClick={() => {
          const ok = ctx.importSave(text);
          ctx.pushToast(ok ? "Save imported." : "Invalid save data.", "info");
          if (ok) setOpen(false);
        }}>Load</Button>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs text-parchment/70"><span>{label}</span><span>{Math.round(value * 100)}%</span></span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-fern" />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-lg bg-black/25 px-3 py-2 text-sm">
      <span className="text-parchment/85">{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${value ? "bg-fern" : "bg-black/50"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${value ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

export function CreditsScreen({ ctx }: { ctx: GameController }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <Header ctx={ctx} title="Credits" />
      <Panel className="space-y-3 text-sm text-parchment/85">
        <p><b>Warrior Apocalypse</b> — a fan-made survival game built with Next.js, TypeScript, React, and Tailwind CSS.</p>
        <p>Cat artwork hand-drawn by <b>Aina</b>, recolored in-game to each player&rsquo;s chosen fur color and pattern. All artwork is original. Game design, systems, and code created for this project.</p>
        <div className="rounded-lg border border-fern/20 bg-black/30 p-3 text-[12px] leading-relaxed text-parchment/70">
          <b>Disclaimer:</b> This is an unofficial, fan-created game inspired by the world of the
          <em> Warriors</em> books. It is not affiliated with, endorsed by, or sponsored by the books&rsquo;
          authors or publishers. No official illustrations, logos, character art, or text are used — only
          original interpretations based on broad, publicly known traits. A widely distributed version would
          be safer with entirely original clan and character names.
        </div>
      </Panel>
    </div>
  );
}
