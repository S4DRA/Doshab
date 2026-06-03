import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushNotifications } from "@/lib/push";

export const dashboardNotificationSelect = {
  actor: {
    select: {
      email: true,
      id: true,
      image: true,
      name: true,
      status: true,
    },
  },
  body: true,
  callId: true,
  createdAt: true,
  dataJson: true,
  expiresAt: true,
  href: true,
  id: true,
  readAt: true,
  title: true,
  type: true,
} satisfies Prisma.NotificationSelect;

type CreateNotificationInput = {
  actorId?: string;
  body: string;
  callId?: string;
  channelId?: string;
  data?: Prisma.InputJsonValue;
  expiresAt?: Date;
  groupId?: string;
  href: string;
  messageId?: string;
  push?: {
    actions?: { action: string; title: string }[];
    requireInteraction?: boolean;
    tag?: string;
  };
  title: string;
  type: NonNullable<Prisma.NotificationCreateInput["type"]>;
  userId: string;
};

export async function createNotification({
  actorId,
  body,
  callId,
  channelId,
  data,
  expiresAt,
  groupId,
  href,
  messageId,
  push,
  title,
  type,
  userId,
}: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      actorId,
      body,
      callId,
      channelId,
      dataJson: data,
      expiresAt,
      groupId,
      href,
      messageId,
      title,
      type,
      userId,
    },
    select: dashboardNotificationSelect,
  });

  await sendPushNotifications({
    actions: push?.actions,
    body,
    data: {
      callId: callId ?? "",
      notificationId: notification.id,
      type,
    },
    href,
    recipientIds: [userId],
    requireInteraction: push?.requireInteraction,
    tag: push?.tag ?? `${type}:${notification.id}`,
    title,
  }).catch((error: unknown) => {
    console.error("Failed to send push notification", error);
  });

  return notification;
}

export async function createManyMessageNotifications({
  actorId,
  body,
  channelId,
  groupId,
  href,
  messageId,
  recipientIds,
  title,
}: {
  actorId: string;
  body: string;
  channelId: string;
  groupId: string;
  href: string;
  messageId: string;
  recipientIds: string[];
  title: string;
}) {
  if (!recipientIds.length) {
    return;
  }

  await prisma.notification.createMany({
    data: recipientIds.map((recipientId) => ({
      actorId,
      body,
      channelId,
      groupId,
      href,
      messageId,
      title,
      type: "MESSAGE",
      userId: recipientId,
    })),
    skipDuplicates: false,
  });
}
