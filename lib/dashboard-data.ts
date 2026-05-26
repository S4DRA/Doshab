import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const getDashboardSession = cache(getSession);

export const getDashboardGroups = cache(async (userId: string) =>
  prisma.group.findMany({
    where: {
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
    },
  }),
);

export const getDashboardSidebarGroups = cache(async (userId: string) =>
  prisma.group.findMany({
    where: {
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
    },
  }),
);
