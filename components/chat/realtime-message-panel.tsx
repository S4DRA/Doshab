"use client";

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

import { MessageList } from "@/components/chat/message-list";
import { DialogSurface } from "@/components/ui/dialog-surface";
import { reactionEmojis } from "@/lib/chat-constants";
import {
  decryptMessageContent,
  encryptMessageContent,
  fetchChannelDeviceKeys,
  registerDeviceKey,
} from "@/lib/e2ee-message.client";
import type { ChatMessage } from "@/types";

type RealtimeMessagePanelProps = {
  canPinMessages?: boolean;
  channelId: string;
  channelName: string;
  currentUser?: ChatMessage["sender"];
  initialMessages: ChatMessage[];
};

type PendingMessage = ChatMessage & {
  pending: true;
};

type DecryptedMessageCacheEntry = {
  key: string;
  message: ChatMessage;
};

export function RealtimeMessagePanel({
  canPinMessages = false,
  channelId,
  channelName,
  currentUser,
  initialMessages,
}: RealtimeMessagePanelProps) {
  const [encryptedMessages, setEncryptedMessages] = useState(initialMessages);
  const [decryptedMessages, setDecryptedMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [encryptionError, setEncryptionError] = useState<string | null>(null);
  const [encryptionAttempt, setEncryptionAttempt] = useState(0);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [pinnedLoading, setPinnedLoading] = useState(false);
  const [pinnedError, setPinnedError] = useState<string | null>(null);
  const [pollSending, setPollSending] = useState(false);
  const pollSendingRef = useRef(false);
  const [composerTools, setComposerTools] = useState<"tools" | "emoji" | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const decryptedMessageCacheRef = useRef(new Map<string, DecryptedMessageCacheEntry>());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const followingLatestRef = useRef(true);
  const previousCountRef = useRef(0);
  const streamCursorRef = useRef(newestCreatedAt(initialMessages));
  const displayedMessages = useMemo(
    () => mergeMessages(decryptedMessages, pendingMessages),
    [decryptedMessages, pendingMessages],
  );
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return displayedMessages.filter((message) => {
      const sender = `${message.sender.name} ${message.sender.email}`.toLowerCase();

      return message.content.toLowerCase().includes(query) || sender.includes(query);
    });
  }, [displayedMessages, searchQuery]);
  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTarget(message);
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (followingLatestRef.current && feed) feed.scrollTop = feed.scrollHeight;
    else setNewMessageCount((count) => count + Math.max(0, displayedMessages.length - previousCountRef.current));
    previousCountRef.current = displayedMessages.length;
  }, [displayedMessages.length]);

  useEffect(() => {
    let cancelled = false;

    async function decryptMessages() {
      const nextMessages = await Promise.all(
        encryptedMessages.map(async (message) => {
          const cacheKey = getChatMessageCacheKey(message);
          const cachedMessage = decryptedMessageCacheRef.current.get(message.id);

          if (cachedMessage?.key === cacheKey) {
            return cachedMessage.message;
          }

          const decryptedMessage = await decryptChatMessage(message);

          decryptedMessageCacheRef.current.set(message.id, {
            key: cacheKey,
            message: decryptedMessage,
          });

          return decryptedMessage;
        }),
      );

      if (!cancelled) {
        setDecryptedMessages(nextMessages);
      }
    }

    void decryptMessages();

    return () => {
      cancelled = true;
    };
  }, [encryptedMessages]);

  useEffect(() => {
    let cancelled = false;

    async function prepareEncryption() {
      try {
        await registerDeviceKey();

        if (!cancelled) {
          setEncryptionReady(true);
          setEncryptionError(null);
        }
      } catch {
        if (!cancelled) {
          setEncryptionReady(false);
          setEncryptionError("Could not prepare secure chat on this device. Please try again.");
        }
      }
    }

    void prepareEncryption();

    return () => {
      cancelled = true;
    };
  }, [encryptionAttempt]);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/channels/${channelId}/messages?after=${encodeURIComponent(streamCursorRef.current)}`,
    );

    eventSource.addEventListener("ready", () => {
      setStreamError(null);
    });

    eventSource.addEventListener("messages", (event) => {
      const messages = JSON.parse(event.data) as ChatMessage[];
      streamCursorRef.current = newestCreatedAt(messages);
      setEncryptedMessages((current) => mergeMessages(current, messages));
      setStreamError(null);
    });

    eventSource.onerror = () => {
      setStreamError("Realtime connection is reconnecting.");
    };

    return () => eventSource.close();
  }, [channelId]);

  const handleMessageUpdate = useCallback(async (message: ChatMessage) => {
    setEncryptedMessages((current) => mergeMessages(current, [message]));

    const decryptedMessage = await decryptChatMessage(message);
    const cacheKey = getChatMessageCacheKey(message);

    decryptedMessageCacheRef.current.set(message.id, {
      key: cacheKey,
      message: decryptedMessage,
    });
    setDecryptedMessages((current) => mergeMessages(current, [decryptedMessage]));
    setPinnedMessages((current) => {
      const nextMessages = decryptedMessage.pinnedAt
        ? mergeMessages(current, [decryptedMessage])
        : current.filter((item) => item.id !== decryptedMessage.id);

      return nextMessages.sort(
        (first, second) =>
          new Date(second.pinnedAt ?? second.createdAt).getTime() -
          new Date(first.pinnedAt ?? first.createdAt).getTime(),
      );
    });
  }, []);

  async function loadPinnedMessages() {
    setPinnedOpen(true);
    setPinnedLoading(true);
    setPinnedError(null);

    try {
      const response = await fetch(`/api/channels/${channelId}/pinned-messages`, {
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Pinned messages failed.");
      }

      const data = (await response.json()) as { messages?: ChatMessage[] };
      const messages = await Promise.all((data.messages ?? []).map(decryptChatMessage));
      setPinnedMessages(messages);
    } catch {
      setPinnedError("Could not load pinned messages. Please try again.");
    } finally {
      setPinnedLoading(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content || content.length > 2000 || !encryptionReady || !currentUser) {
      return;
    }

    const pendingMessage: PendingMessage = {
      content,
      createdAt: new Date().toISOString(),
      id: `pending:${crypto.randomUUID()}`,
      pending: true,
      replyTo: replyTarget
        ? {
            content: replyTarget.content,
            id: replyTarget.id,
            sender: replyTarget.sender,
          }
        : null,
      sender: currentUser,
    };

    setDraft("");
    followingLatestRef.current = true;
    setNewMessageCount(0);
    setSendError(null);
    setReplyTarget(null);
    setPendingMessages((current) => [...current, pendingMessage]);

    try {
      const { devices } = await fetchChannelDeviceKeys(channelId);
      const encryptedContent = await encryptMessageContent(content, devices);
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        body: JSON.stringify({
          encryptedContent,
          notificationPreview: content,
          replyToMessageId: replyTarget?.id,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Message send failed.");
      }

      const message = (await response.json()) as ChatMessage;
      setEncryptedMessages((current) => mergeMessages(current, [message]));
      setPendingMessages((current) =>
        current.filter((pending) => pending.id !== pendingMessage.id),
      );
    } catch {
      setPendingMessages((current) =>
        current.filter((pending) => pending.id !== pendingMessage.id),
      );
      setDraft((current) => current ? `${content}\n${current}` : content);
      setReplyTarget((current) => current ?? replyTarget);
      setSendError("Could not send. Your message is back in the composer.");
    }
  }

  async function sendPoll() {
    const question = pollQuestion.replace(/\s+/g, " ").trim();
    const options = pollOptions
      .map((option) => option.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 5);

    if (!question || options.length < 2 || !encryptionReady || !currentUser || pollSendingRef.current) {
      return;
    }

    setSendError(null);
    pollSendingRef.current = true;
    setPollSending(true);

    try {
      const { devices } = await fetchChannelDeviceKeys(channelId);
      const content = `Poll: ${question}`;
      const encryptedContent = await encryptMessageContent(content, devices);
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        body: JSON.stringify({
          encryptedContent,
          notificationPreview: content,
          poll: {
            options,
            question,
          },
          replyToMessageId: replyTarget?.id,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Poll send failed.");
      }

      const message = (await response.json()) as ChatMessage;
      followingLatestRef.current = true;
      setEncryptedMessages((current) => mergeMessages(current, [message]));
      setPollOpen(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setReplyTarget(null);
    } catch {
      setSendError("Could not create poll. Try again in a moment.");
    } finally {
      pollSendingRef.current = false;
      setPollSending(false);
    }
  }

  function submitOnEnter(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="val-chat-panel relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col" data-tour-target="chat-panel">
      <div className="shrink-0 space-y-2">
        {!encryptionReady ? (
          <p className="app-card p-3 text-xs leading-5 text-slate-400">
            {encryptionError ?? "Preparing encrypted chat for this device…"}
            {encryptionError && <button type="button" className="val-dialog-link mt-2" onClick={() => { setEncryptionError(null); setEncryptionAttempt((attempt) => attempt + 1); }}>Try again</button>}
          </p>
        ) : null}

        {streamError ? (
          <p className="rounded-md border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-100">
            {streamError}
          </p>
        ) : null}
      </div>

      <div className="chat-toolbar">
          <button
            className="val-chat-search"
            onClick={() => setSearchOpen(true)}
            aria-label={`Search in #${channelName}`}
            aria-haspopup="dialog"
            title="Search channel"
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Search in #{channelName}…</span>
          </button>
        <div className="val-chat-toolbar-actions">
          <button
            className="val-chat-tool-button"
            onClick={() => void loadPinnedMessages()}
            title="Pinned messages"
            type="button"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 3 6 6-3 1-3 6-3-3-6 6m0-9 6-3 1-3Z" /></svg> Pinned
          </button>
          <button
            className="val-chat-tool-button"
            onClick={() => { setSendError(null); setPollOpen(true); }}
            title="Create poll"
            type="button"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 20v-7m7 7V8m7 12V3" /></svg> Polls
          </button>
        <span className="message-load-status text-[11px] text-slate-500">
          {displayedMessages.length} messages
        </span>
        </div>
      </div>

      {searchOpen ? (
        <SearchPanel
          onClose={() => setSearchOpen(false)}
          query={searchQuery}
          results={searchResults}
          setQuery={setSearchQuery}
        />
      ) : null}

      {pinnedOpen ? (
        <PinnedPanel
          loading={pinnedLoading}
          error={pinnedError}
          onRetry={() => void loadPinnedMessages()}
          messages={pinnedMessages}
          onClose={() => setPinnedOpen(false)}
        />
      ) : null}

      {pollOpen ? (
        <PollDialog
          onClose={() => setPollOpen(false)}
          onCreate={() => void sendPoll()}
          pending={pollSending}
          error={sendError}
          options={pollOptions}
          question={pollQuestion}
          setOptions={setPollOptions}
          setQuestion={setPollQuestion}
        />
      ) : null}

      <div className="message-feed min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain" ref={feedRef} onScroll={() => {
        const feed = feedRef.current;
        followingLatestRef.current = Boolean(feed && feed.scrollHeight - feed.clientHeight - feed.scrollTop < 80);
        if (followingLatestRef.current) setNewMessageCount(0);
      }}>
        <MessageList
          canPinMessages={canPinMessages}
          currentUserId={currentUser?.id}
          messages={displayedMessages}
          onMessageUpdate={handleMessageUpdate}
          onReply={handleReply}
        />
        <div ref={messagesEndRef} />
      </div>
      {newMessageCount > 0 && <button className="val-jump-latest" type="button" onClick={() => { followingLatestRef.current = true; setNewMessageCount(0); feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }); }}>{newMessageCount} new {newMessageCount === 1 ? "message" : "messages"} · Jump to latest ↓</button>}

      <div className="chat-composer sticky bottom-0 z-10 min-w-0 shrink-0 overflow-hidden border-t border-white/10 bg-[#070907]/95 pb-[max(calc(var(--dashboard-bottom-nav-height,4rem)+0.25rem),0.25rem)] pt-3 backdrop-blur md:pb-[max(env(safe-area-inset-bottom),0.25rem)]">
        <div className="mx-auto w-full max-w-[min(100%,82rem)]">
          {replyTarget ? (
            <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-[#FF5F25]/30 bg-[#FF5F25]/10 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#FFB199]">
                  Replying to {replyTarget.sender.name || replyTarget.sender.email}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-300">
                  {replyTarget.content}
                </p>
              </div>
              <button
                aria-label="Cancel reply"
                className="app-icon-button h-8 w-8 shrink-0"
                onClick={() => setReplyTarget(null)}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ) : null}
          <form className="message-composer-form flex w-full min-w-0 max-w-full items-end gap-2 sm:gap-3" data-tour-target="message-composer" onSubmit={sendMessage}>
            <button type="button" className="app-icon-button val-composer-add" aria-label="Message tools" aria-haspopup="dialog" onClick={() => setComposerTools("tools")}><span aria-hidden="true">+</span></button>
            <textarea
              ref={textareaRef}
              aria-label={`Message #${channelName}`}
              className="max-h-28 min-h-12 min-w-0 max-w-full flex-1 resize-none overflow-y-auto rounded-lg border border-white/10 bg-[#050505] px-3 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:max-h-36 sm:text-sm"
              disabled={!encryptionReady || !currentUser}
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={submitOnEnter}
              placeholder={
                encryptionReady
                  ? `Message #${channelName}…`
                  : "Preparing encrypted chat..."
              }
              required
              rows={Math.min(5, Math.max(1, draft.split("\n").length))}
              value={draft}
            />
            <button type="button" className="val-composer-emoji" aria-label="Add emoji" aria-haspopup="dialog" disabled={!encryptionReady || !currentUser} onClick={() => setComposerTools("emoji")}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M8 14a4 4 0 0 0 8 0M8 9h1m6 0h1" /></svg></button>
            <button
              aria-label="Send message"
              className="app-icon-button app-icon-button-primary h-12 w-12 shrink-0 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-11"
              disabled={!encryptionReady || !draft.trim() || draft.length > 2000 || !currentUser}
              title="Send message"
              type="submit"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span className="val-composer-keyboard-hint hidden sm:inline">Enter to send. Shift+Enter for a new line.</span>
            <span className="val-composer-touch-hint sm:hidden">Encrypted · Tap send</span>
            <span>{draft.length}/2000</span>
          </div>
          {sendError && !pollOpen ? <p className="val-chat-error" role="alert">{sendError}</p> : null}
          {draft.length > 2000 && <p className="val-chat-error" role="alert">Split this draft into messages of 2,000 characters or fewer.</p>}
        </div>
      </div>
      {composerTools && <DialogSurface key={composerTools} title={composerTools === "emoji" ? "Add emoji" : "Message tools"} onClose={() => setComposerTools(null)}>
        {composerTools === "emoji" ? <div className="val-emoji-grid">{[...reactionEmojis, "✨", "🎉", "👋", "🤔", "✅", "🙌", "☕"].map((emoji) => <button type="button" key={emoji} aria-label={`Insert ${emoji}`} onClick={() => {
          const input = textareaRef.current;
          const start = input?.selectionStart ?? draft.length;
          const end = input?.selectionEnd ?? start;
          const nextDraft = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
          if (nextDraft.length > 2000) {
            flushSync(() => {
              setSendError("Make room in your draft before adding an emoji.");
              setComposerTools(null);
            });
            input?.focus({ preventScroll: true });
            return;
          }
          flushSync(() => {
            setDraft(nextDraft);
            setComposerTools(null);
          });
          input?.focus({ preventScroll: true });
          input?.setSelectionRange(start + emoji.length, start + emoji.length);
        }}>{emoji}</button>)}</div> : <div className="val-dialog-links">
          <button type="button" className="val-dialog-link" onClick={() => { setComposerTools(null); setPollOpen(true); setSendError(null); }}>Create a poll</button>
          <button type="button" className="val-dialog-link" onClick={() => { setComposerTools(null); setSearchOpen(true); }}>Search this conversation</button>
          <button type="button" className="val-dialog-link" onClick={() => { setComposerTools(null); void loadPinnedMessages(); }}>Pinned messages</button>
        </div>}
        {composerTools === "tools" && <button type="button" className="val-dialog-link mt-2" onClick={() => setComposerTools("emoji")}>Add emoji</button>}
      </DialogSurface>}
    </div>
  );
}

function mergeMessages<T extends ChatMessage>(current: T[], incoming: T[]) {
  const messagesById = new Map<string, T>();

  [...current, ...incoming].forEach((message) => {
    messagesById.set(message.id, message);
  });

  return [...messagesById.values()].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
  );
}

function newestCreatedAt(messages: ChatMessage[]) {
  const newest = messages.reduce((latest, message) => {
    const timestamp = new Date(message.createdAt).getTime();

    return timestamp > latest ? timestamp : latest;
  }, 0);

  return new Date(newest).toISOString();
}

function getChatMessageCacheKey(message: ChatMessage) {
  return JSON.stringify([
    message.content,
    message.replyTo?.content ?? null,
    message.pinnedAt ?? null,
    message.reactions ?? [],
    message.poll ?? null,
  ]);
}

async function decryptChatMessage<T extends ChatMessage>(message: T): Promise<T> {
  const [content, replyContent] = await Promise.all([
    decryptMessageContent(message.content),
    message.replyTo ? decryptMessageContent(message.replyTo.content) : null,
  ]);

  return {
    ...message,
    content: content.text,
    replyTo: message.replyTo
      ? {
          ...message.replyTo,
          content: replyContent?.text ?? "Original message unavailable.",
        }
      : null,
  };
}

function SearchPanel({
  onClose,
  query,
  results,
  setQuery,
}: {
  onClose: () => void;
  query: string;
  results: ChatMessage[];
  setQuery: (value: string) => void;
}) {
  return (
    <DialogSurface title="Channel search" onClose={onClose}>
        <input
          data-dialog-autofocus
          aria-label="Search loaded messages"
          className="mt-4 h-11 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none focus:border-[#FF5F25] sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search loaded messages"
          value={query}
        />
        <div className="mt-4 grid gap-2">
          {query.trim() && results.length ? (
            results.map((message) => (
              <button
                className="app-row min-h-14 p-3 text-left"
                key={message.id}
                onClick={() => {
                  scrollToMessage(message.id);
                  onClose();
                }}
                type="button"
              >
                <span className="block truncate text-sm font-semibold text-white">
                  {message.sender.name || message.sender.email}
                </span>
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-400">
                  {message.content}
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
              {query.trim() ? "No messages found." : "Search uses messages loaded on this device."}
            </p>
          )}
        </div>
    </DialogSurface>
  );
}

function PinnedPanel({
  error,
  loading,
  messages,
  onClose,
  onRetry,
}: {
  error: string | null;
  loading: boolean;
  messages: ChatMessage[];
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <DialogSurface title="Pinned messages" onClose={onClose}>
        <div className="mt-4 grid gap-2">
          {error ? <div role="alert"><p className="val-chat-error">{error}</p><button className="val-dialog-link" type="button" onClick={onRetry}>Try again</button></div> : loading ? (
            <div className="app-skeleton h-20 rounded-lg" />
          ) : messages.length ? (
            messages.map((message) => (
              <button
                className="app-row min-h-16 p-3 text-left"
                key={message.id}
                onClick={() => {
                  scrollToMessage(message.id);
                  onClose();
                }}
                type="button"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-white">
                    {message.sender.name || message.sender.email}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {formatMessageDate(message.pinnedAt ?? message.createdAt)}
                  </span>
                </span>
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-400">
                  {message.content}
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
              No pinned messages yet.
            </p>
          )}
        </div>
    </DialogSurface>
  );
}

function PollDialog({
  error,
  onClose,
  onCreate,
  options,
  question,
  setOptions,
  setQuestion,
  pending,
}: {
  error: string | null;
  onClose: () => void;
  onCreate: () => void;
  options: string[];
  question: string;
  setOptions: (options: string[]) => void;
  setQuestion: (question: string) => void;
  pending: boolean;
}) {
  const validOptionCount = options.filter((option) => option.trim()).length;

  return (
    <DialogSurface title="Create poll" onClose={onClose}>
        <fieldset disabled={pending}>
        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Question
          </span>
          <input
            data-dialog-autofocus
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none focus:border-[#FF5F25] sm:text-sm"
            maxLength={180}
            onChange={(event) => setQuestion(event.target.value)}
            value={question}
          />
        </label>
        <div className="mt-4 grid gap-2">
          {options.map((option, index) => (
            <input
              className="h-11 rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none focus:border-[#FF5F25] sm:text-sm"
              key={index}
              maxLength={80}
              onChange={(event) => {
                const nextOptions = [...options];
                nextOptions[index] = event.target.value;
                setOptions(nextOptions);
              }}
              placeholder={`Option ${index + 1}`}
              aria-label={`Option ${index + 1}`}
              value={option}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.length < 5 ? (
            <button
              className="app-button-secondary h-10 rounded-lg px-3 text-xs font-semibold"
              onClick={() => setOptions([...options, ""])}
              type="button"
            >
              Add option
            </button>
          ) : null}
          {options.length > 2 ? (
            <button
              className="app-button-secondary h-10 rounded-lg px-3 text-xs font-semibold"
              onClick={() => setOptions(options.slice(0, -1))}
              type="button"
            >
              Remove option
            </button>
          ) : null}
        </div>
        <button
          className="app-button-primary mt-4 h-11 w-full rounded-lg text-sm font-bold disabled:opacity-60"
          disabled={pending || !question.trim() || validOptionCount < 2}
          aria-busy={pending}
          onClick={onCreate}
          type="button"
        >
          {pending ? "Creating…" : "Create poll"}
        </button>
        </fieldset>
        {error && <p className="val-chat-error" role="alert">{error}</p>}
    </DialogSurface>
  );
}

function scrollToMessage(messageId: string) {
  document.getElementById(`message-${messageId}`)?.scrollIntoView({
    block: "center",
    behavior: "smooth",
  });
}

function formatMessageDate(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
