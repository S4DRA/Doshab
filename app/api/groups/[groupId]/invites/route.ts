import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { orderedFriendshipPair } from "@/lib/friends";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  auditSecurityEvent,
  requireAuth,
  requireGroupRole,
  SecurityError,
} from "@/lib/security/permissions";

const inviteFormSchema = z.object({
  receiverId: z.string().trim().min(1).max(128),
});

type InviteRouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

function redirectToInviteSettings(
  request: NextRequest,
  groupId: string,
  type: "error" | "message",
  message: string,
) {
  const url = new URL(`/dashboard/groups/${groupId}/settings`, request.url);
  url.searchParams.set(type, message);
  url.hash = "invite-friends";

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest, context: InviteRouteContext) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { groupId } = await context.params;
  const limited = await rateLimit(request, {
    identifiers: [`group:${groupId}`, `admin:${user.id}`],
    key: "groups:invites:create",
    limit: 30,
    windowMs: 60 * 60_000,
  });

  if (limited) {
    return limited;
  }

  const formData = await request.formData();
  const parsed = inviteFormSchema.safeParse({
    receiverId: formData.get("receiverId"),
  });
  const receiverId = parsed.success ? parsed.data.receiverId : "";

  if (!receiverId || receiverId === user.id) {
    return redirectToInviteSettings(
      request,
      groupId,
      "error",
      "Choose a valid friend to invite.",
    );
  }

  const membership = await requireGroupRole(user.id, groupId, ["OWNER", "ADMIN"]).catch(
    (error: unknown) => {
      if (error instanceof SecurityError && error.status === 404) {
        return null;
      }

      return undefined;
    },
  );

  if (!membership) {
    return redirectToInviteSettings(
      request,
      groupId,
      "error",
      "Only owners and admins can invite friends.",
    );
  }

  const currentUser = user;
  const currentMembership = membership;

  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
    select: {
      id: true,
    },
  });

  if (!receiver) {
    return redirectToInviteSettings(
      request,
      groupId,
      "error",
      "That user could not be found.",
    );
  }

  const [userOneId, userTwoId] = orderedFriendshipPair(user.id, receiverId);
  const [friendship, existingMembership, existingInvite] = await Promise.all([
    prisma.friendship.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: receiverId,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.groupInvite.findUnique({
      where: {
        groupId_receiverId: {
          groupId,
          receiverId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (!friendship) {
    return redirectToInviteSettings(
      request,
      groupId,
      "error",
      "You can only invite accepted friends.",
    );
  }

  if (existingMembership) {
    return redirectToInviteSettings(
      request,
      groupId,
      "error",
      "That friend is already in this space.",
    );
  }

  if (existingInvite?.status === "PENDING") {
    return redirectToInviteSettings(
      request,
      groupId,
      "error",
      "A pending invite already exists.",
    );
  }

  if (existingInvite?.status === "ACCEPTED") {
    return redirectToInviteSettings(
      request,
      groupId,
      "error",
      "That invite has already been accepted.",
    );
  }

  if (existingInvite?.status === "REJECTED") {
    const invite = await prisma.groupInvite.update({
      where: {
        id: existingInvite.id,
      },
      data: {
        inviterId: user.id,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

    await createGroupInviteNotification(invite.id);
  } else {
    const invite = await prisma.groupInvite.create({
      data: {
        groupId,
        inviterId: user.id,
        receiverId,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

    await createGroupInviteNotification(invite.id);
  }

  await auditSecurityEvent(
    "group.invite",
    {
      actorId: user.id,
      groupId,
      inviteeId: receiverId,
    },
    request,
  );

  return redirectToInviteSettings(request, groupId, "message", "Space invite sent.");

  async function createGroupInviteNotification(inviteId: string) {
    await createNotification({
      actorId: currentUser.id,
      body: `${currentUser.name || currentUser.email} invited you to ${currentMembership.group.name}.`,
      data: {
        groupInviteId: inviteId,
      },
      groupId,
      href: "/dashboard#requests-and-invites",
      title: "New space invite",
      type: "GROUP_INVITE",
      userId: receiverId,
    });
  }
}
