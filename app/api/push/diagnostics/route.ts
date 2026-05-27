import { connection, NextResponse } from "next/server";

import { getPushConfigStatus } from "@/lib/push";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  await connection();

  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, subscriptions] = await Promise.all([
    Promise.resolve(getPushConfigStatus()),
    prisma.pushSubscription.count({
      where: {
        userId: session.userId,
      },
    }),
  ]);

  return NextResponse.json({
    config,
    subscriptions,
  });
}
