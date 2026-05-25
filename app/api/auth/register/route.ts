import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/register?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!name) {
    return redirectWithError(request, "Name is required.");
  }

  if (!isValidEmail(email)) {
    return redirectWithError(request, "Enter a valid email address.");
  }

  if (!isValidPassword(password)) {
    return redirectWithError(request, "Password must be at least 8 characters.");
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return redirectWithError(request, "An account with that email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
  } catch {
    return redirectWithError(request, "Authentication is temporarily unavailable.");
  }

  return NextResponse.redirect(new URL("/login?registered=1", request.url), {
    status: 303,
  });
}
