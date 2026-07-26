import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Multiplayer is OPTIONAL. If the env vars are missing, single-player still works
// fully and the UI shows a friendly setup message instead of crashing.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isMultiplayerConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isMultiplayerConfigured()) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

export const MULTIPLAYER_SETUP_MESSAGE =
  "Multiplayer needs a free Supabase project. Add NEXT_PUBLIC_SUPABASE_URL and " +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment (see the README), then restart. " +
  "Single-player works fully without it.";

export function makeRoomCode(): string {
  // 5-character human-friendly room code (no ambiguous chars).
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
