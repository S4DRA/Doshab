import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security/permissions";

export async function GET() {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const [incomingCount, outgoingCount] = await Promise.all([
    prisma.friendRequest.count({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
    }),
    prisma.friendRequest.count({
      where: {
        senderId: userId,
        status: "PENDING",
      },
    }),
  ]);

  return NextResponse.json({
    incomingCount,
    outgoingCount,
    totalCount: incomingCount + outgoingCount,
  });
}

