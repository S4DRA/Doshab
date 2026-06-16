"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOptionalPersistentCall } from "@/components/calls/persistent-call-provider";
import {
  getBrowserPushDiagnostics,
  getPushRegistrationMessage,
  registerPushNotifications,
  type BrowserPushDiagnostics,
  type PushRegistrationResult,
} from "@/lib/browser-push";

const tourCompletedKey = "doshabTourCompleted";
const desktopTourCompletedKey = "doshabTourVariantCompletedDesktop";
const mobileTourCompletedKey = "doshabTourVariantCompletedMobile";
const tourSkippedAtKey = "doshabTourSkippedAt";
const tourStepKey = "doshabTourStep";
const desktopTourStepKey = "doshabTourStepDesktop";
const mobileTourStepKey = "doshabTourStepMobile";
const notificationCompletedKey = "doshabNotificationOnboardingCompleted";
const notificationDismissedAtKey = "doshabNotificationOnboardingDismissedAt";
const notificationRemindLaterAtKey = "doshabNotificationOnboardingRemindLaterAt";
const notificationSettingsKey = "doshabProfileSettings";
const notificationDismissalCooldownMs = 7 * 24 * 60 * 60 * 1000;

type CoordinatorMode = "idle" | "notification" | "tour";
type NotificationFlowStatus = "blocked" | "error" | "idle" | "saving" | "success" | "unsupported";
type TourVariant = "desktop" | "mobile";

type TourStep = {
  icon: React.ReactNode;
  primaryLabel?: string;
  target?: string;
  text: string;
  title: string;
};

const desktopTourSteps: TourStep[] = [
  {
    icon: <SparkIcon />,
    primaryLabel: "Start tour",
    text: "VAL is your private space for spaces, voice channels, messages, friends, and focused dark or light modes.",
    title: "Welcome to VAL",
  },
  {
    icon: <GroupIcon />,
    target: "groups-sidebar",
    text: "Create or join spaces to organize your friends, communities, or teams.",
    title: "Your spaces live here",
  },
  {
    icon: <ChannelIcon />,
    target: "channels-list",
    text: "Use text channels for conversations and voice channels to jump into calls instantly.",
    title: "Channels keep things organized",
  },
  {
    icon: <MicIcon />,
    target: "voice-channels",
    text: "Click a voice channel to join directly. You can see who is inside before joining.",
    title: "Join voice instantly",
  },
  {
    icon: <MessageIcon />,
    target: "chat-panel",
    text: "Send messages, follow conversations, and stay connected inside each channel.",
    title: "Talk in real time",
  },
  {
    icon: <FriendsIcon />,
    target: "friends-nav",
    text: "Add friends, accept requests, and invite people into your spaces.",
    title: "Bring your friends",
  },
  {
    icon: <BellIcon />,
    primaryLabel: "Set up notifications",
    target: "notifications-nav",
    text: "VAL can notify you about messages, invites, missed calls, and incoming calls.",
    title: "Never miss calls or messages",
  },
  {
    icon: <PaletteIcon />,
    target: "themes-settings",
    text: "Choose the VAL mode that fits your environment: high-contrast dark or high-contrast light.",
    title: "Make VAL feel personal",
  },
  {
    icon: <CheckIcon />,
    text: "Create a space, join a voice channel, or invite your friends to start using VAL.",
    title: "You're ready",
  },
];

const mobileTourSteps: TourStep[] = [
  {
    icon: <SparkIcon />,
    primaryLabel: "Start tour",
    text: "VAL keeps your spaces, calls, friends, and dark or light mode close while leaving room for the conversation.",
    title: "Welcome to VAL",
  },
  {
    icon: <ChannelIcon />,
    target: "mobile-bottom-nav",
    text: "Use the bottom bar to jump between friends, create actions, spaces, notifications, and your profile.",
    title: "Bottom navigation",
  },
  {
    icon: <GroupIcon />,
    target: "mobile-channel-drawer",
    text: "Tap the channel shortcut to pin a space or open the full channels view when you need more room.",
    title: "Groups and channels drawer",
  },
  {
    icon: <MicIcon />,
    target: "voice-channels",
    text: "Voice rooms open with one tap, and VAL shows who is inside before you join.",
    title: "Tap voice to join",
  },
  {
    icon: <MessageIcon />,
    target: "chat-panel",
    text: "The composer stays large enough for quick replies while the chat keeps scrolling above it.",
    title: "Chat and composer",
  },
  {
    icon: <FriendsIcon />,
    target: "friends-nav",
    text: "Open friends to add people, answer requests, start messages, or invite them into spaces.",
    title: "Friends and invites",
  },
  {
    icon: <BellIcon />,
    target: "notifications-nav",
    text: "Mobile alerts help VAL reach you for incoming calls, missed calls, messages, and invites.",
    title: "Mobile notifications and calls",
  },
  {
    icon: <PaletteIcon />,
    target: "themes-settings",
    text: "Dark and light mode carry across mobile and desktop, so VAL stays consistent everywhere.",
    title: "Themes",
  },
  {
    icon: <CheckIcon />,
    text: "You are ready to create a space, join a voice room, or invite friends from your phone.",
    title: "You're ready",
  },
];

export function DashboardOnboardingCoordinator() {
  const pathname = usePathname();
  const callContext = useOptionalPersistentCall();
  const activeCall = callContext?.activeCall ?? null;
  const [mode, setMode] = useState<CoordinatorMode>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [diagnostics, setDiagnostics] = useState<BrowserPushDiagnostics | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationFlowStatus>("idle");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showPhoneSteps, setShowPhoneSteps] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [activeTourVariant, setActiveTourVariant] = useState<TourVariant>("desktop");
  const dialogRef = useRef<HTMLElement | null>(null);

  const currentTourSteps = activeTourVariant === "mobile" ? mobileTourSteps : desktopTourSteps;
  const step = currentTourSteps[stepIndex] ?? currentTourSteps[0];
  const shouldAvoidPrompts = useCallback(
    () => Boolean(activeCall) || isIncomingCallVisible(),
    [activeCall],
  );

  const refreshDiagnostics = useCallback(async () => {
    const nextDiagnostics = await getBrowserPushDiagnostics();
    setDiagnostics(nextDiagnostics);

    if (nextDiagnostics.status === "enabled") {
      writeStorage(notificationCompletedKey, "true");
    }

    return nextDiagnostics;
  }, []);

  const maybeOpenNotificationFlow = useCallback(async () => {
    if (!isMobile || shouldAvoidPrompts() || !canAutoShowNotificationPrompt()) {
      return;
    }

    const nextDiagnostics = await refreshDiagnostics();

    if (nextDiagnostics.status === "not_enabled") {
      window.setTimeout(() => {
        if (!shouldAvoidPrompts()) {
          setMode("notification");
        }
      }, 900);
    }
  }, [isMobile, refreshDiagnostics, shouldAvoidPrompts]);

  const closeNotificationFlow = useCallback(() => {
    setMode("idle");
  }, []);

  const completeTour = useCallback(() => {
    writeStorage(tourCompletedKey, "true");
    writeStorage(getTourCompletionKey(activeTourVariant), "true");
    removeStorage(tourSkippedAtKey);
    removeStorage(tourStepKey);
    removeStorage(getTourStepKey(activeTourVariant));
    setMode("idle");
    void maybeOpenNotificationFlow();
  }, [activeTourVariant, maybeOpenNotificationFlow]);

  const skipTour = useCallback(() => {
    writeStorage(tourSkippedAtKey, new Date().toISOString());
    removeStorage(tourStepKey);
    removeStorage(getTourStepKey(activeTourVariant));
    setMode("idle");
    window.setTimeout(() => void maybeOpenNotificationFlow(), 1800);
  }, [activeTourVariant, maybeOpenNotificationFlow]);

  const goNext = useCallback(() => {
    if (stepIndex >= currentTourSteps.length - 1) {
      completeTour();
      return;
    }

    const nextStep = stepIndex + 1;
    setStepIndex(nextStep);
    writeStorage(getTourStepKey(activeTourVariant), String(nextStep));
    writeStorage(tourStepKey, String(nextStep));
  }, [activeTourVariant, completeTour, currentTourSteps.length, stepIndex]);

  const handlePrimaryTourAction = useCallback(() => {
    goNext();
  }, [goNext]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!pathname.startsWith("/dashboard") || shouldAvoidPrompts()) {
        return;
      }

      const variant = window.innerWidth < 768 ? "mobile" : "desktop";
      const steps = variant === "mobile" ? mobileTourSteps : desktopTourSteps;
      const storedStep = readStorage(getTourStepKey(variant)) ?? readStorage(tourStepKey);
      const completed = readStorage(getTourCompletionKey(variant)) === "true";
      const skipped = Boolean(readStorage(tourSkippedAtKey));

      if (!completed && !skipped) {
        const parsedStep = Number(storedStep);
        setActiveTourVariant(variant);
        setStepIndex(
          Number.isInteger(parsedStep) && parsedStep >= 0 && parsedStep < steps.length
            ? parsedStep
            : 0,
        );
        setMode("tour");
        return;
      }

      await maybeOpenNotificationFlow();
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [maybeOpenNotificationFlow, pathname, shouldAvoidPrompts]);

  useEffect(() => {
    if (mode === "idle") {
      return;
    }

    if (shouldAvoidPrompts()) {
      const timer = window.setTimeout(() => setMode("idle"), 0);

      return () => window.clearTimeout(timer);
    }
  }, [mode, shouldAvoidPrompts]);

  useEffect(() => {
    const handleRestart = () => {
      const variant: TourVariant = window.innerWidth < 768 ? "mobile" : "desktop";

      removeStorage(tourCompletedKey);
      removeStorage(getTourCompletionKey(variant));
      removeStorage(tourSkippedAtKey);
      writeStorage(tourStepKey, "0");
      writeStorage(getTourStepKey(variant), "0");
      setActiveTourVariant(variant);
      setStepIndex(0);
      setMode("tour");
    };

    window.addEventListener("doshab:restart-platform-tour", handleRestart);

    return () => window.removeEventListener("doshab:restart-platform-tour", handleRestart);
  }, []);

  useEffect(() => {
    if (mode !== "tour") {
      const timer = window.setTimeout(() => setTargetRect(null), 0);

      return () => window.clearTimeout(timer);
    }

    const updateTargetRect = () => {
      if (!step.target) {
        setTargetRect(null);
        return;
      }

      const element = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-tour-target="${step.target}"]`),
      ).find((targetElement) => {
        const rect = targetElement.getBoundingClientRect();

        return isVisibleRect(rect);
      });

      setTargetRect(element?.getBoundingClientRect() ?? null);
    };

    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [mode, step.target]);

  useEffect(() => {
    if (mode === "idle") {
      return;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => {
      const focusTarget = dialogRef.current?.querySelector<HTMLElement>(
        "button, a, input, textarea, select, [tabindex]:not([tabindex='-1'])",
      );
      focusTarget?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();

      if (mode === "tour") {
        skipTour();
      } else {
        closeNotificationFlow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [closeNotificationFlow, mode, skipTour]);

  async function enableNotifications() {
    setNotificationStatus("saving");
    setNotificationMessage("Opening browser permission prompt...");

    try {
      const result = await registerPushNotifications();
      const nextDiagnostics = await refreshDiagnostics();

      if (result.ok) {
        enableLocalNotificationDefaults();
        writeStorage(notificationCompletedKey, "true");
        removeStorage(notificationDismissedAtKey);
        removeStorage(notificationRemindLaterAtKey);
        setNotificationMessage(
          "Notifications are on. You'll receive VAL alerts for calls, messages, and invites.",
        );
        setNotificationStatus("success");
        return;
      }

      setNotificationMessage(getPushRegistrationMessage(result));
      setNotificationStatus(nextDiagnostics.status === "blocked" ? "blocked" : "error");
    } catch {
      setNotificationMessage(
        getPushRegistrationMessage({
          ok: false,
          reason: "subscription-failed",
        } satisfies PushRegistrationResult),
      );
      setNotificationStatus("error");
    }
  }

  function handleNotNow() {
    const now = Date.now();
    writeStorage(notificationDismissedAtKey, new Date(now).toISOString());
    writeStorage(
      notificationRemindLaterAtKey,
      new Date(now + notificationDismissalCooldownMs).toISOString(),
    );
    closeNotificationFlow();
  }

  function handleDontAskAgain() {
    writeStorage(notificationCompletedKey, "true");
    closeNotificationFlow();
  }

  if (mode === "idle") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] text-slate-100" aria-live="polite">
      {mode === "tour" ? (
        <TourOverlay
          canGoBack={stepIndex > 0}
          isMobile={activeTourVariant === "mobile"}
          onBack={() => {
            const previousStep = Math.max(0, stepIndex - 1);
            setStepIndex(previousStep);
            writeStorage(tourStepKey, String(previousStep));
          }}
          onFinish={completeTour}
          onNext={handlePrimaryTourAction}
          onSkip={skipTour}
          refElement={dialogRef}
          step={step}
          stepIndex={stepIndex}
          targetRect={targetRect}
          totalSteps={currentTourSteps.length}
        />
      ) : (
        <NotificationOnboarding
          diagnostics={diagnostics}
          flowStatus={notificationStatus}
          message={notificationMessage}
          onDontAskAgain={handleDontAskAgain}
          onEnable={enableNotifications}
          onNotNow={handleNotNow}
          onShowSteps={() => setShowPhoneSteps((current) => !current)}
          refElement={dialogRef}
          showPhoneSteps={showPhoneSteps}
        />
      )}
    </div>
  );
}

function TourOverlay({
  canGoBack,
  isMobile,
  onBack,
  onFinish,
  onNext,
  onSkip,
  refElement,
  step,
  stepIndex,
  targetRect,
  totalSteps,
}: {
  canGoBack: boolean;
  isMobile: boolean;
  onBack: () => void;
  onFinish: () => void;
  onNext: () => void;
  onSkip: () => void;
  refElement: React.MutableRefObject<HTMLElement | null>;
  step: TourStep;
  stepIndex: number;
  targetRect: DOMRect | null;
  totalSteps: number;
}) {
  const isFinalStep = stepIndex === totalSteps - 1;
  const cardPosition = useMemo(() => getTourCardPosition(targetRect), [targetRect]);

  return (
    <>
      <div className="absolute inset-0 bg-black/72 backdrop-blur-sm" />
      {!isMobile && targetRect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-xl border border-[#FF5F25] bg-[#FF5F25]/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.68),0_0_34px_rgba(255,95,37,0.45)] motion-safe:transition-all"
          style={{
            height: targetRect.height + 16,
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
          }}
        />
      ) : null}
      <section
        aria-label="VAL platform tour"
        aria-modal="true"
        className={`app-panel fixed max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 shadow-2xl sm:p-5 ${
          isMobile
            ? "inset-x-3 bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)]"
            : "w-[min(25rem,calc(100vw-2rem))]"
        }`}
        ref={refElement}
        role="dialog"
        style={!isMobile ? cardPosition : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#FF5F25]/35 bg-[#FF5F25]/15 text-[#FFB199]">
            {step.icon}
          </span>
          <button
            className="app-icon-button h-11 w-11 shrink-0"
            onClick={onSkip}
            type="button"
            aria-label="Skip platform tour"
            title="Skip tour"
          >
            <CloseIcon />
          </button>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">{step.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{step.text}</p>
        {!targetRect && step.target ? (
          <p className="mt-3 rounded-lg border border-white/10 bg-white/7 px-3 py-2 text-xs leading-5 text-slate-400">
            This part of the UI may be on another route or hidden at this screen size.
          </p>
        ) : null}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#FF5F25] motion-safe:transition-all"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
          <button
            className="app-button-secondary h-12 rounded-lg px-4 text-sm font-semibold disabled:opacity-45"
            disabled={!canGoBack}
            onClick={onBack}
            type="button"
          >
            Back
          </button>
          <button
            className="min-h-12 rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-300 transition hover:border-white/35 hover:text-white"
            onClick={onSkip}
            type="button"
          >
            Skip tour
          </button>
          <button
            className="app-button-primary h-12 rounded-lg px-4 text-sm font-bold"
            onClick={isFinalStep ? onFinish : onNext}
            type="button"
          >
            {isFinalStep ? "Finish" : step.primaryLabel ?? "Next"}
          </button>
        </div>
        {isFinalStep ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link
              className="app-button-secondary inline-flex h-12 items-center justify-center rounded-lg px-4 text-sm font-semibold"
              href="/dashboard/profile"
              onClick={onFinish}
            >
              Open settings
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/60 hover:text-white"
              href="/dashboard"
              onClick={onFinish}
            >
              Create space
            </Link>
          </div>
        ) : null}
      </section>
    </>
  );
}

function NotificationOnboarding({
  diagnostics,
  flowStatus,
  message,
  onDontAskAgain,
  onEnable,
  onNotNow,
  onShowSteps,
  refElement,
  showPhoneSteps,
}: {
  diagnostics: BrowserPushDiagnostics | null;
  flowStatus: NotificationFlowStatus;
  message: string;
  onDontAskAgain: () => void;
  onEnable: () => void;
  onNotNow: () => void;
  onShowSteps: () => void;
  refElement: React.MutableRefObject<HTMLElement | null>;
  showPhoneSteps: boolean;
}) {
  const isBlocked = flowStatus === "blocked" || diagnostics?.status === "blocked";
  const isUnsupported = flowStatus === "unsupported" || diagnostics?.status === "unsupported";
  const isEnabled = flowStatus === "success" || diagnostics?.status === "enabled";

  return (
    <>
      <div className="absolute inset-0 bg-black/72 backdrop-blur-sm" />
      <section
        aria-label="Notification onboarding"
        aria-modal="true"
        className="app-panel fixed inset-x-3 bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 shadow-2xl sm:inset-x-1/2 sm:bottom-auto sm:top-1/2 sm:w-[min(34rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-5"
        ref={refElement}
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-[#FF5F25]/35 bg-[#FF5F25]/15 text-[#FFB199]">
            <BellIcon />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
              VAL alerts
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {isBlocked
                ? "Notifications are blocked"
                : isUnsupported
                  ? "Push is not supported here"
                  : isEnabled
                    ? "Notifications are already enabled"
                    : "Turn on VAL notifications"}
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          {isBlocked
            ? "Enable notifications from your browser or phone settings, then return to VAL."
            : isUnsupported
              ? "Your browser does not fully support background push notifications. Try installing VAL from Chrome or using a supported browser."
              : isEnabled
                ? "Notifications are already enabled on this device."
                : "Get message alerts, space invites, and incoming call notifications even when VAL is closed."}
        </p>

        {diagnostics?.installedPwa === "yes" ? (
          <p className="mt-3 inline-flex rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-200">
            Installed app mode detected
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {["Incoming call alerts", "Message notifications", "Friend and space invites", "Missed call alerts"].map(
            (benefit) => (
              <span
                className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
                key={benefit}
              >
                <CheckIcon className="h-4 w-4 shrink-0 text-emerald-300" />
                {benefit}
              </span>
            ),
          )}
        </div>

        {message ? (
          <p
            className={`mt-4 rounded-lg border px-3 py-3 text-sm leading-5 ${
              flowStatus === "success"
                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                : "border-amber-300/20 bg-amber-400/10 text-amber-100"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}

        <button
          className="mt-4 min-h-11 rounded-lg border border-white/15 px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/60 hover:text-white"
          onClick={onShowSteps}
          type="button"
        >
          {showPhoneSteps ? "Hide phone setup steps" : "Show phone setup steps"}
        </button>

        {showPhoneSteps ? <PhoneSetupSteps diagnostics={diagnostics} /> : null}

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Call alerts need notification permission, push subscription, and phone notification settings enabled. Some phones may not show full-screen call screens for PWAs, but tapping the notification will open VAL and join the call.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <button
            className="app-button-primary h-12 rounded-lg px-4 text-sm font-bold disabled:opacity-60"
            disabled={flowStatus === "saving" || isBlocked || isUnsupported || isEnabled}
            onClick={onEnable}
            type="button"
          >
            {flowStatus === "saving" ? "Enabling..." : "Enable notifications"}
          </button>
          <button
            className="app-button-secondary h-12 rounded-lg px-4 text-sm font-semibold"
            onClick={onNotNow}
            type="button"
          >
            Not now
          </button>
          <button
            className="min-h-12 rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-300 transition hover:border-white/35 hover:text-white"
            onClick={onDontAskAgain}
            type="button"
          >
            Don&apos;t ask again
          </button>
        </div>
      </section>
    </>
  );
}

function PhoneSetupSteps({ diagnostics }: { diagnostics: BrowserPushDiagnostics | null }) {
  const platform = getDevicePlatform();
  const installed = diagnostics?.installedPwa === "yes";
  const steps =
    platform === "ios"
      ? [
          "Open Settings.",
          "Tap Notifications.",
          "Find VAL if it is installed.",
          "Allow Notifications.",
          "Enable Lock Screen, Notification Center, and Banners.",
        ]
      : installed
        ? [
            "Long press the VAL app icon.",
            "Tap App info.",
            "Tap Notifications.",
            "Turn on notifications.",
            "Enable Pop-up, Floating, Banner, or Lock screen notifications if your phone shows them.",
          ]
        : [
            "Open Chrome settings.",
            "Open Site settings.",
            "Tap Notifications.",
            "Find VAL.",
            "Allow notifications.",
          ];

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-semibold text-white">
        {platform === "ios"
          ? "iPhone and iOS"
          : installed
            ? "Android installed app"
            : "Chrome on Android"}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        A web app cannot reliably open every phone&apos;s exact floating notification settings page. Use these manual steps when a direct settings link is unavailable.
      </p>
      <ol className="mt-3 grid gap-2 text-sm leading-5 text-slate-300">
        {steps.map((item, index) => (
          <li className="flex gap-2" key={item}>
            <span className="text-[#FFB199]">{index + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function getTourCardPosition(targetRect: DOMRect | null): React.CSSProperties {
  if (!targetRect) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const cardWidth = Math.min(400, window.innerWidth - 32);
  const leftCandidate =
    targetRect.right + cardWidth + 24 < window.innerWidth
      ? targetRect.right + 18
      : targetRect.left - cardWidth - 18;
  const left = Math.min(Math.max(16, leftCandidate), window.innerWidth - cardWidth - 16);
  const top = Math.min(Math.max(16, targetRect.top), window.innerHeight - 360);

  return {
    left,
    top,
    width: cardWidth,
  };
}

function canAutoShowNotificationPrompt() {
  if (readStorage(notificationCompletedKey) === "true") {
    return false;
  }

  const remindLaterAt = Date.parse(readStorage(notificationRemindLaterAtKey) ?? "");

  return Number.isNaN(remindLaterAt) || remindLaterAt <= Date.now();
}

function getTourCompletionKey(variant: TourVariant) {
  return variant === "mobile" ? mobileTourCompletedKey : desktopTourCompletedKey;
}

function getTourStepKey(variant: TourVariant) {
  return variant === "mobile" ? mobileTourStepKey : desktopTourStepKey;
}

function enableLocalNotificationDefaults() {
  try {
    const stored = window.localStorage.getItem(notificationSettingsKey);
    const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};

    window.localStorage.setItem(
      notificationSettingsKey,
      JSON.stringify({
        ...parsed,
        callNotifications: parsed.callNotifications ?? true,
        enableNotifications: true,
        friendInviteNotifications: parsed.friendInviteNotifications ?? true,
        messageNotifications: parsed.messageNotifications ?? true,
        showMessagePreview: parsed.showMessagePreview ?? true,
        soundEnabled: parsed.soundEnabled ?? true,
      }),
    );
  } catch {
    window.localStorage.setItem(
      notificationSettingsKey,
      JSON.stringify({
        callNotifications: true,
        enableNotifications: true,
        friendInviteNotifications: true,
        messageNotifications: true,
        showMessagePreview: true,
        soundEnabled: true,
      }),
    );
  }
}

function getDevicePlatform() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  return "android";
}

function isIncomingCallVisible() {
  if (typeof document === "undefined") {
    return false;
  }

  return (
    document.documentElement.hasAttribute("data-doshab-incoming-call") ||
    Boolean(document.querySelector("[data-doshab-incoming-call-overlay='true']"))
  );
}

function isVisibleRect(rect: DOMRect) {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Onboarding state is progressive enhancement.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Onboarding state is progressive enhancement.
  }
}

function SparkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2 9.8 8.2 4 10.5l5.8 2.3L12 19l2.2-6.2 5.8-2.3-5.8-2.3L12 2Z" />
      <path d="M19 15v4" />
      <path d="M21 17h-4" />
    </svg>
  );
}

function GroupIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 6h16v12H4z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}

function ChannelIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function MicIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}

function MessageIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function FriendsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PaletteIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22a10 10 0 1 1 10-10 3 3 0 0 1-3 3h-1.5a2 2 0 0 0-1.8 2.9l.3.6A2.4 2.4 0 0 1 13.8 22H12Z" />
      <circle cx="7.5" cy="10.5" r=".8" />
      <circle cx="10.5" cy="7.5" r=".8" />
      <circle cx="14" cy="7.5" r=".8" />
      <circle cx="16.5" cy="10.5" r=".8" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
