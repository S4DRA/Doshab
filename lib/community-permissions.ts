import { prisma } from "@/lib/prisma";

export async function getMessageAccess(messageId: string, userId: string) {
  return prisma.message.findFirst({
    where: {
      id: messageId,
      channel: {
        group: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    select: {
      id: true,
      channelId: true,
      channel: {
        select: {
          groupId: true,
          group: {
            select: {
              isDirectMessage: true,
              members: {
                where: {
                  userId,
                },
                select: {
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getChannelMembership(channelId: string, userId: string) {
  return prisma.channel.findFirst({
    where: {
      id: channelId,
      group: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    select: {
      id: true,
      groupId: true,
      type: true,
      group: {
        select: {
          isDirectMessage: true,
          members: {
            where: {
              userId,
            },
            select: {
              role: true,
            },
          },
        },
      },
    },
  });
}

export function canManageSpace(role: "OWNER" | "ADMIN" | "MEMBER" | undefined) {
  return role === "OWNER" || role === "ADMIN";
}
