"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  PersistentCallSurface,
  usePersistentCall,
} from "@/components/calls/persistent-call-provider";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { FriendPerson } from "@/types";

type FriendCallTokenResponse = {
  token: string;
  livekitUrl: string;
  roomName: string;
  call: {
    id: string;
    friend: FriendPerson;
    status: string;
  };
};

type FriendCallRoomProps = {
  callId: string;
};

export function FriendCallRoom({ callId }: FriendCallRoomProps) {
  const { activeCall, startCall } = usePersistentCall();
  const [friend, setFriend] = useState<FriendPerson | null>(null);
  const [error, setError] = useState("");
  const [hasJoinedOnce, setHasJoinedOnce] = useState(false);
  const loadedRef = useRef(false);
  const activeHere = activeCall?.id === `friend:${callId}`;
  const callEnded = hasJoinedOnce && !activeHere && !error && Boolean(friend);

  useEffect(() => {
    if (loadedRef.current || activeHere) {
      return;
    }

    loadedRef.current = true;

    async function joinCall() {
      try {
        const response = await fetch(`/api/friend-calls/${callId}/token`, {
          method: "POST",
        });
        const data = (await response.json().catch(() => null)) as
          | (Partial<FriendCallTokenResponse> & { error?: string })
          | null;

        if (!response.ok || !data?.token || !data.livekitUrl || !data.roomName || !data.call) {
          throw new Error(data?.error ?? "Could not join this call.");
        }

        setFriend(data.call.friend);
        setHasJoinedOnce(true);
        startCall({
          endUrl: `/api/friend-calls/${callId}/end`,
          href: `/dashboard/calls/${callId}`,
          id: `friend:${callId}`,
          kind: "friend",
          livekitUrl: data.livekitUrl,
          roomName: data.roomName,
          statusUrl: `/api/friend-calls/${callId}/status`,
          subtitle: "Private call",
          title: data.call.friend.name || data.call.friend.email,
          token: data.token,
        });
      } catch (joinError) {
        setError(joinError instanceof Error ? joinError.message : "Could not join this call.");
      }
    }

    void joinCall();
  }, [activeHere, callId, startCall]);

  return (
    activeHere ? (
      <PersistentCallSurface sessionId={`friend:${callId}`} />
    ) : (
    <div className="grid min-h-0 flex-1 place-items-center px-4 py-8">
      <section className="app-panel w-full max-w-md p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Friend call
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          {error ? "Call unavailable" : callEnded ? "Call ended" : activeHere ? "Call running" : "Joining call..."}
        </h1>
        {friend ? (
          <div className="mt-5 flex items-center justify-center gap-3">
            <AvatarInitials
              imageUrl={friend.image}
              value={friend.name || friend.email}
            />
            <p className="min-w-0 truncate text-sm font-semibold text-white">
              {friend.name || friend.email}
            </p>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p> : null}
        {!error ? (
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {callEnded ? "You left the call. It will not reconnect unless you start or answer a new call." : "Connecting the call..."}
          </p>
        ) : null}
        <Link
          className="app-button-secondary mt-6 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
          href="/dashboard/messages"
        >
          Back to messages
        </Link>
      </section>
    </div>
    )
  );
}
