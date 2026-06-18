import { NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import type { GroupRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/security/rate-limit";

export type AuthenticatedUser = Extract<
  Awaited<ReturnType<typeof getAuthState>>,
  { status: "authenticated" }
>["user"];

export class SecurityError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = "SecurityError";
  }
}

export async function requireAuth() {
  const auth = await getAuthState({ includeImage: true });

  if (auth.status === "unverified") {
    throw new SecurityError(403, "Email not verified");
  }

  if (auth.status !== "authenticated") {
    throw new SecurityError(401, "Unauthorized");
  }

  return auth.user;
}

export async function requireGroupMember(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
      group: {
        select: {
          id: true,
          isDirectMessage: true,
          name: true,
          ownerId: true,
        },
      },
    },
  });

  if (!membership) {
    throw new SecurityError(404, "Resource not found");
  }

  return membership;
}

export async function requireGroupRole(
  userId: string,
  groupId: string,
  allowedRoles: readonly GroupRole[],
) {
  const membership = await requireGroupMember(userId, groupId);

  if (!allowedRoles.includes(membership.role)) {
    throw new SecurityError(403, "Forbidden");
  }

  return membership;
}

export function canManageChannel(role: GroupRole | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canInviteToGroup(role: GroupRole | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canModerateMessage(role: GroupRole | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export async function requireChannelMember(userId: string, channelId: string) {
  const channel = await prisma.channel.findFirst({
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
      name: true,
      type: true,
      group: {
        select: {
          id: true,
          isDirectMessage: true,
          members: {
            where: {
              userId,
            },
            select: {
              role: true,
            },
          },
          name: true,
        },
      },
    },
  });

  if (!channel) {
    throw new SecurityError(404, "Resource not found");
  }

  return channel;
}

export async function requireMessageAccess(userId: string, messageId: string) {
  const message = await prisma.message.findFirst({
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
      senderId: true,
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

  if (!message) {
    throw new SecurityError(404, "Resource not found");
  }

  return message;
}

export function securityJson(error: unknown) {
  if (error instanceof SecurityError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
}

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

function pickTarget(action: string, metadata: AuditMetadata) {
  const targetEntries = [
    ["group", metadata.groupId],
    ["channel", metadata.channelId],
    ["message", metadata.messageId],
    ["call", metadata.callId],
    ["invite", metadata.inviteId],
    ["friendRequest", metadata.requestId],
    ["messageReport", metadata.reportId],
    ["user", metadata.receiverId ?? metadata.inviteeId],
  ] as const;
  const target = targetEntries.find((entry) => typeof entry[1] === "string" && entry[1]);

  if (target) {
    return {
      targetId: String(target[1]),
      targetType: target[0],
    };
  }

  const [targetType] = action.split(".");

  return {
    targetId: undefined,
    targetType: targetType || undefined,
  };
}

export async function auditSecurityEvent(
  action: string,
  metadata: AuditMetadata,
  request?: Request | null,
) {
  const { targetId, targetType } = pickTarget(action, metadata);
  const cleanedMetadata = Object.fromEntries(
    Object.entries(metadata).filter((entry) => entry[1] !== undefined),
  );

  try {
    await prisma.auditLog.create({
      data: {
        action,
        ip: request ? getClientIp(request) : null,
        metadata: cleanedMetadata,
        targetId,
        targetType,
        userAgent: request?.headers.get("user-agent") ?? null,
        userId: typeof metadata.actorId === "string" ? metadata.actorId : null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
