import type { ChatMessage } from "@/types";

type MessageListener = (message: ChatMessage) => void;

const listenersByChannel = new Map<string, Set<MessageListener>>();

export function subscribeToChannelMessages(
  channelId: string,
  listener: MessageListener,
) {
  const listeners = listenersByChannel.get(channelId) ?? new Set<MessageListener>();

  listeners.add(listener);
  listenersByChannel.set(channelId, listeners);

  return () => {
    listeners.delete(listener);

    if (!listeners.size) {
      listenersByChannel.delete(channelId);
    }
  };
}

export function publishChannelMessage(channelId: string, message: ChatMessage) {
  listenersByChannel.get(channelId)?.forEach((listener) => listener(message));
}
