"use client";

import { useEffect, useRef, useState } from "react";

import { MessageList } from "@/components/chat/message-list";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types";

type RealtimeMessagePanelProps = {
  channelId: string;
  initialMessages: ChatMessage[];
};

type MessageInsertPayload = {
  id?: unknown;
  channelId?: unknown;
};

export function RealtimeMessagePanel({
  channelId,
  initialMessages,
}: RealtimeMessagePanelProps) {
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const knownMessageIdsRef = useRef(new Set(initialMessages.map((message) => message.id)));
  const messages = mergeMessages(initialMessages, liveMessages);

  useEffect(() => {
    knownMessageIdsRef.current = new Set(
      messages.map((message) => message.id),
    );
  }, [messages]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    async function loadInsertedMessage(messageId: string) {
      try {
        const response = await fetch(
          `/api/channels/${channelId}/messages?messageId=${encodeURIComponent(messageId)}`,
          {
            headers: {
              accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Could not load the new message.");
        }

        const message = (await response.json()) as ChatMessage;

        if (!isMounted) {
          return;
        }

        setLiveMessages((currentMessages) => {
          if (currentMessages.some((current) => current.id === message.id)) {
            return currentMessages;
          }

          knownMessageIdsRef.current.add(message.id);
          return [...currentMessages, message];
        });
      } catch {
        if (isMounted) {
          setSubscriptionError("Live updates paused. Refresh to see the latest messages.");
        }
      }
    }

    const realtimeChannel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channelId=eq.${channelId}`,
        },
        (payload) => {
          const newMessage = payload.new as MessageInsertPayload;
          const messageId = typeof newMessage.id === "string" ? newMessage.id : null;

          if (!messageId || knownMessageIdsRef.current.has(messageId)) {
            return;
          }

          knownMessageIdsRef.current.add(messageId);
          void loadInsertedMessage(messageId);
        },
      )
      .subscribe((status) => {
        if (!isMounted) {
          return;
        }

        if (status === "SUBSCRIBED") {
          setSubscriptionError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSubscriptionError("Live updates paused. Refresh to see the latest messages.");
        }
      });

    return () => {
      isMounted = false;
      void supabase.removeChannel(realtimeChannel);
    };
  }, [channelId]);

  return (
    <div className="space-y-4">
      {subscriptionError ? (
        <p className="rounded-md border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-100">
          {subscriptionError}
        </p>
      ) : null}
      <MessageList messages={messages} />
    </div>
  );
}

function mergeMessages(
  initialMessages: ChatMessage[],
  liveMessages: ChatMessage[],
) {
  const seenMessageIds = new Set<string>();

  return [...initialMessages, ...liveMessages].filter((message) => {
    if (seenMessageIds.has(message.id)) {
      return false;
    }

    seenMessageIds.add(message.id);
    return true;
  });
}
