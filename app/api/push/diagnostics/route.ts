import { connection, NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { getPushConfigStatus } from "@/lib/push";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await connection();

  const auth = await getAuthState();

  if (auth.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, subscriptions] = await Promise.all([
    Promise.resolve(getPushConfigStatus()),
    prisma.pushSubscription.count({
      where: {
        userId: auth.user.id,
      },
    }),
  ]);

  return NextResponse.json({
    config,
    subscriptions,
  });
}
