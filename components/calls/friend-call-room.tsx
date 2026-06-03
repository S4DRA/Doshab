"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  PersistentCallSurface,
  usePersistentCall,
} from "@/components/calls/persistent-call-provider";
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
  const sessionId = `friend:${callId}`;
  const { activeCall, endedCallIds, startCall } = usePersistentCall();
  const loadedRef = useRef(false);
  const router = useRouter();
  const activeHere = activeCall?.id === sessionId;
  const endedLocally = endedCallIds.has(sessionId);

  useEffect(() => {
    if (endedLocally && !activeHere) {
      router.replace("/dashboard/messages");
    }
  }, [activeHere, endedLocally, router]);

  useEffect(() => {
    if (loadedRef.current || activeHere || endedLocally) {
      return;
    }

    loadedRef.current = true;
    let cancelled = false;

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

        if (cancelled) {
          return;
        }

        startCall({
          endUrl: `/api/friend-calls/${callId}/end`,
          href: `/dashboard/calls/${callId}`,
          id: sessionId,
          kind: "friend",
          livekitUrl: data.livekitUrl,
          roomName: data.roomName,
          statusUrl: `/api/friend-calls/${callId}/status`,
          subtitle: "Private call",
          title: data.call.friend.name || data.call.friend.email,
          token: data.token,
        });
      } catch {
        if (cancelled) {
          return;
        }

        router.replace("/dashboard/messages");
      }
    }

    void joinCall();

    return () => {
      cancelled = true;
    };
  }, [activeHere, callId, endedLocally, router, sessionId, startCall]);

  return activeHere ? <PersistentCallSurface sessionId={sessionId} /> : null;
}
