import { FriendCallRoom } from "@/components/calls/friend-call-room";

type FriendCallPageProps = {
  params: Promise<{
    callId: string;
  }>;
  searchParams?: Promise<{
    autoJoin?: string;
    callExpired?: string;
    incoming?: string;
  }>;
};

export default async function FriendCallPage({ params, searchParams }: FriendCallPageProps) {
  const { callId } = await params;
  const query = await searchParams;

  return (
    <main className="flex h-full min-h-0 bg-[#070907]/95 text-slate-100 sm:h-auto sm:min-h-[100dvh]">
      <FriendCallRoom
        autoJoin={query?.autoJoin === "1"}
        callExpiredHint={query?.callExpired === "1"}
        callId={callId}
        incoming={query?.incoming === "1"}
      />
    </main>
  );
}
