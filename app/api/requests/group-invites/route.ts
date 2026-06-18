import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security/permissions";

export async function GET() {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const invites = await prisma.groupInvite.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isDirectMessage: true,
          channels: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          members: {
            select: {
              id: true,
              role: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ invites });
}

