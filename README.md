# Warrior Apocalypse

A polished, responsive browser **survival game**. A mysterious infection is spreading
through the clans — lead five cats and survive as many days as you can. Single-player works
completely offline in your browser; optional private multiplayer rooms run on Supabase.

> **Disclaimer:** This is an **unofficial, fan-created** game inspired by the world of the
> _Warriors_ books. It is **not affiliated with, endorsed by, or sponsored by** the books'
> authors or publishers. All artwork is original and procedurally generated with SVG/CSS —
> no official illustrations, logos, character art, or text are used. A widely distributed or
> commercial version would be safer with entirely original clan and character names.

Built with **Next.js (App Router) · TypeScript · React · Tailwind CSS**, deployable to **Vercel**.

---

## Features (current build)

- **Full single-player survival loop** — one-minute opening scavenge → dig shelter → one-minute
  days with meters, notes, decisions, missions, weather, infection, turn-based battles, deaths,
  run-end summary, and alternative endings.
- **17 book-inspired characters** + a **custom cat creator**, **5 clans**, **5 roles**.
- **25 items, 10 herbs, 20 random events, 10 mission types, 8 locations, 8 shelter upgrades,
  8 enemy types, 5+ weather types, 14 achievements, 8 permanent upgrades, 10 cosmetics,
  4 alternative endings.**
- **Persistent progression** in `localStorage` — coins, upgrades, cosmetics, achievements,
  settings, and a saved run (export/import as JSON).
- **Turn-based battles** with role/character abilities, healing, protecting, distracting, escaping.
- **Multiplayer lobby foundation** — private rooms with live Supabase presence (friendly setup
  message when Supabase isn't configured; single-player never depends on it).
- **Accessibility** — reduced motion, high contrast, text-size scaling, large touch targets,
  ARIA meters, no hover-only interactions.
- **Developer debug panel** (development mode only).
- **Unit tests** for the core game logic (`vitest`).

---

## 1. Install dependencies

Requires **Node.js 18.18+** (Node 20/22 recommended).

```bash
npm install
```

## 2. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>. Single-player is fully playable immediately — no configuration needed.

Other scripts:

```bash
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint
npm run test       # run unit tests (vitest)
npm run typecheck  # TypeScript check
```

## 3. Create the Supabase tables (optional — multiplayer only)

Multiplayer uses [Supabase](https://supabase.com) Realtime for room presence and state sync.
Single-player does **not** need any of this.

1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor** and run:

```sql
-- Temporary multiplayer rooms
create table if not exists rooms (
  code text primary key,
  host_name text not null,
  created_at timestamptz not null default now(),
  started boolean not null default false,
  -- Authoritative game state owned by the host, distributed to clients
  game_state jsonb
);

-- Players present in a room
create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  display_name text not null,
  role text,
  cat_id text,
  is_host boolean not null default false,
  is_spectator boolean not null default false,
  connected boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists room_players_room_idx on room_players(room_code);

-- Clean up abandoned rooms (optional): rooms older than a day
-- delete from rooms where created_at < now() - interval '1 day';

-- Enable Realtime on both tables (Database → Replication, or):
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;
```

3. Row Level Security: for a no-accounts prototype you can either keep RLS disabled on these
   tables, or add permissive policies. The client only ever uses the **anon** key — never expose
   the service-role key to the browser.

```sql
-- Example permissive policies (prototype only — tighten for production):
alter table rooms enable row level security;
alter table room_players enable row level security;
create policy "rooms open" on rooms for all using (true) with check (true);
create policy "players open" on room_players for all using (true) with check (true);
```

> The current build's lobby uses Supabase **Realtime Presence** (no table writes required) so it
> works even before you create these tables. The tables above are the schema for full persisted
> room/state sync as the multiplayer layer is expanded.

## 4. Add environment variables

Copy `.env.example` to `.env.local` and fill in your project's values (Project Settings → API):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Only the public **anon** key is used, and only `NEXT_PUBLIC_*` variables reach the client.
**Never** put the service-role key in a `NEXT_PUBLIC_*` variable.

If these are missing, single-player still works fully and the Multiplayer screen shows a friendly
setup message instead of crashing.

## 5. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com), **New Project → Import** the repo. Vercel auto-detects Next.js.
3. (Optional, for multiplayer) add the two `NEXT_PUBLIC_SUPABASE_*` environment variables under
   **Project → Settings → Environment Variables**.
4. **Deploy.** No server env/secrets are required for single-player.

Or with the CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

## 6. Test multiplayer with two browser windows

1. Ensure the Supabase env vars are set and restart `npm run dev`.
2. Open the app in **two windows** (e.g. a normal window and an incognito window, or two browsers).
3. Window A → **Host Multiplayer Game** → enter a name → note the 5-letter **room code**.
4. Window B → **Join Multiplayer Game** → enter a name and the room code.
5. Both windows now show each other in the room's live presence list in real time.

---

## Project structure

```
src/
  app/                  Next.js App Router (layout, page, global styles, icon)
  config/
    balance.ts          Centralized balance constants (all tunables in one place)
  data/                 Typed game data: characters, clans, roles, items, herbs,
                        enemies, weather, locations, shelters, upgrades, cosmetics,
                        achievements, missions, events, endings, custom-cat options
  engine/               Framework-agnostic, unit-tested game logic:
    rng.ts              Seedable deterministic RNG (multiplayer-safe)
    meters.ts           Meter drain / rest / feed / injure
    infection.ts        Infection stages, growth, treatment, turning
    missions.ts         Mission estimation & resolution
    battle.ts           Turn-based battle system
    events.ts           Random-event selection & resolution
    scavenge.ts         Opening-phase loot & risk
    difficulty.ts       Ten-day difficulty scaling
    coins.ts            Ten-day coin rewards
    achievements.ts     Achievement evaluation (coin-capped)
    death.ts            Death conditions & role succession
    multiplayer.ts      Player↔NPC transfer & kit protection rules
    gameState.ts        Run creation + day-tick orchestration
    engine.test.ts      Unit tests
  persistence/
    storage.ts          localStorage save/load, import/export, validation
  multiplayer/
    supabase.ts         Optional Supabase client + graceful "not configured" handling
  game/
    useGameController.ts Central React controller (state machine + actions)
  components/
    art/                Original SVG/CSS art: CatPortrait, Scene, weather overlays
    ui/                 MeterBar and shared primitives
    screens/            Title, NewGame, CustomCatCreator, Scavenging, DigShelter,
                        Day, Battle, RunEnd, Collection/Shop/Achievements/HowTo/
                        Settings/Credits, Multiplayer, DebugPanel
    GameShell.tsx       Screen router + toasts
```

## Balancing

Every tunable value lives in `src/config/balance.ts` (day length, meter rates, infection growth,
treatment odds, mission durations/success, battle damage, escape odds, difficulty scaling, coin
rewards, upgrade prices) plus the per-difficulty and per-weather multiplier tables.

## Saving

Single-player autosaves after actions and each day. From **Settings** you can **Export** the
current run as JSON, **Import** a run (validated before loading), or **Reset all data**.

## Roadmap (next steps)

- Full synchronized multiplayer runs (host-authoritative state distribution over the tables above,
  leadership succession, spectators, limited medical rescue after treatable deaths).
- Scavenge-phase encounters that flow directly into battles.
- More characters, events, enemies, and missions; richer illustrations and optional generated audio.
- A guided first-run tutorial.

## Tech notes

- No user accounts. All single-player progress is in the browser's `localStorage`.
- Deterministic, seedable RNG so the host can generate outcomes and distribute them to clients.
- The Supabase **service-role** key is never used client-side.
