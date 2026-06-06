"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

type FriendCallStatusResponse = {
  status?: string;
  call?: {
    expiresAt: string;
    friend: FriendPerson;
    isCaller: boolean;
    isReceiver: boolean;
    status: string;
  };
  error?: string;
};

type FriendCallRoomProps = {
  autoJoin?: boolean;
  callExpiredHint?: boolean;
  callId: string;
  incoming?: boolean;
};

type RoomState =
  | { kind: "checking" }
  | { kind: "incoming"; call: NonNullable<FriendCallStatusResponse["call"]> }
  | { kind: "joining"; call?: NonNullable<FriendCallStatusResponse["call"]> }
  | { kind: "unavailable"; call?: NonNullable<FriendCallStatusResponse["call"]>; message: string };

export function FriendCallRoom({
  autoJoin = false,
  callExpiredHint = false,
  callId,
  incoming = false,
}: FriendCallRoomProps) {
  const sessionId = `friend:${callId}`;
  const { activeCall, endedCallIds, startCall } = usePersistentCall();
  const router = useRouter();
  const activeHere = activeCall?.id === sessionId;
  const endedLocally = endedCallIds.has(sessionId);
  const [roomState, setRoomState] = useState<RoomState>(
    callExpiredHint || endedLocally
      ? { kind: "unavailable", message: "Call no longer available." }
      : { kind: "checking" },
  );
  const [declining, setDeclining] = useState(false);
  const loadedRef = useRef(false);
  const shouldAutoJoin = autoJoin || !incoming;

  const showUnavailable = useCallback((message: string, call?: NonNullable<FriendCallStatusResponse["call"]>) => {
    setRoomState({
      call,
      kind: "unavailable",
      message,
    });
  }, []);

  const joinCall = useCallback(async (call?: NonNullable<FriendCallStatusResponse["call"]>) => {
    setRoomState({
      call,
      kind: "joining",
    });

    try {
      const response = await fetch(`/api/friend-calls/${callId}/token`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as
        | (Partial<FriendCallTokenResponse> & { error?: string })
        | null;

      if (!response.ok || !data?.token || !data.livekitUrl || !data.roomName || !data.call) {
        const unavailableMessage =
          response.status === 410 || response.status === 409
            ? "Call no longer available."
            : data?.error ?? "Could not join this call.";

        showUnavailable(unavailableMessage, call);
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
      showUnavailable("Could not join this call.", call);
    }
  }, [callId, sessionId, showUnavailable, startCall]);

  useEffect(() => {
    if (activeHere || loadedRef.current) {
      return;
    }

    if (endedLocally) {
      return;
    }

    loadedRef.current = true;
    let cancelled = false;

    async function loadCall() {
      const response = await fetch(`/api/friend-calls/${callId}/status`, {
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as FriendCallStatusResponse | null;

      if (cancelled) {
        return;
      }

      if (!response?.ok || !data?.call) {
        showUnavailable("Call no longer available.");
        return;
      }

      if (data.status === "RINGING" && data.call.isReceiver && incoming && !autoJoin) {
        setRoomState({
          call: data.call,
          kind: "incoming",
        });
        return;
      }

      if (data.status === "RINGING" || data.status === "ACCEPTED") {
        if (shouldAutoJoin) {
          await joinCall(data.call);
          return;
        }

        setRoomState({
          call: data.call,
          kind: "incoming",
        });
        return;
      }

      showUnavailable("Call no longer available.", data.call);
    }

    void loadCall();

    return () => {
      cancelled = true;
    };
  }, [
    activeHere,
    autoJoin,
    callId,
    endedLocally,
    incoming,
    joinCall,
    shouldAutoJoin,
    showUnavailable,
  ]);

  async function declineCall() {
    if (declining) {
      return;
    }

    setDeclining(true);

    try {
      await fetch(`/api/friend-calls/${callId}/decline`, {
        method: "POST",
      });
      showUnavailable("Call declined.", roomState.kind === "incoming" ? roomState.call : undefined);
    } catch {
      showUnavailable("Call no longer available.", roomState.kind === "incoming" ? roomState.call : undefined);
    } finally {
      setDeclining(false);
    }
  }

  if (activeHere) {
    return <PersistentCallSurface sessionId={sessionId} />;
  }

  if (roomState.kind === "incoming") {
    return (
      <CallScreenPanel
        busy={declining}
        call={roomState.call}
        onAccept={() => void joinCall(roomState.call)}
        onBack={() => router.replace("/dashboard/messages")}
        onDecline={() => void declineCall()}
      />
    );
  }

  if (roomState.kind === "unavailable") {
    return (
      <UnavailableCallPanel
        call={roomState.call}
        message={roomState.message}
        onBack={() => router.replace("/dashboard/messages")}
      />
    );
  }

  return (
    <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b0f0b] p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          {roomState.kind === "joining" ? "Joining call" : "Checking call"}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          {roomState.kind === "joining" ? "Connecting to VAL voice" : "Opening call"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {roomState.kind === "joining"
            ? "Hang tight while the voice room connects."
            : "Verifying that this call is still available."}
        </p>
      </div>
    </div>
  );
}

function CallScreenPanel({
  busy,
  call,
  onAccept,
  onBack,
  onDecline,
}: {
  busy: boolean;
  call: NonNullable<FriendCallStatusResponse["call"]>;
  onAccept: () => void;
  onBack: () => void;
  onDecline: () => void;
}) {
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null);
  const friendLabel = call.friend.name || call.friend.email;

  useEffect(() => {
    acceptButtonRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="incoming-call-screen-title"
      className="grid min-h-0 flex-1 place-items-center px-4 py-6"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#FF5F25]/35 bg-[#070a12] p-6 text-center shadow-2xl shadow-black/45 sm:p-8">
        <div className="mx-auto grid w-fit place-items-center">
          <span className="absolute h-28 w-28 rounded-full bg-[#FF5F25]/20 motion-safe:animate-ping" />
          <AvatarInitials imageUrl={call.friend.image} size="lg" value={friendLabel} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Incoming voice call
        </p>
        <h1 id="incoming-call-screen-title" className="mt-3 truncate text-3xl font-bold text-white">
          {friendLabel}
        </h1>
        <p className="mt-2 text-sm text-slate-300">Private call on VAL</p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            className="app-button-danger h-14 rounded-lg px-4 text-base font-bold transition disabled:opacity-60"
            disabled={busy}
            onClick={onDecline}
            type="button"
          >
            {busy ? "Declining..." : "Decline"}
          </button>
          <button
            className="app-button-primary h-14 rounded-lg px-4 text-base font-bold transition disabled:opacity-60"
            disabled={busy}
            onClick={onAccept}
            ref={acceptButtonRef}
            type="button"
          >
            Accept
          </button>
        </div>
        <button
          className="mt-4 min-h-11 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
          onClick={onBack}
          type="button"
        >
          Back to messages
        </button>
      </div>
    </section>
  );
}

function UnavailableCallPanel({
  call,
  message,
  onBack,
}: {
  call?: NonNullable<FriendCallStatusResponse["call"]>;
  message: string;
  onBack: () => void;
}) {
  const friendLabel = call?.friend.name || call?.friend.email || "This call";

  return (
    <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b0f0b] p-6 text-center">
        {call?.friend ? (
          <AvatarInitials imageUrl={call.friend.image} size="lg" value={friendLabel} />
        ) : null}
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Missed call
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Call no longer available</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {message} {call?.friend ? `${friendLabel} may have stopped ringing or ended the call.` : ""}
        </p>
        <button
          className="app-button-primary mt-6 h-11 rounded-lg px-4 text-sm font-bold transition"
          onClick={onBack}
          type="button"
        >
          Back to messages
        </button>
      </div>
    </div>
  );
}
