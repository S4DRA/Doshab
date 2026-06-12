import { NextRequest, NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { orderedFriendshipPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

function redirectWithError(request: NextRequest, error: string, returnTo = "/dashboard") {
  return NextResponse.redirect(
    new URL(`${returnTo}?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
}

function getSafeDashboardReturnTo(value: unknown) {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  const returnTo = value.trim();

  if (
    returnTo === "/dashboard" ||
    returnTo.startsWith("/dashboard/") ||
    returnTo.startsWith("/dashboard?")
  ) {
    return returnTo;
  }

  return "/dashboard";
}

export async function POST(request: NextRequest) {
  let returnTo = "/dashboard";

  try {
    const auth = await getAuthState();

    if (auth.status === "unverified") {
      return NextResponse.redirect(new URL("/verify-email", request.url), { status: 303 });
    }

    if (auth.status !== "authenticated") {
      return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }

    const userId = auth.user.id;
    const formData = await request.formData();
    const friendId = String(formData.get("friendId") ?? "");
    returnTo = getSafeDashboardReturnTo(formData.get("returnTo"));

    if (!friendId || friendId === userId) {
      return redirectWithError(request, "Choose a valid friend.", returnTo);
    }

    const [userOneId, userTwoId] = orderedFriendshipPair(userId, friendId);
    const directMessageKey = `${userOneId}:${userTwoId}`;

    const friendship = await prisma.friendship.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      select: {
        userOne: {
          select: {
            id: true,
            name: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!friendship) {
      return redirectWithError(
        request,
        "You can only message accepted friends.",
        returnTo,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingGroup = await tx.group.findUnique({
        where: {
          directMessageKey,
        },
        select: {
          id: true,
          channels: {
            where: {
              type: "TEXT",
            },
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
            select: {
              id: true,
            },
          },
        },
      });

      if (existingGroup) {
        const channel = await getOrCreatePrivateTextChannel(tx, existingGroup.id);

        return {
          channelId: channel.id,
          groupId: existingGroup.id,
        };
      }

      const friend =
        friendship.userOne.id === userId
          ? friendship.userTwo
          : friendship.userOne;
      const currentUser =
        friendship.userOne.id === userId
          ? friendship.userOne
          : friendship.userTwo;

      const createdGroup = await tx.group.create({
        data: {
          description: "Private message",
          directMessageKey,
          isDirectMessage: true,
          name: `${currentUser.name} / ${friend.name}`,
          ownerId: userId,
        },
        select: {
          id: true,
        },
      });

      await tx.groupMember.createMany({
        data: [
          {
            groupId: createdGroup.id,
            role: "OWNER",
            userId,
          },
          {
            groupId: createdGroup.id,
            role: "MEMBER",
            userId: friend.id,
          },
        ],
      });

      const channel = await tx.channel.create({
        data: {
          groupId: createdGroup.id,
          name: "private",
          type: "TEXT",
        },
        select: {
          id: true,
        },
      });

      return {
        channelId: channel.id,
        groupId: createdGroup.id,
      };
    });

    return NextResponse.redirect(
      new URL(
        `/dashboard/groups/${result.groupId}/channels/${result.channelId}?view=messages`,
        request.url,
      ),
      { status: 303 },
    );
  } catch (error) {
    console.error("Could not open private message.", error);

    return redirectWithError(
      request,
      "Could not open that private message. Please try again.",
      returnTo,
    );
  }
}

async function getOrCreatePrivateTextChannel(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  groupId: string,
) {
  const existingChannel = await tx.channel.findFirst({
    where: {
      groupId,
      type: "TEXT",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
  });

  if (existingChannel) {
    return existingChannel;
  }

  return tx.channel.create({
    data: {
      groupId,
      name: "private",
      type: "TEXT",
    },
    select: {
      id: true,
    },
  });
}
