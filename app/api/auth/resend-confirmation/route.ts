import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: Re-enable email verification/reset before production.
  return NextResponse.redirect(
    new URL(
      `/login?message=${encodeURIComponent(
        "Email verification is disabled for development. Log in to continue.",
      )}`,
      request.url,
    ),
    { status: 303 },
  );
}
