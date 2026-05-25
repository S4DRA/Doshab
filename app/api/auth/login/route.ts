import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || !password) {
    return redirectWithError(request, "Enter a valid email and password.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return redirectWithError(request, "Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return redirectWithError(request, "Invalid email or password.");
    }

    await setSessionCookie(user.id);
  } catch {
    return redirectWithError(request, "Authentication is temporarily unavailable.");
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), {
    status: 303,
  });
}
