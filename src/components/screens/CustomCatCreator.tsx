import React, { useMemo, useState } from "react";
import type { CharacterDef, ClanId, RoleId, Appearance } from "@/engine/types";
import { CLAN_LIST } from "@/data/clans";
import { ROLES, ROLE_LIST } from "@/data/roles";
import {
  FUR_COLORS, FUR_PATTERNS, EYE_COLORS, SCAR_STYLES, ACCESSORIES,
  BODY_TYPES, EAR_SHAPES, TAIL_STYLES,
} from "@/data/customCat";
import { CatPortrait } from "@/components/art/CatPortrait";
import { Button } from "@/components/ui/primitives";

// Custom-cat stats are driven primarily by role & clan (no personality traits).
function buildCustomDef(opts: {
  name: string; clan: ClanId; role: RoleId; appearance: Appearance;
}): CharacterDef {
  const roleDef = ROLES[opts.role];
  const base = { attack: 12, defense: 12, hunting: 12, medicine: 8, stealth: 11, speed: 12 };
  const stats = { ...base };
  (Object.keys(roleDef.statBias) as (keyof typeof base)[]).forEach((k) => {
    stats[k] = Math.max(1, base[k] + (roleDef.statBias[k] ?? 0));
  });
  // Small clan flavor.
  if (opts.clan === "WindClan") stats.speed += 3;
  if (opts.clan === "RiverClan") stats.hunting += 2;
  if (opts.clan === "ShadowClan") stats.stealth += 3;
  if (opts.clan === "ThunderClan") stats.attack += 2;
  if (opts.clan === "SkyClan") stats.defense += 2;

  const baseMeters = { health: 100, hunger: 100, thirst: 100, infection: 0, energy: 100 };
  (Object.keys(roleDef.meterBias) as (keyof typeof baseMeters)[]).forEach((k) => {
    baseMeters[k] = Math.max(10, baseMeters[k] + (roleDef.meterBias[k] ?? 0));
  });

  return {
    id: `custom_${Date.now()}`,
    name: opts.name || "Custom Cat",
    clan: opts.clan,
    role: opts.role,
    baseMeters,
    baseStats: stats,
    passive: { id: "custom_resolve", name: "Clan Resolve", description: "A determined cat shaped by clan and role." },
    battleAbility: { id: "custom_strike", name: "Determined Strike", description: "A focused attack drawing on training." },
    description: `An original ${opts.clan} ${roleDef.name.toLowerCase()} of your own creation.`,
    appearance: opts.appearance,
    isCustom: true,
  };
}

interface Props {
  onConfirm: (def: CharacterDef) => void;
  onCancel: () => void;
}

export function CustomCatCreator({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState("");
  const [clan, setClan] = useState<ClanId>("ThunderClan");
  const [role, setRole] = useState<RoleId>("Warrior");
  const [furColor, setFurColor] = useState(FUR_COLORS[0].value);
  const [furPattern, setFurPattern] = useState(FUR_PATTERNS[0].id);
  const [eyeColor, setEyeColor] = useState(EYE_COLORS[0].value);
  const [scars, setScars] = useState(SCAR_STYLES[0].id);
  const [accessory, setAccessory] = useState(ACCESSORIES[0].id);
  const [bodyType, setBodyType] = useState(BODY_TYPES[1].id);
  const [earShape, setEarShape] = useState(EAR_SHAPES[0].id);
  const [tailStyle, setTailStyle] = useState(TAIL_STYLES[1].id);

  const appearance: Appearance = { furColor, furPattern, eyeColor, scars, accessory, bodyType, earShape, tailStyle };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const def = useMemo(() => buildCustomDef({ name, clan, role, appearance }), [name, clan, role, furColor, furPattern, eyeColor, scars, accessory, bodyType, earShape, tailStyle]);

  return (
    <div>
      <div className="flex flex-col items-center gap-2">
        <CatPortrait appearance={appearance} size={100} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your cat"
          maxLength={20}
          className="w-full rounded-lg border border-fern/30 bg-black/40 px-3 py-2 text-center text-parchment"
          aria-label="Cat name"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Clan">
          <Select value={clan} onChange={(v) => setClan(v as ClanId)} options={CLAN_LIST.map((c) => ({ v: c.id, l: c.name }))} />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(v) => setRole(v as RoleId)} options={ROLE_LIST.map((r) => ({ v: r.id, l: r.name }))} />
        </Field>
      </div>

      <div className="mt-3">
        <Swatches label="Fur Color" value={furColor} onChange={setFurColor} options={FUR_COLORS.map((c) => ({ v: c.value, color: c.value }))} />
        <Swatches label="Eye Color" value={eyeColor} onChange={setEyeColor} options={EYE_COLORS.map((c) => ({ v: c.value, color: c.value }))} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Fur Pattern"><Select value={furPattern} onChange={setFurPattern} options={FUR_PATTERNS.map((o) => ({ v: o.id, l: o.label }))} /></Field>
        <Field label="Scars"><Select value={scars} onChange={setScars} options={SCAR_STYLES.map((o) => ({ v: o.id, l: o.label }))} /></Field>
        <Field label="Accessory"><Select value={accessory} onChange={setAccessory} options={ACCESSORIES.map((o) => ({ v: o.id, l: o.label }))} /></Field>
        <Field label="Body Type"><Select value={bodyType} onChange={setBodyType} options={BODY_TYPES.map((o) => ({ v: o.id, l: o.label }))} /></Field>
        <Field label="Ear Shape"><Select value={earShape} onChange={setEarShape} options={EAR_SHAPES.map((o) => ({ v: o.id, l: o.label }))} /></Field>
        <Field label="Tail Style"><Select value={tailStyle} onChange={setTailStyle} options={TAIL_STYLES.map((o) => ({ v: o.id, l: o.label }))} /></Field>
      </div>

      <p className="mt-3 text-xs text-parchment/60">
        Stats come from role and clan: {ROLES[role].summary}
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" className="flex-1" onClick={() => onConfirm(def)}>Use This Cat</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-parchment/70">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-fern/30 bg-dusk px-2 py-2 text-sm text-parchment"
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>{o.l}</option>
      ))}
    </select>
  );
}

function Swatches({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; color: string }[] }) {
  return (
    <div className="mb-2">
      <span className="mb-1 block text-xs text-parchment/70">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            aria-label={`${label} ${o.color}`}
            className={`h-8 w-8 rounded-full border-2 ${value === o.v ? "border-parchment" : "border-transparent"}`}
            style={{ background: o.color }}
          />
        ))}
      </div>
    </div>
  );
}
