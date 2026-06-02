import { NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { getPushConfigStatus, sendPushNotifications } from "@/lib/push";
import { prisma } from "@/lib/prisma";

export async function POST() {
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
    recipientIds: [auth.user.id],
    title: "Doshab test notification",
  });

  return NextResponse.json({ config, ok: true, subscriptions });
}
