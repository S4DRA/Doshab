"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
  const streamCursorRef = useRef(newestCreatedAt(initialMessages));
  const displayedMessages = useMemo(
    () => mergeMessages(decryptedMessages, pendingMessages),
    [decryptedMessages, pendingMessages],
  );

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
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

      <MessageList messages={displayedMessages} />

      <form className="sticky bottom-0 flex gap-3 border-t border-white/10 bg-[#070907]/95 pt-3 backdrop-blur" onSubmit={sendMessage}>
        <textarea
          className="min-h-11 flex-1 resize-none rounded-lg border border-white/10 bg-[#050505] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!encryptionReady || !currentUser}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            encryptionReady
              ? `Encrypted message #${channelName}`
              : "Preparing encrypted chat..."
          }
          required
          rows={1}
          value={draft}
        />
        <button
          className="app-button-primary h-11 rounded-lg px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!encryptionReady || !draft.trim() || !currentUser}
          type="submit"
        >
          Send
        </button>
      </form>
      {sendError ? <p className="text-xs text-amber-200">{sendError}</p> : null}
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
