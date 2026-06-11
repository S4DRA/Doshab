import { NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getAuthState({ includeImage: true });

  if (auth.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = auth.user.id;

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

