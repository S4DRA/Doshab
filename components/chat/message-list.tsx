"use client";

import { memo, useEffect, useRef, useState } from "react";

import { AvatarInitials } from "@/components/ui/avatar-initials";
import { reactionEmojis } from "@/lib/chat-constants";
import { formatReadableTimestamp } from "@/lib/utils";
import type { ChatMessage } from "@/types";

type MessageListProps = {
  canPinMessages?: boolean;
  currentUserId?: string;
  messages: ChatMessage[];
  onMessageUpdate?: (message: ChatMessage) => void;
  onReply?: (message: ChatMessage) => void;
};

type MessageRowProps = {
  canPinMessages: boolean;
  currentUserId?: string;
  isGrouped: boolean;
  message: ChatMessage;
  onMessageUpdate?: (message: ChatMessage) => void;
  onReport: () => void;
  onReply?: (message: ChatMessage) => void;
  showDateSeparator: boolean;
};

const reportReasons = [
  { label: "Spam", value: "SPAM" },
  { label: "Harassment", value: "HARASSMENT" },
  { label: "Hate or abuse", value: "HATE_OR_ABUSE" },
  { label: "NSFW/inappropriate", value: "NSFW" },
  { label: "Other", value: "OTHER" },
];

function MessageListComponent({
  canPinMessages = false,
  currentUserId,
  messages,
  onMessageUpdate,
  onReply,
}: MessageListProps) {
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);

  if (!messages.length) {
    return (
      <div className="app-card border-dashed p-5 text-center sm:p-6">
        <p className="text-sm font-semibold text-white">No messages yet</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Start the conversation with the first message.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="message-stack mx-auto flex min-h-full w-full max-w-[min(100%,82rem)] flex-col justify-end px-1 sm:px-2">
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          const isGrouped = shouldGroupMessage(previousMessage, message);
          const showDateSeparator = shouldShowDateSeparator(previousMessage, message);

          return (
            <MemoMessageRow
              canPinMessages={canPinMessages}
              currentUserId={currentUserId}
              isGrouped={isGrouped}
              key={message.id}
              message={message}
              onMessageUpdate={onMessageUpdate}
              onReport={() => setReportingMessage(message)}
              onReply={onReply}
              showDateSeparator={showDateSeparator}
            />
          );
        })}
      </div>
      {reportingMessage ? (
        <ReportDialog
          message={reportingMessage}
          onClose={() => setReportingMessage(null)}
        />
      ) : null}
    </>
  );
}

export const MessageList = memo(
  MessageListComponent,
  (previousProps, nextProps) =>
    previousProps.canPinMessages === nextProps.canPinMessages &&
    previousProps.currentUserId === nextProps.currentUserId &&
    previousProps.messages === nextProps.messages &&
    previousProps.onMessageUpdate === nextProps.onMessageUpdate &&
    previousProps.onReply === nextProps.onReply,
);

const MemoMessageRow = memo(function MessageRow({
  canPinMessages,
  currentUserId,
  isGrouped,
  message,
  onMessageUpdate,
  onReport,
  onReply,
  showDateSeparator,
}: MessageRowProps) {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsPanelRef = useRef<HTMLDivElement | null>(null);
  const actionsToggleRef = useRef<HTMLButtonElement | null>(null);
  const senderLabel = message.sender.name || message.sender.email;
  const isOwnMessage = Boolean(currentUserId && message.sender.id === currentUserId);
  const visibleReactions = (message.reactions ?? []).filter((item) => item.count > 0);

  useEffect(() => {
    if (!actionsOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActionsOpen(false);
      }
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;

      if (
        !(target instanceof Node) ||
        actionsPanelRef.current?.contains(target) ||
        actionsToggleRef.current?.contains(target)
      ) {
        return;
      }

      setActionsOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [actionsOpen]);

  async function updateFromResponse(response: Response) {
    if (!response.ok) {
      throw new Error("Action failed.");
    }

    const updatedMessage = (await response.json()) as ChatMessage;
    onMessageUpdate?.(updatedMessage);
  }

  async function toggleReaction(emoji: string) {
    if (!currentUserId || busyAction) {
      return;
    }

    setBusyAction(`reaction:${emoji}`);

    try {
      await updateFromResponse(
        await fetch(`/api/messages/${message.id}/reactions`, {
          body: JSON.stringify({ emoji }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        }),
      );
    } catch {
      // The next refresh will recover action state.
    } finally {
      setBusyAction(null);
    }
  }

  async function togglePin() {
    if (!canPinMessages || busyAction) {
      return;
    }

    setBusyAction("pin");

    try {
      await updateFromResponse(
        await fetch(`/api/messages/${message.id}/pin`, {
          method: "POST",
        }),
      );
    } catch {
      // Pin state will refresh from the server.
    } finally {
      setBusyAction(null);
    }
  }

  async function vote(optionId: string) {
    if (!message.poll || busyAction) {
      return;
    }

    setBusyAction(`poll:${optionId}`);

    try {
      await updateFromResponse(
        await fetch(`/api/polls/${message.poll.id}/vote`, {
          body: JSON.stringify({ optionId }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        }),
      );
    } catch {
      // Poll state will refresh from the server.
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      {showDateSeparator ? (
        <div className="message-date-separator flex items-center gap-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          <time>{formatMessageDay(message.createdAt)}</time>
          <span className="h-px flex-1 bg-white/10" />
        </div>
      ) : null}
      <article
        className={`message-row group/message flex scroll-mt-28 gap-2.5 border border-transparent px-1.5 transition sm:gap-3 sm:px-2 ${
          isGrouped ? "message-row-grouped py-1" : "py-2.5"
        } ${message.pinnedAt ? "message-row-pinned" : ""} ${
          isOwnMessage ? "message-row-own" : "message-row-friend"
        }`}
        id={`message-${message.id}`}
      >
        <div className="message-avatar-slot shrink-0">
          {isGrouped ? (
            <time className="message-group-time hidden text-[10px] text-slate-600 sm:block">
              {formatMessageTime(message.createdAt)}
            </time>
          ) : (
            <AvatarInitials
              imageUrl={message.sender.image}
              value={senderLabel}
            />
          )}
        </div>
        <div className="message-shell min-w-0 flex-1">
          <div className="message-bubble relative pr-12 sm:pr-14">
          <button
            aria-expanded={actionsOpen}
            aria-label={`More actions for ${senderLabel}`}
            className={`message-action-toggle app-icon-button absolute right-3 top-3 z-10 h-8 w-8 rounded-full border border-white/10 bg-black/15 text-slate-400 shadow-[0_10px_18px_-16px_rgba(0,0,0,0.95)] transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus-visible:border-[#FF5F25]/60 focus-visible:text-white ${
              actionsOpen
                ? "opacity-100"
                : "opacity-100 sm:pointer-events-none sm:opacity-0 sm:group-hover/message:pointer-events-auto sm:group-hover/message:opacity-100 sm:group-focus-within/message:pointer-events-auto sm:group-focus-within/message:opacity-100"
            }`}
            onClick={() => setActionsOpen((open) => !open)}
            ref={actionsToggleRef}
            type="button"
          >
            <span aria-hidden="true" className="text-sm leading-none">...</span>
          </button>

          {!isGrouped ? (
            <div className="message-meta flex min-w-0 items-start gap-2">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="min-w-0 max-w-full truncate text-sm font-semibold text-white">
                  {senderLabel}
                </p>
                <time className="text-[11px] text-slate-500 sm:text-xs">
                  {formatReadableTimestamp(message.createdAt)}
                </time>
                {message.pinnedAt ? (
                  <span className="rounded-md border border-[#FF5F25]/30 bg-[#FF5F25]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FFB199]">
                    Pinned
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {message.replyTo ? (
            <button
              className="mt-2 block max-w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition hover:border-[#FF5F25]/50"
              onClick={() => scrollToMessage(message.replyTo?.id)}
              type="button"
            >
              <span className="block truncate text-xs font-semibold text-slate-200">
                Replying to {message.replyTo.sender.name || message.replyTo.sender.email}
              </span>
              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-400">
                {message.replyTo.content || "Original message unavailable."}
              </span>
            </button>
          ) : null}

          <p className={`${isGrouped ? "mt-0" : "mt-1"} whitespace-pre-wrap break-words text-[0.95rem] leading-6 text-slate-200 [overflow-wrap:anywhere]`}>
            {message.content}
          </p>

          {message.poll ? <PollCard message={message} onVote={vote} /> : null}

          {visibleReactions.length ? (
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5">
              {visibleReactions.map((reaction) => (
                <button
                  aria-label={`${reaction.reacted ? "Remove" : "Repeat"} ${reaction.emoji} reaction`}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition ${
                    reaction.reacted
                      ? "border-[#FF5F25]/70 bg-[#FF5F25]/15 text-white"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:text-white"
                  }`}
                  disabled={!currentUserId || busyAction === `reaction:${reaction.emoji}`}
                  key={reaction.emoji}
                  onClick={() => void toggleReaction(reaction.emoji)}
                  type="button"
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          ) : null}

          {actionsOpen ? (
            <div
              className="message-actions mt-3 flex min-w-0 flex-wrap items-center justify-end gap-1.5 rounded-xl border border-white/10 bg-black/15 p-2 shadow-[0_14px_28px_-24px_rgba(0,0,0,0.9)]"
              ref={actionsPanelRef}
            >
              {reactionEmojis.map((emoji) => {
                const reaction = message.reactions?.find((item) => item.emoji === emoji);
                const reacted = Boolean(reaction?.reacted);
                const count = reaction?.count ?? 0;

                return (
                  <button
                    aria-label={`${reacted ? "Remove" : "Add"} ${emoji} reaction`}
                    className={`inline-flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-2 text-sm transition sm:min-h-8 sm:min-w-8 ${
                      reacted
                        ? "border-[#FF5F25]/70 bg-[#FF5F25]/15 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white"
                    }`}
                    disabled={!currentUserId || busyAction === `reaction:${emoji}`}
                    key={emoji}
                    onClick={() => void toggleReaction(emoji)}
                    type="button"
                  >
                    <span>{emoji}</span>
                    {count ? <span className="text-[11px] font-bold">{count}</span> : null}
                  </button>
                );
              })}
              <button
                className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white sm:min-h-8"
                onClick={() => {
                  setActionsOpen(false);
                  onReply?.(message);
                }}
                type="button"
              >
                Reply
              </button>
              {canPinMessages ? (
                <button
                  className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-slate-300 transition hover:border-[#FF5F25]/60 hover:text-white sm:min-h-8"
                  disabled={busyAction === "pin"}
                  onClick={() => {
                    setActionsOpen(false);
                    void togglePin();
                  }}
                  type="button"
                >
                  {message.pinnedAt ? "Unpin" : "Pin"}
                </button>
              ) : null}
              <button
                className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-slate-400 transition hover:border-white/25 hover:text-white sm:min-h-8"
                onClick={() => {
                  setActionsOpen(false);
                  onReport();
                }}
                type="button"
              >
                Report
              </button>
            </div>
          ) : null}
          </div>
      </div>
      </article>
    </>
  );
}, areMessageRowPropsEqual);

function PollCard({
  message,
  onVote,
}: {
  message: ChatMessage;
  onVote: (optionId: string) => void;
}) {
  const poll = message.poll;

  if (!poll) {
    return null;
  }

  return (
    <div className="mt-3 max-w-xl rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm font-semibold text-white">{poll.question}</p>
      <div className="mt-3 grid gap-2">
        {poll.options.map((option) => {
          const selected = poll.userVoteOptionId === option.id;
          const percentage = poll.totalVotes
            ? Math.round((option.voteCount / poll.totalVotes) * 100)
            : 0;

          return (
            <button
              className={`relative min-h-11 overflow-hidden rounded-lg border px-3 py-2 text-left transition ${
                selected
                  ? "border-[#FF5F25]/70 bg-[#FF5F25]/12"
                  : "border-white/10 bg-[#050505]/60 hover:border-white/25"
              }`}
              key={option.id}
              onClick={() => onVote(option.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-[#FF5F25]/15"
                style={{ width: `${percentage}%` }}
              />
              <span className="relative flex items-center justify-between gap-3 text-sm">
                <span className="break-words font-semibold text-slate-100">
                  {option.text}
                </span>
                <span className="shrink-0 text-xs font-bold text-slate-300">
                  {option.voteCount} / {percentage}%
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}

function ReportDialog({
  message,
  onClose,
}: {
  message: ChatMessage;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(reportReasons[0].value);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useCloseOnEscape(onClose);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node) || panelRef.current?.contains(target)) {
        return;
      }

      onClose();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [onClose]);

  async function submitReport() {
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/messages/${message.id}/reports`, {
        body: JSON.stringify({
          details,
          reason,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Report failed.");
      }

      setStatus("Report sent.");
      window.setTimeout(onClose, 900);
    } catch {
      setStatus("Could not send report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4">
      <div className="app-panel max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-4 sm:max-w-md sm:rounded-lg sm:p-5" ref={panelRef}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="app-section-title">Report</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Report message</h2>
          </div>
          <button
            aria-label="Close report dialog"
            className="app-icon-button h-10 w-10"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {reportReasons.map((item) => (
            <label
              className="flex min-h-11 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
              key={item.value}
            >
              <input
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                type="radio"
              />
              {item.label}
            </label>
          ))}
        </div>
        <textarea
          className="mt-3 min-h-24 w-full resize-none rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white outline-none focus:border-[#FF5F25]"
          maxLength={600}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Optional details"
          value={details}
        />
        <button
          className="app-button-primary mt-3 h-11 w-full rounded-lg text-sm font-bold disabled:opacity-60"
          disabled={submitting}
          onClick={() => void submitReport()}
          type="button"
        >
          {submitting ? "Sending..." : "Send report"}
        </button>
        {status ? <p className="mt-2 text-sm text-slate-300">{status}</p> : null}
      </div>
    </div>
  );
}

function scrollToMessage(messageId?: string) {
  if (!messageId) {
    return;
  }

  document.getElementById(`message-${messageId}`)?.scrollIntoView({
    block: "center",
    behavior: "smooth",
  });
}

function shouldGroupMessage(
  previousMessage: ChatMessage | undefined,
  message: ChatMessage,
) {
  if (!previousMessage || message.replyTo || message.poll || message.pinnedAt) {
    return false;
  }

  if (getSenderKey(previousMessage) !== getSenderKey(message)) {
    return false;
  }

  const previousTime = new Date(previousMessage.createdAt).getTime();
  const messageTime = new Date(message.createdAt).getTime();

  return Number.isFinite(previousTime) &&
    Number.isFinite(messageTime) &&
    messageTime - previousTime <= 5 * 60 * 1000;
}

function getSenderKey(message: ChatMessage) {
  return message.sender.id ?? `${message.sender.email}:${message.sender.name}`;
}

function shouldShowDateSeparator(
  previousMessage: ChatMessage | undefined,
  message: ChatMessage,
) {
  if (!previousMessage) {
    return true;
  }

  return formatDateKey(previousMessage.createdAt) !== formatDateKey(message.createdAt);
}

function formatDateKey(value: Date | string) {
  const date = new Date(value);

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageDay(value: Date | string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (formatDateKey(date) === formatDateKey(today)) {
    return "Today";
  }

  if (formatDateKey(date) === formatDateKey(yesterday)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatMessageTime(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function useCloseOnEscape(onClose: () => void) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);
}

function areMessageRowPropsEqual(
  previousProps: Readonly<MessageRowProps>,
  nextProps: Readonly<MessageRowProps>,
) {
  return (
    previousProps.canPinMessages === nextProps.canPinMessages &&
    previousProps.currentUserId === nextProps.currentUserId &&
    previousProps.isGrouped === nextProps.isGrouped &&
    previousProps.message === nextProps.message &&
    previousProps.onMessageUpdate === nextProps.onMessageUpdate &&
    previousProps.onReply === nextProps.onReply &&
    previousProps.showDateSeparator === nextProps.showDateSeparator
  );
}
