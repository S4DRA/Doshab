"use client";

import {
  ControlBar,
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
  useRef,
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
    <section className="fixed inset-x-3 bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] z-[60] max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] overflow-x-hidden overflow-y-auto rounded-xl border border-[#FF5F25]/40 bg-[#070a12] shadow-2xl shadow-black/50 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(28rem,calc(100vw-2rem))]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
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
          <div className="min-h-0 max-h-[min(45dvh,24rem)] overflow-hidden p-3">
            <PersistentCallParticipants />
          </div>
          <div className="overflow-x-auto border-t border-white/10 px-3 py-3">
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
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#050705] px-2 py-2 sm:px-4 sm:py-3">
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0b0f0b] px-3 py-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            {activeCall.kind === "friend" ? "Friend call" : "Voice room"}
          </p>
          <h2 className="mt-0.5 truncate text-base font-semibold text-white">{activeCall.title}</h2>
          {activeCall.subtitle ? (
            <p className="truncate text-[11px] text-slate-400">{activeCall.subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            className="app-button-secondary h-8 rounded-lg px-3 text-xs font-semibold transition"
            onClick={() => setPoppedOut(true)}
            type="button"
          >
            Pop out
          </button>
          <button
            className="h-8 rounded-lg border border-red-400/40 px-3 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
            onClick={endCall}
            type="button"
          >
            End
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black">
        <PersistentCallParticipants showScreenShareFocus />
      </div>
      <div className="mt-2 shrink-0 overflow-x-auto rounded-lg border border-white/10 bg-[#0b0f0b] px-2 py-2">
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
  const [focusedTrackKey, setFocusedTrackKey] = useState<string | null>(null);
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );
  const orderedTracks = useMemo(
    () =>
      [...tracks].sort((first, second) => {
        const firstIsShare = getTrackSource(first) === Track.Source.ScreenShare;
        const secondIsShare = getTrackSource(second) === Track.Source.ScreenShare;

        if (firstIsShare !== secondIsShare) {
          return firstIsShare ? -1 : 1;
        }

        return getParticipantLabel(first).localeCompare(getParticipantLabel(second));
      }),
    [tracks],
  );
  const focusedTrack = orderedTracks.find((track) => getTrackKey(track) === focusedTrackKey);

  if (!tracks.length) {
    return (
      <div className="grid h-full min-h-0 place-items-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
        Waiting for participants.
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#050705] p-3">
      {showScreenShareFocus && focusedTrack ? (
        <FocusedCallCard
          onClose={() => setFocusedTrackKey(null)}
          track={focusedTrack}
        />
      ) : null}
      <div className="flex flex-wrap content-start justify-center gap-3">
        {orderedTracks.map((track) => (
          <SmallCallCard
            active={getTrackKey(track) === focusedTrackKey}
            key={getTrackKey(track)}
            onSelect={() => setFocusedTrackKey(getTrackKey(track))}
            track={track}
          />
        ))}
      </div>
    </div>
  );
}

type PersistentTrack = ReturnType<typeof useTracks>[number];

function FocusedCallCard({
  onClose,
  track,
}: {
  onClose: () => void;
  track: PersistentTrack;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isShare = getTrackSource(track) === Track.Source.ScreenShare;

  useEffect(() => {
    const updateFullscreenElement = () => {
      setIsFullscreen(Boolean(cardRef.current && document.fullscreenElement === cardRef.current));
    };

    updateFullscreenElement();
    document.addEventListener("fullscreenchange", updateFullscreenElement);

    return () => document.removeEventListener("fullscreenchange", updateFullscreenElement);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = cardRef.current;

    if (!element) {
      return;
    }

    if (document.fullscreenElement === element) {
      void document.exitFullscreen().catch(() => null);
      return;
    }

    void element.requestFullscreen().catch(() => null);
  }, []);

  return (
    <section
      className="mx-auto mb-3 flex h-[clamp(14rem,48dvh,34rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[#FF5F25]/40 bg-[#070a12] fullscreen:h-screen fullscreen:max-w-none fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-black"
      ref={cardRef}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            {getParticipantLabel(track)}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFB199]">
            {isShare ? "Screen share" : "Participant"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen card"}
            className="app-icon-button h-8 w-8"
            onClick={toggleFullscreen}
            type="button"
          >
            <FullscreenIcon active={isFullscreen} />
          </button>
          <button
            aria-label="Close large card"
            className="app-icon-button h-8 w-8"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CallCardContent focused track={track} />
      </div>
    </section>
  );
}

function SmallCallCard({
  active,
  onSelect,
  track,
}: {
  active: boolean;
  onSelect: () => void;
  track: PersistentTrack;
}) {
  const isShare = getTrackSource(track) === Track.Source.ScreenShare;

  return (
    <div
      aria-label={`${isShare ? "Screen share" : "Participant"} card for ${getParticipantLabel(track)}`}
      aria-pressed={active}
      className={`group relative h-[clamp(20rem,26vw,24rem)] w-[clamp(30rem,40vw,36rem)] cursor-pointer overflow-hidden rounded-lg border bg-[#0b1020] transition hover:border-[#FF5F25]/70 focus:outline-none focus:ring-2 focus:ring-[#FF5F25]/50 ${
        active ? "border-[#FF5F25]/70" : "border-white/10"
      }`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CallCardContent track={track} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="truncate text-xs font-semibold text-white">{getParticipantLabel(track)}</p>
        {isShare ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFB199]">
            Screen share
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CallCardContent({
  focused = false,
  track,
}: {
  focused?: boolean;
  track: PersistentTrack;
}) {
  const isShare = getTrackSource(track) === Track.Source.ScreenShare;

  if (isShare && isLocalTrack(track)) {
    return <LocalScreenSharePreview focused={focused} />;
  }

  return (
    <ParticipantTile
      className="h-full rounded-none [&_.lk-focus-toggle-button]:hidden [&_.lk-participant-media-video]:!object-contain [&_.lk-participant-media-video]:!object-center"
      trackRef={track}
    />
  );
}

function LocalScreenSharePreview({ focused = false }: { focused?: boolean }) {
  return (
    <div className={`grid h-full min-h-0 place-items-center bg-[#111511] p-3 text-center ${focused ? "p-6" : ""}`}>
      <div className="max-w-xs">
        <div className={`${focused ? "size-12" : "size-9"} mx-auto grid place-items-center rounded-lg border border-[#FF5F25]/40 bg-[#FF5F25]/12 text-[#FFB199]`}>
          <ScreenShareGlyph className={focused ? "h-6 w-6" : "h-4 w-4"} />
        </div>
        <p className={`${focused ? "mt-4 text-sm" : "mt-2 text-xs"} truncate font-semibold text-white`}>
          Your screen is being shared
        </p>
        <p className={`${focused ? "mt-2 text-xs leading-5" : "mt-1 text-[10px] leading-4"} text-slate-400`}>
          The local preview is hidden.
        </p>
      </div>
    </div>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      {active ? (
        <>
          <path d="M8 3v5H3" />
          <path d="M16 3v5h5" />
          <path d="M8 21v-5H3" />
          <path d="M16 21v-5h5" />
        </>
      ) : (
        <>
          <path d="M8 3H3v5" />
          <path d="M16 3h5v5" />
          <path d="M8 21H3v-5" />
          <path d="M16 21h5v-5" />
        </>
      )}
    </svg>
  );
}

function ScreenShareGlyph({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 4h18v12H3z" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
      <path d="m9 10 3-3 3 3" />
      <path d="M12 7v7" />
    </svg>
  );
}

function getTrackSource(track: PersistentTrack) {
  return track.publication?.source ?? track.source;
}

function isLocalTrack(track: PersistentTrack) {
  return Boolean(track.participant.isLocal);
}

function getTrackKey(track: PersistentTrack) {
  return [
    track.participant.identity,
    getTrackSource(track),
    track.publication?.trackSid ?? "placeholder",
  ].join(":");
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
