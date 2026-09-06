"use client";

import {
  AudioTrack,
  ControlBar,
  DisconnectButton,
  LiveKitRoom,
  ParticipantTile,
  useIsSpeaking,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { ConnectionQuality, Track } from "livekit-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import { MusicButton } from "@/components/music/music-button";
import { MusicSessionProvider } from "@/components/music/music-session-provider";
import { defaultVoiceSettings, type VoiceSettings } from "@/lib/voice-settings";

const endedCallIdsStorageKey = "palaver:ended-call-ids";
const participantVoicePreferencesStorageKey = "val:participant-voice-preferences:v1";
const maxRememberedEndedCalls = 50;
const defaultParticipantVoicePreference = {
  localVolume: 100,
  locallyMuted: false,
};

type ParticipantVoicePreference = {
  targetUserId: string;
  localVolume: number;
  locallyMuted: boolean;
};

type ParticipantVoicePreferenceMap = Record<string, ParticipantVoicePreference>;

type ParticipantVoicePreferencesContextValue = {
  getPreference: (targetUserId: string) => ParticipantVoicePreference;
  resetPreference: (targetUserId: string) => void;
  updatePreference: (
    targetUserId: string,
    patch: Partial<Omit<ParticipantVoicePreference, "targetUserId">>,
  ) => void;
};

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
  voiceSettings?: VoiceSettings;
};

type PersistentCallContextValue = {
  activeCall: PersistentCallSession | null;
  endCall: () => void;
  endedCallIds: ReadonlySet<string>;
  poppedOut: boolean;
  setPoppedOut: (poppedOut: boolean) => void;
  startCall: (session: PersistentCallSession) => void;
};

const PersistentCallContext = createContext<PersistentCallContextValue | null>(null);
const ParticipantVoicePreferencesContext =
  createContext<ParticipantVoicePreferencesContextValue | null>(null);

type CallRenderErrorBoundaryProps = {
  boundaryKey: string;
  children: React.ReactNode;
  onEnd: () => void;
};

type CallRenderErrorBoundaryState = {
  error: Error | null;
  resetVersion: number;
};

class CallRenderErrorBoundary extends Component<
  CallRenderErrorBoundaryProps,
  CallRenderErrorBoundaryState
> {
  state: CallRenderErrorBoundaryState = {
    error: null,
    resetVersion: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<CallRenderErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Voice room render failed", error);
  }

  componentDidUpdate(previousProps: CallRenderErrorBoundaryProps) {
    if (previousProps.boundaryKey !== this.props.boundaryKey && this.state.error) {
      this.setState({ error: null, resetVersion: 0 });
    }
  }

  render() {
    if (!this.state.error) {
      return this.state.resetVersion ? (
        <div key={this.state.resetVersion} className="contents">
          {this.props.children}
        </div>
      ) : (
        this.props.children
      );
    }

    return (
      <div className="dashboard-content-frame dashboard-density grid min-h-0 w-full min-w-0 place-items-center overflow-hidden bg-[#050705] px-4 py-8">
        <section className="app-panel w-full max-w-lg p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Voice room stopped rendering
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">Leave and rejoin the channel</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The active call UI hit a client-side rendering problem. Leaving clears the stuck room state so the channel can open normally again.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              className="app-button-primary h-11 rounded-lg px-5 text-sm font-bold transition"
              onClick={this.props.onEnd}
              type="button"
            >
              Leave call
            </button>
            <button
              className="app-button-secondary h-11 rounded-lg px-5 text-sm font-bold transition"
              onClick={() => this.setState((state) => ({
                error: null,
                resetVersion: state.resetVersion + 1,
              }))}
              type="button"
            >
              Retry call UI
            </button>
          </div>
        </section>
      </div>
    );
  }
}

function readRememberedEndedCallIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const value = window.sessionStorage.getItem(endedCallIdsStorageKey);
    const parsed = value ? JSON.parse(value) : [];

    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set<string>();
  }
}

function rememberEndedCallIds(callIds: ReadonlySet<string>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const remembered = Array.from(callIds).slice(-maxRememberedEndedCalls);
    window.sessionStorage.setItem(endedCallIdsStorageKey, JSON.stringify(remembered));
  } catch {
    // A storage failure should not make leaving a call fail.
  }
}

function clampParticipantVolume(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultParticipantVoicePreference.localVolume;
  }

  return Math.min(Math.max(Math.round(value), 0), 200);
}

function getMediaElementVolume(value: number) {
  return Math.min(Math.max(value / 100, 0), 1);
}

function readParticipantVoicePreferences() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const value = window.localStorage.getItem(participantVoicePreferencesStorageKey);
    const parsed = value ? JSON.parse(value) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<ParticipantVoicePreferenceMap>((preferences, [targetUserId, preference]) => {
      if (!targetUserId || !preference || typeof preference !== "object" || Array.isArray(preference)) {
        return preferences;
      }

      const item = preference as Partial<ParticipantVoicePreference>;
      preferences[targetUserId] = {
        targetUserId,
        localVolume: clampParticipantVolume(item.localVolume),
        locallyMuted: Boolean(item.locallyMuted),
      };
      return preferences;
    }, {});
  } catch {
    return {};
  }
}

function writeParticipantVoicePreferences(preferences: ParticipantVoicePreferenceMap) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      participantVoicePreferencesStorageKey,
      JSON.stringify(preferences),
    );
  } catch {
    // Local voice preferences should never block the call UI.
  }
}

function ParticipantVoicePreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ParticipantVoicePreferenceMap>(
    readParticipantVoicePreferences,
  );

  useEffect(() => {
    writeParticipantVoicePreferences(preferences);
  }, [preferences]);

  const getPreference = useCallback((targetUserId: string): ParticipantVoicePreference => {
    return preferences[targetUserId] ?? {
      targetUserId,
      ...defaultParticipantVoicePreference,
    };
  }, [preferences]);

  const updatePreference = useCallback<ParticipantVoicePreferencesContextValue["updatePreference"]>(
    (targetUserId, patch) => {
      setPreferences((current) => {
        const existing = current[targetUserId] ?? {
          targetUserId,
          ...defaultParticipantVoicePreference,
        };
        const next = {
          ...existing,
          ...patch,
          targetUserId,
          localVolume: patch.localVolume === undefined
            ? existing.localVolume
            : clampParticipantVolume(patch.localVolume),
          locallyMuted: patch.locallyMuted === undefined
            ? existing.locallyMuted
            : patch.locallyMuted,
        };

        return {
          ...current,
          [targetUserId]: next,
        };
      });
    },
    [],
  );

  const resetPreference = useCallback((targetUserId: string) => {
    setPreferences((current) => {
      if (!current[targetUserId]) {
        return current;
      }

      const next = { ...current };
      delete next[targetUserId];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      getPreference,
      resetPreference,
      updatePreference,
    }),
    [getPreference, resetPreference, updatePreference],
  );

  return (
    <ParticipantVoicePreferencesContext.Provider value={value}>
      {children}
    </ParticipantVoicePreferencesContext.Provider>
  );
}

function useParticipantVoicePreferences() {
  const context = useContext(ParticipantVoicePreferencesContext);

  if (!context) {
    throw new Error("useParticipantVoicePreferences must be used inside ParticipantVoicePreferencesProvider.");
  }

  return context;
}

export function PersistentCallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<PersistentCallSession | null>(null);
  const [endedCallIds, setEndedCallIds] = useState<ReadonlySet<string>>(readRememberedEndedCallIds);
  const [expanded, setExpanded] = useState(true);
  const [poppedOut, setPoppedOut] = useState(false);
  const activeCallRef = useRef<PersistentCallSession | null>(null);
  const endedCallIdsRef = useRef<ReadonlySet<string>>(endedCallIds);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    endedCallIdsRef.current = endedCallIds;
  }, [endedCallIds]);

  const postEnd = useCallback((session: PersistentCallSession | null) => {
    if (session?.endUrl) {
      void fetch(session.endUrl, { method: "POST" }).catch(() => null);
    }
  }, []);

  const markCallEnded = useCallback((sessionId: string) => {
    if (endedCallIdsRef.current.has(sessionId)) {
      return;
    }

    const next = new Set(endedCallIdsRef.current);
    next.add(sessionId);
    endedCallIdsRef.current = next;
    rememberEndedCallIds(next);
    setEndedCallIds(next);
  }, []);

  const leaveCallPage = useCallback((session: PersistentCallSession | null) => {
    if (session?.kind === "friend" && pathname === getCallHref(session)) {
      router.replace("/dashboard/messages");
    }
  }, [pathname, router]);

  const endCall = useCallback(() => {
    const current = activeCallRef.current;

    if (current) {
      postEnd(current);
      markCallEnded(current.id);
    }

    activeCallRef.current = null;
    setActiveCall(null);
    setPoppedOut(false);
    leaveCallPage(current);
  }, [leaveCallPage, markCallEnded, postEnd]);

  const startCall = useCallback(
    (session: PersistentCallSession) => {
      const current = activeCallRef.current;

      if (current && current.id !== session.id) {
        postEnd(current);
        markCallEnded(current.id);
      }

      setEndedCallIds((currentEndedCallIds) => {
        if (!currentEndedCallIds.has(session.id)) {
          return currentEndedCallIds;
        }

        const next = new Set(currentEndedCallIds);
        next.delete(session.id);
        endedCallIdsRef.current = next;
        rememberEndedCallIds(next);
        return next;
      });
      activeCallRef.current = session;
      setActiveCall(session);
      setExpanded(true);
      setPoppedOut(false);
    },
    [markCallEnded, postEnd],
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
        markCallEnded(activeCall.id);
        if (activeCallRef.current?.id === activeCall.id) {
          activeCallRef.current = null;
        }
        setActiveCall(null);
        leaveCallPage(activeCall);
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activeCall, leaveCallPage, markCallEnded]);

  const value = useMemo(
    () => ({
      activeCall,
      endCall,
      endedCallIds,
      poppedOut,
      setPoppedOut,
      startCall,
    }),
    [activeCall, endCall, endedCallIds, poppedOut, startCall],
  );
  const showDock = Boolean(activeCall && (poppedOut || !isActiveCallPage(activeCall, pathname)));
  const activeVoiceSettings = activeCall?.voiceSettings ?? defaultVoiceSettings;

  return (
    <PersistentCallContext.Provider value={value}>
      {activeCall ? (
        <CallRenderErrorBoundary
          boundaryKey={activeCall.id}
          onEnd={endCall}
        >
          <LiveKitRoom
            audio={getLiveKitAudioOptions(activeVoiceSettings)}
            className="contents"
            connect
            data-lk-theme="default"
            key={activeCall.id}
            onDisconnected={endCall}
            options={getLiveKitRoomOptions(activeVoiceSettings)}
            serverUrl={activeCall.livekitUrl}
            token={activeCall.token}
            video={activeCall.kind === "group"}
          >
            <ParticipantVoicePreferencesProvider>
              <MusicSessionProvider channelId={activeCall.kind === "group" ? activeCall.id.slice("group:".length) : null}>
                {activeVoiceSettings.joinDeafened ? null : <ParticipantAudioRenderer />}
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
              </MusicSessionProvider>
            </ParticipantVoicePreferencesProvider>
          </LiveKitRoom>
        </CallRenderErrorBoundary>
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

export function useOptionalPersistentCall() {
  return useContext(PersistentCallContext);
}

function ParticipantAudioRenderer() {
  const { getPreference } = useParticipantVoicePreferences();
  const audioTracks = useTracks(
    [Track.Source.Microphone, Track.Source.ScreenShareAudio, Track.Source.Unknown],
    {
      onlySubscribed: true,
      updateOnlyOn: [],
    },
  ).filter((track) => !track.participant.isLocal && track.publication.kind === Track.Kind.Audio);

  return (
    <div style={{ display: "none" }}>
      {audioTracks.map((track) => {
        const preference = getPreference(track.participant.identity);
        const volume = preference.locallyMuted
          ? 0
          : getMediaElementVolume(preference.localVolume);

        return (
          <AudioTrack
            key={getTrackKey(track)}
            trackRef={track}
            volume={volume}
          />
        );
      })}
    </div>
  );
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
  const dockRef = useRef<HTMLElement>(null);
  const dragStateRef = useRef<{
    offsetX: number;
    offsetY: number;
    pointerId: number;
  } | null>(null);
  const [dockPosition, setDockPosition] = useState<{ x: number; y: number } | null>(null);

  const clampDockPosition = useCallback((x: number, y: number) => {
    const rect = dockRef.current?.getBoundingClientRect();
    const margin = 12;
    const width = rect?.width ?? 448;
    const height = rect?.height ?? 280;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);

    return {
      x: Math.min(Math.max(x, margin), maxX),
      y: Math.min(Math.max(y, margin), maxY),
    };
  }, []);

  useEffect(() => {
    if (!dockPosition) {
      return;
    }

    const handleResize = () => {
      setDockPosition((current) => (
        current ? clampDockPosition(current.x, current.y) : current
      ));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampDockPosition, dockPosition]);

  const beginDockDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest("a, button, input, select, textarea, [role='button']")
    ) {
      return;
    }

    const rect = dockRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDockPosition(clampDockPosition(rect.left, rect.top));
  };

  const moveDock = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    setDockPosition(clampDockPosition(
      event.clientX - dragState.offsetX,
      event.clientY - dragState.offsetY,
    ));
  };

  const endDockDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return (
    <section
      className={cn(
        "fixed z-[60] max-h-[calc(100dvh_-_1.5rem)] overflow-x-hidden overflow-y-auto rounded-xl border border-[#FF5F25]/40 bg-[#070a12] shadow-2xl shadow-black/50",
        dockPosition
          ? "w-[min(28rem,calc(100vw-1.5rem))]"
          : "inset-x-3 bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(28rem,calc(100vw-2rem))]",
      )}
      ref={dockRef}
      style={dockPosition ? { left: dockPosition.x, top: dockPosition.y } : undefined}
    >
      <div
        className="flex touch-none cursor-move select-none flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"
        onPointerCancel={endDockDrag}
        onPointerDown={beginDockDrag}
        onPointerMove={moveDock}
        onPointerUp={endDockDrag}
        title="Drag to move call window"
      >
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
          {dockPosition ? (
            <button
              aria-label="Reset call window position"
              className="app-icon-button h-10 w-10"
              onClick={() => setDockPosition(null)}
              title="Reset position"
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v6h6" />
              </svg>
            </button>
          ) : null}
          <Link
            aria-label="Open call page"
            className="app-icon-button h-10 w-10"
            href={getCallHref(session)}
            onClick={onUnpop}
            title="Open call page"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 3h6v6" />
              <path d="m10 14 11-11" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          </Link>
          <button
            aria-label={expanded ? "Minimize call" : "Expand call"}
            className="app-icon-button h-10 w-10"
            onClick={onToggle}
            title={expanded ? "Minimize call" : "Expand call"}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {expanded ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
            </svg>
          </button>
          <button
            className="app-button-danger h-11 rounded-lg px-3 text-xs font-semibold transition sm:h-10"
            onClick={onEnd}
            type="button"
          >
            End call
          </button>
        </div>
      </div>
      {expanded ? (
        <>
          <div className="min-h-0 max-h-[min(45dvh,24rem)] overflow-hidden p-3">
            <PersistentCallParticipants />
          </div>
          <div className="overflow-visible border-t border-white/10 px-3 py-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {session.kind === "group" ? <MusicButton /> : null}
              <ControlBar
                className="!w-auto !border-0 !bg-transparent !p-0"
                controls={{
                  microphone: true,
                  camera: session.kind === "group",
                  screenShare: true,
                  chat: false,
                  settings: false,
                  leave: false,
                }}
                saveUserChoices={false}
                variation="minimal"
              />
              <DisconnectButton
                className="app-button-danger h-11 rounded-lg px-3 text-xs font-semibold transition sm:h-10"
                onClick={onEnd}
              >
                Leave
              </DisconnectButton>
            </div>
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
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b0f0b] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            {activeCall.kind === "friend" ? "Friend call" : "Voice room"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{activeCall.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This call is popped out. You can keep moving around the dashboard.
          </p>
          <button
            className="app-button-primary mt-6 h-11 rounded-lg px-4 text-sm font-semibold transition"
            onClick={() => setPoppedOut(false)}
            type="button"
          >
            Return to full call
          </button>
        </div>
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
            className="app-button-secondary h-11 rounded-lg px-3 text-xs font-semibold transition sm:h-10"
            onClick={() => setPoppedOut(true)}
            type="button"
          >
            Pop out
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black">
        <PersistentCallParticipants showScreenShareFocus />
      </div>
      <div className="mt-2 shrink-0 overflow-visible rounded-lg border border-white/10 bg-[#0b0f0b] px-2 py-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {activeCall.kind === "group" ? <MusicButton /> : null}
          <ControlBar
            className="!w-auto !border-0 !bg-transparent !p-0"
            controls={{
              microphone: true,
              camera: activeCall.kind === "group",
              screenShare: true,
              chat: false,
              settings: false,
              leave: false,
            }}
            saveUserChoices={false}
            variation="minimal"
          />
          <DisconnectButton
            className="app-button-danger h-11 rounded-lg px-3 text-xs font-semibold transition sm:h-10"
            onClick={endCall}
          >
            Leave
          </DisconnectButton>
        </div>
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
        Waiting for participants. The room will update as soon as someone joins.
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
      <ParticipantVoiceControlsSection />
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
  const hideControlsTimerRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const isShare = getTrackSource(track) === Track.Source.ScreenShare;
  const canControlParticipant = !isLocalTrack(track);

  const revealTopBar = useCallback((holdOpen = false) => {
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }

    setTopBarVisible(true);

    if (!holdOpen && document.fullscreenElement === cardRef.current) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setTopBarVisible(false);
      }, 2800);
    }
  }, []);

  useEffect(() => {
    const updateFullscreenElement = () => {
      const fullscreen = Boolean(cardRef.current && document.fullscreenElement === cardRef.current);
      setIsFullscreen(fullscreen);
      setTopBarVisible(true);

      if (fullscreen) {
        revealTopBar();
      } else if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
        hideControlsTimerRef.current = null;
      }
    };

    document.addEventListener("fullscreenchange", updateFullscreenElement);

    return () => document.removeEventListener("fullscreenchange", updateFullscreenElement);
  }, [revealTopBar]);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
        hideControlsTimerRef.current = null;
      }
    };
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
      className="relative mx-auto mb-3 flex h-[clamp(14rem,48dvh,34rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[#FF5F25]/40 bg-[#070a12] fullscreen:h-screen fullscreen:max-w-none fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-black"
      onFocusCapture={() => revealTopBar(true)}
      onKeyDown={() => revealTopBar()}
      onPointerMove={() => revealTopBar()}
      onTouchStart={() => revealTopBar()}
      ref={cardRef}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#070a12]/95 px-3 py-2 backdrop-blur transition duration-200 fullscreen:absolute fullscreen:inset-x-0 fullscreen:top-0 fullscreen:z-20",
          isFullscreen && !topBarVisible && "pointer-events-none -translate-y-2 opacity-0",
        )}
        onMouseEnter={() => revealTopBar(true)}
        onMouseLeave={() => revealTopBar()}
      >
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            {getParticipantLabel(track)}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFB199]">
            {isShare ? "Screen share" : "Participant"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canControlParticipant ? (
            <div className="relative">
              <button
                aria-expanded={controlsOpen}
                aria-label={`Open local voice controls for ${getParticipantLabel(track)}`}
                className="app-icon-button h-10 w-10"
                onClick={() => setControlsOpen((current) => !current)}
                title="Participant voice controls"
                type="button"
              >
                <MoreIcon />
              </button>
              {controlsOpen ? (
                <ParticipantVoiceControlsPanel
                  onClose={() => setControlsOpen(false)}
                  participant={track.participant}
                />
              ) : null}
            </div>
          ) : null}
          <button
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen card"}
            className="app-icon-button h-10 w-10"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
            type="button"
          >
            <FullscreenIcon active={isFullscreen} />
          </button>
          <button
            aria-label="Close large card"
            className="app-icon-button h-10 w-10"
            onClick={onClose}
            title="Close large card"
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
  const [controlsOpen, setControlsOpen] = useState(false);
  const canControlParticipant = !isLocalTrack(track);

  return (
    <div
      aria-label={`${isShare ? "Screen share" : "Participant"} card for ${getParticipantLabel(track)}`}
      aria-pressed={active}
      className={`group relative h-[clamp(13rem,48vw,24rem)] w-full max-w-[36rem] cursor-pointer overflow-hidden rounded-lg border bg-[#0b1020] transition hover:border-[#FF5F25]/70 focus:outline-none focus:ring-2 focus:ring-[#FF5F25]/50 sm:h-[clamp(20rem,26vw,24rem)] sm:w-[clamp(30rem,40vw,36rem)] ${
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
      {canControlParticipant ? (
        <div className="absolute right-2 top-2 z-20">
          <button
            aria-expanded={controlsOpen}
            aria-label={`Open local voice controls for ${getParticipantLabel(track)}`}
            className="app-icon-button h-10 w-10 border-black/40 bg-black/55 text-white shadow-lg shadow-black/40 backdrop-blur hover:bg-black/75"
            onClick={(event) => {
              event.stopPropagation();
              setControlsOpen((current) => !current);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            title="Participant voice controls"
            type="button"
          >
            <MoreIcon />
          </button>
          {controlsOpen ? (
            <ParticipantVoiceControlsPanel
              onClose={() => setControlsOpen(false)}
              participant={track.participant}
            />
          ) : null}
        </div>
      ) : null}
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

function ParticipantVoiceControlsSection() {
  const participants = useParticipants();
  const remoteParticipants = participants.filter((participant) => !participant.isLocal);
  const [openParticipantId, setOpenParticipantId] = useState<string | null>(null);
  const { getPreference } = useParticipantVoicePreferences();

  if (!remoteParticipants.length) {
    return null;
  }

  return (
    <section className="mb-3 rounded-lg border border-white/10 bg-[#090d12] p-3 shadow-inner shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
            Participant Voice Controls
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Local listening controls. Only changes what you hear.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {remoteParticipants.map((participant) => {
          const preference = getPreference(participant.identity);
          const participantId = participant.identity;

          return (
            <div
              className="relative flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2"
              key={participant.sid || participant.identity}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {getParticipantName(participant)}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {preference.locallyMuted ? "Locally muted" : `${preference.localVolume}% local volume`}
                </p>
              </div>
              <button
                aria-expanded={openParticipantId === participantId}
                aria-label={`Open local voice controls for ${getParticipantName(participant)}`}
                className="app-icon-button h-10 w-10"
                onClick={() => {
                  setOpenParticipantId((current) => (
                    current === participantId ? null : participantId
                  ));
                }}
                title="Participant voice controls"
                type="button"
              >
                <MoreIcon />
              </button>
              {openParticipantId === participantId ? (
                <ParticipantVoiceControlsPanel
                  onClose={() => setOpenParticipantId(null)}
                  participant={participant}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ParticipantVoiceControlsPanel({
  onClose,
  participant,
}: {
  onClose: () => void;
  participant: Participant;
}) {
  const isSpeaking = useIsSpeaking(participant);
  const { getPreference, resetPreference, updatePreference } = useParticipantVoicePreferences();
  const preference = getPreference(participant.identity);
  const label = getParticipantName(participant);
  const microphonePublication = participant.getTrackPublication(Track.Source.Microphone);
  const voiceStatus = microphonePublication?.isMuted ? "Mic muted" : "Mic available";

  return (
    <>
      <button
        aria-label="Close participant voice controls"
        className="fixed inset-0 z-[79] cursor-default bg-black/55 sm:hidden"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        type="button"
      />
      <div
        className="fixed inset-x-3 bottom-3 z-[80] rounded-xl border border-[#FF5F25]/30 bg-[#080b10] p-4 text-left shadow-2xl shadow-black/60 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-80"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
              Only for me
            </p>
            <h3 className="mt-1 truncate text-sm font-semibold text-white">{label}</h3>
          </div>
          <button
            aria-label="Close participant voice controls"
            className="app-icon-button h-9 w-9"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-xs font-semibold text-white" htmlFor={`participant-volume-${participant.identity}`}>
              Local volume
            </label>
            <span className="text-xs font-semibold text-[#FFD400]">
              {preference.locallyMuted ? "Muted" : `${preference.localVolume}%`}
            </span>
          </div>
          <input
            aria-label={`Local volume for ${label}`}
            className="voice-settings-range w-full"
            disabled={preference.locallyMuted}
            id={`participant-volume-${participant.identity}`}
            max="200"
            min="0"
            onChange={(event) => {
              updatePreference(participant.identity, {
                localVolume: Number(event.currentTarget.value),
              });
            }}
            step="5"
            type="range"
            value={preference.localVolume}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className={cn(
              "h-11 rounded-lg border px-3 text-xs font-semibold transition active:scale-[0.98]",
              preference.locallyMuted
                ? "border-[#FFD400]/45 bg-[#FFD400]/15 text-[#FFE875]"
                : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.07]",
            )}
            onClick={() => {
              updatePreference(participant.identity, {
                locallyMuted: !preference.locallyMuted,
              });
            }}
            type="button"
          >
            {preference.locallyMuted ? "Unmute for me" : "Mute for me"}
          </button>
          <button
            className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.98]"
            onClick={() => resetPreference(participant.identity)}
            type="button"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <StatusPill label="Activity" value={isSpeaking ? "Speaking" : "Quiet"} />
          <StatusPill label="Voice" value={voiceStatus} />
          <StatusPill label="Connection" value={formatConnectionQuality(participant.connectionQuality)} />
          <StatusPill label="Scope" value="Local only" />
        </div>
      </div>
    </>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-200">{value}</p>
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

function MoreIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 12h.01" />
      <path d="M19 12h.01" />
      <path d="M5 12h.01" />
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

function getParticipantName(participant: Participant) {
  return participant.name || participant.identity || "Voice participant";
}

function formatConnectionQuality(connectionQuality: ConnectionQuality) {
  switch (connectionQuality) {
    case ConnectionQuality.Excellent:
      return "Excellent";
    case ConnectionQuality.Good:
      return "Good";
    case ConnectionQuality.Poor:
      return "Poor";
    case ConnectionQuality.Lost:
      return "Lost";
    case ConnectionQuality.Unknown:
    default:
      return "Unknown";
  }
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

function getLiveKitAudioOptions(settings: VoiceSettings) {
  if (settings.joinMuted) {
    return false;
  }

  return {
    autoGainControl: settings.autoGainControl,
    deviceId: settings.inputDeviceId ? { ideal: settings.inputDeviceId } : undefined,
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    voiceIsolation: settings.voiceIsolation || undefined,
  };
}

function getLiveKitRoomOptions(settings: VoiceSettings) {
  return {
    audioOutput: settings.outputDeviceId
      ? {
          deviceId: settings.outputDeviceId,
        }
      : undefined,
  };
}
