import "server-only";
import { createHmac } from "node:crypto";
export function createMediaCredential(payload: { userId: string; roomId: string; metadata: { name: string; email: string } }) { const secret = process.env.MEDIA_AUTH_SECRET; if (!secret || secret.length < 32) return null; const encoded = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 5 * 60_000 })).toString("base64url"); return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`; }
export function mediaServerUrl() { return process.env.NEXT_PUBLIC_MEDIA_SERVER_URL ?? "http://localhost:3001"; }
