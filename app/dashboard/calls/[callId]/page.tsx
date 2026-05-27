import { FriendCallRoom } from "@/components/calls/friend-call-room";

type FriendCallPageProps = {
  params: Promise<{
    callId: string;
  }>;
};

export default async function FriendCallPage({ params }: FriendCallPageProps) {
  const { callId } = await params;

  return (
    <main className="flex h-[100dvh] min-h-0 bg-[#070907]/95 text-slate-100">
      <FriendCallRoom callId={callId} />
    </main>
  );
}
