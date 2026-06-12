import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const getDashboardGroups = cache(async (userId: string) =>
  prisma.group.findMany({
    where: {
      isDirectMessage: false,
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
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
      id: true,
      name: true,
      description: true,
      image: true,
      isDirectMessage: true,
      members: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              id: true,
              image: true,
              name: true,
              status: true,
            },
          },
        },
      },
    },
  }),
);

export const getDashboardSidebarGroups = cache(async (userId: string) => {
  const groups = await prisma.group.findMany({
    where: {
      isDirectMessage: false,
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      image: true,
      isDirectMessage: true,
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

  return groups.map((group) => ({
    firstTextChannelId: group.channels[0]?.id ?? null,
    id: group.id,
    image: group.image,
    isDirectMessage: group.isDirectMessage,
    name: group.name,
  }));
});

export const getDashboardMessageThreads = cache(async (userId: string) => {
  const groups = await prisma.group.findMany({
    where: {
      isDirectMessage: true,
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
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
          name: true,
          type: true,
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              content: true,
              createdAt: true,
              sender: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      members: {
        where: {
          userId: {
            not: userId,
          },
        },
        take: 1,
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return groups
    .map((group) => {
      const channel = group.channels[0];

      if (!channel) {
        return null;
      }

      const friend = group.members[0]?.user ?? null;
      const lastMessage = channel.messages[0] ?? null;

      return {
        channelId: channel.id,
        friend,
        id: group.id,
        lastActivityAt: lastMessage?.createdAt ?? group.updatedAt,
        lastMessageEncryptedContent: lastMessage?.content ?? null,
        lastMessageSenderName:
          lastMessage?.sender.name || lastMessage?.sender.email || null,
        name: friend?.name || friend?.email || group.name,
      };
    })
    .filter((thread): thread is NonNullable<typeof thread> => Boolean(thread))
    .sort(
      (first, second) =>
        new Date(second.lastActivityAt ?? 0).getTime() -
        new Date(first.lastActivityAt ?? 0).getTime(),
    );
});
