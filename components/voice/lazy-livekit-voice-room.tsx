"use client";

import dynamic from "next/dynamic";

const LiveKitVoiceRoom = dynamic(
  () =>
    import("@/components/voice/livekit-voice-room").then(
      (module) => module.LiveKitVoiceRoom,
    ),
  {
    loading: () => (
      <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
        <section className="w-full max-w-2xl rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-sm font-semibold text-white">Loading voice room...</p>
        </section>
      </div>
    ),
    ssr: false,
  },
);

type LazyLiveKitVoiceRoomProps = {
  channelId: string;
  channelName: string;
};

export function LazyLiveKitVoiceRoom(props: LazyLiveKitVoiceRoomProps) {
  return <LiveKitVoiceRoom {...props} />;
}
