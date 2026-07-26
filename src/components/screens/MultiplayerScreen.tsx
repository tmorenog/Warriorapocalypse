"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameController } from "@/game/useGameController";
import {
  isMultiplayerConfigured,
  getSupabase,
  MULTIPLAYER_SETUP_MESSAGE,
  makeRoomCode,
} from "@/multiplayer/supabase";
import { Button, Panel, Badge } from "@/components/ui/primitives";
import { REQUIRED_ROLES } from "@/data/roles";

interface Presence {
  name: string;
  role: string;
  isHost: boolean;
}

export function MultiplayerScreen({ ctx }: { ctx: GameController }) {
  const configured = isMultiplayerConfigured();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"menu" | "host" | "join">("menu");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState<Presence[]>([]);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [role, setRole] = useState("Warrior");
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null>(null);

  useEffect(() => {
    return () => {
      // Clean up presence channel on unmount.
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const connect = (code: string, isHost: boolean) => {
    const supa = getSupabase();
    if (!supa) return;
    setStatus("connecting");
    const channel = supa.channel(`room:${code}`, {
      config: { presence: { key: `${name}-${Math.random().toString(36).slice(2, 7)}` } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, Presence[]>;
        const list: Presence[] = Object.values(state).flat();
        setPlayers(list);
      })
      .subscribe(async (s: string) => {
        if (s === "SUBSCRIBED") {
          setStatus("connected");
          await channel.track({ name: name || "Player", role, isHost });
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          setStatus("error");
        }
      });
    channelRef.current = channel;
  };

  const host = () => {
    const code = makeRoomCode();
    setRoomCode(code);
    setMode("host");
    connect(code, true);
  };

  const join = () => {
    if (joinCode.trim().length < 4) return;
    setRoomCode(joinCode.trim().toUpperCase());
    setMode("join");
    connect(joinCode.trim().toUpperCase(), false);
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-2xl text-parchment">Multiplayer</h1>
          <Button onClick={() => ctx.setScreen("title")}>← Menu</Button>
        </header>
        <Panel title="Setup Needed">
          <p className="text-sm text-parchment/85">{MULTIPLAYER_SETUP_MESSAGE}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-parchment/70">
            <li>Create a free project at supabase.com.</li>
            <li>Copy the project URL and anon key from Project Settings → API.</li>
            <li>Add them to <code className="rounded bg-black/40 px-1">.env.local</code> as <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</li>
            <li>Create the tables from the README, then restart the dev server.</li>
          </ol>
          <p className="mt-3 rounded bg-fern/10 p-2 text-xs text-fern">
            Single-player works fully right now without any of this.
          </p>
        </Panel>
        <div className="mt-3">
          <Button variant="primary" onClick={() => ctx.setScreen("newGame")}>Play Single-Player Instead</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-parchment">Multiplayer</h1>
        <Button onClick={() => ctx.setScreen("title")}>← Menu</Button>
      </header>

      <Panel title="Your Details" className="mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" maxLength={16}
          className="w-full rounded-lg border border-fern/30 bg-black/40 px-3 py-2 text-parchment" />
        <div className="mt-2">
          <label className="mb-1 block text-xs text-parchment/70">Preferred Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-fern/30 bg-dusk px-2 py-2 text-sm text-parchment">
            {REQUIRED_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </Panel>

      {mode === "menu" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="primary" disabled={!name} onClick={host}>Host a Private Room</Button>
          <div className="panel p-3">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Room code" maxLength={6}
              className="mb-2 w-full rounded-lg border border-fern/30 bg-black/40 px-3 py-2 text-center font-mono text-lg tracking-widest text-parchment" />
            <Button className="w-full" disabled={!name || joinCode.length < 4} onClick={join}>Join Room</Button>
          </div>
        </div>
      )}

      {mode !== "menu" && (
        <Panel title={mode === "host" ? "Hosting Room" : "Joined Room"}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-parchment/60">Room Code</div>
              <div className="font-mono text-3xl font-bold tracking-widest text-ember">{roomCode}</div>
            </div>
            <Badge color={status === "connected" ? "#8bab6a" : status === "error" ? "#c15a5a" : "#c79a4a"}>
              {status}
            </Badge>
          </div>
          <p className="mb-2 text-xs text-parchment/70">Share this code with up to four friends. Players in the room:</p>
          <ul className="space-y-1">
            {players.length === 0 && <li className="text-xs text-parchment/50">Waiting for players…</li>}
            {players.map((p, i) => (
              <li key={i} className="flex items-center justify-between rounded bg-black/25 px-2 py-1 text-sm">
                <span className="text-parchment">{p.name}</span>
                <span className="flex gap-1">
                  <Badge>{p.role}</Badge>
                  {p.isHost && <Badge color="#c76b3b">Host</Badge>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-lg bg-fern/10 p-2 text-[11px] text-fern">
            Live presence is connected — everyone in the room sees each other in real time. Empty roles are
            filled by NPCs. The host is the authoritative game-state owner and distributes random outcomes so
            clients never diverge. Starting a shared run launches from here.
          </div>
          <div className="mt-3 flex gap-2">
            {mode === "host" && (
              <Button variant="primary" className="flex-1" onClick={() => ctx.setScreen("newGame")}>
                Start Run (host)
              </Button>
            )}
            <Button onClick={() => { channelRef.current?.unsubscribe(); setMode("menu"); setPlayers([]); setStatus("idle"); }}>
              Leave Room
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
