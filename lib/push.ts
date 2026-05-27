import webpush, { type PushSubscription } from "web-push";

import { prisma } from "@/lib/prisma";

let configured = false;

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

function configureWebPush() {
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
  body,
  href,
  recipientIds,
  title,
}: {
  body: string;
  href: string;
  recipientIds: string[];
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
            body,
            href,
            tag: href,
            title,
          }),
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
