import type { ChatMessage } from "../types";

export type MessageSendState = "pending" | "confirmed" | "failed" | "unknown";
export type PresentedMessage = ChatMessage & {
  visualId?: string;
  sendState?: MessageSendState;
};
export type MessageSendOperation = {
  localId: string;
  message: PresentedMessage;
  serverMessage?: ChatMessage;
  knownServerIds: readonly string[];
};
type SendSnapshot = {
  operations: readonly MessageSendOperation[];
  replyTarget: ChatMessage | null;
  announcement: { sequence: number; text: string };
};
const emptySnapshot: SendSnapshot = {
  operations: [], replyTarget: null, announcement: { sequence: 0, text: "" },
};
const announcements: Record<MessageSendState, string> = {
  pending: "Sending message.",
  confirmed: "Message saved on server.",
  failed: "Message not sent. Its text and reply have been kept.",
  unknown: "Send not confirmed. It may already be saved. Do not resend.",
};

/** Owned by MessageDraftsProvider. No disk storage, timers, retries or transport ownership. */
export function createMessageSendStore() {
  let active = true;
  const channels = new Map<string, SendSnapshot>();
  const listeners = new Set<() => void>();
  const get = (key: string) => channels.get(key) ?? emptySnapshot;
  const publish = (key: string, snapshot: SendSnapshot) => {
    channels.set(key, snapshot);
    listeners.forEach((listener) => listener());
  };
  return {
    get,
    isActive: () => active,
    setActive(value: boolean) { active = value; },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    setReply(key: string, replyTarget: ChatMessage | null) {
      const current = get(key);
      if (current.replyTarget !== replyTarget) publish(key, { ...current, replyTarget });
    },
    begin(key: string, content: string, sender: ChatMessage["sender"], localId: string, createdAt: string, knownServerIds: readonly string[]) {
      const current = get(key);
      const operation: MessageSendOperation = {
        localId,
        knownServerIds: current.operations.find((item) => item.message.sendState === "pending")?.knownServerIds ?? knownServerIds,
        message: {
          id: localId, visualId: localId, sendState: "pending", content, createdAt, sender,
          replyTo: current.replyTarget ? {
            id: current.replyTarget.id, content: current.replyTarget.content, sender: current.replyTarget.sender,
          } : null,
        },
      };
      publish(key, {
        operations: [...current.operations, operation], replyTarget: null,
        announcement: { sequence: current.announcement.sequence + 1, text: announcements.pending },
      });
      return operation;
    },
    finish(key: string, localId: string, state: Exclude<MessageSendState, "pending">, serverMessage?: ChatMessage) {
      const current = get(key);
      const operation = current.operations.find((item) => item.localId === localId);
      // Late/duplicate completion cannot change an already settled operation.
      if (!operation || operation.message.sendState !== "pending") return;
      const message: PresentedMessage = {
        ...operation.message, sendState: state,
        ...(serverMessage ? { id: serverMessage.id, pinnedAt: serverMessage.pinnedAt, reactions: serverMessage.reactions } : {}),
      };
      publish(key, {
        ...current,
        operations: current.operations.map((item) => item === operation ? { ...operation, message, serverMessage, knownServerIds: [] } : item),
        announcement: { sequence: current.announcement.sequence + 1, text: announcements[state] },
      });
    },
  };
}

export type MessageSendStore = ReturnType<typeof createMessageSendStore>;
type SendDependencies = {
  encrypt: (content: string) => Promise<string>;
  post: (content: string, replyId?: string) => Promise<Pick<Response, "ok" | "status" | "json">>;
};

/** The POST boundary determines whether failure is known or ambiguous. */
export async function establishMessage(
  store: MessageSendStore, key: string, operation: MessageSendOperation, dependencies: SendDependencies,
) {
  let postStarted = false;
  try {
    const encrypted = await dependencies.encrypt(operation.message.content);
    // Route changes keep this owner; signing out/account replacement does not.
    if (!store.isActive()) {
      store.finish(key, operation.localId, "failed");
      return;
    }
    postStarted = true;
    const response = await dependencies.post(encrypted, operation.message.replyTo?.id);
    if (!response.ok) {
      // These statuses are explicit pre-write rejections in the existing route.
      const knownRejection = [400, 401, 404, 429].includes(response.status);
      store.finish(key, operation.localId, knownRejection ? "failed" : "unknown");
      return;
    }
    if (response.status !== 201) {
      store.finish(key, operation.localId, "unknown");
      return;
    }
    const message: unknown = await response.json();
    if (!isMessageReceipt(message, operation.message.sender.id)) {
      store.finish(key, operation.localId, "unknown");
      return;
    }
    store.finish(key, operation.localId, "confirmed", message);
  } catch {
    store.finish(key, operation.localId, postStarted ? "unknown" : "failed");
  }
}

function isMessageReceipt(value: unknown, senderId?: string): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return typeof message.id === "string" && Boolean(message.id) && !message.id.startsWith("pending:") &&
    typeof message.content === "string" && typeof message.createdAt === "string" &&
    Number.isFinite(Date.parse(message.createdAt)) && Boolean(message.sender) &&
    Boolean(senderId) && message.sender?.id === senderId && typeof message.sender?.name === "string" &&
    typeof message.sender?.email === "string" && message.poll == null &&
    (message.reactions === undefined || Array.isArray(message.reactions) && message.reactions.every((reaction) =>
      reaction && typeof reaction.emoji === "string" && typeof reaction.count === "number" &&
      Number.isFinite(reaction.count) && reaction.count >= 0 && typeof reaction.reacted === "boolean"));
}

/** Exact server-ID reconciliation only. Own SSE echoes wait for in-flight POST receipts. */
export function createMessagePresentation() {
  const cache = new WeakMap<MessageSendOperation, { server?: ChatMessage; view: PresentedMessage }>();
  return (messages: ChatMessage[], operations: readonly MessageSendOperation[], userId?: string): PresentedMessage[] => {
    const serverMessages = new Map(messages.map((message) => [message.id, message]));
    const mappedIds = new Set(operations.flatMap((operation) => operation.serverMessage ? [operation.serverMessage.id] : []));
    const awaitingReceipt = operations.find((operation) => operation.message.sendState === "pending");
    const knownIds = new Set(awaitingReceipt?.knownServerIds);
    const result: PresentedMessage[] = Array.from(serverMessages.values()).filter((message) => !mappedIds.has(message.id) &&
      !(awaitingReceipt && message.sender.id === userId && !knownIds.has(message.id)));
    for (const operation of operations) {
      const server = operation.serverMessage ? serverMessages.get(operation.serverMessage.id) : undefined;
      const previous = cache.get(operation);
      const view = previous && previous.server === server ? previous.view : server ? {
        ...server, ...operation.message, pinnedAt: server.pinnedAt, reactions: server.reactions,
      } : operation.message;
      cache.set(operation, { server, view });
      result.push(view);
    }
    // Local ordering time is retained through acknowledgement, not used for deduplication.
    return result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };
}
