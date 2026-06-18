import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, requireAuth, requireMessageAccess } from "@/lib/security/permissions";

const reportReasons = ["SPAM", "HARASSMENT", "HATE_OR_ABUSE", "NSFW", "OTHER"] as const;

type ReportReason = (typeof reportReasons)[number];
const reportSchema = z.object({
  details: z.string().max(600).optional(),
  reason: z.enum(reportReasons),
});

type ReportRouteProps = {
  params: Promise<{
    messageId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: ReportRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { messageId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await requireMessageAccess(user.id, messageId).catch(() => null);

  if (!access) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const parsed = reportSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a report reason." }, { status: 400 });
  }

  const reason = parsed.data.reason;
  const details = parsed.data.details?.trim() ?? "";

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

  await auditSecurityEvent(
    "message.report",
    {
      actorId: user.id,
      groupId: access.channel.groupId,
      messageId,
    },
    request,
  );

  return NextResponse.json({ message: "Report sent." }, { status: 201 });
}
