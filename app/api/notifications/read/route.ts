import { NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      readAt: null,
      userId: auth.user.id,
    },
    data: {
      readAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
