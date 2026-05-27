import { redirect } from "next/navigation";

import { ChannelList } from "@/components/groups/channel-list";
import { CreateChannelForm } from "@/components/groups/create-channel-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Alert } from "@/components/ui/alert";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { getDashboardSession } from "@/lib/dashboard-data";
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
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const { groupId } = await params;
  const pageParams = await searchParams;

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: session.userId,
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
  const isOwner = membership.group.ownerId === session.userId;

  return (
    <DashboardShell
      groupSettingsPanel={
        <GroupSettingsPanel
          canManage={canManage}
          error={pageParams?.error}
          group={membership.group}
          isOwner={isOwner}
          message={pageParams?.message}
        />
      }
      groups={[]}
      selectedGroup={{
        ...membership.group,
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
}: {
  canManage: boolean;
  error?: string;
  group: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    channels: Array<{
      id: string;
      name: string;
      type: "TEXT" | "VOICE";
    }>;
  };
  isOwner: boolean;
  message?: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
      <div className="grid min-w-0 gap-4 min-[1180px]:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-white/10 bg-[#050505] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
            Space settings
          </p>
          <div className="mt-4 flex items-center gap-4">
            <AvatarInitials imageUrl={group.image} size="lg" value={group.name} />
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
            method="post"
          >
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Space name
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#050505] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20"
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
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#050505] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20"
                defaultValue={group.image ?? ""}
                disabled={!canManage}
                name="image"
                placeholder="https://..."
                type="url"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Description
              </span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20"
                defaultValue={group.description ?? ""}
                disabled={!canManage}
                maxLength={180}
                name="description"
                placeholder="Optional"
              />
            </label>

            <button
              className="h-11 rounded-xl bg-[#FF5F25] px-5 text-sm font-bold text-black transition hover:bg-[#ff7847] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
              disabled={!canManage}
              type="submit"
            >
              Save space
            </button>
          </form>
        </section>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-white/10 bg-[#050505] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
              Channels
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Add a channel</h2>
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

          <section className="rounded-2xl border border-white/10 bg-[#050505] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
              Existing channels
            </p>
            <ChannelList
              canManageChannels={canManage}
              channels={group.channels}
              groupId={group.id}
              returnToSettings
            />
          </section>

          <section className="rounded-2xl border border-[#FF5F25]/60 bg-[#050505] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
              Membership
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
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
                  className="h-11 rounded-xl border border-[#FF5F25] bg-[#FF5F25] px-5 text-sm font-bold text-black transition hover:bg-[#ff7847]"
                  type="submit"
                >
                  Delete space
                </button>
              </form>
            ) : (
              <form action={`/api/groups/${group.id}/leave`} className="mt-4" method="post">
                <button
                  className="h-11 rounded-xl border border-white/20 bg-[#181818] px-5 text-sm font-bold text-white transition hover:border-[#FF5F25] hover:bg-[#242424]"
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
