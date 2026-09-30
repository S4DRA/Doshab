import "server-only";
import { createHmac } from "node:crypto";

export function createMediaSignalingRoom(roomId: string) {
  const secret = process.env.MEDIA_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    return null;
  }

  return createHmac("sha256", secret)
    .update(`val-realtime:${roomId}`)
    .digest("base64url");
}

export function createMediaIceServers(userId: string): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  const urls = process.env.MEDIA_TURN_URLS?.split(/[\s,]+/).filter(Boolean) ?? [];
  const secret = process.env.MEDIA_TURN_SECRET;
  if (!urls.length && !secret) return servers;
  if (!secret || !urls.length || urls.some((url) => !/^turns?:[^\s]+$/.test(url))) {
    throw new Error("TURN relay configuration is incomplete.");
  }
  // TURN REST authentication: send expiring credentials, never the shared server secret.
  const username = `${Math.floor(Date.now() / 1000) + 86_400}:${userId}`;
  const credential = createHmac("sha1", secret).update(username).digest("base64");
  return [...servers, { urls, username, credential }];
}
