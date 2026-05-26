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
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LiveKitVoiceRoom } from "@/components/voice/livekit-voice-room";
import { formatUserStatus } from "@/lib/utils";
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
  user,
  groups,
  selectedGroup,
  selectedChannel,
  activeSection = "dashboard",
}: DashboardShellProps) {
  const canCreateChannels =
    selectedGroup?.currentUserRole === "OWNER" ||
    selectedGroup?.currentUserRole === "ADMIN";
  const allChannels = groups.flatMap((group) => group.channels ?? []);

  return (
    <main className="flex min-h-screen bg-[#050719] text-slate-100">
      <aside className="hidden w-24 shrink-0 flex-col gap-4 border-r border-white/10 bg-[#09101d]/80 p-4 backdrop-blur-sm lg:flex">
        <GroupList
          friendsActive={activeSection === "friends"}
          groups={groups}
          selectedGroupId={selectedGroup?.id}
        />
        <div className="mt-auto space-y-3">
          <Link
            className="block rounded-3xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/10"
            href="/dashboard"
          >
            Home
          </Link>
          <Link
            className="block rounded-3xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/10"
            href="/dashboard/friends"
          >
            Friends
          </Link>
          <Link
            className="block rounded-3xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/10"
            href="/dashboard/channels"
          >
            Channels
          </Link>
        </div>
      </aside>

      <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#0b1623]/90 p-5 backdrop-blur-sm lg:flex">
        {selectedGroup ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-[#0c1422] p-5 shadow-sm shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                Group
              </p>
              <h1 className="mt-2 text-xl font-semibold text-white">{selectedGroup.name}</h1>
              {selectedGroup.description ? (
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {selectedGroup.description}
                </p>
              ) : null}
            </div>
            <ChannelList
              channels={selectedGroup.channels}
              groupId={selectedGroup.id}
              selectedChannelId={selectedChannel?.id}
            />
            {canCreateChannels ? (
              <div className="mt-auto rounded-3xl border border-white/10 bg-[#0c1422] p-5 shadow-sm shadow-black/20">
                <CreateChannelForm groupId={selectedGroup.id} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="rounded-3xl border border-white/10 bg-[#0c1422] p-5 shadow-sm shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                Groups
              </p>
              <h1 className="mt-2 text-xl font-semibold text-white">Your spaces</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-5">
              <Link
                className="mb-4 block rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#FF5F25] transition hover:bg-white/10"
                href="/dashboard/friends"
              >
                Friends
              </Link>
              {groups.length ? (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <Link
                      className="block rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                      href={`/dashboard/groups/${group.id}`}
                      key={group.id}
                    >
                      {group.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-400">
                  Create your first private space for voice, chat and collaboration.
                </p>
              )}
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c1422] p-5 shadow-sm shadow-black/20">
              <CreateGroupForm compact />
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/8 bg-[#0b1020]/95 px-5 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#FF5F25]">
              {selectedChannel ? selectedChannel.name : selectedGroup ? selectedGroup.name : activeSection === "channels" ? "Channels" : "Dashboard"}
            </p>
            <p className="text-sm text-slate-400">
              {selectedChannel
                ? selectedChannel.type === "TEXT"
                  ? "Text channel"
                  : "Voice channel"
                : selectedGroup
                  ? "Group detail shell"
                  : activeSection === "channels"
                    ? "Browse channels across your groups"
                    : "Groups foundation"}
            </p>
          </div>
          <nav className="flex gap-2 sm:hidden">
            <ThemeToggle />
            <Link
              className="rounded-md border border-white/10 bg-white/7 px-3 py-2 text-xs font-semibold text-slate-200"
              href="/dashboard"
            >
              Home
            </Link>
            <Link
              className="rounded-md border border-white/10 bg-white/7 px-3 py-2 text-xs font-semibold text-slate-200"
              href="/dashboard/friends"
            >
              Friends
            </Link>
            <Link
              className="rounded-md border border-white/10 bg-white/7 px-3 py-2 text-xs font-semibold text-slate-200"
              href="/dashboard/profile"
            >
              Profile
            </Link>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            <Link
              className="flex items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-white/7"
              href="/dashboard/profile"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-500">
                  {formatUserStatus(user.status)}
                </p>
              </div>
              <AvatarInitials
                imageUrl={user.image}
                size="sm"
                value={user.name || user.email}
              />
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                className="h-9 rounded-md border border-white/10 bg-white/7 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/12"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        {selectedChannel ? (
          <ChannelMain
            channel={selectedChannel}
            messages={selectedChannel.messages ?? []}
          />
        ) : selectedGroup ? (
          <GroupMain
            canInvite={canCreateChannels}
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
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
            Channels
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">All channels in one place</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            View every text and voice channel across your private groups, then jump into the space you need.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {channelCards.length ? (
            channelCards.map((channel) => (
              <div
                key={channel.id}
                className="rounded-3xl border border-white/10 bg-[#0c1422]/95 p-5"
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
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
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
      <div className="border-t border-white/8 bg-[#0b1020] px-5 py-4">
        <MessageInput channelId={channel.id} channelName={channel.name} />
      </div>
    </div>
  );
}

function DashboardHome({ groups }: { groups: DashboardGroup[] }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
      <div className="mx-auto grid w-full max-w-5xl gap-5">
        <section className="rounded-[2rem] border border-white/12 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-8 shadow-[0_30px_120px_-50px_rgba(0,0,0,0.75)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                Welcome back
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Create calm, connected spaces.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Build private groups that feel easy to join and simple to manage. Start with friends,
                invite people you trust, and keep the experience light and intentional.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:auto-cols-max lg:grid-flow-col">
              <Link
                className="rounded-full border border-white/10 bg-[#FF5F25] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#FF5F25]/90"
                href="/dashboard/profile"
              >
                Update profile
              </Link>
              <Link
                className="rounded-full border border-white/10 bg-white/7 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/12"
                href="/dashboard/friends"
              >
                Explore friends
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#0b1020]/90 p-5">
              <p className="text-sm text-slate-400">Active spaces</p>
              <p className="mt-3 text-4xl font-semibold text-white">{groups.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0b1020]/90 p-5">
              <p className="text-sm text-slate-400">Voice rooms</p>
              <p className="mt-3 text-4xl font-semibold text-white">Always ready</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0b1020]/90 p-5">
              <p className="text-sm text-slate-400">Invites</p>
              <p className="mt-3 text-4xl font-semibold text-white">Private</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/12 bg-white/[0.04] p-8 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.65)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                Quick start
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-white">Create a private group</h3>
            </div>
            <span className="inline-flex rounded-full bg-[#FF5F25]/10 px-3 py-1 text-sm text-[#FF5F25]">
              Comfortable setup
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Use groups to organize friends, voice rooms, and shared channels with privacy and ease.
          </p>
          <div className="mt-6">
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
}: {
  group: DashboardGroup & {
    inviteCandidates?: FriendPerson[];
    members?: GroupMemberItem[];
    notice?: string;
  };
  canInvite: boolean;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        {group.notice ? <Alert>{group.notice}</Alert> : null}
        <section className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 shadow-[0_25px_80px_-50px_rgba(0,0,0,0.7)]">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
                {group.name}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                A calm place for your group.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Start by picking a channel or creating something new. This space is
                made for focused conversation, private invites, and clear shared routines.
              </p>
            </div>
            <div className="rounded-3xl bg-[#0b1020]/90 p-5">
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
