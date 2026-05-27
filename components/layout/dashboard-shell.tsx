import Link from "next/link";

import { RealtimeMessagePanel } from "@/components/chat/realtime-message-panel";
import { FriendRequestList } from "@/components/friends/friend-request-list";
import { FriendSearchForm } from "@/components/friends/friend-search-form";
import { ChannelList } from "@/components/groups/channel-list";
import { CreateChannelForm } from "@/components/groups/create-channel-form";
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
    <main className="flex h-[100dvh] min-h-0 w-full max-w-full overflow-hidden bg-[#070907]/95 text-slate-100">
      <aside className="dashboard-secondary-sidebar hidden w-[min(17rem,24vw)] shrink-0 flex-col border-r border-white/10 bg-[#0d100e] p-3 min-[1180px]:flex min-[1400px]:w-64 min-[1400px]:p-4">
        {activeSection === "messages" || selectedGroup?.isDirectMessage ? (
          <MessageThreadSidebar
            selectedGroupId={selectedGroup?.id}
            threads={messageThreads}
          />
        ) : selectedGroup ? (
          <>
            <div className="app-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                Space
              </p>
              <h1 className="mt-2 text-lg font-semibold text-white">{selectedGroup.name}</h1>
              {selectedGroup.description ? (
                <p className="mt-2 text-xs leading-5 text-slate-400">
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
                className="mt-1 rounded-lg border border-white/10 bg-[#181818] px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/70 hover:bg-[#242424] hover:text-white"
                href={`/dashboard/groups/${selectedGroup.id}/settings`}
              >
                Space settings
              </Link>
            ) : null}
            {canCreateChannels ? (
              <div className="app-card mt-auto p-4">
                <CreateChannelForm groupId={selectedGroup.id} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="app-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                Spaces
              </p>
              <h1 className="mt-2 text-lg font-semibold text-white">Your spaces</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-3">
              {groups.length ? (
                <p className="text-xs leading-5 text-slate-300">
                  Select a space from the sidebar or create a new private space.
                </p>
              ) : (
                <p className="text-xs leading-5 text-slate-300">
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

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-[#090c0a]/92 px-3 py-1.5 backdrop-blur sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#FF5F25]">
              {selectedChannel ? selectedChannel.name : selectedGroup ? selectedGroup.name : activeSection === "channels" ? "Channels" : activeSection === "messages" ? "Messages" : "Dashboard"}
            </p>
            <p className="truncate text-xs text-slate-400">
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
                className="app-icon-button app-icon-button-primary h-9 w-9"
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
      <div className="rounded-2xl border border-white/10 bg-[#121512] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Messages
        </p>
        <h1 className="mt-2 text-lg font-semibold text-white">Private chats</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        {threads.length ? (
          <div className="space-y-1">
            {threads.map((thread) => (
              <div
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
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
                      className="app-icon-button app-icon-button-primary h-8 w-8"
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
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
      <div className="w-full space-y-4">
        <section className="app-surface rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
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
  groups: Array<DashboardGroup & { channels?: GroupChannel[] }>;
}) {
  const channelCards = groups.flatMap((group) =>
    (group.channels ?? []).map((channel) => ({
      ...channel,
      groupName: group.name,
    })),
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <section className="app-surface rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
            Channels
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">All channels in one place</h2>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-300">
            View every text and voice channel across your private spaces, then jump into the space you need.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {channelCards.length ? (
            channelCards.map((channel) => (
              <div
                key={channel.id}
                className="app-card p-4"
              >
                <p className="text-sm text-slate-400">{channel.groupName}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{channel.name}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {channel.type === "TEXT" ? "Text channel" : "Voice channel"}
                </p>
              </div>
            ))
          ) : (
            <div className="app-card p-6 text-center text-slate-400">
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
      <div className="flex min-h-0 flex-1 flex-col">
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
        <LazyLiveKitVoiceRoom channelId={channel.id} channelName={channel.name} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        <section className="app-surface rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
                {groupName ?? "Channel"}
              </p>
              <h2 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
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
        <div className="mt-6">
          <RealtimeMessagePanel
            channelId={channel.id}
            channelName={channel.name}
            currentUser={currentUser}
            initialMessages={messages}
            key={channel.id}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardHome({ data }: { data?: DashboardHomeData }) {
  const friends = data?.friends ?? [];
  const onlineCount = friends.filter((friend) => friend.status === "ONLINE").length;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto grid w-full max-w-6xl gap-4">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
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

        <div className="grid gap-4 xl:grid-cols-2">
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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
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

function GroupMain({
  group,
  canInvite,
  canDeleteGroup,
  invitePanel,
}: {
  group: DashboardGroup & {
    channels: GroupChannel[];
    members?: GroupMemberItem[];
    notice?: string;
  };
  canInvite: boolean;
  canDeleteGroup: boolean;
  invitePanel?: React.ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
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

        {!group.isDirectMessage ? (
          <Link
            className="mt-1 inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-[#181818] px-4 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/70 hover:text-white"
            href={`/dashboard/groups/${group.id}/settings`}
          >
            Space settings
          </Link>
        ) : null}
      </div>

      <div className="hidden w-full min-w-0 gap-4 min-[1180px]:grid">
        {group.notice ? <Alert>{group.notice}</Alert> : null}
        <section className="app-surface rounded-xl p-5">
          <div className="grid min-w-0 gap-5 min-[1180px]:grid-cols-[1fr_1.2fr] min-[1180px]:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                {group.name}
              </p>
              <h2 className="mt-2 break-words text-xl font-semibold text-white sm:text-2xl">
                {group.isDirectMessage
                  ? "A private place to talk."
                  : "A calm place for your space."}
              </h2>
              <p className="mt-3 break-words text-xs leading-5 text-slate-300">
                {group.isDirectMessage
                  ? "This conversation is only visible to the people in this private message."
                  : "Start by picking a channel or creating something new. This space is made for focused conversation, private invites, and clear shared routines."}
              </p>
            </div>
            <div className="app-card min-w-0 p-4">
              <p className="text-sm text-slate-400">Members</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {group.members?.length ?? 0}
              </p>
              <p className="mt-3 break-words text-sm text-slate-400">
                Current space size. Keep the circle intentional and the experience smooth.
              </p>
            </div>
          </div>
        </section>

        {canDeleteGroup ? (
          <section className="min-w-0 rounded-2xl border border-[#FF5F25]/60 bg-[#050505] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                  Danger zone
                </p>
                <h3 className="mt-2 break-words text-xl font-semibold text-white">Delete this space</h3>
                <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-400">
                  This removes the space, its channels, messages, invites, and member list.
                </p>
              </div>
              <form action={`/api/groups/${group.id}/delete`} method="post">
                <button
                  className="h-11 rounded-xl border border-[#FF5F25] bg-[#FF5F25] px-5 text-sm font-bold text-black transition hover:bg-[#ff7847]"
                  type="submit"
                >
                  Delete space
                </button>
              </form>
            </div>
          </section>
        ) : null}

        <div className="grid min-w-0 gap-5 min-[1180px]:grid-cols-[1.2fr_0.8fr]">
          <GroupMembersList members={group.members ?? []} />
          {canInvite ? invitePanel : (
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
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
      </div>
    </div>
  );
}
