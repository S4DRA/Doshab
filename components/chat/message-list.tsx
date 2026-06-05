"use client";

import { useState } from "react";

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

const reportReasons = [
  { label: "Spam", value: "SPAM" },
  { label: "Harassment", value: "HARASSMENT" },
  { label: "Hate or abuse", value: "HATE_OR_ABUSE" },
  { label: "NSFW/inappropriate", value: "NSFW" },
  { label: "Other", value: "OTHER" },
];

export function MessageList({
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
      <div className="space-y-1">
        {messages.map((message) => (
          <MessageRow
            canPinMessages={canPinMessages}
            currentUserId={currentUserId}
            key={message.id}
            message={message}
            onMessageUpdate={onMessageUpdate}
            onReport={() => setReportingMessage(message)}
            onReply={onReply}
          />
        ))}
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

function MessageRow({
  canPinMessages,
  currentUserId,
  message,
  onMessageUpdate,
  onReport,
  onReply,
}: {
  canPinMessages: boolean;
  currentUserId?: string;
  message: ChatMessage;
  onMessageUpdate?: (message: ChatMessage) => void;
  onReport: () => void;
  onReply?: (message: ChatMessage) => void;
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const senderLabel = message.sender.name || message.sender.email;
  const isOwnMessage = Boolean(currentUserId && message.sender.id === currentUserId);

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
    <article
      className={`message-row group/message flex scroll-mt-28 gap-2.5 border border-transparent px-1.5 py-2.5 transition hover:border-white/10 hover:bg-white/[0.02] sm:gap-3 sm:px-2 ${
        isOwnMessage ? "message-row-own" : "message-row-friend"
      }`}
      id={`message-${message.id}`}
    >
      <AvatarInitials
        imageUrl={message.sender.image}
        value={senderLabel}
      />
      <div className="message-shell min-w-0">
        <div className="message-bubble">
        <div className="message-meta flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
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

        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300 [overflow-wrap:anywhere]">
          {message.content}
        </p>

        {message.poll ? <PollCard message={message} onVote={vote} /> : null}

        <div className="message-actions mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
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
            className="ml-0 inline-flex min-h-9 items-center rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white sm:min-h-8"
            onClick={() => onReply?.(message)}
            type="button"
          >
            Reply
          </button>
          {canPinMessages ? (
            <button
              className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-slate-300 transition hover:border-[#FF5F25]/60 hover:text-white sm:min-h-8"
              disabled={busyAction === "pin"}
              onClick={() => void togglePin()}
              type="button"
            >
              {message.pinnedAt ? "Unpin" : "Pin"}
            </button>
          ) : null}
          <button
            className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-slate-400 transition hover:border-white/25 hover:text-white sm:min-h-8"
            onClick={onReport}
            type="button"
          >
            Report
          </button>
        </div>
        </div>
      </div>
    </article>
  );
}

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
      <div className="app-panel max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-4 sm:max-w-md sm:rounded-lg sm:p-5">
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
            <span aria-hidden="true">x</span>
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
