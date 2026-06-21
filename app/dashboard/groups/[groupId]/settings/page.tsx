import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ChannelList } from "@/components/groups/channel-list";
import { CreateChannelForm } from "@/components/groups/create-channel-form";
import { InviteFriendForm } from "@/components/groups/invite-friend-form";
import { ModerationReportsPanel } from "@/components/groups/moderation-reports-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Alert } from "@/components/ui/alert";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { getAuthState } from "@/lib/auth";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

type GroupSettingsPageProps = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function GroupSettingsPage({
  params,
  searchParams,
}: GroupSettingsPageProps) {
  const auth = await getAuthState();

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const userId = auth.user.id;

  const { groupId } = await params;
  const pageParams = await searchParams;

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    select: {
      role: true,
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isDirectMessage: true,
          ownerId: true,
          channels: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  if (membership.group.isDirectMessage) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const canManage =
    membership.role === "OWNER" || membership.role === "ADMIN";
  const isOwner = membership.group.ownerId === userId;
  const selectedGroupForShell = {
    channels: membership.group.channels,
    description: membership.group.description,
    id: membership.group.id,
    image: membership.group.image,
    isDirectMessage: membership.group.isDirectMessage,
    name: membership.group.name,
    ownerId: membership.group.ownerId,
  };

  return (
    <DashboardShell
      groupSettingsPanel={
        <GroupSettingsPanel
          canManage={canManage}
          error={pageParams?.error}
          group={membership.group}
          isOwner={isOwner}
          message={pageParams?.message}
          userId={userId}
        />
      }
      groups={[]}
      selectedGroup={{
        ...selectedGroupForShell,
        currentUserRole: membership.role,
      }}
    />
  );
}

function GroupSettingsPanel({
  canManage,
  error,
  group,
  isOwner,
  message,
  userId,
}: {
  canManage: boolean;
  error?: string;
  group: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    members: Array<{
      userId: string;
    }>;
    channels: Array<{
      id: string;
      name: string;
      type: "TEXT" | "VOICE";
    }>;
  };
  isOwner: boolean;
  message?: string;
  userId: string;
}) {
  const memberIds = group.members.map((member) => member.userId);

  return (
    <div className="app-page-scroll">
      <div className="app-page-container grid min-w-0 gap-5">
        <section className="app-page-header">
          <p className="app-section-title">
            Space settings
          </p>
          <div className="mt-4 flex items-center gap-4">
            <AvatarInitials fallback="group" imageUrl={group.image} size="lg" value={group.name} />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-white">{group.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Manage the space identity, channels, and membership.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {error ? <Alert tone="error">{error}</Alert> : null}
            {message ? <Alert tone="success">{message}</Alert> : null}
          </div>

          <form
            action={`/api/groups/${group.id}/settings`}
            className="mt-6 grid gap-4"
            encType="multipart/form-data"
            method="post"
          >
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Space name
              </span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                defaultValue={group.name}
                disabled={!canManage}
                maxLength={80}
                minLength={2}
                name="name"
                required
                type="text"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Picture URL
              </span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                defaultValue={group.image ?? ""}
                disabled={!canManage}
                name="image"
                placeholder="https://... or /uploads/groups/..."
                type="text"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Upload picture
              </span>
              <input
                accept="image/gif,image/jpeg,image/png,image/svg+xml,image/webp"
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-sm text-slate-200 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/15 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManage}
                name="imageUpload"
                type="file"
              />
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                PNG, JPG, WebP, GIF, or SVG. Max 2 MB.
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Description
              </span>
              <textarea
                className="mt-2 min-h-28 w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:min-h-24 sm:text-sm"
                defaultValue={group.description ?? ""}
                disabled={!canManage}
                maxLength={180}
                name="description"
                placeholder="Optional"
              />
            </label>

            <button
              className="app-button-primary h-12 rounded-lg px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
              disabled={!canManage}
              type="submit"
            >
              Save space
            </button>
          </form>
        </section>

        <div className="grid gap-5 min-[1180px]:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
          <section className="app-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
            <p className="app-section-title">
              Channels
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Add a channel</h2>
              </div>
              <Link
                className="app-button-secondary hidden h-10 items-center rounded-lg px-3 text-xs font-semibold transition sm:inline-flex"
                href={`/dashboard/groups/${group.id}`}
              >
                View space
              </Link>
            </div>
            {canManage ? (
              <div className="mt-4">
                <CreateChannelForm groupId={group.id} returnToSettings />
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Only owners and admins can add channels.
              </p>
            )}
          </section>

          <section className="app-panel p-5">
            <p className="app-section-title">
              Existing channels
            </p>
            <ChannelList
              canManageChannels={canManage}
              channels={group.channels}
              groupId={group.id}
              returnToSettings
              showManagementActions
            />
          </section>

          {canManage ? (
            <Suspense fallback={<InviteSettingsFallback />}>
              <InviteSettingsPanel
                groupId={group.id}
                memberIds={memberIds}
                userId={userId}
              />
            </Suspense>
          ) : (
            <section className="app-panel p-5">
              <p className="app-section-title">
                Invite
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Invite friends</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Only owners and admins can invite friends into this space.
              </p>
            </section>
          )}

          {canManage ? <ModerationReportsPanel groupId={group.id} /> : null}

          <section className="app-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Membership
            </p>
            <h2 className="mt-2 text-base font-semibold text-white">
              {isOwner ? "Delete this space" : "Leave this space"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isOwner
                ? "Deleting removes the space, channels, messages, invites, and members."
                : "Leaving removes you from this space. You will need a new invite to rejoin."}
            </p>
            {isOwner ? (
              <form action={`/api/groups/${group.id}/delete`} className="mt-4" method="post">
                <button
                  className="app-button-danger h-11 w-full rounded-lg px-4 text-sm font-semibold transition sm:h-10 sm:w-auto"
                  type="submit"
                >
                  Delete space
                </button>
              </form>
            ) : (
              <form action={`/api/groups/${group.id}/leave`} className="mt-4" method="post">
                <button
                  className="app-button-danger h-11 w-full rounded-lg px-4 text-sm font-semibold transition sm:h-10 sm:w-auto"
                  type="submit"
                >
                  Leave space
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

async function InviteSettingsPanel({
  groupId,
  memberIds,
  userId,
}: {
  groupId: string;
  memberIds: string[];
  userId: string;
}) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userOneId: userId }, { userTwoId: userId }],
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      userOneId: true,
      userTwoId: true,
      userOne: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
      userTwo: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
    },
  });

  const groupMemberIds = new Set(memberIds);
  const inviteCandidates = friendships
    .map((friendship) => friendFromPair(friendship, userId))
    .filter((friend) => !groupMemberIds.has(friend.id));

  return <InviteFriendForm friends={inviteCandidates} groupId={groupId} />;
}

function InviteSettingsFallback() {
  return (
    <section className="app-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
        Invite
      </p>
      <div className="app-skeleton mt-4 h-11 rounded-lg" />
    </section>
  );
}
