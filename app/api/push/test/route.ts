import { NextResponse } from "next/server";

import { getPushConfigStatus, sendPushNotifications } from "@/lib/push";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
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

  if (!config.hasPublicKey || !config.hasPrivateKey) {
    return NextResponse.json(
      {
        config,
        error: "Push is not configured on this server.",
        subscriptions,
      },
      { status: 500 },
    );
  }

  if (!subscriptions) {
    return NextResponse.json(
      {
        config,
        error: "This account has no saved push subscription.",
        subscriptions,
      },
      { status: 409 },
    );
  }

  await sendPushNotifications({
    body: "Phone alerts are working.",
    href: "/dashboard",
    recipientIds: [session.userId],
    title: "Doshab test notification",
  });

  return NextResponse.json({ config, ok: true, subscriptions });
}
