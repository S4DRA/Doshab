import "server-only";
import { SignJWT, jwtVerify } from "jose";

export const sessionCookieName = "doshab_session";
export const sessionDurationSeconds = 30 * 24 * 60 * 60;
const renewAfterSeconds = 24 * 60 * 60;
type SessionPayload = { userId: string };

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt).setExpirationTime(issuedAt + sessionDurationSeconds).sign(getSessionSecret());
}

async function verifiedPayload(token: string, now = Date.now()) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"], currentDate: new Date(now) });
    return typeof payload.userId === "string" && typeof payload.iat === "number" && typeof payload.exp === "number" ? payload : null;
  } catch { return null; }
}

export async function verifySessionToken(token: string) {
  const payload = await verifiedPayload(token);
  return payload ? { userId: payload.userId as string } : null;
}

export async function renewSessionTokenIfNeeded(token: string, now = Date.now()) {
  const payload = await verifiedPayload(token, now);
  if (!payload) return null;
  const age = Math.floor(now / 1000) - (payload.iat as number);
  const originalLifetime = (payload.exp as number) - (payload.iat as number);
  if (age < renewAfterSeconds && originalLifetime >= sessionDurationSeconds) return null;
  return createSessionToken({ userId: payload.userId as string }, now);
}
