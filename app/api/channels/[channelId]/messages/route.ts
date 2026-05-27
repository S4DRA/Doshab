import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { isValidEncryptedMessageContent } from "@/lib/e2ee-message";
import {
  publishChannelMessage,
  subscribeToChannelMessages,
} from "@/lib/message-bus";
import { prisma } from "@/lib/prisma";
import { sendPushNotifications } from "@/lib/push";

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

function messageSelect() {
  return {
    id: true,
    content: true,
    createdAt: true,
    sender: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
      },
    },
  } as const;
}

export async function POST(request: NextRequest, { params }: MessagesRouteProps) {
  const user = await getCurrentUser();
  const { channelId } = await params;

  if (!user) {
    if (request.headers.get("content-type")?.includes("application/json")) {
      return jsonError("Unauthorized", 401);
    }

    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const channel = await getTextChannelForUser(channelId, user.id);

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
  const content = isJsonRequest
    ? String(
        ((await request.json().catch(() => null)) as {
          encryptedContent?: unknown;
        } | null)?.encryptedContent ?? "",
      ).trim()
    : String((await request.formData()).get("content") ?? "").trim();

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
    const message = await tx.message.create({
      data: {
        channelId: channel.id,
        senderId: user.id,
        content,
      },
      select: messageSelect(),
    });

    const recipients = channel.group.members
      .filter((member) => member.userId !== user.id)
      .map((member) => member.userId);

    if (!recipients.length) {
      return {
        href: "",
        message,
        notificationBody: "",
        notificationTitle: "",
        recipients,
      };
    }

    const href = `/dashboard/groups/${channel.groupId}/channels/${channel.id}`;
    const senderName = user.name || user.email;
    const title = channel.group.isDirectMessage
      ? senderName
      : `${channel.group.name} / #${channel.name}`;
    const body = channel.group.isDirectMessage
      ? "New encrypted message"
      : `${senderName}: New encrypted message`;

    await tx.notification.createMany({
      data: recipients.map((recipientId) => ({
        actorId: user.id,
        body,
        channelId: channel.id,
        groupId: channel.groupId,
        href,
        messageId: message.id,
        title,
        userId: recipientId,
      })),
    });

    return {
      href,
      message,
      notificationBody: body,
      notificationTitle: title,
      recipients,
    };
  });

  if (result.recipients.length) {
    await sendPushNotifications({
      body: result.notificationBody,
      href: result.href,
      recipientIds: result.recipients,
      title: result.notificationTitle,
    }).catch((error: unknown) => {
      console.error("Failed to send push notifications", error);
    });
  }

  publishChannelMessage(channel.id, result.message);

  if (isJsonRequest) {
    return NextResponse.json(result.message, { status: 201 });
  }

  return redirectBack(request, channel.groupId, channel.id);
}

export async function GET(request: NextRequest, { params }: MessagesRouteProps) {
  const user = await getCurrentUser();
  const { channelId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      take: 100,
      select: messageSelect(),
    });

    return NextResponse.json(messages);
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
    select: messageSelect(),
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(message);
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
          take: 100,
          select: messageSelect(),
        });

        if (!messages.length) {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
          return;
        }

        cursor = new Date(messages[messages.length - 1].createdAt);
        controller.enqueue(
          encoder.encode(`event: messages\ndata: ${JSON.stringify(messages)}\n\n`),
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
      }, 10000);

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
