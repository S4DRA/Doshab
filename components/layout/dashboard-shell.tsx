import Link from "next/link";

import { MessageInput } from "@/components/chat/message-input";
import { RealtimeMessagePanel } from "@/components/chat/realtime-message-panel";
import { ChannelList } from "@/components/groups/channel-list";
import { CreateChannelForm } from "@/components/groups/create-channel-form";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { GroupList } from "@/components/groups/group-list";
import { GroupMembersList } from "@/components/groups/group-members-list";
import { InviteFriendForm } from "@/components/groups/invite-friend-form";
import { Alert } from "@/components/ui/alert";
import { LiveKitVoiceRoom } from "@/components/voice/livekit-voice-room";
import type {
  ChatMessage,
  DashboardGroup,
  FriendPerson,
  GroupChannel,
  GroupMemberItem,
} from "@/types";

type DashboardUser = {
  name: string;
  email: string;
  image?: string | null;
  status: "ONLINE" | "IDLE" | "DO_NOT_DISTURB" | "OFFLINE";
};

type DashboardShellProps = {
  user: DashboardUser;
  groups: DashboardGroup[];
  selectedGroup?: DashboardGroup & {
    channels: GroupChannel[];
    currentUserRole?: "OWNER" | "ADMIN" | "MEMBER";
    inviteCandidates?: FriendPerson[];
    members?: GroupMemberItem[];
    notice?: string;
  };
  selectedChannel?: GroupChannel & {
    messages?: ChatMessage[];
  };
  activeSection?: "dashboard" | "friends" | "channels";
};

export function DashboardShell({
  groups,
  selectedGroup,
  selectedChannel,
  activeSection = "dashboard",
}: DashboardShellProps) {
  const canCreateChannels =
    selectedGroup?.currentUserRole === "OWNER" ||
    selectedGroup?.currentUserRole === "ADMIN";

  return (
    <main className="flex h-[100dvh] min-h-[520px] w-full overflow-hidden bg-[#050705]/95 text-slate-100">
      <aside className="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-black bg-[#050505] p-2.5 pb-24 lg:flex">
        <GroupList
          friendsActive={activeSection === "friends"}
          groups={groups}
          selectedGroupId={selectedGroup?.id}
        />
      </aside>

      <aside className="hidden w-64 flex-col border-r border-black bg-[#0d0f0d] p-4 pb-24 lg:flex">
        {selectedGroup ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-[#121512] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                Group
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
            {canCreateChannels ? (
              <div className="mt-auto rounded-2xl border border-white/10 bg-[#121512] p-4">
                <CreateChannelForm groupId={selectedGroup.id} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="rounded-2xl border border-white/10 bg-[#121512] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                Groups
              </p>
              <h1 className="mt-2 text-lg font-semibold text-white">Your spaces</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-3">
              <Link
                className="mb-3 block rounded-xl border border-[#FF5F25]/60 bg-[#FF5F25] px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-[#ff7847]"
                href="/dashboard/friends"
              >
                Friends
              </Link>
              {groups.length ? (
                  <div className="space-y-2">
                  {groups.map((group) => (
                    <Link
                      className="block rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-[#FF5F25] hover:text-white"
                      href={`/dashboard/groups/${group.id}`}
                      key={group.id}
                    >
                      {group.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-5 text-slate-300">
                  Create your first private space for voice, chat and collaboration.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121512] p-4">
              <CreateGroupForm compact />
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-12 items-center justify-between gap-4 border-b border-black bg-[#050505] px-5 py-1.5 pl-5 lg:pl-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#FF5F25]">
              {selectedChannel ? selectedChannel.name : selectedGroup ? selectedGroup.name : activeSection === "channels" ? "Channels" : "Dashboard"}
            </p>
            <p className="text-xs text-slate-400">
              {selectedChannel
                ? selectedChannel.type === "TEXT"
                  ? "Text channel"
                  : "Voice channel"
                : selectedGroup
                  ? "Group"
                  : activeSection === "channels"
                    ? "Browse channels across your groups"
                    : "Groups foundation"}
            </p>
          </div>
          <div className="h-1 w-1" />
        </header>

        <MobileSpaceSwitcher
          activeSection={activeSection}
          groups={groups}
          selectedChannelId={selectedChannel?.id}
          selectedGroup={selectedGroup}
        />

        {selectedChannel ? (
          <ChannelMain
            channel={selectedChannel}
            messages={selectedChannel.messages ?? []}
          />
        ) : selectedGroup ? (
          <GroupMain
            canInvite={canCreateChannels}
            canDeleteGroup={selectedGroup.currentUserRole === "OWNER"}
            group={selectedGroup}
          />
        ) : activeSection === "channels" ? (
          <ChannelsHome groups={groups} />
        ) : (
          <DashboardHome groups={groups} />
        )}
      </section>
    </main>
  );
}

function MobileSpaceSwitcher({
  activeSection,
  groups,
  selectedChannelId,
  selectedGroup,
}: {
  activeSection: "dashboard" | "friends" | "channels";
  groups: DashboardGroup[];
  selectedChannelId?: string;
  selectedGroup?: DashboardGroup & { channels: GroupChannel[] };
}) {
  return (
    <div className="border-b border-black bg-[#0d0f0d] px-3 py-2 lg:hidden">
      <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          className={`inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${
            activeSection === "dashboard" && !selectedGroup
              ? "border-[#FF5F25] bg-[#FF5F25] text-black"
              : "border-white/10 bg-[#050505] text-slate-200"
          }`}
          href="/dashboard"
        >
          Spaces
        </Link>
        <Link
          className={`inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${
            activeSection === "friends"
              ? "border-[#FF5F25] bg-[#FF5F25] text-black"
              : "border-white/10 bg-[#050505] text-slate-200"
          }`}
          href="/dashboard/friends"
        >
          Friends
        </Link>
        {selectedGroup
          ? selectedGroup.channels.map((channel) => (
              <Link
                className={`inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${
                  selectedChannelId === channel.id
                    ? "border-[#FF5F25] bg-[#FF5F25] text-black"
                    : "border-white/10 bg-[#050505] text-slate-200"
                }`}
                href={`/dashboard/groups/${selectedGroup.id}/channels/${channel.id}`}
                key={channel.id}
              >
                {channel.type === "TEXT" ? "# " : ""}
                {channel.name}
              </Link>
            ))
          : groups.map((group) => (
              <Link
                className="inline-flex h-10 shrink-0 items-center rounded-full border border-white/10 bg-[#050505] px-4 text-sm font-semibold text-slate-200"
                href={`/dashboard/groups/${group.id}`}
                key={group.id}
              >
                {group.name}
              </Link>
            ))}
      </div>
    </div>
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
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-24">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <section className="rounded-2xl border border-white/10 bg-[#050505] p-5 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
            Channels
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">All channels in one place</h2>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-300">
            View every text and voice channel across your private groups, then jump into the space you need.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {channelCards.length ? (
            channelCards.map((channel) => (
              <div
                key={channel.id}
                className="rounded-xl border border-white/10 bg-[#050505] p-4"
              >
                <p className="text-sm text-slate-400">{channel.groupName}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{channel.name}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {channel.type === "TEXT" ? "Text channel" : "Voice channel"}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-[#0c1422]/95 p-6 text-center text-slate-400">
              No channels found yet. Create a group to add your first channels.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChannelMain({
  channel,
  messages,
}: {
  channel: GroupChannel;
  messages: ChatMessage[];
}) {
  if (channel.type === "VOICE") {
    return <LiveKitVoiceRoom channelId={channel.id} channelName={channel.name} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-24">
        <section className="rounded-xl border border-white/10 bg-[#050505] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Text channel
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white"># {channel.name}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Chat messages and realtime delivery will be added in Step 7.
          </p>
        </section>
        <div className="mt-6">
          <RealtimeMessagePanel
            channelId={channel.id}
            initialMessages={messages}
            key={channel.id}
          />
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#050505] px-4 pb-24 pt-3">
        <MessageInput channelId={channel.id} channelName={channel.name} />
      </div>
    </div>
  );
}

function DashboardHome({ groups }: { groups: DashboardGroup[] }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-24 sm:px-5">
      <div className="w-full space-y-4">
        <section className="rounded-2xl border border-white/10 bg-[#050505] p-5 shadow-[0_30px_120px_-50px_rgba(0,0,0,0.75)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                Welcome back
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Create spaces
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Build private groups that feel easy to join and simple to manage. Start with friends,
                invite people you trust, and keep the experience light and intentional.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-1 lg:auto-cols-max lg:grid-flow-col">
              <Link
                className="rounded-full border border-white/10 bg-[#181818] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25] hover:bg-[#242424]"
                href="/dashboard/friends"
              >
                Explore friends
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#181818] p-4">
              <p className="text-sm text-slate-400">Active spaces</p>
              <p className="mt-2 text-3xl font-semibold text-white">{groups.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#181818] p-4">
              <p className="text-sm text-slate-400">Voice rooms</p>
              <p className="mt-2 text-3xl font-semibold text-white">Always ready</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#181818] p-4">
              <p className="text-sm text-slate-400">Invites</p>
              <p className="mt-2 text-3xl font-semibold text-white">Private</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#050505] p-5 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.65)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                Quick start
              </p>
              <h3 className="mt-1.5 text-2xl font-semibold text-white">Create a private group</h3>
            </div>
            <span className="inline-flex rounded-full bg-[#FF5F25]/10 px-3 py-1 text-sm text-[#FF5F25]">
              Comfortable setup
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
            Use groups to organize friends, voice rooms, and shared channels with privacy and ease.
          </p>
          <div className="mt-4">
            <CreateGroupForm />
          </div>
        </section>
      </div>
    </div>
  );
}

function GroupMain({
  group,
  canInvite,
  canDeleteGroup,
}: {
  group: DashboardGroup & {
    inviteCandidates?: FriendPerson[];
    members?: GroupMemberItem[];
    notice?: string;
  };
  canInvite: boolean;
  canDeleteGroup: boolean;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-24">
      <div className="grid w-full gap-4">
        {group.notice ? <Alert>{group.notice}</Alert> : null}
        <section className="rounded-2xl border border-white/10 bg-[#050505] p-5 shadow-[0_25px_80px_-50px_rgba(0,0,0,0.7)]">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                {group.name}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                A calm place for your group.
              </h2>
              <p className="mt-3 text-xs leading-5 text-slate-300">
                Start by picking a channel or creating something new. This space is
                made for focused conversation, private invites, and clear shared routines.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#181818] p-4">
              <p className="text-sm text-slate-400">Members</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {group.members?.length ?? 0}
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Current group size. Keep the circle intentional and the experience smooth.
              </p>
            </div>
          </div>
        </section>

        {canDeleteGroup ? (
          <section className="rounded-2xl border border-[#FF5F25]/60 bg-[#050505] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                  Danger zone
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">Delete this group</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  This removes the group, its channels, messages, invites, and member list.
                </p>
              </div>
              <form action={`/api/groups/${group.id}/delete`} method="post">
                <button
                  className="h-11 rounded-xl border border-[#FF5F25] bg-[#FF5F25] px-5 text-sm font-bold text-black transition hover:bg-[#ff7847]"
                  type="submit"
                >
                  Delete group
                </button>
              </form>
            </div>
          </section>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <GroupMembersList members={group.members ?? []} />
          {canInvite ? (
            <InviteFriendForm
              friends={group.inviteCandidates ?? []}
              groupId={group.id}
            />
          ) : (
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                Invites
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">Owner access only</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Group invites are reserved for owners and admins. Reach out to an
                administrator when you want to expand the circle.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
