"use client";

import { useConnectionState, useLocalParticipant } from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { defaultStreamSettings, getStreamOptions, streamPresets, type StreamSettings } from "@/lib/stream-settings";

function useStreamController() {
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const connection = useConnectionState();
  const [settings, setSettings] = useState(defaultStreamSettings);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const busy = useRef(false);

  async function toggle() {
    if (busy.current || connection !== ConnectionState.Connected) return;
    busy.current = true;
    setPending(true);
    setMessage(null);
    try {
      if (localParticipant.isScreenShareEnabled) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error("This browser does not support screen sharing. Use a supported desktop browser.");
        }
        const options = getStreamOptions(settings);
        const publication = await localParticipant.setScreenShareEnabled(true, options.capture, options.publish);
        if (publication && settings.audio !== "off" && !localParticipant.getTrackPublication(Track.Source.ScreenShareAudio)) {
          setMessage("Your screen is live without shared audio. To include sound, stop and select a source with Share audio enabled in the browser picker.");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? `Screen sharing: ${error.message}` : "Screen sharing failed. Please try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return { settings, setSettings, pending, message, toggle, isScreenShareEnabled, connection };
}

const StreamContext = createContext<ReturnType<typeof useStreamController> | null>(null);

export function StreamControlsProvider({ children }: { children: ReactNode }) {
  const controller = useStreamController();
  return <StreamContext.Provider value={controller}>{children}</StreamContext.Provider>;
}

export function StreamControls() {
  const controller = useContext(StreamContext);
  if (!controller) throw new Error("StreamControls requires StreamControlsProvider");
  const { settings, setSettings, pending, message, toggle, isScreenShareEnabled, connection } = controller;
  const locked = pending || isScreenShareEnabled;
  const selectClass = "mt-1 h-11 w-full rounded-lg border border-white/15 bg-[#080b10] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-[#FF5F25] disabled:opacity-50";
  const patch = (value: Partial<StreamSettings>) => setSettings((current) => ({ ...current, ...value }));

  return (
    <details className="w-full rounded-lg border border-white/10 bg-black/25 text-slate-200 shadow-inner">
      <summary className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#FF5F25]">
        {isScreenShareEnabled ? "Stream live · controls" : "Start streaming · options"}
        {pending ? " · Please wait…" : connection !== ConnectionState.Connected ? " · Reconnecting…" : ""}
        {message ? " · Check stream status" : ""}
      </summary>
      <div className="max-h-[45dvh] space-y-3 overflow-y-auto border-t border-white/10 p-3">
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
          <label className="text-xs">Quality & performance
            <select className={selectClass} disabled={locked} value={settings.preset} onChange={(e) => patch({ preset: e.target.value as StreamSettings["preset"] })}>
              {Object.entries(streamPresets).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}
            </select>
          </label>
          <label className="text-xs">Frame rate
            <select className={selectClass} disabled={locked} value={settings.frameRate} onChange={(e) => patch({ frameRate: Number(e.target.value) as StreamSettings["frameRate"] })}>
              <option value={15}>15 FPS · less bandwidth</option><option value={30}>30 FPS · balanced</option><option value={60}>60 FPS · smoother motion</option>
            </select>
          </label>
          <label className="text-xs">Optimize video for
            <select className={selectClass} disabled={locked} value={settings.content} onChange={(e) => patch({ content: e.target.value as StreamSettings["content"] })}>
              <option value="motion">Games & video</option><option value="detail">Text & presentations</option>
            </select>
          </label>
          <label className="text-xs">Stream audio
            <select className={selectClass} disabled={locked} value={settings.audio} onChange={(e) => patch({ audio: e.target.value as StreamSettings["audio"] })}>
              <option value="high">High quality stereo</option><option value="standard">Standard stereo</option><option value="off">No shared audio</option>
            </select>
          </label>
        </div>
        <p className="text-xs leading-5 text-slate-400">Your microphone and camera use the call controls separately. Choose Share audio in the browser picker to include sound; availability depends on your browser and selected source. Avoid sharing this call’s audio to prevent echo.</p>
        <p className="text-xs leading-5 text-slate-400">Higher resolution and 60 FPS need more bandwidth and processing power. Delivery adapts to your connection; capture may be lower than requested. Stop sharing to change options.</p>
        {message ? <p role="alert" className="text-xs text-amber-200">{message}</p> : null}
        <button type="button" disabled={pending || connection !== ConnectionState.Connected} onClick={() => void toggle()} className={`${isScreenShareEnabled ? "app-button-danger" : "app-button-primary"} h-11 w-full rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50`}>
          {pending ? "Please wait…" : isScreenShareEnabled ? "Stop streaming" : "Choose screen & go live"}
        </button>
      </div>
    </details>
  );
}
