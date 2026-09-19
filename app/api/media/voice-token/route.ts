import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createMediaCredential, mediaServerUrl } from "@/lib/media/credential";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const payload = await request.json().catch(() => null) as { channelId?: unknown } | null; const channelId = typeof payload?.channelId === "string" ? payload.channelId : "";
  if (!channelId) return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  const channel = await prisma.channel.findFirst({ where: { id: channelId, type: "VOICE", group: { members: { some: { userId: user.id } } } }, select: { id: true, groupId: true } });
  if (!channel) return NextResponse.json({ error: "You do not have access to this voice room." }, { status: 403 });
  const roomId = `space:${channel.groupId}:channel:${channel.id}`; const credential = createMediaCredential({ roomId, userId: user.id, metadata: { name: user.name, email: user.email } });
  if (!credential) return NextResponse.json({ error: "Media credentials are not configured." }, { status: 503 });
  return NextResponse.json({ credential, mediaServerUrl: mediaServerUrl(), roomId });
}
