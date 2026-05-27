import { NextResponse } from "next/server";

import { sendPushNotifications } from "@/lib/push";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendPushNotifications({
    body: "Phone alerts are working.",
    href: "/dashboard",
    recipientIds: [session.userId],
    title: "Doshab test notification",
  });

  return NextResponse.json({ ok: true });
}
