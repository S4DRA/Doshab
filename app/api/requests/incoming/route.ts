import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security/permissions";

export async function GET() {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const incoming = await prisma.friendRequest.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({ incoming });
}



