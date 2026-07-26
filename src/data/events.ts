// Random events (20). Each presents a note + decision options.
// Options resolve to weighted outcomes made of declarative effects the engine applies.

export type EventEffect =
  | { kind: "log"; text: string; entry?: "event" | "discovery" | "injury" | "resource" }
  | { kind: "meterGroup"; meter: "health" | "hunger" | "thirst" | "energy"; delta: number }
  | { kind: "meterMain"; meter: "health" | "hunger" | "thirst" | "energy"; delta: number }
  | { kind: "addItem"; itemId: string; quantity: number }
  | { kind: "removeItem"; itemId: string; quantity: number }
  | { kind: "injureRandom"; amount: number }
  | { kind: "infectRandom"; amount: number }
  | { kind: "battle"; enemyId: string }
  | { kind: "rescueCat" }
  | { kind: "discovery"; id: string; text: string }
  | { kind: "coins"; amount: number }
  | { kind: "shelterIntegrity"; delta: number }
  | { kind: "abandonShelterPrompt" };

export interface EventOutcome {
  weight: number;
  text: string;
  effects: EventEffect[];
}

export interface EventOption {
  id: string;
  label: string;
  outcomes: EventOutcome[];
}

export interface RandomEventDef {
  id: string;
  title: string;
  text: string;
  weight: number;
  minDay?: number;
  options: EventOption[];
}

// Shorthand outcome builders keep the table readable.
const ok = (text: string, effects: EventEffect[], weight = 1): EventOutcome => ({ weight, text, effects });

export const RANDOM_EVENTS: RandomEventDef[] = [
  {
    id: "missing_hunter",
    title: "A Hunter Has Not Returned",
    text: "One of your cats went out to hunt and has not come back. The light is fading.",
    weight: 3,
    options: [
      { id: "search", label: "Send a cat to search", outcomes: [
        ok("They find their clanmate, shaken but safe.", [{ kind: "log", text: "The missing hunter is found and brought home." }], 3),
        ok("A rat ambush! You must fight.", [{ kind: "battle", enemyId: "rat" }], 2),
      ] },
      { id: "wait", label: "Wait until morning", outcomes: [
        ok("They stagger back at dawn, hungry and cold.", [{ kind: "meterMain", meter: "hunger", delta: -8 }], 3),
        ok("They return wounded from a fall.", [{ kind: "injureRandom", amount: 14 }], 2),
      ] },
    ],
  },
  {
    id: "bad_water",
    title: "The Water Smells Wrong",
    text: "Your medicine cat believes the water source may be contaminated.",
    weight: 3,
    options: [
      { id: "avoid", label: "Ask the medicine cat to find another source", outcomes: [
        ok("A clean trickle is found nearby.", [{ kind: "addItem", itemId: "fresh_water", quantity: 1 }], 3),
        ok("The search turns up nothing.", [{ kind: "log", text: "No clean water is found today." }], 2),
      ] },
      { id: "drink", label: "Ignore the warning and drink", outcomes: [
        ok("It was fine after all.", [{ kind: "meterGroup", meter: "thirst", delta: 8 }], 2),
        ok("The water was foul. A cat sickens.", [{ kind: "infectRandom", amount: 12 }], 3),
      ] },
    ],
  },
  {
    id: "scratching_below",
    title: "Scratching Beneath the Shelter",
    text: "The kit swears something is scratching under the den floor.",
    weight: 2,
    options: [
      { id: "investigate", label: "Investigate", outcomes: [
        ok("Rats! They boil up from below.", [{ kind: "battle", enemyId: "rat" }], 3),
        ok("Only a burrowing vole — and a free meal.", [{ kind: "addItem", itemId: "vole", quantity: 1 }], 2),
      ] },
      { id: "ignore", label: "Ignore it", outcomes: [
        ok("The scratching stops by morning.", [{ kind: "log", text: "The noise fades in the night." }], 2),
        ok("The floor is undermined — the shelter weakens.", [{ kind: "shelterIntegrity", delta: -12 }], 2),
      ] },
    ],
  },
  {
    id: "cry_for_help",
    title: "A Cry Beyond the Trees",
    text: "A cat is calling for help somewhere past the tree line.",
    weight: 3,
    options: [
      { id: "help", label: "Send two cats to help", outcomes: [
        ok("You rescue a frightened survivor who joins you.", [{ kind: "rescueCat" }, { kind: "log", text: "A survivor is rescued." }], 3),
        ok("It was a trap set by a hostile loner.", [{ kind: "battle", enemyId: "hostile_survivor" }], 2),
      ] },
      { id: "ignore", label: "Stay hidden", outcomes: [
        ok("The cries fade. The group stays safe but uneasy.", [{ kind: "meterGroup", meter: "energy", delta: -4 }], 3),
      ] },
    ],
  },
  {
    id: "leave_before_night",
    title: "The Deputy Is Uneasy",
    text: "The deputy thinks the group should leave the area before nightfall.",
    weight: 2,
    options: [
      { id: "prepare", label: "Prepare defenses instead", outcomes: [
        ok("The night passes without incident.", [{ kind: "shelterIntegrity", delta: 6 }], 3),
        ok("Infected cats test the defenses.", [{ kind: "battle", enemyId: "infected_cat" }], 2),
      ] },
      { id: "consider", label: "Consider abandoning the shelter", outcomes: [
        ok("The deputy's instinct proves right.", [{ kind: "abandonShelterPrompt" }], 1),
        ok("On reflection, the group stays.", [{ kind: "log", text: "The group decides to hold their ground." }], 2),
      ] },
    ],
  },
  {
    id: "prey_smells_wrong",
    title: "Tainted Prey",
    text: "One of the prey animals smells wrong to the medicine cat.",
    weight: 3,
    options: [
      { id: "discard", label: "Discard it to be safe", outcomes: [
        ok("Better hungry than sick.", [{ kind: "meterGroup", meter: "hunger", delta: -4 }], 3),
      ] },
      { id: "eat", label: "Eat it anyway", outcomes: [
        ok("It filled bellies without harm.", [{ kind: "meterGroup", meter: "hunger", delta: 10 }], 2),
        ok("The prey was contaminated. Sickness spreads.", [{ kind: "infectRandom", amount: 14 }], 3),
      ] },
    ],
  },
  {
    id: "dark_clouds",
    title: "Dark Clouds Gather",
    text: "Heavy clouds are building beyond the moor. A storm may be coming.",
    weight: 2,
    options: [
      { id: "shelter", label: "Reinforce the shelter", outcomes: [
        ok("You weather the coming storm well.", [{ kind: "shelterIntegrity", delta: 8 }, { kind: "meterGroup", meter: "energy", delta: -6 }], 3),
      ] },
      { id: "gather", label: "Rush to gather water first", outcomes: [
        ok("You collect water before the downpour.", [{ kind: "addItem", itemId: "fresh_water", quantity: 2 }], 3),
        ok("The storm catches you in the open.", [{ kind: "injureRandom", amount: 10 }], 2),
      ] },
    ],
  },
  {
    id: "hidden_wound",
    title: "A Hidden Wound",
    text: "A clanmate is hiding a wound, afraid of being seen as weak.",
    weight: 3,
    options: [
      { id: "treat", label: "Have the medicine cat treat it", outcomes: [
        ok("The wound is cleaned before it can fester.", [{ kind: "meterMain", meter: "health", delta: 8 }], 3),
      ] },
      { id: "leave", label: "Respect their pride and leave it", outcomes: [
        ok("They tough it out.", [{ kind: "log", text: "The wound stays hidden — for now." }], 2),
        ok("The wound festers overnight.", [{ kind: "infectRandom", amount: 10 }], 2),
      ] },
    ],
  },
  {
    id: "stranger_at_entrance",
    title: "A Stranger at the Entrance",
    text: "An unknown cat stands at the shelter entrance, asking to be let in.",
    weight: 2,
    options: [
      { id: "admit", label: "Let them in", outcomes: [
        ok("They share supplies in gratitude.", [{ kind: "addItem", itemId: "herb_kit", quantity: 1 }, { kind: "rescueCat" }], 2),
        ok("They were infected. Chaos erupts.", [{ kind: "battle", enemyId: "infected_cat" }], 2),
      ] },
      { id: "refuse", label: "Turn them away", outcomes: [
        ok("They slink off into the dark.", [{ kind: "meterGroup", meter: "energy", delta: -3 }], 3),
      ] },
    ],
  },
  {
    id: "smoke_on_wind",
    title: "Smoke on the Wind",
    text: "The acrid smell of smoke drifts through the trees.",
    weight: 2,
    options: [
      { id: "flee", label: "Prepare to abandon the shelter", outcomes: [
        ok("You are ready to move if the fire nears.", [{ kind: "log", text: "The group readies to flee." }], 2),
        ok("The fire turns away. Relief.", [{ kind: "meterGroup", meter: "energy", delta: -4 }], 2),
      ] },
      { id: "scout", label: "Scout the source", outcomes: [
        ok("A distant Twoleg fire — no danger yet.", [{ kind: "discovery", id: "twoleg_fire", text: "You learn Twolegs are active nearby." }], 2),
        ok("You stumble into a fox fleeing the flames.", [{ kind: "battle", enemyId: "fox" }], 1),
      ] },
    ],
  },
  {
    id: "found_cache",
    title: "A Hidden Cache",
    text: "The kit's sharp nose finds a small hidden cache of supplies.",
    weight: 2,
    options: [
      { id: "take", label: "Gather it up", outcomes: [
        ok("A tidy little haul.", [{ kind: "addItem", itemId: "mouse", quantity: 1 }, { kind: "addItem", itemId: "cobwebs", quantity: 1 }], 3),
        ok("Even better — medicine!", [{ kind: "addItem", itemId: "herb_kit", quantity: 1 }], 1),
      ] },
    ],
  },
  {
    id: "lost_kit_sound",
    title: "Tiny Sounds",
    text: "The kit hears something the adults cannot — a faint mewing nearby.",
    weight: 2,
    options: [
      { id: "follow", label: "Follow the sound carefully", outcomes: [
        ok("You find a hidden survivor.", [{ kind: "rescueCat" }], 2),
        ok("It leads to a narrow, useful passage.", [{ kind: "discovery", id: "hidden_path", text: "A hidden path is discovered." }], 2),
      ] },
      { id: "ignore", label: "Keep the kit safe inside", outcomes: [
        ok("The sound stops.", [{ kind: "log", text: "The mewing fades away." }], 2),
      ] },
    ],
  },
  {
    id: "rat_nest",
    title: "A Rat Nest",
    text: "A cat stumbles onto a nest of rats near the food store.",
    weight: 3,
    options: [
      { id: "fight", label: "Drive them off", outcomes: [
        ok("The rats attack in force!", [{ kind: "battle", enemyId: "rat_swarm" }], 3),
      ] },
      { id: "retreat", label: "Retreat and seal the store", outcomes: [
        ok("You lose some food but avoid the fight.", [{ kind: "meterGroup", meter: "hunger", delta: -6 }], 2),
      ] },
    ],
  },
  {
    id: "drought_warning",
    title: "The Streams Run Low",
    text: "The medicine cat warns that water is growing scarce.",
    weight: 2,
    minDay: 5,
    options: [
      { id: "ration", label: "Ration water carefully", outcomes: [
        ok("Careful rationing stretches supplies.", [{ kind: "log", text: "Water is rationed." }], 3),
      ] },
      { id: "search", label: "Send cats to find water", outcomes: [
        ok("They return with water.", [{ kind: "addItem", itemId: "fresh_water", quantity: 2 }], 2),
        ok("They find nothing under the harsh sun.", [{ kind: "meterGroup", meter: "thirst", delta: -8 }], 2),
      ] },
    ],
  },
  {
    id: "old_friend",
    title: "A Familiar Scent",
    text: "A scout catches the scent of a cat they once knew.",
    weight: 1,
    options: [
      { id: "track", label: "Track the scent", outcomes: [
        ok("An old friend, alive! They join you.", [{ kind: "rescueCat" }], 2),
        ok("The trail ends at a bad sign.", [{ kind: "discovery", id: "grim_sign", text: "A grim discovery about the sickness." }, { kind: "addItem", itemId: "infection_clue", quantity: 1 }], 2),
      ] },
      { id: "leave", label: "Leave it be", outcomes: [
        ok("Some trails are best left cold.", [{ kind: "log", text: "The scent is left uninvestigated." }], 2),
      ] },
    ],
  },
  {
    id: "berry_temptation",
    title: "Bright Berries",
    text: "The kit found bright red berries and wants to eat them.",
    weight: 2,
    options: [
      { id: "stop", label: "Have the medicine cat check them", outcomes: [
        ok("Deathberries! The medicine cat forbids them.", [{ kind: "discovery", id: "deathberries", text: "The group learns to avoid deathberries." }], 3),
      ] },
      { id: "allow", label: "Let the kit eat", outcomes: [
        ok("The kit falls terribly ill.", [{ kind: "meterMain", meter: "health", delta: -18 }], 3),
      ] },
    ],
  },
  {
    id: "flood_rising",
    title: "Rising Water",
    text: "Water is creeping toward the shelter after days of rain.",
    weight: 2,
    minDay: 4,
    options: [
      { id: "move", label: "Move supplies to higher ground", outcomes: [
        ok("You save the supplies in time.", [{ kind: "meterGroup", meter: "energy", delta: -8 }], 3),
        ok("The water rises fast — abandon the shelter!", [{ kind: "abandonShelterPrompt" }], 1),
      ] },
      { id: "wait", label: "Hope it recedes", outcomes: [
        ok("The water pulls back by morning.", [{ kind: "log", text: "The flood recedes." }], 2),
        ok("The den floods. Supplies are lost.", [{ kind: "removeItem", itemId: "moss_bedding", quantity: 1 }, { kind: "shelterIntegrity", delta: -14 }], 2),
      ] },
    ],
  },
  {
    id: "wounded_stranger",
    title: "A Wounded Stranger",
    text: "A badly hurt cat drags itself toward your territory.",
    weight: 2,
    options: [
      { id: "treat", label: "Treat their wounds", outcomes: [
        ok("They recover and join you, loyal for life.", [{ kind: "rescueCat" }, { kind: "removeItem", itemId: "cobwebs", quantity: 1 }], 2),
        ok("Their wounds were beyond help.", [{ kind: "log", text: "The stranger could not be saved." }], 2),
      ] },
      { id: "refuse", label: "Keep your distance", outcomes: [
        ok("You cannot risk the group.", [{ kind: "meterGroup", meter: "energy", delta: -4 }], 3),
      ] },
    ],
  },
  {
    id: "strange_calm",
    title: "An Eerie Calm",
    text: "The forest has gone utterly silent. Even the birds have stopped.",
    weight: 2,
    options: [
      { id: "ready", label: "Ready the group for danger", outcomes: [
        ok("A dire infected creature bursts from the brush!", [{ kind: "battle", enemyId: "dire_infected" }], 2),
        ok("Nothing comes. The silence lifts.", [{ kind: "log", text: "The calm passes strangely." }], 2),
      ] },
      { id: "rest", label: "Use the quiet to rest", outcomes: [
        ok("A rare, restful moment.", [{ kind: "meterGroup", meter: "energy", delta: 10 }], 2),
        ok("You are caught off guard.", [{ kind: "battle", enemyId: "fox" }], 1),
      ] },
    ],
  },
  {
    id: "cure_whisper",
    title: "A Whisper of a Cure",
    text: "A clue suggests the sickness might be curable after all.",
    weight: 1,
    minDay: 8,
    options: [
      { id: "pursue", label: "Follow the lead", outcomes: [
        ok("You recover a precious cure sample.", [{ kind: "addItem", itemId: "cure_sample", quantity: 1 }, { kind: "discovery", id: "cure_lead", text: "A real lead toward a cure." }], 2),
        ok("The lead is a dead end guarded by rats.", [{ kind: "battle", enemyId: "rat_swarm" }], 2),
      ] },
      { id: "ignore", label: "Focus on survival", outcomes: [
        ok("Survival comes first.", [{ kind: "log", text: "The lead is set aside." }], 2),
      ] },
    ],
  },
];

export const RANDOM_EVENTS_BY_ID: Record<string, RandomEventDef> = Object.fromEntries(
  RANDOM_EVENTS.map((e) => [e.id, e]),
);
