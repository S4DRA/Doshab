import Link from "next/link";

import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";
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
  activeSection?: "dashboard" | "friends";
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

  return (
    <main className="flex min-h-screen bg-[#070a12] text-slate-100">
      <aside className="hidden w-20 flex-col items-center gap-3 border-r border-white/8 bg-[#0a0e19] px-3 py-5 sm:flex">
        <GroupList
          friendsActive={activeSection === "friends"}
          groups={groups}
          selectedGroupId={selectedGroup?.id}
        />
      </aside>

      <aside className="hidden w-64 flex-col border-r border-white/8 bg-[#0d1322] lg:flex">
        {selectedGroup ? (
          <>
            <div className="border-b border-white/8 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Group
              </p>
              <h1 className="mt-1 text-lg font-semibold text-white">{selectedGroup.name}</h1>
              {selectedGroup.description ? (
                <p className="mt-2 text-sm leading-5 text-slate-500">
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
              <div className="mt-auto border-t border-white/8 p-4">
                <CreateChannelForm groupId={selectedGroup.id} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-white/8 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Groups
              </p>
              <h1 className="mt-1 text-lg font-semibold text-white">Your spaces</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <Link
                className="mb-4 block rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-white/8"
                href="/dashboard/friends"
              >
                Friends
              </Link>
              {groups.length ? (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <Link
                      className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/7 hover:text-white"
                      href={`/dashboard/groups/${group.id}`}
                      key={group.id}
                    >
                      {group.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  Create your first private space for channels and meetings.
                </p>
              )}
            </div>
            <div className="border-t border-white/8 p-4">
              <CreateGroupForm compact />
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/8 bg-[#0b1020]/95 px-5 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-300">
              {selectedChannel ? selectedChannel.name : selectedGroup ? selectedGroup.name : "Dashboard"}
            </p>
            <p className="text-sm text-slate-400">
              {selectedChannel
                ? selectedChannel.type === "TEXT"
                  ? "Text channel"
                  : "Voice channel"
                : selectedGroup
                  ? "Group detail shell"
                  : "Groups foundation"}
            </p>
          </div>
          <nav className="flex gap-2 sm:hidden">
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
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
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
        ) : (
          <DashboardHome groups={groups} />
        )}
      </section>
    </main>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Text channel
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white"># {channel.name}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Chat messages and realtime delivery will be added in Step 7.
          </p>
        </section>
        <div className="mt-6">
          <MessageList messages={messages} />
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
    <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
      <section className="w-full max-w-xl rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Step 5
        </p>
        <h2 className="mt-3 text-2xl font-bold text-white">
          {groups.length ? "Create another group" : "Create your first group"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Groups are private spaces. Each one starts with a text channel and a
          voice room so the next steps can build on real data.
        </p>
        <div className="mt-6">
          <CreateGroupForm />
        </div>
      </section>
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
      <div className="mx-auto grid w-full max-w-5xl gap-5">
        {group.notice ? <Alert>{group.notice}</Alert> : null}
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            {group.name}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Select a channel to start.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Text chat, voice, video, and channel activity will plug into this
            shell in later steps.
          </p>
          <p className="mt-4 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-400">
            Open # general from the channel list, or create another channel from
            the sidebar if you are an owner or admin.
          </p>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <GroupMembersList members={group.members ?? []} />
          {canInvite ? (
            <InviteFriendForm
              friends={group.inviteCandidates ?? []}
              groupId={group.id}
            />
          ) : (
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Invites
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">Member only</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Owners and admins can invite accepted friends to this group.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
