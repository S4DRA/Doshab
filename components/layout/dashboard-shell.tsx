import Link from "next/link";

import { ChannelHeaderActions } from "@/components/chat/channel-header-actions";
import { RealtimeMessagePanel } from "@/components/chat/realtime-message-panel";
import { ChannelList } from "@/components/groups/channel-list";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { GroupMembersList } from "@/components/groups/group-members-list";
import { Alert } from "@/components/ui/alert";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { LazyLiveKitVoiceRoom } from "@/components/voice/lazy-livekit-voice-room";
import { formatReadableTimestamp, formatUserStatus } from "@/lib/utils";
import type { ReactNode } from "react";
import type {
  ChatMessage,
  DashboardGroup,
  FriendPerson,
  GroupChannel,
  GroupMemberItem,
  MessageThread,
} from "@/types";

type DashboardHomeData = {
  friends: FriendPerson[];
  message?: string;
  messageTone?: "neutral" | "success" | "error" | "warning";
  requestsPanel?: ReactNode;
};

type DashboardShellProps = {
  currentUser?: ChatMessage["sender"];
  groups: DashboardGroup[];
  homeData?: DashboardHomeData;
  selectedGroup?: DashboardGroup & {
    channels: GroupChannel[];
    currentUserRole?: "OWNER" | "ADMIN" | "MEMBER";
    members?: GroupMemberItem[];
    notice?: string;
  };
  selectedChannel?: GroupChannel & {
    messages?: ChatMessage[];
  };
  activeSection?: "dashboard" | "friends" | "channels" | "messages";
  groupSettingsPanel?: React.ReactNode;
  invitePanel?: React.ReactNode;
  messageThreads?: MessageThread[];
  messagesPageContent?: React.ReactNode;
};

export function DashboardShell({
  currentUser,
  groups,
  homeData,
  selectedGroup,
  selectedChannel,
  activeSection = "dashboard",
  groupSettingsPanel,
  invitePanel,
  messageThreads = [],
  messagesPageContent,
}: DashboardShellProps) {
  const canCreateChannels =
    !selectedGroup?.isDirectMessage &&
    (selectedGroup?.currentUserRole === "OWNER" ||
      selectedGroup?.currentUserRole === "ADMIN");
  const selectedMessageThread = selectedGroup?.isDirectMessage
    ? messageThreads.find((thread) => thread.id === selectedGroup.id)
    : null;

  return (
    <main className="dashboard-shell-root flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-[#070907]/95 text-slate-100">
      <aside className="dashboard-secondary-sidebar hidden min-h-0 w-[292px] shrink-0 flex-col gap-3 overflow-hidden border-r border-white/10 bg-[#0d100e] p-3 min-[1180px]:flex min-[1500px]:w-[312px]">
        {activeSection === "messages" || selectedGroup?.isDirectMessage ? (
          <MessageThreadSidebar
            selectedGroupId={selectedGroup?.id}
            threads={messageThreads}
          />
        ) : selectedGroup ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="app-card shrink-0 p-4 min-[1180px]:p-3.5">
              <p className="app-section-title">
                Space
              </p>
              <h1 className="mt-2 break-words text-lg font-semibold text-white min-[1180px]:text-base">{selectedGroup.name}</h1>
              {selectedGroup.description ? (
                <p className="mt-2 break-words text-sm leading-6 text-slate-400 min-[1180px]:text-xs min-[1180px]:leading-5">
                  {selectedGroup.description}
                </p>
              ) : null}
            </div>
            <div className="min-h-0 flex-1">
              <ChannelList
                canManageChannels={canCreateChannels}
                channels={selectedGroup.channels}
                groupId={selectedGroup.id}
                selectedChannelId={selectedChannel?.id}
              />
            </div>
            {!selectedGroup.isDirectMessage ? (
              <Link
                className="mt-auto shrink-0 rounded-lg border border-white/10 bg-[#181818] px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/70 hover:bg-[#242424] hover:text-white min-[1180px]:text-xs"
                href={`/dashboard/groups/${selectedGroup.id}/settings`}
              >
                Space settings
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="app-card p-4">
              <p className="app-section-title">
                Spaces
              </p>
              <h1 className="mt-2 text-lg font-semibold text-white">Your spaces</h1>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto py-3">
              {groups.length ? (
                <div className="grid gap-2">
                  {groups.map((group) => (
                    <Link
                      className="app-row flex min-w-0 items-center gap-3 px-3 py-3 transition hover:border-[#FF5F25]/70"
                      href={getDefaultSpaceHref(group)}
                      key={group.id}
                    >
                      <AvatarInitials fallback="group" imageUrl={group.image} value={group.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {group.name}
                        </span>
                        <span className="block truncate text-xs text-slate-400">
                          {formatSpaceMembers(group.members)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-1 text-sm leading-6 text-slate-300">
                  Create your first private space for voice, chat, and collaboration.
                </p>
              )}
            </div>
            <div className="app-card p-4">
              <CreateGroupForm compact />
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="dashboard-shell-header sticky top-0 z-10 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#090c0a]/92 px-3 py-2 sm:px-6 min-[1180px]:min-h-16 min-[1180px]:px-7">
          <div className="min-w-0">
            <p className="app-section-title">
              {selectedChannel ? selectedChannel.name : selectedGroup ? selectedGroup.name : activeSection === "channels" ? "Channels" : activeSection === "messages" ? "Messages" : "Dashboard"}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-400 min-[1180px]:text-xs">
              {selectedChannel
                ? selectedChannel.type === "TEXT"
                  ? "Text channel"
                  : "Voice channel"
                : selectedGroup
                  ? selectedGroup.isDirectMessage
                    ? "Private message"
                    : "Space"
                  : activeSection === "channels"
                    ? "Browse channels across your spaces"
                    : activeSection === "messages"
                      ? "Private messages"
                      : "Spaces foundation"}
            </p>
          </div>
          {selectedMessageThread?.friend ? (
            <form action="/api/friend-calls/start" method="post">
              <input name="friendId" type="hidden" value={selectedMessageThread.friend.id} />
              <button
                aria-label={`Call ${selectedMessageThread.name}`}
                className="app-icon-button app-icon-button-primary h-11 w-11 min-[1180px]:h-8 min-[1180px]:w-8"
                title={`Call ${selectedMessageThread.name}`}
                type="submit"
              >
                <PhoneIcon className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="h-1 w-1" />
          )}
        </header>

        {groupSettingsPanel ? (
          groupSettingsPanel
        ) : selectedChannel ? (
          <ChannelMain
            canInvite={
              !selectedGroup?.isDirectMessage &&
              (selectedGroup?.currentUserRole === "OWNER" ||
                selectedGroup?.currentUserRole === "ADMIN")
            }
            canManageSpace={
              !selectedGroup?.isDirectMessage &&
              (selectedGroup?.currentUserRole === "OWNER" ||
                selectedGroup?.currentUserRole === "ADMIN")
            }
            channel={selectedChannel}
            channels={selectedGroup?.channels ?? []}
            currentUser={currentUser}
            currentUserId={currentUser?.id}
            canPinMessages={
              !selectedGroup?.isDirectMessage &&
              (selectedGroup?.currentUserRole === "OWNER" ||
                selectedGroup?.currentUserRole === "ADMIN")
            }
            groupId={selectedGroup?.id}
            groupName={selectedGroup?.name}
            messages={selectedChannel.messages ?? []}
            members={selectedGroup?.members ?? []}
          />
        ) : selectedGroup ? (
          <GroupMain
            canInvite={canCreateChannels}
            canDeleteGroup={
              !selectedGroup.isDirectMessage &&
              selectedGroup.currentUserRole === "OWNER"
            }
            currentUserId={currentUser?.id}
            group={selectedGroup}
            invitePanel={invitePanel}
          />
        ) : activeSection === "channels" ? (
          <ChannelsHome groups={groups} />
        ) : activeSection === "messages" ? (
          messagesPageContent ?? <MessagesHome threads={messageThreads} />
        ) : (
          <DashboardHome currentUser={currentUser} data={homeData} groups={groups} />
        )}
      </section>
    </main>
  );
}

function formatSpaceMembers(members: GroupMemberItem[] | undefined) {
  if (!members?.length) {
    return "No people yet";
  }

  const names = members
    .slice(0, 3)
    .map((member) => member.user.name || member.user.email);

  return members.length > 3 ? `${names.join(", ")} ....` : names.join(", ");
}

function MessageThreadSidebar({
  selectedGroupId,
  threads,
}: {
  selectedGroupId?: string;
  threads: MessageThread[];
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="app-card p-4 min-[1180px]:p-3.5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Messages
        </p>
        <h1 className="mt-2 text-lg font-semibold text-white">Private chats</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {threads.length ? (
          <div className="space-y-1">
            {threads.map((thread) => (
              <div
                className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2.5 transition ${
                  selectedGroupId === thread.id
                    ? "border-[#6B5BFF] bg-[#1A1D22] shadow-[5px_5px_0_#000]"
                    : "border-transparent bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
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
                    <span className="block truncate text-sm font-semibold text-white">
                      {thread.name}
                    </span>
                    <span
                      className={`block truncate text-xs transition ${
                        selectedGroupId === thread.id ? "text-[#FFD0BF]" : "text-slate-400"
                      }`}
                    >
                      {thread.lastActivityAt
                        ? `Active ${formatReadableTimestamp(thread.lastActivityAt)}`
                        : "Private message"}
                    </span>
                    {selectedGroupId === thread.id ? (
                      <span className="mt-1 inline-flex w-fit items-center rounded-full border border-[#FF5F25]/30 bg-[#FF5F25]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FFD0BF]">
                        Open
                      </span>
                    ) : null}
                  </span>
                </Link>
                {thread.friend ? (
                  <form action="/api/friend-calls/start" method="post">
                    <input name="friendId" type="hidden" value={thread.friend.id} />
                    <button
                      aria-label={`Call ${thread.name}`}
                      className={`app-icon-button app-icon-button-primary h-10 w-10 min-[1180px]:h-7 min-[1180px]:w-7 ${
                        selectedGroupId === thread.id
                          ? "border-[#FF5F25]/45 bg-[#FF5F25]/10 text-[#FFD0BF]"
                          : ""
                      }`}
                      title={`Call ${thread.name}`}
                      type="submit"
                    >
                      <PhoneIcon className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">No private chats yet</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Use Create, choose a friend, and VAL will open a private chat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MessagesHome({ threads }: { threads: MessageThread[] }) {
  return (
    <div className="app-page-scroll">
      <div className="app-page-container space-y-4">
        <section className="app-page-header">
          <p className="app-section-title">
            Private messages
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Choose a conversation
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Your private chats live in the sidebar. Open one to continue the conversation.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {threads.length ? (
            threads.map((thread) => (
              <div
                className="app-card flex items-center gap-3 p-4 transition hover:border-[#FF5F25]/70"
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
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {thread.name}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      Open private chat
                    </span>
                  </span>
                </Link>
                {thread.friend ? (
                  <form action="/api/friend-calls/start" method="post">
                    <input name="friendId" type="hidden" value={thread.friend.id} />
                    <button
                      aria-label={`Call ${thread.name}`}
                      className="app-icon-button app-icon-button-primary h-10 w-10"
                      title={`Call ${thread.name}`}
                      type="submit"
                    >
                      <PhoneIcon className="h-4 w-4" />
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <div className="app-card p-5 text-sm leading-6 text-slate-300">
              No private chats yet. Use Create and choose a friend to start one.
            </div>
          )}
        </section>
      </div>
    </div>
  );
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

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function ChannelsHome({
  groups,
}: {
  groups: Array<DashboardGroup & {
    channels?: GroupChannel[];
    members?: GroupMemberItem[];
  }>;
}) {
  return (
    <div className="app-page-scroll">
      <div className="app-page-container space-y-4">
        <section className="app-page-header">
          <p className="app-section-title">
            Channels
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">All channels in one place</h2>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-300">
            View every text and voice channel across your private spaces, then jump into the space you need.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {groups.length ? (
            groups.map((group) => {
              const members = group.members ?? [];
              const channels = group.channels ?? [];
              const onlineCount = members.filter(
                (member) => member.user.status === "ONLINE",
              ).length;

              return (
                <article className="app-card overflow-hidden" key={group.id}>
                  <div className="flex items-start gap-3 border-b border-white/10 p-4">
                    <AvatarInitials fallback="group" imageUrl={group.image} size="lg" value={group.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold text-white">
                          {group.name}
                        </h3>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {channels.length} channels
                        </span>
                      </div>
                      {group.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                          {group.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
                          Who is in it
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {members.length} members, {onlineCount} online
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {members.slice(0, 5).map((member) => (
                          <AvatarInitials
                            imageUrl={member.user.image}
                            key={member.id}
                            size="sm"
                            value={member.user.name || member.user.email}
                          />
                        ))}
                        {members.length > 5 ? (
                          <span className="grid size-9 place-items-center rounded-lg border border-white/10 bg-[#181818] text-xs font-bold text-slate-300">
                            +{members.length - 5}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 p-4">
                    {channels.length ? (
                      channels.map((channel) => (
                        <Link
                          className="app-row flex min-h-12 items-center justify-between gap-3 px-3 py-2.5 transition hover:border-[#FF5F25]/70"
                          href={`/dashboard/groups/${group.id}/channels/${channel.id}`}
                          key={channel.id}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/7 text-xs font-bold text-slate-200">
                              {channel.type === "TEXT" ? "#" : "V"}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-white">
                                {channel.name}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {channel.type === "TEXT" ? "Text channel" : "Voice room"}
                              </span>
                            </span>
                          </span>
                          <span className="rounded-lg border border-white/10 px-2 py-1 text-xs font-semibold text-slate-300">
                            Open
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
                        No channels yet. Create one in space settings to start talking.
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="app-card p-6 text-center text-slate-400 xl:col-span-2">
              No channels found yet. Create a space to add your first channels.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChannelMain({
  canInvite = false,
  canManageSpace = false,
  canPinMessages = false,
  channel,
  channels,
  currentUser,
  currentUserId,
  groupId,
  groupName,
  messages,
  members,
}: {
  canInvite?: boolean;
  canManageSpace?: boolean;
  canPinMessages?: boolean;
  channel: GroupChannel;
  channels: GroupChannel[];
  currentUser?: ChatMessage["sender"];
  currentUserId?: string;
  groupId?: string;
  groupName?: string;
  messages: ChatMessage[];
  members: GroupMemberItem[];
}) {
  if (channel.type === "VOICE") {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden min-[1180px]:h-full">
        <div className="border-b border-white/10 bg-[#090c0a]/92 px-3 py-2 min-[1180px]:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="app-section-title">
                {groupName ?? "Voice"}
              </p>
              <h2 className="truncate text-lg font-semibold text-white">
                {channel.name}
              </h2>
            </div>
            {groupId ? (
              <ChannelHeaderActions
                canInvite={canInvite}
                canManageSpace={canManageSpace}
                channels={channels}
                currentUserId={currentUserId}
                groupId={groupId}
                groupName={groupName}
                members={members}
                selectedChannelId={channel.id}
              />
            ) : null}
          </div>
        </div>
        <LazyLiveKitVoiceRoom
          channelId={channel.id}
          channelName={channel.name}
          groupId={groupId}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-shell-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2.5 py-2.5 sm:px-4 sm:py-4 min-[1180px]:px-6 min-[1180px]:py-4">
      <section className="channel-top-bar shrink-0 app-surface rounded-xl px-3 py-2.5 sm:px-4 min-[1180px]:rounded-lg min-[1180px]:px-4 min-[1180px]:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="app-section-title">
              {groupName ?? "Channel"}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-white sm:text-xl min-[1180px]:text-xl">
              # {channel.name}
            </h2>
          </div>
          {groupId ? (
            <ChannelHeaderActions
              canInvite={canInvite}
              canManageSpace={canManageSpace}
              channels={channels}
              currentUserId={currentUserId}
              groupId={groupId}
              groupName={groupName}
              members={members}
              selectedChannelId={channel.id}
            />
          ) : null}
        </div>
      </section>
      <div className="mt-2 flex min-h-0 min-w-0 flex-1 flex-col sm:mt-3">
        <RealtimeMessagePanel
          canPinMessages={canPinMessages}
          channelId={channel.id}
          channelName={channel.name}
          currentUser={currentUser}
          initialMessages={messages}
          key={channel.id}
        />
      </div>
    </div>
  );
}

function DashboardHome({
  currentUser,
  data,
  groups,
}: {
  currentUser?: ChatMessage["sender"];
  data?: DashboardHomeData;
  groups: DashboardGroup[];
}) {
  const friends = data?.friends ?? [];
  const onlineFriends = friends.filter((friend) => friend.status === "ONLINE");
  const currentUserId = currentUser?.id;
  const firstName = currentUser?.name?.trim().split(/\s+/)[0];

  return (
    <div className="app-page-scroll">
      <div className="app-page-container dashboard-home-stack grid">
        <section className="app-page-header dashboard-welcome-card">
          <span className="dashboard-welcome-mark" aria-hidden="true" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="app-section-title">Home</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
                Welcome back{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Your spaces, requests, invites, and online friends are ready from one focused command center.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="app-button-secondary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
                href="/dashboard/friends?add=1"
              >
                Add friend
              </Link>
              <Link
                className="app-button-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
                href="#create-space"
              >
                Create space
              </Link>
            </div>
          </div>
        </section>

        {data?.message ? (
          <Alert tone={data.messageTone ?? "neutral"}>{data.message}</Alert>
        ) : null}

        {data?.requestsPanel ? data.requestsPanel : null}

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <DashboardGlyph icon="space" />
              <span className="min-w-0">
                <p className="app-section-title">Spaces</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Your spaces</h2>
              </span>
            </div>
            <span className="app-badge px-3 py-1 text-xs font-semibold">
              {groups.length} total
            </span>
          </div>
          <div className={`grid gap-4 md:grid-cols-2 ${groups.length === 1 ? "xl:grid-cols-1" : "xl:grid-cols-3"}`}>
            {groups.length ? (
              groups.map((group) => (
                <HomeGroupCard currentUserId={currentUserId} group={group} key={group.id} />
              ))
            ) : (
              <div className="app-empty-state md:col-span-2 xl:col-span-3">
                <p className="text-sm leading-6 text-slate-400">
                  No spaces yet. Create one below to start a private place for messages, voice, and invites.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    className="app-button-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
                    href="#create-space"
                  >
                    Create space
                  </Link>
                  <Link
                    className="app-button-secondary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
                    href="/dashboard/friends?add=1"
                  >
                    Add friend
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <DashboardGlyph icon="friends" />
              <span className="min-w-0">
                <p className="app-section-title">Online friends</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Friends online</h2>
              </span>
            </div>
            <span className="app-badge px-3 py-1 text-xs font-semibold">
              {onlineFriends.length} online
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {onlineFriends.length ? (
              onlineFriends.map((friend) => (
                <OnlineFriendCard friend={friend} key={friend.id} />
              ))
            ) : (
              <div className="app-empty-state md:col-span-2 xl:col-span-3">
                <p className="text-sm leading-6 text-slate-400">
                  No friends are online right now.
                </p>
                <Link
                  className="app-button-secondary mt-4 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
                  href="/dashboard/friends?add=1"
                >
                  Add friends
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="app-panel p-5">
          <p className="app-section-title">Update news</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <UpdateNewsItem
              body="Incoming calls now use stronger PWA notifications and direct call links."
              title="Call alerts improved"
            />
            <UpdateNewsItem
              body="The friends icon opens a focused list with message and call actions."
              title="Friends shortcut"
            />
            <UpdateNewsItem
              body="Theme settings are back as compact visual cards."
              title="Theme cards"
            />
          </div>
        </section>

        <section className="app-panel p-5" id="create-space">
          <div className="mb-4">
            <p className="app-section-title">Create space</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Create space</h2>
          </div>
          <CreateGroupForm />
        </section>
      </div>
    </div>
  );
}

function HomeGroupCard({
  currentUserId,
  group,
}: {
  currentUserId?: string;
  group: DashboardGroup;
}) {
  const members = group.members ?? [];
  const channels = group.channels ?? [];
  const visibleChannels = channels.slice(0, 3);
  const visibleMembers = members.slice(0, 3);
  const currentMember = members.find((member) => member.user.id === currentUserId);
  const canManageSpace =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const defaultSpaceHref = getDefaultSpaceHref(group);

  return (
    <article className="app-card dashboard-space-card transition">
      <div className="dashboard-space-identity flex min-w-0 items-start gap-4">
        <AvatarInitials fallback="group" imageUrl={group.image} size="lg" value={group.name} />
        <span className="min-w-0 flex-1">
          <Link
            className="block truncate text-lg font-black text-white transition hover:text-[#FFB199]"
            href={defaultSpaceHref}
          >
            {group.name}
          </Link>
          <span className="mt-1 block text-xs font-bold text-slate-400">
            {channels.length} {channels.length === 1 ? "channel" : "channels"} / {members.length} {members.length === 1 ? "member" : "members"}
          </span>
          {group.description ? (
            <span className="mt-2 block line-clamp-2 text-xs leading-5 text-slate-500">
              {group.description}
            </span>
          ) : null}
          {visibleChannels.length ? (
            <span className="dashboard-channel-pills mt-3 flex min-w-0 flex-wrap gap-2">
              {visibleChannels.map((channel) => (
                <Link
                  className="dashboard-channel-pill"
                  href={
                    channel.type === "TEXT"
                      ? `/dashboard/groups/${group.id}/channels/${channel.id}`
                      : `/dashboard/groups/${group.id}`
                  }
                  key={channel.id}
                >
                  {channel.type === "TEXT" ? "# " : ""}
                  {channel.name}
                </Link>
              ))}
              {channels.length > visibleChannels.length ? (
                <span className="dashboard-channel-pill dashboard-channel-pill-muted">
                  +{channels.length - visibleChannels.length}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      </div>

      <div className="dashboard-space-people min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#FF5F25]">
          People
        </span>
        <span className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
          {visibleMembers.length ? (
            <>
              {visibleMembers.map((member) => (
                <span
                  className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1"
                  key={member.id}
                >
                  <AvatarInitials
                    imageUrl={member.user.image}
                    size="sm"
                    value={member.user.name || member.user.email}
                  />
                  <span className="truncate text-xs font-semibold text-slate-200">
                    {member.user.name || member.user.email}
                  </span>
                </span>
              ))}
              {members.length > 3 ? (
                <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-bold text-slate-300">
                  ....
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-sm text-slate-400">No people yet</span>
          )}
        </span>
      </div>

      <div className="dashboard-space-actions flex flex-wrap gap-2">
        {currentMember?.role ? (
          <span className="dashboard-space-role app-badge px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
            {currentMember.role.toLowerCase()}
          </span>
        ) : null}
        <Link
          className="app-button-primary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
          href={defaultSpaceHref}
        >
          Open
        </Link>
        {canManageSpace ? (
          <>
            <Link
              className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
              href={`/dashboard/groups/${group.id}/settings#invite-friends`}
            >
              Invite
            </Link>
            <Link
              className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
              href={`/dashboard/groups/${group.id}/settings`}
            >
              Settings
            </Link>
          </>
        ) : null}
      </div>
    </article>
  );
}

function OnlineFriendCard({ friend }: { friend: FriendPerson }) {
  const friendLabel = friend.name || friend.email;

  return (
    <article className="app-card flex min-w-0 items-center gap-3 p-4">
      <AvatarInitials imageUrl={friend.image} value={friendLabel} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-white">{friendLabel}</h3>
        <p className="mt-1 flex items-center gap-2 text-xs text-emerald-300">
          <span className="app-status-dot" data-status={friend.status ?? "OFFLINE"} />
          {formatUserStatus(friend.status)}
        </p>
      </div>
      <form action="/api/private-messages" method="post">
        <input name="friendId" type="hidden" value={friend.id} />
        <button
          aria-label={`Message ${friendLabel}`}
          className="app-icon-button h-10 w-10"
          title={`Message ${friendLabel}`}
          type="submit"
        >
          <MessageIcon className="h-4 w-4" />
        </button>
      </form>
      <form action="/api/friend-calls/start" method="post">
        <input name="friendId" type="hidden" value={friend.id} />
        <button
          aria-label={`Call ${friendLabel}`}
          className="app-icon-button app-icon-button-primary h-10 w-10"
          title={`Call ${friendLabel}`}
          type="submit"
        >
          <PhoneIcon className="h-4 w-4" />
        </button>
      </form>
    </article>
  );
}

function UpdateNewsItem({ body, title }: { body: string; title: string }) {
  return (
    <article className="app-row flex min-w-0 gap-3 p-4">
      <DashboardGlyph icon="news" />
      <span className="min-w-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-slate-400">{body}</p>
      </span>
    </article>
  );
}

function DashboardGlyph({ icon }: { icon: "friends" | "news" | "space" }) {
  return (
    <span className={`dashboard-glyph dashboard-glyph-${icon}`} aria-hidden="true">
      {icon === "friends" ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ) : icon === "news" ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        </svg>
      )}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="app-card min-w-0 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function getDirectMessageHref(groupId: string, channelId?: string | null) {
  if (!channelId) {
    return `/dashboard/groups/${groupId}?view=messages`;
  }

  return `/dashboard/groups/${groupId}/channels/${channelId}?view=messages`;
}

function getDefaultSpaceHref(group: DashboardGroup) {
  const firstTextChannel = group.channels?.find((channel) => channel.type === "TEXT");

  if (firstTextChannel) {
    return `/dashboard/groups/${group.id}/channels/${firstTextChannel.id}`;
  }

  if (group.firstTextChannelId) {
    return `/dashboard/groups/${group.id}/channels/${group.firstTextChannelId}`;
  }

  return `/dashboard/groups/${group.id}`;
}

function GroupMain({
  group,
  canInvite,
  currentUserId,
  canDeleteGroup,
  invitePanel,
}: {
  group: DashboardGroup & {
    channels: GroupChannel[];
    members?: GroupMemberItem[];
    notice?: string;
  };
  canInvite: boolean;
  currentUserId?: string;
  canDeleteGroup: boolean;
  invitePanel?: React.ReactNode;
}) {
  const textChannelCount = group.channels.filter((channel) => channel.type === "TEXT").length;
  const voiceChannelCount = group.channels.filter((channel) => channel.type === "VOICE").length;
  const onlineMemberCount = (group.members ?? []).filter(
    (member) => member.user.status === "ONLINE",
  ).length;
  const firstTextChannel = group.channels.find((channel) => channel.type === "TEXT");

  return (
    <div className="app-page-scroll">
      <div className="grid w-full min-w-0 gap-3 min-[1180px]:hidden">
        {group.notice ? <Alert>{group.notice}</Alert> : null}
        <section className="app-surface rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
            {group.isDirectMessage ? "Private message" : "Channels"}
          </p>
          <h2 className="mt-1 truncate text-2xl font-semibold text-white">
            {group.name}
          </h2>
        </section>

        <section className="grid gap-2">
          {group.channels.length ? (
            group.channels.map((channel) => (
              <Link
                className="app-card flex min-h-14 items-center justify-between gap-3 p-3 transition hover:border-[#FF5F25]/70"
                href={`/dashboard/groups/${group.id}/channels/${channel.id}`}
                key={channel.id}
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-white">
                    {channel.type === "TEXT" ? "# " : ""}
                    {channel.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {channel.type === "TEXT" ? "Text" : "Voice"}
                  </span>
                </span>
                <span className="rounded-lg border border-white/10 px-2 py-1 text-xs font-semibold text-slate-300">
                  Open
                </span>
              </Link>
            ))
          ) : (
            <div className="app-card p-5 text-sm text-slate-300">
              No channels yet. Create one to start talking in this space.
            </div>
          )}
        </section>

        {canInvite ? invitePanel : null}

        {!group.isDirectMessage ? (
          <Link
            className="mt-1 inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-[#181818] px-4 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/70 hover:text-white"
            href={`/dashboard/groups/${group.id}/settings`}
          >
            Space settings
          </Link>
        ) : null}
      </div>

      <div className="app-page-container hidden min-w-0 gap-5 min-[1180px]:grid">
        {group.notice ? <Alert>{group.notice}</Alert> : null}
        <section className="app-page-header">
          <div className="grid min-w-0 gap-5 min-[1180px]:grid-cols-[1fr_1.2fr] min-[1180px]:items-center">
            <div className="min-w-0">
              <p className="app-section-title">
                {group.name}
              </p>
              <h2 className="mt-2 break-words text-xl font-semibold text-white sm:text-2xl">
                {group.isDirectMessage
                  ? "A private place to talk."
                  : "A calm place for your space."}
              </h2>
              <p className="mt-3 break-words text-sm leading-6 text-slate-300">
                {group.isDirectMessage
                  ? "This conversation is only visible to the people in this private message."
                  : "Start by picking a channel or creating something new. This space is made for focused conversation, private invites, and clear shared routines."}
              </p>
              {!group.isDirectMessage ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
                    href={`/dashboard/groups/${group.id}/settings`}
                  >
                    Space settings
                  </Link>
                  {firstTextChannel ? (
                    <Link
                      className="app-button-primary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
                      href={`/dashboard/groups/${group.id}/channels/${firstTextChannel.id}`}
                    >
                      Open first channel
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Members" value={group.members?.length ?? 0} />
              <MetricCard label="Online" value={onlineMemberCount} />
              <MetricCard label="Text channels" value={textChannelCount} />
              <MetricCard label="Voice rooms" value={voiceChannelCount} />
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-5 min-[1180px]:grid-cols-[1.2fr_0.8fr]">
          <GroupMembersList currentUserId={currentUserId} members={group.members ?? []} />
          {canInvite ? invitePanel : (
            <section className="app-panel p-5">
              <p className="app-section-title">
                Invites
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">Owner access only</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Space invites are reserved for owners and admins. Reach out to an
                administrator when you want to expand the circle.
              </p>
            </section>
          )}
        </div>

        {canDeleteGroup ? (
          <section className="app-card min-w-0 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Danger zone
                </p>
                <h3 className="mt-2 break-words text-base font-semibold text-white">Delete this space</h3>
                <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-400">
                  Permanent actions live at the bottom so daily space work stays focused.
                </p>
              </div>
              <form action={`/api/groups/${group.id}/delete`} method="post">
                <button
                  className="app-button-danger h-11 rounded-lg px-4 text-sm font-semibold transition sm:h-10"
                  type="submit"
                >
                  Delete space
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
