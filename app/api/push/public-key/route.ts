import { connection, NextResponse } from "next/server";

import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  await connection();

  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: "Missing VAPID public key" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    publicKey,
  });
}
