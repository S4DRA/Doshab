"use client";

import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AvatarInitials } from "@/components/ui/avatar-initials";
import { decryptMessageContent } from "@/lib/e2ee-message.client";
import { isEncryptedMessageContent } from "@/lib/e2ee-message";
import { formatReadableTimestamp } from "@/lib/utils";
import type { FriendPerson, MessageThread } from "@/types";

type MessagesPageClientProps = {
  error?: string;
  friends: FriendPerson[];
  message?: string;
  threads: MessageThread[];
};

type PreviewMap = Record<string, string>;

export function MessagesPageClient({
  error,
  friends,
  message,
  threads,
}: MessagesPageClientProps) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendQuery, setFriendQuery] = useState("");
  const [previewsByThreadId, setPreviewsByThreadId] = useState<PreviewMap>({});
  const chooserPanelRef = useRef<HTMLDivElement | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredFriendQuery = useDeferredValue(friendQuery);
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const normalizedFriendQuery = deferredFriendQuery.trim().toLowerCase();
  const closeChooser = useCallback(() => {
    setChooserOpen(false);
    setFriendQuery("");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviews() {
      const previewEntries = await Promise.all(
        threads.map(async (thread) => {
          const content = thread.lastMessageEncryptedContent?.trim();

          if (!content) {
            return [thread.id, "No messages yet"] as const;
          }

          if (!isEncryptedMessageContent(content)) {
            return [thread.id, trimPreview(content)] as const;
          }

          const preview = await decryptMessageContent(content);

          return [thread.id, trimPreview(preview.text)] as const;
        }),
      );

      if (!cancelled) {
        setPreviewsByThreadId(Object.fromEntries(previewEntries));
      }
    }

    void loadPreviews();

    return () => {
      cancelled = true;
    };
  }, [threads]);

  useEffect(() => {
    if (!chooserOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeChooser();
      }
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node) || chooserPanelRef.current?.contains(target)) {
        return;
      }

      closeChooser();
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [chooserOpen, closeChooser]);

  const filteredThreads = useMemo(() => {
    if (!normalizedSearchQuery) {
      return threads;
    }

    return threads.filter((thread) => {
      const preview = previewsByThreadId[thread.id] ?? "";
      const searchable = [
        thread.name,
        thread.friend?.email ?? "",
        thread.lastMessageSenderName ?? "",
        preview,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, previewsByThreadId, threads]);

  const filteredFriends = useMemo(() => {
    if (!normalizedFriendQuery) {
      return friends;
    }

    return friends.filter((friend) =>
      `${friend.name} ${friend.email}`.toLowerCase().includes(normalizedFriendQuery),
    );
  }, [friends, normalizedFriendQuery]);

  return (
    <>
      <div className="app-page-scroll">
        <div className="app-page-container space-y-4">
          <section className="app-page-header">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="app-section-title">Messages</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Messages
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Pick up where you left off, or start a private conversation with a friend.
                </p>
              </div>
              <button
                className="app-button-primary inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-bold transition"
                onClick={() => setChooserOpen(true)}
                type="button"
              >
                Start message
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <label className="block min-w-0">
                <span className="sr-only">Search messages</span>
                <input
                  className="h-12 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search conversations"
                  type="search"
                  value={searchQuery}
                />
              </label>
              <span className="app-badge inline-flex w-fit items-center px-3 py-1 text-xs font-semibold">
                {threads.length} {threads.length === 1 ? "thread" : "threads"}
              </span>
            </div>
          </section>

          {error ? (
            <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200">
              {message}
            </div>
          ) : null}

          {threads.length ? (
            <section className="grid gap-3">
              {filteredThreads.length ? (
                filteredThreads.map((thread) => {
                  const preview = previewsByThreadId[thread.id];

                  return (
                    <article
                      className="app-card flex min-w-0 flex-col gap-3 p-4 transition hover:border-[#FF5F25]/70 sm:flex-row sm:items-center sm:justify-between"
                      key={thread.id}
                    >
                      <Link
                        className="flex min-w-0 flex-1 items-center gap-3"
                        href={getDirectMessageHref(thread.id, thread.channelId)}
                      >
                        <AvatarInitials
                          imageUrl={thread.friend?.image}
                          value={thread.name}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center justify-between gap-3">
                            <span className="truncate text-sm font-semibold text-white">
                              {thread.name}
                            </span>
                            <span className="shrink-0 text-[11px] text-slate-500">
                              {formatConversationTime(thread.lastActivityAt)}
                            </span>
                          </span>
                          <span className="mt-1 block truncate text-xs text-slate-400">
                            {thread.friend?.email ?? "Private message"}
                          </span>
                          <span className="mt-2 block line-clamp-2 text-sm leading-6 text-slate-300">
                            {preview ?? "Decrypting latest message..."}
                          </span>
                        </span>
                      </Link>
                      {thread.friend ? (
                        <form action="/api/friend-calls/start" method="post">
                          <input name="friendId" type="hidden" value={thread.friend.id} />
                          <button
                            aria-label={`Call ${thread.name}`}
                            className="app-icon-button app-icon-button-primary h-11 w-11 shrink-0"
                            title={`Call ${thread.name}`}
                            type="submit"
                          >
                            <PhoneIcon className="h-4 w-4" />
                          </button>
                        </form>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <div className="app-card p-5 text-sm leading-6 text-slate-300">
                  No conversations matched <span className="font-semibold text-white">{searchQuery.trim()}</span>.
                </div>
              )}
            </section>
          ) : (
            <section className="app-card p-5 sm:p-6">
              <p className="text-base font-semibold text-white">No direct messages yet</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Conversations appear here after you send or receive a private message.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="app-button-primary inline-flex h-11 items-center rounded-lg px-4 text-sm font-bold transition"
                  onClick={() => setChooserOpen(true)}
                  type="button"
                >
                  Start a conversation
                </button>
                <Link
                  className="app-button-secondary inline-flex h-11 items-center rounded-lg px-4 text-sm font-semibold transition"
                  href="/dashboard/friends?add=1"
                >
                  Find friends
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {chooserOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/50 sm:items-center sm:justify-center">
          <div
            className="app-panel mx-3 mb-[calc(var(--dashboard-bottom-nav-height)+0.5rem)] max-h-[72dvh] w-full max-w-xl overflow-y-auto rounded-[1.4rem] p-4 sm:mb-0 sm:rounded-lg sm:p-5"
            ref={chooserPanelRef}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="app-section-title">New message</p>
                <h2 className="mt-2 text-lg font-semibold text-white">Choose a friend</h2>
                <p className="mt-2 text-sm leading-5 text-slate-400">
                  VAL will open a private thread the moment you pick someone.
                </p>
              </div>
              <button
                aria-label="Close new message chooser"
                className="app-icon-button h-10 w-10 shrink-0"
                onClick={closeChooser}
                type="button"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block">
              <span className="sr-only">Search friends</span>
              <input
                autoFocus
                className="h-12 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                onChange={(event) => setFriendQuery(event.target.value)}
                placeholder="Search friends by name or email"
                type="search"
                value={friendQuery}
              />
            </label>

            <div className="mt-4 grid gap-2">
              {filteredFriends.length ? (
                filteredFriends.map((friend) => {
                  const friendLabel = friend.name || friend.email;

                  return (
                    <form
                      action="/api/private-messages"
                      className="app-row flex min-w-0 items-center gap-3 px-3 py-3"
                      key={friend.id}
                      method="post"
                      onSubmit={closeChooser}
                    >
                      <input name="friendId" type="hidden" value={friend.id} />
                      <input name="returnTo" type="hidden" value="/dashboard/messages" />
                      <AvatarInitials imageUrl={friend.image} value={friendLabel} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {friendLabel}
                        </span>
                        <span className="block truncate text-xs text-slate-400">
                          {friend.email}
                        </span>
                      </span>
                      <button
                        className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition"
                        type="submit"
                      >
                        Message
                      </button>
                    </form>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-400">
                  {friends.length
                    ? `No friends matched ${friendQuery.trim()}.`
                    : "Add a friend first to start a private conversation."}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function trimPreview(value: string) {
  const preview = value.replace(/\s+/g, " ").trim();

  if (!preview) {
    return "New message";
  }

  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function getDirectMessageHref(groupId: string, channelId?: string | null) {
  if (!channelId) {
    return `/dashboard/groups/${groupId}?view=messages`;
  }

  return `/dashboard/groups/${groupId}/channels/${channelId}?view=messages`;
}

function formatConversationTime(value?: Date | string | null) {
  if (!value) {
    return "New";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "New";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return formatReadableTimestamp(date);
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
