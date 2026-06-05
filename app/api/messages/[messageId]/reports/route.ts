import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getMessageAccess } from "@/lib/community-permissions";
import { prisma } from "@/lib/prisma";

const reportReasons = ["SPAM", "HARASSMENT", "HATE_OR_ABUSE", "NSFW", "OTHER"] as const;

type ReportReason = (typeof reportReasons)[number];

type ReportRouteProps = {
  params: Promise<{
    messageId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: ReportRouteProps) {
  const user = await getCurrentUser();
  const { messageId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getMessageAccess(messageId, user.id);

  if (!access) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    details?: unknown;
    reason?: unknown;
  } | null;
  const reason = typeof body?.reason === "string" ? body.reason : "";

  if (!reportReasons.includes(reason as ReportReason)) {
    return NextResponse.json({ error: "Choose a report reason." }, { status: 400 });
  }

  const details = typeof body?.details === "string"
    ? body.details.trim().slice(0, 600)
    : "";

  await prisma.messageReport.create({
    data: {
      channelId: access.channelId,
      details: details || null,
      groupId: access.channel.groupId,
      messageId,
      reason: reason as ReportReason,
      reporterId: user.id,
    },
  });

  return NextResponse.json({ message: "Report sent." }, { status: 201 });
}
