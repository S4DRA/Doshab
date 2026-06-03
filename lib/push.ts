import webpush, { type PushSubscription } from "web-push";
import { loadEnvConfig } from "@next/env";

import { prisma } from "@/lib/prisma";

type PushNotificationAction = {
  action: string;
  title: string;
};

let configured = false;
let envLoaded = false;

function ensureEnvLoaded() {
  if (!envLoaded) {
    loadEnvConfig(process.cwd());
    envLoaded = true;
  }
}

export function getVapidPublicKey() {
  ensureEnvLoaded();

  return (
    process.env.VAPID_PUBLIC_KEY ??
    process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"] ??
    ""
  ).trim();
}

export function getPushConfigStatus() {
  ensureEnvLoaded();

  return {
    hasPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY?.trim()),
    hasPublicKey: Boolean(getVapidPublicKey()),
    hasSubject: Boolean(process.env.VAPID_SUBJECT?.trim()),
  };
}

function configureWebPush() {
  ensureEnvLoaded();

  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return false;
  }

  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@localhost",
      publicKey,
      privateKey,
    );
    configured = true;
  }

  return true;
}

export async function sendPushNotifications({
  actions,
  body,
  data,
  href,
  recipientIds,
  requireInteraction = false,
  tag,
  title,
}: {
  actions?: PushNotificationAction[];
  body: string;
  data?: Record<string, string>;
  href: string;
  recipientIds: string[];
  requireInteraction?: boolean;
  tag?: string;
  title: string;
}) {
  if (!recipientIds.length || !configureWebPush()) {
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: {
        in: recipientIds,
      },
    },
    select: {
      auth: true,
      endpoint: true,
      id: true,
      p256dh: true,
    },
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.auth,
          p256dh: subscription.p256dh,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            actions,
            body,
            data,
            href,
            requireInteraction,
            tag: tag ?? href,
            title,
          }),
          {
            TTL: requireInteraction ? 60 : 3600,
            topic: tag?.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 32),
            urgency: requireInteraction ? "high" : "normal",
          },
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof error.statusCode === "number"
            ? error.statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.deleteMany({
            where: {
              id: subscription.id,
            },
          });
        }
      }
    }),
  );
}
