import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { canManageSpace } from "@/lib/community-permissions";
import { prisma } from "@/lib/prisma";

const reportStatuses = ["OPEN", "REVIEWED", "DISMISSED"] as const;

type ReportStatus = (typeof reportStatuses)[number];

type GroupReportsRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

async function getModeratorMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  return canManageSpace(membership?.role) ? membership : null;
}

export async function GET(_request: NextRequest, { params }: GroupReportsRouteProps) {
  const user = await getCurrentUser();
  const { groupId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getModeratorMembership(groupId, user.id);

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
  const user = await getCurrentUser();
  const { groupId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getModeratorMembership(groupId, user.id);

  if (!membership) {
    return NextResponse.json({ error: "Only owners and admins can review reports." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    reportId?: unknown;
    status?: unknown;
  } | null;
  const reportId = typeof body?.reportId === "string" ? body.reportId : "";
  const status = typeof body?.status === "string" ? body.status : "";

  if (!reportId || !reportStatuses.includes(status as ReportStatus)) {
    return NextResponse.json({ error: "Choose a valid report status." }, { status: 400 });
  }

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

  return NextResponse.json({ message: "Report updated." });
}
