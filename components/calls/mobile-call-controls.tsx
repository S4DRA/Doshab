"use client";

import { useState } from "react";
import { CallIcon } from "./call-workspace";
import { microphoneConstraints, type CallContextValue } from "./persistent-call-provider";
import { usePushToTalk } from "./use-push-to-talk";

export function MobileCallMiniControls({ call }: { call: CallContextValue }) {
  const [pending, setPending] = useState(false);
  const pushToTalk = usePushToTalk(call.media, call.activeCall?.voiceSettings, call.setError);
  const muted = call.snapshot?.micMuted ?? true;
  const toggle = async () => {
    if (!call.media || pending || pushToTalk.enabled) return;
    setPending(true); call.setError(null);
    try {
      await call.media.setMicMuted(!muted);
      if (muted && !call.media.snapshot().local.some((item) => item.source === "mic")) await call.media.start("mic", microphoneConstraints(call.activeCall?.voiceSettings));
    } catch (error) { console.error("Could not update call microphone", error); call.setError("Could not enable the microphone. Check browser permission and audio devices."); }
    finally { setPending(false); }
  };
  return <div className="val-mobile-only val-mobile-call-mini-controls">
    <button className="val-mobile-icon-button" type="button" disabled={pending || call.snapshot?.state !== "connected"} aria-busy={pending} aria-pressed={!muted} aria-label={pushToTalk.enabled ? "Hold to talk" : muted ? "Unmute microphone" : "Mute microphone"} onClick={() => void toggle()}
      onPointerDown={(event) => { if (pushToTalk.enabled) { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); pushToTalk.press(); } }} onPointerUp={pushToTalk.release} onPointerCancel={pushToTalk.release} onLostPointerCapture={pushToTalk.release} onBlur={pushToTalk.release}
      onKeyDown={(event) => { if (pushToTalk.enabled && [" ", "Enter"].includes(event.key)) { event.preventDefault(); pushToTalk.press(); } }} onKeyUp={(event) => { if (pushToTalk.enabled && [" ", "Enter"].includes(event.key)) pushToTalk.release(); }}><CallIcon name={muted ? "mic-off" : "mic"} /></button>
    <button className="val-mobile-icon-button val-mobile-call-leave" type="button" aria-label="Leave call" onClick={call.endCall}><CallIcon name="phone" /></button>
  </div>;
}
