"use client";

import dynamic from "next/dynamic";

import { VoiceRoomLoading } from "@/components/ui/loading-states";

const LiveKitVoiceRoom = dynamic(
  () =>
    import("@/components/voice/livekit-voice-room").then(
      (module) => module.LiveKitVoiceRoom,
    ),
  {
    loading: () => <VoiceRoomLoading />,
    ssr: false,
  },
);

type LazyLiveKitVoiceRoomProps = {
  channelId: string;
  channelName: string;
  groupId?: string;
};

export function LazyLiveKitVoiceRoom(props: LazyLiveKitVoiceRoomProps) {
  return <LiveKitVoiceRoom {...props} />;
}
