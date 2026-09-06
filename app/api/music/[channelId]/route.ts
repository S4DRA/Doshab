import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeMusic, roomMusic } from "@/lib/music/server";
import { MusicError } from "@/lib/music/state";
import { rateLimit } from "@/lib/security/rate-limit";

const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.enum(["playNow", "addNext", "enqueue"]), trackId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/), provider: z.literal("youtube") }),
  z.object({ type: z.enum(["play", "pause", "restart", "next", "ended", "clear"]) }),
  z.object({ type: z.literal("seek"), position: z.number().finite().min(0).max(14400) }),
  z.object({ type: z.literal("autoplay"), enabled: z.boolean() }),
  z.object({ type: z.enum(["remove", "moveNext", "moveBottom"]), queueId: z.string().uuid() }),
  z.object({ type: z.literal("reorder"), queueIds: z.array(z.string().uuid()).max(30) }),
]);
const bodySchema = z.object({ command: commandSchema, commandId: z.string().uuid(), version: z.number().int().min(0), roomId: z.string().min(1).max(128) });
type Context = { params: Promise<{ channelId: string }> };

function failure(error: unknown) {
  if (error instanceof MusicError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Room music request failed", { name: error instanceof Error ? error.name : "UnknownError" });
  return NextResponse.json({ error: "Room music is temporarily unavailable." }, { status: 503 });
}

export async function GET(_request: NextRequest, { params }: Context) {
  const serverReceivedAt = Date.now();
  try { return NextResponse.json({ ...await roomMusic(await authorizeMusic((await params).channelId)), serverReceivedAt }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}

export async function POST(request: NextRequest, { params }: Context) {
  const serverReceivedAt = Date.now();
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) throw new MusicError("Invalid request origin.", 403);
    const input = bodySchema.safeParse(await request.json().catch(() => null));
    if (!input.success) throw new MusicError("Invalid music command.");
    const context = await authorizeMusic((await params).channelId);
    const limited = await rateLimit(request, { key: "music:command", identifiers: [context.user.id], limit: 90, windowMs: 60000 });
    if (limited) return limited;
    return NextResponse.json({ ...await roomMusic(context, input.data), serverReceivedAt });
  } catch (error) { return failure(error); }
}
