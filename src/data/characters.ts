import type { CharacterDef, ClanId, RoleId, Appearance } from "@/engine/types";

// NOTE: These are ORIGINAL fan interpretations. Names, clans, and broad traits
// (fur color, role) are used, but all artwork is generated from these simple
// descriptors — no official illustrations are copied.

function appearance(a: Partial<Appearance>): Appearance {
  return {
    furColor: "#b06a3a",
    furPattern: "tabby",
    eyeColor: "#6fae7a",
    scars: "none",
    accessory: "none",
    bodyType: "medium",
    earShape: "pointed",
    tailStyle: "medium",
    ...a,
  };
}

interface Seed {
  id: string;
  name: string;
  clan: ClanId;
  role: RoleId;
  health: number;
  hunger: number;
  thirst: number;
  infection: number;
  energy: number;
  attack: number;
  defense: number;
  hunting: number;
  medicine: number;
  stealth: number;
  speed: number;
  passive: [string, string, string];
  battle: [string, string, string];
  description: string;
  appearance: Partial<Appearance>;
}

const SEEDS: Seed[] = [
  {
    id: "firestar",
    name: "Firestar",
    clan: "ThunderClan",
    role: "Leader",
    health: 100, hunger: 100, thirst: 100, infection: 0, energy: 100,
    attack: 18, defense: 14, hunting: 16, medicine: 4, stealth: 10, speed: 15,
    passive: ["kindled_spirit", "Kindled Spirit", "Nearby clanmates recover a little extra energy each day."],
    battle: ["blaze_rally", "Blaze Rally", "Grants an ally an extra action this round."],
    description: "A bright ginger tom with an unshakeable sense of what is right, leading by example.",
    appearance: { furColor: "#d9622a", furPattern: "solid", eyeColor: "#4a8f3c" },
  },
  {
    id: "bluestar",
    name: "Bluestar",
    clan: "ThunderClan",
    role: "Leader",
    health: 96, hunger: 100, thirst: 100, infection: 0, energy: 92,
    attack: 15, defense: 16, hunting: 12, medicine: 6, stealth: 11, speed: 12,
    passive: ["steady_command", "Steady Command", "Reduces the chance a mission goes badly wrong."],
    battle: ["frost_resolve", "Frost Resolve", "Shields the whole group, reducing incoming damage this round."],
    description: "A wise blue-gray she-cat whose calm judgement has carried the clan through many storms.",
    appearance: { furColor: "#7f93a8", furPattern: "solid", eyeColor: "#4d7fb0", scars: "muzzle" },
  },
  {
    id: "graystripe",
    name: "Graystripe",
    clan: "ThunderClan",
    role: "Deputy",
    health: 102, hunger: 100, thirst: 100, infection: 0, energy: 95,
    attack: 16, defense: 15, hunting: 14, medicine: 3, stealth: 9, speed: 12,
    passive: ["loyal_shoulder", "Loyal Shoulder", "The cat he guards takes less injury on missions."],
    battle: ["shoulder_check", "Shoulder Check", "Redirects an ally's incoming hit onto himself."],
    description: "A broad gray tom with a long stripe down his back, loyal to the last whisker.",
    appearance: { furColor: "#8a8f96", furPattern: "stripe", eyeColor: "#c8a13a", bodyType: "large" },
  },
  {
    id: "sandstorm",
    name: "Sandstorm",
    clan: "ThunderClan",
    role: "Warrior",
    health: 98, hunger: 100, thirst: 100, infection: 0, energy: 96,
    attack: 17, defense: 13, hunting: 17, medicine: 3, stealth: 12, speed: 16,
    passive: ["keen_hunter", "Keen Hunter", "Improves food gained from hunting missions."],
    battle: ["swift_strikes", "Swift Strikes", "Attacks twice at reduced power."],
    description: "A pale ginger she-cat, quick-tempered and quicker on her paws, a superb hunter.",
    appearance: { furColor: "#e0b46a", furPattern: "tabby", eyeColor: "#5fa04a" },
  },
  {
    id: "yellowfang",
    name: "Yellowfang",
    clan: "ShadowClan",
    role: "Medicine",
    health: 88, hunger: 100, thirst: 100, infection: 0, energy: 84,
    attack: 10, defense: 12, hunting: 8, medicine: 20, stealth: 11, speed: 8,
    passive: ["herb_wisdom", "Herb Wisdom", "Herbs treat infection more effectively in her paws."],
    battle: ["bitter_poultice", "Bitter Poultice", "Heals an ally and reduces their infection risk."],
    description: "A grizzled dark gray she-cat with a sharp tongue and unmatched knowledge of herbs.",
    appearance: { furColor: "#5a5b60", furPattern: "solid", eyeColor: "#d67a2a", scars: "ear", bodyType: "large" },
  },
  {
    id: "cinderpelt",
    name: "Cinderpelt",
    clan: "ThunderClan",
    role: "Medicine",
    health: 84, hunger: 100, thirst: 100, infection: 0, energy: 88,
    attack: 9, defense: 11, hunting: 8, medicine: 18, stealth: 12, speed: 9,
    passive: ["gentle_hands", "Gentle Hands", "Wound healing restores extra health."],
    battle: ["soothing_herbs", "Soothing Herbs", "Restores a large amount of health to one ally."],
    description: "A dark gray she-cat with a lame leg and a bright, devoted heart for healing.",
    appearance: { furColor: "#4f5158", furPattern: "solid", eyeColor: "#4d7fb0", scars: "leg" },
  },
  {
    id: "leafpool",
    name: "Leafpool",
    clan: "ThunderClan",
    role: "Medicine",
    health: 86, hunger: 100, thirst: 100, infection: 0, energy: 90,
    attack: 9, defense: 11, hunting: 9, medicine: 17, stealth: 13, speed: 11,
    passive: ["quiet_intuition", "Quiet Intuition", "Better at spotting contaminated food and water."],
    battle: ["healing_touch", "Healing Touch", "Heals an ally and cleanses one status effect."],
    description: "A light brown tabby she-cat with amber eyes and a deep bond to the world around her.",
    appearance: { furColor: "#b58a52", furPattern: "tabby", eyeColor: "#c8901f" },
  },
  {
    id: "squirrelflight",
    name: "Squirrelflight",
    clan: "ThunderClan",
    role: "Deputy",
    health: 97, hunger: 100, thirst: 100, infection: 0, energy: 98,
    attack: 16, defense: 13, hunting: 15, medicine: 4, stealth: 13, speed: 17,
    passive: ["bold_spark", "Bold Spark", "Improves organization; missions finish a little faster."],
    battle: ["darting_defense", "Darting Defense", "Protects an ally and counters the next attacker."],
    description: "A fiery ginger she-cat with one white paw, brave, stubborn, and fiercely loyal.",
    appearance: { furColor: "#cf5b28", furPattern: "tabby", eyeColor: "#5fa04a", accessory: "none" },
  },
  {
    id: "brambleclaw",
    name: "Brambleclaw",
    clan: "ThunderClan",
    role: "Warrior",
    health: 104, hunger: 100, thirst: 100, infection: 0, energy: 96,
    attack: 19, defense: 16, hunting: 14, medicine: 3, stealth: 10, speed: 13,
    passive: ["broad_guard", "Broad Guard", "Weaker clanmates at the shelter are safer."],
    battle: ["thorn_lunge", "Thorn Lunge", "A powerful strike that ignores part of the target's defense."],
    description: "A powerful dark brown tabby tom with broad shoulders and amber eyes.",
    appearance: { furColor: "#6b4b2c", furPattern: "tabby", eyeColor: "#c8901f", bodyType: "large" },
  },
  {
    id: "cloudtail",
    name: "Cloudtail",
    clan: "ThunderClan",
    role: "Warrior",
    health: 100, hunger: 100, thirst: 100, infection: 0, energy: 97,
    attack: 17, defense: 13, hunting: 16, medicine: 3, stealth: 11, speed: 15,
    passive: ["thick_pelt", "Thick Pelt", "Takes slightly less injury in bad weather."],
    battle: ["reckless_charge", "Reckless Charge", "High damage, but lowers his own defense this round."],
    description: "A long-haired white tom, skeptical of tradition but bold and strong in a fight.",
    appearance: { furColor: "#eef0ee", furPattern: "solid", eyeColor: "#4d7fb0", bodyType: "large", tailStyle: "fluffy" },
  },
  {
    id: "ravenpaw",
    name: "Ravenpaw",
    clan: "ThunderClan",
    role: "Warrior",
    health: 90, hunger: 100, thirst: 100, infection: 0, energy: 94,
    attack: 13, defense: 12, hunting: 15, medicine: 4, stealth: 18, speed: 16,
    passive: ["wary_eyes", "Wary Eyes", "Lowers the chance of ambush on missions he joins."],
    battle: ["shadow_slip", "Shadow Slip", "Greatly improves the group's escape chance this round."],
    description: "A sleek black tom with a white dash on his chest and tail-tip, gentle but ever watchful.",
    appearance: { furColor: "#2a2b30", furPattern: "solid", eyeColor: "#4a8f3c", tailStyle: "tipped" },
  },
  {
    id: "tallstar",
    name: "Tallstar",
    clan: "WindClan",
    role: "Leader",
    health: 94, hunger: 100, thirst: 100, infection: 0, energy: 100,
    attack: 14, defense: 13, hunting: 15, medicine: 5, stealth: 12, speed: 20,
    passive: ["long_stride", "Long Stride", "Missions in open terrain finish faster for the group."],
    battle: ["moor_rally", "Moor Rally", "Boosts the whole group's speed and next escape attempt."],
    description: "A lean black-and-white tom with an unusually long tail, swift across the open moor.",
    appearance: { furColor: "#2f3036", furPattern: "patched", eyeColor: "#c8a13a", bodyType: "lean", tailStyle: "long" },
  },
  {
    id: "crookedstar",
    name: "Crookedstar",
    clan: "RiverClan",
    role: "Leader",
    health: 100, hunger: 100, thirst: 100, infection: 0, energy: 96,
    attack: 17, defense: 15, hunting: 16, medicine: 4, stealth: 11, speed: 13,
    passive: ["river_born", "River Born", "Fishing and water-gathering yield more for the group."],
    battle: ["current_slam", "Current Slam", "A heavy strike that can lower the target's speed."],
    description: "A large light brown tabby tom with a crooked jaw and an iron will.",
    appearance: { furColor: "#a9855a", furPattern: "tabby", eyeColor: "#5aa06a", scars: "jaw", bodyType: "large" },
  },
  {
    id: "mistystar",
    name: "Mistystar",
    clan: "RiverClan",
    role: "Deputy",
    health: 96, hunger: 100, thirst: 100, infection: 0, energy: 95,
    attack: 15, defense: 15, hunting: 14, medicine: 6, stealth: 12, speed: 14,
    passive: ["still_water", "Still Water", "Lowers flood and river risk for the group."],
    battle: ["tide_guard", "Tide Guard", "Protects an ally and heals them slightly."],
    description: "A graceful blue-gray she-cat with clear blue eyes and a steady, fair temper.",
    appearance: { furColor: "#8496ab", furPattern: "solid", eyeColor: "#4d7fb0" },
  },
  {
    id: "blackstar",
    name: "Blackstar",
    clan: "ShadowClan",
    role: "Leader",
    health: 102, hunger: 100, thirst: 100, infection: 0, energy: 94,
    attack: 18, defense: 16, hunting: 13, medicine: 3, stealth: 15, speed: 13,
    passive: ["night_prowler", "Night Prowler", "Improves success on nighttime missions."],
    battle: ["ambush_command", "Ambush Command", "Strikes and lowers the target's defense for allies."],
    description: "A big white tom with jet-black paws, stern and hard to read.",
    appearance: { furColor: "#e8e8e4", furPattern: "solid", eyeColor: "#c8a13a", bodyType: "large" },
  },
  {
    id: "tigerstar",
    name: "Tigerstar",
    clan: "ShadowClan",
    role: "Warrior",
    health: 108, hunger: 100, thirst: 100, infection: 0, energy: 95,
    attack: 21, defense: 17, hunting: 13, medicine: 2, stealth: 12, speed: 14,
    passive: ["fearsome_presence", "Fearsome Presence", "Enemies are more likely to flee a battle he's in."],
    battle: ["killing_blow", "Killing Blow", "A brutal strike with a high chance to critically hit."],
    description: "A massive dark brown tabby tom with long claws and ambition burning in his amber eyes.",
    appearance: { furColor: "#5a3f24", furPattern: "tabby", eyeColor: "#c88a1f", scars: "muzzle", bodyType: "large" },
  },
  {
    id: "lionheart",
    name: "Lionheart",
    clan: "ThunderClan",
    role: "Warrior",
    health: 106, hunger: 100, thirst: 100, infection: 0, energy: 96,
    attack: 19, defense: 16, hunting: 14, medicine: 3, stealth: 9, speed: 12,
    passive: ["mane_of_courage", "Mane of Courage", "Improves group morale, softening panic in events."],
    battle: ["lions_roar", "Lion's Roar", "Strikes all enemies for moderate damage."],
    description: "A magnificent golden tabby tom with a thick mane-like ruff and a warm heart.",
    appearance: { furColor: "#c79a4a", furPattern: "tabby", eyeColor: "#c8901f", bodyType: "large", tailStyle: "fluffy" },
  },
];

export const BOOK_CHARACTERS: CharacterDef[] = SEEDS.map((s) => ({
  id: s.id,
  name: s.name,
  clan: s.clan,
  role: s.role,
  baseMeters: {
    health: s.health,
    hunger: s.hunger,
    thirst: s.thirst,
    infection: s.infection,
    energy: s.energy,
  },
  baseStats: {
    attack: s.attack,
    defense: s.defense,
    hunting: s.hunting,
    medicine: s.medicine,
    stealth: s.stealth,
    speed: s.speed,
  },
  passive: { id: s.passive[0], name: s.passive[1], description: s.passive[2] },
  battleAbility: { id: s.battle[0], name: s.battle[1], description: s.battle[2] },
  description: s.description,
  appearance: appearance(s.appearance),
}));

export const BOOK_CHARACTERS_BY_ID: Record<string, CharacterDef> = Object.fromEntries(
  BOOK_CHARACTERS.map((c) => [c.id, c]),
);

export function getCharacterDef(id: string): CharacterDef | undefined {
  return BOOK_CHARACTERS_BY_ID[id];
}
