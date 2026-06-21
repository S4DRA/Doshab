import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  chatMessageBaseSelect,
  formatChatMessage,
  formatChatMessages,
} from "@/lib/chat-messages";
import { isValidEncryptedMessageContent } from "@/lib/e2ee-message";
import {
  publishChannelMessage,
  subscribeToChannelMessages,
} from "@/lib/message-bus";
import { prisma } from "@/lib/prisma";
import { sendPushNotifications } from "@/lib/push";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  auditSecurityEvent,
  requireAuth,
  requireChannelMember,
} from "@/lib/security/permissions";

const messageBatchSize = 50;
const messagePollIntervalMs = 30_000;

const jsonMessageSchema = z.object({
  encryptedContent: z.string().trim().min(1).max(200000),
  notificationPreview: z.string().optional(),
  poll: z
    .object({
      options: z.array(z.string()).min(2).max(5),
      question: z.string(),
    })
    .optional(),
  replyToMessageId: z.string().optional(),
});

type MessagesRouteProps = {
  params: Promise<{
    channelId: string;
  }>;
};

function redirectBack(request: NextRequest, groupId?: string, channelId?: string) {
  if (groupId && channelId) {
    return NextResponse.redirect(
      new URL(`/dashboard/groups/${groupId}/channels/${channelId}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), {
    status: 303,
  });
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getTextChannelForUser(channelId: string, userId: string) {
  return prisma.channel.findUnique({
    where: {
      id: channelId,
    },
    select: {
      id: true,
      groupId: true,
      type: true,
      name: true,
      group: {
        select: {
          id: true,
          isDirectMessage: true,
          name: true,
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  }).then((channel) => {
    if (!channel || !channel.group.members.some((member) => member.userId === userId)) {
      return null;
    }

    return channel;
  });
}

function createNotificationPreview(content: string, encrypted: boolean) {
  const preview = content.replace(/\s+/g, " ").trim();

  if (!preview) {
    return encrypted ? "New encrypted message" : "New message";
  }

  return preview.length > 120 ? `${preview.slice(0, 117)}...` : preview;
}

function sanitizeNotificationPreview(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

function sanitizeReplyToMessageId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, 128) : null;
}

function sanitizePoll(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as {
    options?: unknown;
    question?: unknown;
  };
  const question = typeof input.question === "string"
    ? input.question.replace(/\s+/g, " ").trim().slice(0, 180)
    : "";
  const options = Array.isArray(input.options)
    ? input.options
        .map((option) =>
          typeof option === "string"
            ? option.replace(/\s+/g, " ").trim().slice(0, 80)
            : "",
        )
        .filter(Boolean)
        .slice(0, 5)
    : [];

  if (!question || options.length < 2) {
    return null;
  }

  return {
    options,
    question,
  };
}

export async function POST(request: NextRequest, { params }: MessagesRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { channelId } = await params;

  if (!user) {
    if (request.headers.get("content-type")?.includes("application/json")) {
      return jsonError("Unauthorized", 401);
    }

    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const limited = await rateLimit(request, {
    identifiers: [`user:${user.id}`, `channel:${channelId}`],
    key: "channels:messages:create",
    limit: 60,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const channelAccess = await requireChannelMember(user.id, channelId).catch(() => null);
  const channel = channelAccess ? await getTextChannelForUser(channelId, user.id) : null;

  if (!channel) {
    if (request.headers.get("content-type")?.includes("application/json")) {
      return jsonError("Channel not found", 404);
    }

    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (channel.type !== "TEXT") {
    if (request.headers.get("content-type")?.includes("application/json")) {
      return jsonError("Messages can only be sent to text channels.", 400);
    }

    return redirectBack(request, channel.groupId, channel.id);
  }

  const isJsonRequest = request.headers
    .get("content-type")
    ?.includes("application/json");
  const jsonBody = isJsonRequest
    ? jsonMessageSchema.safeParse(await request.json().catch(() => null))
    : null;
  const content = isJsonRequest
    ? String(
        (jsonBody?.success ? jsonBody.data.encryptedContent : "") ?? "",
      ).trim()
    : String((await request.formData()).get("content") ?? "").trim();
  const notificationPreview = sanitizeNotificationPreview(
    jsonBody?.success ? jsonBody.data.notificationPreview : undefined,
  );
  const replyToMessageId = sanitizeReplyToMessageId(
    jsonBody?.success ? jsonBody.data.replyToMessageId : undefined,
  );
  const poll = sanitizePoll(jsonBody?.success ? jsonBody.data.poll : undefined);

  if (
    !content ||
    content.length > 200000 ||
    (isJsonRequest && !isValidEncryptedMessageContent(content))
  ) {
    if (isJsonRequest) {
      return jsonError("Send an encrypted message envelope.", 400);
    }

    return redirectBack(request, channel.groupId, channel.id);
  }

  const result = await prisma.$transaction(async (tx) => {
    const replyToMessage = replyToMessageId
      ? await tx.message.findFirst({
          where: {
            channelId: channel.id,
            id: replyToMessageId,
          },
          select: {
            id: true,
          },
        })
      : null;
    const message = await tx.message.create({
      data: {
        channelId: channel.id,
        senderId: user.id,
        content,
        replyToMessageId: replyToMessage?.id,
      },
      select: {
        id: true,
      },
    });

    if (poll) {
      await tx.poll.create({
        data: {
          messageId: message.id,
          options: {
            create: poll.options.map((option, index) => ({
              position: index,
              text: option,
            })),
          },
          question: poll.question,
        },
      });
    }

    const createdMessage = await tx.message.findUniqueOrThrow({
      where: {
        id: message.id,
      },
      select: chatMessageBaseSelect,
    });

    const recipients = channel.group.members
      .filter((member) => member.userId !== user.id)
      .map((member) => member.userId);

    if (!recipients.length) {
      return {
        href: "",
        message: createdMessage,
        notificationBody: "",
        notificationTitle: "",
        recipients,
      };
    }

    const href = `/dashboard/groups/${channel.groupId}/channels/${channel.id}`;
    const senderName = user.name || user.email;
    const preview = createNotificationPreview(
      notificationPreview || content,
      Boolean(isJsonRequest) && !notificationPreview,
    );
    const title = channel.group.isDirectMessage
      ? senderName
      : `${senderName} in ${channel.group.name}`;
    const body = channel.group.isDirectMessage
      ? preview
      : `#${channel.name}: ${preview}`;

    await tx.notification.createMany({
      data: recipients.map((recipientId) => ({
        actorId: user.id,
        body,
        channelId: channel.id,
        groupId: channel.groupId,
        href,
        messageId: message.id,
        title,
        type: "MESSAGE",
        userId: recipientId,
      })),
    });

    return {
      href,
      message: createdMessage,
      notificationBody: body,
      notificationTitle: title,
      recipients,
    };
  });

  if (result.recipients.length) {
    await sendPushNotifications({
      body: result.notificationBody,
      data: {
        type: "message",
      },
      href: result.href,
      recipientIds: result.recipients,
      title: result.notificationTitle,
    }).catch((error: unknown) => {
      console.error("Failed to send push notifications", error);
    });
  }

  const formattedMessage = await formatChatMessage(result.message, user.id);

  publishChannelMessage(channel.id, formattedMessage);
  await auditSecurityEvent(
    "message.create",
    {
      actorId: user.id,
      channelId: channel.id,
      groupId: channel.groupId,
      messageId: result.message.id,
    },
    request,
  );

  if (isJsonRequest) {
    return NextResponse.json(formattedMessage, { status: 201 });
  }

  return redirectBack(request, channel.groupId, channel.id);
}

export async function GET(request: NextRequest, { params }: MessagesRouteProps) {
  const user = await requireAuth().catch(() => null);
  const { channelId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channelAccess = await requireChannelMember(user.id, channelId).catch(() => null);

  if (!channelAccess || channelAccess.type !== "TEXT") {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const messageId = request.nextUrl.searchParams.get("messageId");
  const after = request.nextUrl.searchParams.get("after");

  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return streamMessages(request, channelId, user.id, after);
  }

  if (!messageId && !after) {
    return NextResponse.json({ error: "Missing messageId or after" }, { status: 400 });
  }

  if (after) {
    const afterDate = new Date(after);

    if (Number.isNaN(afterDate.getTime())) {
      return NextResponse.json({ error: "Invalid after cursor" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        createdAt: {
          gt: afterDate,
        },
        channel: {
          type: "TEXT",
          group: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: messageBatchSize,
      select: chatMessageBaseSelect,
    });

    return NextResponse.json(await formatChatMessages(messages, user.id));
  }

  const requestedMessageId = messageId;

  if (!requestedMessageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
  }

  const message = await prisma.message.findFirst({
    where: {
      id: requestedMessageId,
      channelId,
      channel: {
        type: "TEXT",
        group: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    },
    select: chatMessageBaseSelect,
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(await formatChatMessage(message, user.id));
}

async function streamMessages(
  request: NextRequest,
  channelId: string,
  userId: string,
  after: string | null,
) {
  const channel = await getTextChannelForUser(channelId, userId);

  if (!channel || channel.type !== "TEXT") {
    return jsonError("Channel not found", 404);
  }

  const encoder = new TextEncoder();
  let cursor = after ? new Date(after) : new Date(0);

  if (Number.isNaN(cursor.getTime())) {
    cursor = new Date(0);
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));

      const sendMessages = async () => {
        const messages = await prisma.message.findMany({
          where: {
            channelId,
            createdAt: {
              gt: cursor,
            },
            channel: {
              type: "TEXT",
              group: {
                members: {
                  some: {
                    userId,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: messageBatchSize,
          select: chatMessageBaseSelect,
        });

        if (!messages.length) {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
          return;
        }

        cursor = new Date(messages[messages.length - 1].createdAt);
        controller.enqueue(
          encoder.encode(
            `event: messages\ndata: ${JSON.stringify(await formatChatMessages(messages, userId))}\n\n`,
          ),
        );
      };

      const unsubscribe = subscribeToChannelMessages(channelId, (message) => {
        if (new Date(message.createdAt).getTime() <= cursor.getTime()) {
          return;
        }

        cursor = new Date(message.createdAt);
        controller.enqueue(
          encoder.encode(`event: messages\ndata: ${JSON.stringify([message])}\n\n`),
        );
      });

      const timer = setInterval(() => {
        if (request.signal.aborted) {
          clearInterval(timer);
          unsubscribe();
          controller.close();
          return;
        }

        void sendMessages().catch(() => {
          clearInterval(timer);
          unsubscribe();
          controller.error(new Error("Message stream failed."));
        });
      }, messagePollIntervalMs);

      void sendMessages().catch(() => {
        clearInterval(timer);
        controller.error(new Error("Message stream failed."));
      });

      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
