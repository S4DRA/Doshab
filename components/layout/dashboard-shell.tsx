import Link from "next/link";

import { RealtimeMessagePanel } from "@/components/chat/realtime-message-panel";
import { FriendRequestList } from "@/components/friends/friend-request-list";
import { FriendSearchForm } from "@/components/friends/friend-search-form";
import { ChannelList } from "@/components/groups/channel-list";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { GroupInvitesList } from "@/components/groups/group-invites-list";
import { GroupMembersList } from "@/components/groups/group-members-list";
import { Alert } from "@/components/ui/alert";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { LazyLiveKitVoiceRoom } from "@/components/voice/lazy-livekit-voice-room";
import { formatUserStatus } from "@/lib/utils";
import type {
  ChatMessage,
  DashboardGroup,
  FriendPerson,
  FriendRequestItem,
  GroupChannel,
  GroupInviteItem,
  GroupMemberItem,
  MessageThread,
} from "@/types";

type DashboardHomeData = {
  addFriendMessage?: string;
  addFriendQuery?: string;
  addFriendResult?: FriendPerson | null;
  friends: FriendPerson[];
  groupInvites: GroupInviteItem[];
  incomingRequests: FriendRequestItem[];
  outgoingRequests: FriendRequestItem[];
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
}: DashboardShellProps) {
  const canCreateChannels =
    !selectedGroup?.isDirectMessage &&
    (selectedGroup?.currentUserRole === "OWNER" ||
      selectedGroup?.currentUserRole === "ADMIN");
  const selectedMessageThread = selectedGroup?.isDirectMessage
    ? messageThreads.find((thread) => thread.id === selectedGroup.id)
    : null;

  return (
    <main className="flex h-full min-h-0 w-full max-w-full overflow-hidden bg-[#070907]/95 text-slate-100 sm:h-auto sm:min-h-[100dvh] sm:overflow-visible min-[1180px]:h-[100dvh] min-[1180px]:min-h-0 min-[1180px]:overflow-hidden">
      <aside className="dashboard-secondary-sidebar hidden w-[292px] shrink-0 flex-col gap-3 border-r border-white/10 bg-[#0d100e] p-3 min-[1180px]:flex min-[1500px]:w-[312px]">
        {activeSection === "messages" || selectedGroup?.isDirectMessage ? (
          <MessageThreadSidebar
            selectedGroupId={selectedGroup?.id}
            threads={messageThreads}
          />
        ) : selectedGroup ? (
          <>
            <div className="app-card p-4 min-[1180px]:p-3.5">
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
            <ChannelList
              canManageChannels={canCreateChannels}
              channels={selectedGroup.channels}
              groupId={selectedGroup.id}
              selectedChannelId={selectedChannel?.id}
            />
            {!selectedGroup.isDirectMessage ? (
              <Link
                className="mt-auto rounded-lg border border-white/10 bg-[#181818] px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/70 hover:bg-[#242424] hover:text-white min-[1180px]:text-xs"
                href={`/dashboard/groups/${selectedGroup.id}/settings`}
              >
                Space settings
              </Link>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="app-card p-4">
              <p className="app-section-title">
                Spaces
              </p>
              <h1 className="mt-2 text-lg font-semibold text-white">Your spaces</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-3">
              {groups.length ? (
                <p className="text-sm leading-6 text-slate-300">
                  Select a space from the sidebar or create a new private space.
                </p>
              ) : (
                <p className="text-sm leading-6 text-slate-300">
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

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden sm:overflow-visible min-[1180px]:overflow-hidden">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-[#090c0a]/92 py-2 pl-3 pr-24 backdrop-blur sm:px-6 min-[1180px]:min-h-16 min-[1180px]:px-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5F25] min-[1180px]:text-[11px]">
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
                className="app-icon-button app-icon-button-primary h-9 w-9 min-[1180px]:h-8 min-[1180px]:w-8"
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
            channel={selectedChannel}
            currentUser={currentUser}
            groupId={selectedGroup?.id}
            groupName={selectedGroup?.name}
            messages={selectedChannel.messages ?? []}
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
          <MessagesHome threads={messageThreads} />
        ) : (
          <DashboardHome data={homeData} />
        )}
      </section>
    </main>
  );
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
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
                  selectedGroupId === thread.id
                    ? "border-[#FF5F25]/60 bg-[#FF5F25]/12"
                    : "border-transparent hover:border-white/20 hover:bg-white/7"
                }`}
                key={thread.id}
              >
                <Link
                  className="flex min-w-0 flex-1 items-center gap-3"
                  href={`/dashboard/groups/${thread.id}/channels/${thread.channelId}`}
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
                    Private message
                  </span>
                </span>
                </Link>
                {thread.friend ? (
                  <form action="/api/friend-calls/start" method="post">
                    <input name="friendId" type="hidden" value={thread.friend.id} />
                    <button
                      aria-label={`Call ${thread.name}`}
                    className="app-icon-button app-icon-button-primary h-7 w-7"
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
              Use the plus button in the sidebar and choose a friend to start a PM.
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
                  href={`/dashboard/groups/${thread.id}/channels/${thread.channelId}`}
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
              No PMs yet. Click the plus button in the left sidebar and choose a friend.
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
                    <AvatarInitials imageUrl={group.image} size="lg" value={group.name} />
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
                        No channels in this space yet.
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
  channel,
  currentUser,
  groupId,
  groupName,
  messages,
}: {
  channel: GroupChannel;
  currentUser?: ChatMessage["sender"];
  groupId?: string;
  groupName?: string;
  messages: ChatMessage[];
}) {
  if (channel.type === "VOICE") {
    return (
      <div className="flex min-h-0 flex-1 flex-col min-[1180px]:h-full">
        <div className="border-b border-white/10 bg-[#090c0a]/92 px-3 py-2 backdrop-blur min-[1180px]:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
                {groupName ?? "Voice"}
              </p>
              <h2 className="truncate text-lg font-semibold text-white">
                {channel.name}
              </h2>
            </div>
            {groupId ? (
              <Link
                className="inline-flex h-9 shrink-0 items-center rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 transition hover:border-[#FF5F25] hover:text-white"
                href={`/dashboard/groups/${groupId}`}
              >
                Channels
              </Link>
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
    <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 min-[1180px]:h-full min-[1180px]:px-7 min-[1180px]:py-5">
      <section className="app-surface shrink-0 rounded-xl p-3 sm:p-4 min-[1180px]:rounded-lg min-[1180px]:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
              {groupName ?? "Channel"}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl min-[1180px]:text-xl">
              # {channel.name}
            </h2>
          </div>
          {groupId ? (
            <Link
              className="inline-flex h-9 shrink-0 items-center rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 transition hover:border-[#FF5F25] hover:text-white min-[1180px]:hidden"
              href={`/dashboard/groups/${groupId}`}
            >
              Channels
            </Link>
          ) : null}
        </div>
      </section>
      <div className="mt-4 min-h-0 flex-1 sm:min-h-[28rem] min-[1180px]:min-h-0">
        <RealtimeMessagePanel
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

function DashboardHome({ data }: { data?: DashboardHomeData }) {
  const friends = data?.friends ?? [];
  const onlineCount = friends.filter((friend) => friend.status === "ONLINE").length;

  return (
    <div className="app-page-scroll">
      <div className="app-page-container grid gap-5">
        <section className="app-page-header">
          <div className="flex flex-col gap-4 min-[760px]:flex-row min-[760px]:items-end min-[760px]:justify-between">
            <div className="min-w-0">
              <p className="app-section-title">Dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Your private workspace
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Start from friends, pending requests, and invites. Spaces and messages stay one click away in the sidebars.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right min-[760px]:min-w-52">
              <MetricCard label="Friends" value={friends.length} />
              <MetricCard label="Online" value={onlineCount} />
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
          <FriendSearchForm
            message={data?.addFriendMessage}
            query={data?.addFriendQuery}
            redirectTo="/dashboard"
            result={data?.addFriendResult}
          />
          <FriendStatusPanel
            friends={friends}
            onlineCount={onlineCount}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <FriendRequestList
            emptyText="No incoming requests."
            kind="incoming"
            requests={data?.incomingRequests ?? []}
            title="Incoming requests"
          />
          <FriendRequestList
            emptyText="No outgoing requests."
            kind="outgoing"
            requests={data?.outgoingRequests ?? []}
            title="Outgoing requests"
          />
        </div>

        <GroupInvitesList invites={data?.groupInvites ?? []} />
      </div>
    </div>
  );
}

function FriendStatusPanel({
  friends,
  onlineCount,
}: {
  friends: FriendPerson[];
  onlineCount: number;
}) {
  return (
    <section className="app-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="app-section-title">
            Friends status
          </p>
          <h2 className="mt-2 text-base font-semibold text-white">
            {onlineCount} online
          </h2>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
          {friends.length} total
        </span>
      </div>

      {friends.length ? (
        <div className="mt-5 max-h-80 space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {friends.map((friend) => (
            <div
              className="app-row flex w-full min-w-0 items-center gap-3 p-3 transition"
              key={friend.id}
            >
              <AvatarInitials
                imageUrl={friend.image}
                value={friend.name || friend.email}
              />
              <form action="/api/private-messages" className="min-w-0 flex-1" method="post">
                <input name="friendId" type="hidden" value={friend.id} />
                <button className="w-full min-w-0 text-left" type="submit">
                  <span className="block truncate text-sm font-semibold text-white">
                    {friend.name || friend.email}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {friend.email}
                  </span>
                </button>
              </form>
              <span className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                <span className="app-status-dot" data-status={friend.status ?? "OFFLINE"} />
                <span className="hidden sm:inline">
                  {formatUserStatus(friend.status)}
                </span>
              </span>
              <form action="/api/friend-calls/start" method="post">
                <input name="friendId" type="hidden" value={friend.id} />
                <button
                  aria-label={`Call ${friend.name || friend.email}`}
                  className="app-icon-button app-icon-button-primary h-9 w-9"
                  type="submit"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z" />
                  </svg>
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-slate-400">
          Friends will appear here after requests are accepted.
        </p>
      )}
    </section>
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
              No channels yet.
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
                  {group.channels[0] ? (
                    <Link
                      className="app-button-primary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
                      href={`/dashboard/groups/${group.id}/channels/${group.channels[0].id}`}
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
                  className="app-button-secondary h-10 rounded-lg px-4 text-sm font-semibold transition"
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
