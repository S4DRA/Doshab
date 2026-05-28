"use client";

import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type PersistentCallSession = {
  href?: string;
  id: string;
  kind: "friend" | "group";
  title: string;
  subtitle?: string;
  token: string;
  livekitUrl: string;
  roomName: string;
  endUrl?: string;
  statusUrl?: string;
};

type PersistentCallContextValue = {
  activeCall: PersistentCallSession | null;
  endCall: () => void;
  poppedOut: boolean;
  setPoppedOut: (poppedOut: boolean) => void;
  startCall: (session: PersistentCallSession) => void;
};

const PersistentCallContext = createContext<PersistentCallContextValue | null>(null);

export function PersistentCallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<PersistentCallSession | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [poppedOut, setPoppedOut] = useState(false);
  const pathname = usePathname();

  const postEnd = useCallback((session: PersistentCallSession | null) => {
    if (session?.endUrl) {
      void fetch(session.endUrl, { method: "POST" }).catch(() => null);
    }
  }, []);

  const endCall = useCallback(() => {
    setActiveCall((current) => {
      postEnd(current);
      return null;
    });
    setPoppedOut(false);
  }, [postEnd]);

  const startCall = useCallback(
    (session: PersistentCallSession) => {
      setActiveCall((current) => {
        if (current && current.id !== session.id) {
          postEnd(current);
        }

        return session;
      });
      setExpanded(true);
      setPoppedOut(false);
    },
    [postEnd],
  );

  useEffect(() => {
    if (!activeCall?.statusUrl) {
      return;
    }

    const timer = window.setInterval(async () => {
      const response = await fetch(activeCall.statusUrl ?? "").catch(() => null);

      if (!response?.ok) {
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        status?: string;
      } | null;

      if (data?.status === "DECLINED" || data?.status === "MISSED" || data?.status === "ENDED") {
        setActiveCall(null);
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activeCall?.statusUrl]);

  const value = useMemo(
    () => ({
      activeCall,
      endCall,
      poppedOut,
      setPoppedOut,
      startCall,
    }),
    [activeCall, endCall, poppedOut, startCall],
  );
  const showDock = Boolean(activeCall && (poppedOut || !isActiveCallPage(activeCall, pathname)));

  return (
    <PersistentCallContext.Provider value={value}>
      {activeCall ? (
        <LiveKitRoom
          audio
          className="contents"
          connect
          data-lk-theme="default"
          key={activeCall.id}
          onDisconnected={endCall}
          serverUrl={activeCall.livekitUrl}
          token={activeCall.token}
          video={activeCall.kind === "group"}
        >
          <RoomAudioRenderer />
          {children}
          {showDock ? (
            <ActiveCallDock
              expanded={expanded}
              onEnd={endCall}
              onToggle={() => setExpanded((current) => !current)}
              onUnpop={() => setPoppedOut(false)}
              session={activeCall}
            />
          ) : null}
        </LiveKitRoom>
      ) : (
        children
      )}
    </PersistentCallContext.Provider>
  );
}

export function usePersistentCall() {
  const context = useContext(PersistentCallContext);

  if (!context) {
    throw new Error("usePersistentCall must be used inside PersistentCallProvider.");
  }

  return context;
}

function ActiveCallDock({
  expanded,
  onEnd,
  onToggle,
  onUnpop,
  session,
}: {
  expanded: boolean;
  onEnd: () => void;
  onToggle: () => void;
  onUnpop: () => void;
  session: PersistentCallSession;
}) {
  return (
    <section className="fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] right-3 z-[60] w-[calc(100vw-1.5rem)] max-w-md overflow-hidden rounded-xl border border-[#FF5F25]/40 bg-[#070a12] shadow-2xl shadow-black/50 sm:bottom-4 sm:right-4">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
            {session.kind === "friend" ? "Friend call" : "Voice room"}
          </p>
          <h2 className="truncate text-sm font-semibold text-white">{session.title}</h2>
          {session.subtitle ? (
            <p className="truncate text-xs text-slate-400">{session.subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            aria-label="Open call page"
            className="app-icon-button h-8 w-8"
            href={getCallHref(session)}
            onClick={onUnpop}
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 3h6v6" />
              <path d="m10 14 11-11" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          </Link>
          <button
            aria-label={expanded ? "Minimize call" : "Expand call"}
            className="app-icon-button h-8 w-8"
            onClick={onToggle}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {expanded ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
            </svg>
          </button>
          <button
            className="h-8 rounded-lg border border-red-400/40 px-3 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
            onClick={onEnd}
            type="button"
          >
            End
          </button>
        </div>
      </div>
      {expanded ? (
        <>
          <div className="max-h-[45vh] min-h-48 p-3">
            <PersistentCallParticipants />
          </div>
          <div className="border-t border-white/10 px-3 py-3">
            <ControlBar
              controls={{
                microphone: true,
                camera: session.kind === "group",
                screenShare: true,
                chat: false,
                settings: false,
                leave: true,
              }}
              saveUserChoices={false}
              variation="minimal"
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

export function PersistentCallSurface({
  sessionId,
}: {
  sessionId: string;
}) {
  const { activeCall, endCall, poppedOut, setPoppedOut } = usePersistentCall();

  if (!activeCall || activeCall.id !== sessionId) {
    return null;
  }

  if (poppedOut) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
        <section className="app-panel w-full max-w-md p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            {activeCall.kind === "friend" ? "Friend call" : "Voice room"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{activeCall.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This call is popped out. You can keep moving around the dashboard.
          </p>
          <button
            className="app-button-primary mt-6 h-10 rounded-lg px-4 text-sm font-semibold transition"
            onClick={() => setPoppedOut(false)}
            type="button"
          >
            Return to full call
          </button>
        </section>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#050705] px-3 py-3 sm:px-5 sm:py-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b0f0b] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            {activeCall.kind === "friend" ? "Friend call" : "Voice room"}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-white">{activeCall.title}</h2>
          {activeCall.subtitle ? (
            <p className="mt-1 truncate text-xs text-slate-400">{activeCall.subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="app-button-secondary h-9 rounded-lg px-3 text-xs font-semibold transition"
            onClick={() => setPoppedOut(true)}
            type="button"
          >
            Pop out
          </button>
          <button
            className="h-9 rounded-lg border border-red-400/40 px-3 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
            onClick={endCall}
            type="button"
          >
            End
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black">
        <PersistentCallParticipants showScreenShareFocus />
      </div>
      <div className="mt-3 shrink-0 rounded-xl border border-white/10 bg-[#0b0f0b] px-3 py-3">
        <ControlBar
          controls={{
            microphone: true,
            camera: activeCall.kind === "group",
            screenShare: true,
            chat: false,
            settings: false,
            leave: true,
          }}
          saveUserChoices={false}
          variation="minimal"
        />
      </div>
    </section>
  );
}

function PersistentCallParticipants({
  showScreenShareFocus = false,
}: {
  showScreenShareFocus?: boolean;
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );
  const screenShareTracks = tracks.filter(
    (track) => getTrackSource(track) === Track.Source.ScreenShare,
  );
  const participantTracks = tracks.filter(
    (track) => getTrackSource(track) !== Track.Source.ScreenShare,
  );

  if (!tracks.length) {
    return (
      <div className="grid h-full min-h-40 place-items-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
        Waiting for participants.
      </div>
    );
  }

  if (showScreenShareFocus && screenShareTracks.length) {
    const [focusedShare, ...otherShares] = screenShareTracks;
    const secondaryTracks = [...otherShares, ...participantTracks];

    return (
      <div className="flex h-full min-h-0 flex-col gap-2 bg-[#050705] p-2">
        <div className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-lg border border-[#FF5F25]/30 bg-[#070a12]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <p className="truncate text-xs font-semibold text-white">
              {getParticipantLabel(focusedShare)} is sharing
            </p>
            <span className="rounded-full border border-[#FF5F25]/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFB199]">
              Live screen
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <ParticipantTile className="h-full rounded-none" trackRef={focusedShare} />
          </div>
        </div>
        {secondaryTracks.length ? (
          <GridLayout
            className="min-h-28 flex-[1] rounded-lg bg-[#0b1020] p-2"
            tracks={secondaryTracks}
          >
            <ParticipantTile />
          </GridLayout>
        ) : null}
      </div>
    );
  }

  return (
    <GridLayout className="h-full min-h-40 rounded-lg bg-[#0b1020] p-2" tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}

type PersistentTrack = ReturnType<typeof useTracks>[number];

function getTrackSource(track: PersistentTrack) {
  return track.publication?.source ?? track.source;
}

function getParticipantLabel(track: PersistentTrack) {
  return track.participant.name || track.participant.identity || "Someone";
}

function isActiveCallPage(session: PersistentCallSession, pathname: string) {
  if (session.kind === "friend") {
    return pathname === getCallHref(session);
  }

  const channelId = session.id.replace(/^group:/, "");
  return pathname.endsWith(`/channels/${channelId}`);
}

function getCallHref(session: PersistentCallSession) {
  if (session.href) {
    return session.href;
  }

  if (session.kind === "friend") {
    return `/dashboard/calls/${session.id.replace(/^friend:/, "")}`;
  }

  const parts = session.roomName.split("-");
  const groupId = parts[2];
  const channelId = session.id.replace(/^group:/, "");

  return groupId ? `/dashboard/groups/${groupId}/channels/${channelId}` : "/dashboard/channels";
}
