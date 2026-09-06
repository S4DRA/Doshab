import { WebhookReceiver } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getLiveKitConfig } from "@/lib/livekit";
import { reconcileMusicMembership } from "@/lib/music/server";

export async function POST(request: NextRequest) {
  const config = getLiveKitConfig();
  if (!config) return NextResponse.json({ error: "LiveKit is not configured." }, { status: 503 });
  const body = await request.text();
  if (body.length > 1000000) return new NextResponse(null, { status: 413 });
  let event;
  try { event = await new WebhookReceiver(config.apiKey, config.apiSecret).receive(body, request.headers.get("authorization") ?? undefined); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 }); }
  try {
    if ((event.event === "participant_left" || event.event === "participant_joined") && event.room?.name) await reconcileMusicMembership(event.room.name);
    return NextResponse.json({ received: true });
  } catch {
    console.error("Music membership reconciliation failed");
    return NextResponse.json({ error: "Music reconciliation needs a retry." }, { status: 503 });
  }
}
