import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const call = await prisma.friendCall.findFirst({
    where: {
      expiresAt: {
        gt: new Date(),
      },
      receiverId: user.id,
      status: "RINGING",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      caller: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({ call });
}
