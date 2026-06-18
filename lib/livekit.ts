import "server-only";

import { AccessToken } from "livekit-server-sdk";

type LiveKitParticipant = {
  id: string;
  name: string;
  email: string;
};

export function getLiveKitConfig() {
  // Server-only: LIVEKIT_API_SECRET must never be exposed to browser bundles.
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return null;
  }

  return {
    livekitUrl,
    apiKey,
    apiSecret,
  };
}

export function createLiveKitRoomName(groupId: string, channelId: string) {
  return `doshab-group-${groupId}-channel-${channelId}`;
}

export async function createLiveKitToken({
  roomName,
  participant,
}: {
  roomName: string;
  participant: LiveKitParticipant;
}) {
  const config = getLiveKitConfig();

  if (!config) {
    return null;
  }

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: participant.id,
    name: participant.name || participant.email,
    metadata: JSON.stringify({
      email: participant.email,
    }),
    ttl: "2h",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    token: await token.toJwt(),
    livekitUrl: config.livekitUrl,
    roomName,
    participant: {
      id: participant.id,
      name: participant.name,
      email: participant.email,
    },
  };
}
