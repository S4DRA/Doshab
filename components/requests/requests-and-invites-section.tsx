import Link from "next/link";
import { Suspense } from "react";

import { FriendRequestList } from "@/components/friends/friend-request-list";
import { GroupInvitesList } from "@/components/groups/group-invites-list";
import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FriendRequestItem, GroupInviteItem } from "@/types";

export async function RequestsAndInvitesSection() {
  return (
    <section className="app-panel p-5" id="requests-and-invites">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="app-section-title">Requests & Invites</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Pending actions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Review friend requests and space invitations.
          </p>
        </div>
      </div>

      <Suspense fallback={<RequestsAndInvitesLoading />}> 
        <RequestsAndInvitesBody />
      </Suspense>
    </section>
  );
}

async function RequestsAndInvitesBody() {
  const auth = await getAuthState({ includeImage: true });

  if (auth.status !== "authenticated") {
    return <RequestsAndInvitesEmpty />;
  }

  const userId = auth.user.id;

  const [incoming, outgoing, invites] = await Promise.all([
    prisma.friendRequest.findMany({
        where: {
          receiverId: userId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              status: true,
            },
          },
        },
      }),
      prisma.friendRequest.findMany({
        where: {
          senderId: userId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              status: true,
            },
          },
        },
      }),
      prisma.groupInvite.findMany({
        where: {
          receiverId: userId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              status: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              isDirectMessage: true,
              channels: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
              members: {
                select: {
                  id: true,
                  role: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const incomingItems: FriendRequestItem[] = incoming.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      sender: {
        id: r.sender.id,
        name: r.sender.name ?? "",
        email: r.sender.email ?? "",
        image: r.sender.image,
        status: r.sender.status,
      },
    }));

    const outgoingItems: FriendRequestItem[] = outgoing.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      receiver: {
        id: r.receiver.id,
        name: r.receiver.name ?? "",
        email: r.receiver.email ?? "",
        image: r.receiver.image,
        status: r.receiver.status,
      },
    }));

    const inviteItems: GroupInviteItem[] = invites.map((inv) => ({
      id: inv.id,
      status: inv.status,
      createdAt: inv.createdAt,
      inviter: {
        id: inv.inviter.id,
        name: inv.inviter.name ?? "",
        email: inv.inviter.email ?? "",
        image: inv.inviter.image,
        status: inv.inviter.status,
      },
      group: {
        id: inv.group.id,
        name: inv.group.name,
        description: inv.group.description,
        image: inv.group.image,
        isDirectMessage: inv.group.isDirectMessage,
        channels: inv.group.channels.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        })),
        members: inv.group.members.map((m) => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt,
          user: {
            id: m.user.id,
            name: m.user.name ?? "",
            email: m.user.email ?? "",
            image: m.user.image,
            status: m.user.status,
          },
        })),
      },
    }));

    const hasAny = incomingItems.length || outgoingItems.length || inviteItems.length;

    if (!hasAny) {
      return <RequestsAndInvitesEmpty />;
    }

    return (
      <div className="mt-5 grid gap-4">
        <FriendRequestList
          emptyText="No incoming friend requests."
          emptyAction={{
            href: "/dashboard/friends?add=1",
            label: "Find friends",
          }}
          kind="incoming"
          requests={incomingItems}
          title="Incoming friend requests"
        />

        <FriendRequestList
          emptyText="No outgoing friend requests pending."
          kind="outgoing"
          requests={outgoingItems}
          title="Outgoing friend requests"
        />

        <GroupInvitesList
          emptyActions={[
            {
              href: "/dashboard#create-space",
              label: "Create space",
              variant: "primary",
            },
            {
              href: "/dashboard/friends?add=1",
              label: "Invite friends",
            },
          ]}
          invites={inviteItems}
        />
      </div>
    );
}

function RequestsAndInvitesLoading() {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-slate-400">Loading requests…</p>
    </div>
  );
}

function RequestsAndInvitesEmpty() {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-slate-400">
        No pending requests or invites.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="app-button-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
          href="/dashboard#create-space"
        >
          Create space
        </Link>
        <Link
          className="app-button-secondary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
          href="/dashboard/friends?add=1"
        >
          Find friends
        </Link>
      </div>
    </div>
  );
}

