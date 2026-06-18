import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  auditSecurityEvent,
  requireAuth,
  requireGroupRole,
} from "@/lib/security/permissions";

const reportStatuses = ["OPEN", "REVIEWED", "DISMISSED"] as const;

type ReportStatus = (typeof reportStatuses)[number];
const reportReviewSchema = z.object({
  reportId: z.string().trim().min(1).max(128),
  status: z.enum(reportStatuses),
});

type GroupReportsRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: GroupReportsRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { groupId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await requireGroupRole(user.id, groupId, ["OWNER", "ADMIN"]).catch(() => null);

  if (!membership) {
    return NextResponse.json({ error: "Only owners and admins can view reports." }, { status: 403 });
  }

  const reports = await prisma.messageReport.findMany({
    where: {
      groupId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      channel: {
        select: {
          name: true,
        },
      },
      createdAt: true,
      details: true,
      id: true,
      message: {
        select: {
          content: true,
          id: true,
          sender: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
      reason: true,
      reporter: {
        select: {
          email: true,
          name: true,
        },
      },
      status: true,
    },
  });

  return NextResponse.json({ reports });
}

export async function PATCH(request: NextRequest, { params }: GroupReportsRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { groupId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await requireGroupRole(user.id, groupId, ["OWNER", "ADMIN"]).catch(() => null);

  if (!membership) {
    return NextResponse.json({ error: "Only owners and admins can review reports." }, { status: 403 });
  }

  const parsed = reportReviewSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid report status." }, { status: 400 });
  }

  const { reportId, status } = parsed.data;

  const report = await prisma.messageReport.updateMany({
    where: {
      groupId,
      id: reportId,
    },
    data: {
      reviewedAt: new Date(),
      reviewedById: user.id,
      status: status as ReportStatus,
    },
  });

  if (!report.count) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  await auditSecurityEvent(
    "message-report.review",
    {
      actorId: user.id,
      groupId,
      reportId,
    },
    request,
  );

  return NextResponse.json({ message: "Report updated." });
}
