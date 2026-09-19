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
