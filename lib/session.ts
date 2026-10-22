import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { createSessionToken, verifySessionToken, sessionCookieName, sessionDurationSeconds } from "@/lib/session-token";
export { createSessionToken, verifySessionToken, sessionCookieName } from "@/lib/session-token";
const sessionDurationMs = sessionDurationSeconds * 1000;

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken({ userId });
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + sessionDurationMs),
    maxAge: sessionDurationSeconds,
  });
}

export async function setSessionCookieOnResponse(
  response: NextResponse,
  userId: string,
) {
  const token = await createSessionToken({ userId });

  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + sessionDurationMs),
    maxAge: sessionDurationSeconds,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
