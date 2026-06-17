"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cacheVoiceSettings } from "@/lib/voice-settings.client";
import { defaultVoiceSettings, type VoiceInputMode, type VoiceSettings } from "@/lib/voice-settings";

type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";
type MicTestStatus = "idle" | "starting" | "active" | "blocked" | "unsupported" | "error";
type DiagnosticState = "ok" | "blocked" | "missing" | "not-checked" | "unavailable";

type AudioDevice = {
  deviceId: string;
  label: string;
};

export function VoiceAudioSettingsPanel() {
  const [settings, setSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [message, setMessage] = useState("");
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [deviceHint, setDeviceHint] = useState("Device names may appear after microphone permission is granted.");
  const [micStatus, setMicStatus] = useState<MicTestStatus>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticState>>({
    inputDevice: "not-checked",
    livekit: "unavailable",
    microphone: "not-checked",
    network: "not-checked",
    outputDevice: "not-checked",
  });
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const loadedRef = useRef(false);

  const outputSelectionSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return "setSinkId" in HTMLMediaElement.prototype;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/profile/voice-settings", {
          cache: "no-store",
          headers: {
            accept: "application/json",
          },
        });
        const data = (await response.json().catch(() => null)) as {
          settings?: VoiceSettings;
          error?: string;
        } | null;

        if (cancelled) {
          return;
        }

        if (!response.ok || !data?.settings) {
          throw new Error(data?.error ?? "Could not load voice settings.");
        }

        setSettings({
          ...defaultVoiceSettings,
          ...data.settings,
        });
        cacheVoiceSettings({
          ...defaultVoiceSettings,
          ...data.settings,
        });
        setSaveStatus("idle");
        loadedRef.current = true;
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSaveStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not load voice settings.");
        loadedRef.current = true;
      }
    }

    void loadSettings();
    void refreshDevices(false);
    void refreshDiagnostics();

    return () => {
      cancelled = true;
      stopMicTest();
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  // Initial hydration should run once; the button handlers below refresh diagnostics on demand.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSetting = <SettingKey extends keyof VoiceSettings>(
    key: SettingKey,
    value: VoiceSettings[SettingKey],
  ) => {
    setSettings((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      cacheVoiceSettings(next);
      queueSave({ [key]: value });
      return next;
    });
  };

  const updateInputMode = (inputMode: VoiceInputMode) => {
    updateSetting("inputMode", inputMode);
  };

  async function refreshDevices(requestPermission: boolean) {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDeviceHint("This browser does not expose audio device selection.");
      setDiagnostics((current) => ({
        ...current,
        inputDevice: "unavailable",
        outputDevice: "unavailable",
      }));
      return;
    }

    let permissionStream: MediaStream | null = null;

    try {
      if (requestPermission && navigator.mediaDevices.getUserMedia) {
        permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }));
      const outputs = devices
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${index + 1}`,
        }));

      setInputDevices(inputs);
      setOutputDevices(outputs);
      setDeviceHint(
        inputs.some((device) => device.label.startsWith("Microphone "))
          ? "Grant microphone permission to reveal device names on this browser."
          : "Device choices are saved per account, but browsers may rotate device IDs.",
      );
      setDiagnostics((current) => ({
        ...current,
        inputDevice: inputs.length ? "ok" : "missing",
        outputDevice: outputSelectionSupported ? (outputs.length ? "ok" : "missing") : "unavailable",
      }));
    } catch {
      setDeviceHint("Microphone permission is blocked or unavailable, so VAL cannot list every device.");
      setDiagnostics((current) => ({
        ...current,
        inputDevice: "blocked",
        microphone: "blocked",
        outputDevice: outputSelectionSupported ? "not-checked" : "unavailable",
      }));
    } finally {
      permissionStream?.getTracks().forEach((track) => track.stop());
    }
  }

  async function toggleMicTest() {
    if (micStatus === "active" || micStatus === "starting") {
      stopMicTest();
      setMicStatus("idle");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === "undefined") {
      setMicStatus("unsupported");
      return;
    }

    setMicStatus("starting");
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: settings.autoGainControl,
          deviceId: settings.inputDeviceId ? { ideal: settings.inputDeviceId } : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
        },
      });
      const AudioContextConstructor = window.AudioContext;
      const audioContext = new AudioContextConstructor();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const samples = new Uint8Array(analyser.fftSize);

      analyser.fftSize = 1024;
      source.connect(analyser);
      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;

      const readLevel = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;

        for (const sample of samples) {
          const centered = sample - 128;
          sum += centered * centered;
        }

        const rms = Math.sqrt(sum / samples.length);
        setMicLevel(Math.min(100, Math.round(rms * 4)));
        animationRef.current = window.requestAnimationFrame(readLevel);
      };

      setMicStatus("active");
      setDiagnostics((current) => ({
        ...current,
        microphone: "ok",
      }));
      void refreshDevices(false);
      readLevel();
    } catch {
      stopMicTest();
      setMicStatus("blocked");
      setDiagnostics((current) => ({
        ...current,
        microphone: "blocked",
      }));
    }
  }

  function stopMicTest() {
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    void audioContextRef.current?.close().catch(() => null);
    audioContextRef.current = null;
    setMicLevel(0);
  }

  async function resetSettings() {
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/profile/voice-settings", {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as {
        settings?: VoiceSettings;
        error?: string;
      } | null;

      if (!response.ok || !data?.settings) {
        throw new Error(data?.error ?? "Could not reset voice settings.");
      }

      setSettings(data.settings);
      cacheVoiceSettings(data.settings);
      setSaveStatus("saved");
      setMessage("Voice settings reset.");
    } catch (error) {
      setSaveStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not reset voice settings.");
    }
  }

  async function runVoiceCheck() {
    await refreshDiagnostics();
    await refreshDevices(false);
  }

  async function refreshDiagnostics() {
    const next: Record<string, DiagnosticState> = {
      inputDevice: inputDevices.length ? "ok" : "not-checked",
      livekit: "unavailable",
      microphone: "not-checked",
      network: typeof navigator !== "undefined" && navigator.onLine ? "ok" : "missing",
      outputDevice: outputSelectionSupported ? (outputDevices.length ? "ok" : "not-checked") : "unavailable",
    };

    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        next.microphone = permission.state === "granted"
          ? "ok"
          : permission.state === "denied"
            ? "blocked"
            : "not-checked";
      } catch {
        next.microphone = "unavailable";
      }
    }

    setDiagnostics(next);
  }

  function queueSave(patch: Partial<VoiceSettings>) {
    if (!loadedRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setSaveStatus("saving");
    setMessage("");

    saveTimerRef.current = window.setTimeout(() => {
      void savePatch(patch);
    }, 180);
  }

  async function savePatch(patch: Partial<VoiceSettings>) {
    try {
      const response = await fetch("/api/profile/voice-settings", {
        body: JSON.stringify(patch),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      });
      const data = (await response.json().catch(() => null)) as {
        settings?: VoiceSettings;
        error?: string;
      } | null;

      if (!response.ok || !data?.settings) {
        throw new Error(data?.error ?? "Could not save voice settings.");
      }

      setSettings((current) => ({
        ...current,
        ...data.settings,
      }));
      cacheVoiceSettings(data.settings);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (error) {
      setSaveStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save voice settings.");
    }
  }

  return (
    <div className="grid gap-4">
      <section className="app-row p-4">
        <SectionHeader
          eyebrow="Audio devices"
          title="Choose what VAL should use before calls"
          description={deviceHint}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DeviceSelect
            devices={inputDevices}
            label="Input device"
            onChange={(value) => updateSetting("inputDeviceId", value)}
            value={settings.inputDeviceId}
          />
          <DeviceSelect
            devices={outputDevices}
            disabled={!outputSelectionSupported}
            label="Output device"
            onChange={(value) => updateSetting("outputDeviceId", value)}
            value={settings.outputDeviceId}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SliderControl
            label="Input volume"
            onChange={(value) => updateSetting("inputVolume", value)}
            value={settings.inputVolume}
          />
          <SliderControl
            label="Output volume"
            onChange={(value) => updateSetting("outputVolume", value)}
            value={settings.outputVolume}
          />
        </div>
        <button
          className="app-button-secondary mt-4 h-11 rounded-lg px-4 text-sm font-semibold transition"
          onClick={() => void refreshDevices(true)}
          type="button"
        >
          Refresh devices
        </button>
      </section>

      <section className="app-row p-4">
        <SectionHeader
          eyebrow="Input mode"
          title="How your microphone opens"
          description="Push-to-talk keybinds are available on desktop; phones use call controls."
        />
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
          <SegmentButton
            active={settings.inputMode === "voice_activity"}
            label="Voice Activity"
            onClick={() => updateInputMode("voice_activity")}
          />
          <SegmentButton
            active={settings.inputMode === "push_to_talk"}
            label="Push to Talk"
            onClick={() => updateInputMode("push_to_talk")}
          />
        </div>
        {settings.inputMode === "voice_activity" ? (
          <div className="mt-4 grid gap-3">
            <ToggleRow
              checked={settings.autoSensitivity}
              description="VAL lets the browser and LiveKit pick a stable threshold."
              label="Automatically determine input sensitivity"
              onChange={(checked) => updateSetting("autoSensitivity", checked)}
            />
            {!settings.autoSensitivity ? (
              <SliderControl
                label="Manual sensitivity"
                onChange={(value) => updateSetting("sensitivity", value)}
                value={settings.sensitivity}
              />
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <label className="hidden sm:block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Desktop keybind
              </span>
              <input
                className="mt-2 h-12 w-full rounded-lg px-3 text-sm"
                maxLength={40}
                onChange={(event) => updateSetting("pushToTalkKey", event.target.value || null)}
                placeholder="Press a key in call controls"
                type="text"
                value={settings.pushToTalkKey ?? ""}
              />
            </label>
            <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm leading-5 text-slate-300 sm:hidden">
              Hold-to-talk is handled in call controls on mobile.
            </p>
          </div>
        )}
      </section>

      <section className="app-row p-4">
        <SectionHeader
          eyebrow="Mic test"
          title="Check your level locally"
          description="This test uses the Web Audio API on this device and does not send audio to VAL."
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="app-button-primary h-12 rounded-lg px-4 text-sm font-bold transition sm:h-11"
            onClick={() => void toggleMicTest()}
            type="button"
          >
            {micStatus === "active" ? "Stop mic test" : micStatus === "starting" ? "Starting..." : "Test mic"}
          </button>
          <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/30">
            <div
              className="h-full rounded-full bg-[#ffd400] transition-[width]"
              style={{ width: `${micLevel}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-300">{micLevel}%</span>
        </div>
        {micStatus === "blocked" ? (
          <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-xs leading-5 text-amber-200">
            Microphone permission is blocked or unavailable. Allow mic access in the browser, then try again.
          </p>
        ) : null}
        {micStatus === "unsupported" ? (
          <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-xs leading-5 text-slate-300">
            This browser does not support the local mic test APIs VAL needs.
          </p>
        ) : null}
      </section>

      <section className="app-row p-4">
        <SectionHeader
          eyebrow="Voice processing"
          title="Clean up noisy rooms"
          description="Processing can improve calls in noisy spaces, but it may reduce raw microphone quality."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ToggleRow checked={settings.noiseSuppression} description="Reduce background noise where supported." label="Noise suppression" onChange={(checked) => updateSetting("noiseSuppression", checked)} />
          <ToggleRow checked={settings.echoCancellation} description="Reduce speaker feedback and echo." label="Echo cancellation" onChange={(checked) => updateSetting("echoCancellation", checked)} />
          <ToggleRow checked={settings.autoGainControl} description="Let the browser smooth loud and quiet input." label="Automatic gain control" onChange={(checked) => updateSetting("autoGainControl", checked)} />
          <ToggleRow checked={settings.voiceIsolation} description="Experimental browser voice isolation when available." label="Noise reduction" onChange={(checked) => updateSetting("voiceIsolation", checked)} />
        </div>
      </section>

      <section className="app-row p-4">
        <SectionHeader
          eyebrow="Call behavior"
          title="Default call posture"
          description="These defaults are applied before LiveKit connects when VAL can do so safely."
        />
        <div className="mt-4 grid gap-3">
          <SliderControl
            label="Lower other app sounds while people speak"
            onChange={(value) => updateSetting("attenuation", value)}
            value={settings.attenuation}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow checked={settings.joinMuted} description="Join with your microphone off." label="Join muted by default" onChange={(checked) => updateSetting("joinMuted", checked)} />
            <ToggleRow checked={settings.joinDeafened} description="Join without remote audio until you enable it." label="Join deafened by default" onChange={(checked) => updateSetting("joinDeafened", checked)} />
            <ToggleRow checked={settings.showVoiceWarnings} description="Show connection and permission warnings." label="Show voice connection warnings" onChange={(checked) => updateSetting("showVoiceWarnings", checked)} />
            <ToggleRow checked={settings.showSpeakingIndicators} description="Keep speaking activity visible in voice surfaces." label="Show speaking indicators" onChange={(checked) => updateSetting("showSpeakingIndicators", checked)} />
          </div>
        </div>
      </section>

      <section className="app-row p-4">
        <SectionHeader
          eyebrow="Troubleshooting"
          title="Voice check"
          description="Diagnostics only report what this browser can actually inspect."
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button className="app-button-secondary h-11 rounded-lg px-4 text-sm font-semibold transition" onClick={() => void runVoiceCheck()} type="button">
            Run Voice Check
          </button>
          <button className="app-button-secondary h-11 rounded-lg px-4 text-sm font-semibold transition" onClick={() => void resetSettings()} type="button">
            Reset Voice Settings
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <DiagnosticLine label="Microphone permission" state={diagnostics.microphone} />
          <DiagnosticLine label="Input device detected" state={diagnostics.inputDevice} />
          <DiagnosticLine label="Output device detected" state={diagnostics.outputDevice} />
          <DiagnosticLine label="Network reachable" state={diagnostics.network} />
          <DiagnosticLine label="LiveKit token/session" state={diagnostics.livekit} />
        </div>
      </section>

      <p className={`text-sm ${saveStatus === "error" ? "text-amber-200" : "text-emerald-300"}`}>
        {saveStatus === "loading"
          ? "Loading voice settings..."
          : saveStatus === "saving"
            ? "Saving voice settings..."
            : saveStatus === "saved"
              ? message || "Voice settings saved."
              : saveStatus === "error"
                ? message
                : ""}
      </p>
    </div>
  );
}

function SectionHeader({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd400]">{eyebrow}</p>
      <h3 className="mt-2 text-base font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>
    </div>
  );
}

function DeviceSelect({
  devices,
  disabled = false,
  label,
  onChange,
  value,
}: {
  devices: AudioDevice[];
  disabled?: boolean;
  label: string;
  onChange: (value: string | null) => void;
  value: string | null;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <select
        className="mt-2 h-12 w-full rounded-lg px-3 text-sm disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        value={value ?? ""}
      >
        <option value="">System default</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
      {disabled ? (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          Output device selection is not exposed by this browser.
        </span>
      ) : null}
    </label>
  );
}

function SliderControl({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block rounded-lg border border-white/10 bg-black/20 p-3">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-white">
        <span>{label}</span>
        <span className="text-xs text-slate-300">{value}%</span>
      </span>
      <input
        className="voice-settings-range mt-3 w-full"
        max={100}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
    </label>
  );
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="rounded-lg border border-white/10 bg-black/20 p-3">
      <span className="flex min-h-11 items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">{label}</span>
        <input
          aria-label={label}
          checked={checked}
          className="app-switch"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </span>
      <span className="mt-2 block text-xs leading-5 text-slate-400">{description}</span>
    </label>
  );
}

function SegmentButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`min-h-11 rounded-lg px-3 text-sm font-bold transition ${
        active ? "app-button-primary" : "app-button-secondary"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function DiagnosticLine({ label, state }: { label: string; state?: DiagnosticState }) {
  return (
    <span className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${getDiagnosticTone(state)}`}>{formatDiagnostic(state)}</span>
    </span>
  );
}

function formatDiagnostic(state?: DiagnosticState) {
  switch (state) {
    case "ok":
      return "OK";
    case "blocked":
      return "Blocked";
    case "missing":
      return "Missing";
    case "unavailable":
      return "Unavailable";
    default:
      return "Not checked";
  }
}

function getDiagnosticTone(state?: DiagnosticState) {
  switch (state) {
    case "ok":
      return "text-emerald-300";
    case "blocked":
    case "missing":
      return "text-amber-200";
    case "unavailable":
      return "text-slate-500";
    default:
      return "text-slate-300";
  }
}
