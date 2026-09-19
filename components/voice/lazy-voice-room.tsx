"use client";

import dynamic from "next/dynamic";

import { VoiceRoomLoading } from "@/components/ui/loading-states";

const VoiceRoom = dynamic(
  () =>
    import("@/components/voice/voice-room").then(
      (module) => module.VoiceRoom,
    ),
  {
    loading: () => <VoiceRoomLoading />,
    ssr: false,
  },
);

type LazyVoiceRoomProps = {
  channelId: string;
  channelName: string;
  groupId?: string;
};

export function LazyVoiceRoom(props: LazyVoiceRoomProps) {
  return <VoiceRoom {...props} />;
}
