import { NextRequest, NextResponse } from "next/server";

import { orderedFriendshipPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const friendId = String(formData.get("friendId") ?? "");

    if (!friendId || friendId === session.userId) {
      return redirectWithError(request, "Choose a valid friend.");
    }

    const [userOneId, userTwoId] = orderedFriendshipPair(session.userId, friendId);
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
      return redirectWithError(request, "You can only message accepted friends.");
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
        friendship.userOne.id === session.userId
          ? friendship.userTwo
          : friendship.userOne;
      const currentUser =
        friendship.userOne.id === session.userId
          ? friendship.userOne
          : friendship.userTwo;

      const createdGroup = await tx.group.create({
        data: {
          description: "Private message",
          directMessageKey,
          isDirectMessage: true,
          name: `${currentUser.name} / ${friend.name}`,
          ownerId: session.userId,
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
            userId: session.userId,
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
        `/dashboard/groups/${result.groupId}/channels/${result.channelId}`,
        request.url,
      ),
      { status: 303 },
    );
  } catch (error) {
    console.error("Could not open private message.", error);

    return redirectWithError(
      request,
      "Could not open that private message. Please try again.",
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
