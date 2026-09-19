"use client";

import { useRef, useState } from "react";
import { MediaClient } from "@/lib/media/media-client";

export function MediasoupDiagnostic() {
  const client = useRef<MediaClient | null>(null); const [state, setState] = useState("Idle");
  async function run() {
    const response = await fetch("/api/media/voice-token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ channelId: new URLSearchParams(window.location.search).get("channelId") }) });
    const credential = await response.json() as { signalingRoomId?: string; participant?: { id: string; name: string; email: string }; roomId?: string; error?: string };
    if (!response.ok || !credential.signalingRoomId || !credential.participant || !credential.roomId) throw new Error(credential.error ?? "A voice channel ID is required.");
    client.current = new MediaClient(); client.current.subscribe(() => setState(client.current?.snapshot().state ?? "Disconnected")); await client.current.connect({ participant: credential.participant, signalingRoomId: credential.signalingRoomId }); await client.current.start("mic", true);
  }
  return <main className="p-10 text-white"><h1 className="text-xl font-bold">VAL voice diagnostic</h1><p className="mt-2 text-sm text-slate-400">Development only. Add <code>?channelId=...</code> for a voice channel you can access.</p><p className="mt-4">State: {state}</p><button className="app-button-primary mt-4 h-10 rounded-lg px-4" onClick={() => void run().catch((error: unknown) => setState(error instanceof Error ? error.message : "Failed"))} type="button">Join and publish microphone</button><button className="app-button-secondary ml-2 h-10 rounded-lg px-4" onClick={() => void client.current?.leave()} type="button">Leave</button></main>;
}
