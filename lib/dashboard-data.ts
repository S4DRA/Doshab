import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const getDashboardSession = cache(getSession);

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
      id: true,
      name: true,
      description: true,
      image: true,
      isDirectMessage: true,
    },
  }),
);

export const getDashboardSidebarGroups = cache(async (userId: string) =>
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
      id: true,
      name: true,
      image: true,
      isDirectMessage: true,
    },
  }),
);

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
              image: true,
              status: true,
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

      return {
        channelId: channel.id,
        friend,
        id: group.id,
        name: friend?.name || friend?.email || group.name,
      };
    })
    .filter((thread): thread is NonNullable<typeof thread> => Boolean(thread));
});
