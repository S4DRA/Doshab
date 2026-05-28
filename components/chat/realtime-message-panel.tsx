"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MessageList } from "@/components/chat/message-list";
import {
  decryptMessageContent,
  encryptMessageContent,
  fetchChannelDeviceKeys,
  registerDeviceKey,
} from "@/lib/e2ee-message.client";
import type { ChatMessage } from "@/types";

type RealtimeMessagePanelProps = {
  channelId: string;
  channelName: string;
  currentUser?: ChatMessage["sender"];
  initialMessages: ChatMessage[];
};

type PendingMessage = ChatMessage & {
  pending: true;
};

export function RealtimeMessagePanel({
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamCursorRef = useRef(newestCreatedAt(initialMessages));
  const displayedMessages = useMemo(
    () => mergeMessages(decryptedMessages, pendingMessages),
    [decryptedMessages, pendingMessages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [displayedMessages.length]);

  useEffect(() => {
    let cancelled = false;

    async function decryptMessages() {
      const messages = await Promise.all(
        encryptedMessages.map(async (message) => {
          const result = await decryptMessageContent(message.content);

          return {
            ...message,
            content: result.text,
          };
        }),
      );

      if (!cancelled) {
        setDecryptedMessages(messages);
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
        }
      } catch {
        if (!cancelled) {
          setEncryptionReady(false);
        }
      }
    }

    void prepareEncryption();

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content || !encryptionReady || !currentUser) {
      return;
    }

    const pendingMessage: PendingMessage = {
      content,
      createdAt: new Date().toISOString(),
      id: `pending:${crypto.randomUUID()}`,
      pending: true,
      sender: currentUser,
    };

    setDraft("");
    setSendError(null);
    setPendingMessages((current) => [...current, pendingMessage]);

    try {
      const { devices } = await fetchChannelDeviceKeys(channelId);
      const encryptedContent = await encryptMessageContent(content, devices);
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        body: JSON.stringify({
          encryptedContent,
          notificationPreview: content,
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
      setDraft(content);
      setSendError("Could not send. Your message is back in the composer.");
    }
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:min-h-[28rem]">
      <div className="shrink-0 space-y-2">
        {!encryptionReady ? (
          <p className="app-card p-3 text-xs leading-5 text-slate-400">
            Preparing encrypted chat for this device...
          </p>
        ) : null}

        {streamError ? (
          <p className="rounded-md border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-100">
            {streamError}
          </p>
        ) : null}
      </div>

      <div className="message-feed min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 pr-1 sm:max-h-none">
        <MessageList messages={displayedMessages} />
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#070907]/95 pt-3 backdrop-blur">
        <form className="flex items-end gap-2 sm:gap-3" onSubmit={sendMessage}>
          <textarea
            className="h-11 max-h-11 min-h-11 flex-1 resize-none overflow-y-auto rounded-lg border border-white/10 bg-[#050505] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:max-h-36"
            disabled={!encryptionReady || !currentUser}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={submitOnEnter}
            placeholder={
              encryptionReady
                ? `Encrypted message #${channelName}`
                : "Preparing encrypted chat..."
            }
            required
            rows={Math.min(5, Math.max(1, draft.split("\n").length))}
            value={draft}
          />
          <button
            aria-label="Send message"
            className="app-icon-button app-icon-button-primary h-11 w-11 shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!encryptionReady || !draft.trim() || !currentUser}
            type="submit"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500">
          <span>Enter to send. Shift+Enter for a new line.</span>
          <span>{draft.length}/2000</span>
        </div>
        {sendError ? <p className="mt-2 text-xs text-amber-200">{sendError}</p> : null}
      </div>
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
