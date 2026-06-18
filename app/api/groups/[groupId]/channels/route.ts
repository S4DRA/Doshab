import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  auditSecurityEvent,
  requireAuth,
  requireGroupRole,
  SecurityError,
} from "@/lib/security/permissions";

const channelFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  returnTo: z.string().optional(),
  type: z.enum(["TEXT", "VOICE"]),
});

type ChannelRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

function normalizeChannelName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function redirectAfterChannelSubmit(
  request: NextRequest,
  groupId: string,
  returnTo: string,
  type: "error" | "message",
  message: string,
) {
  const pathname =
    returnTo === "settings"
      ? `/dashboard/groups/${groupId}/settings`
      : `/dashboard/groups/${groupId}`;
  const url = new URL(pathname, request.url);

  url.searchParams.set(type, message);

  return NextResponse.redirect(url, { status: 303 });
}

function redirectAfterChannelChange(
  request: NextRequest,
  groupId: string,
  channelId: string,
  returnTo: string,
) {
  const pathname =
    returnTo === "settings"
      ? `/dashboard/groups/${groupId}/settings?message=${encodeURIComponent("Channel created.")}`
      : `/dashboard/groups/${groupId}/channels/${channelId}`;

  return NextResponse.redirect(new URL(pathname, request.url), { status: 303 });
}

export async function POST(request: NextRequest, { params }: ChannelRouteProps) {
  const limited = await rateLimit(request, {
    key: "groups:channels:create",
    limit: 30,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const { groupId } = await params;
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const parsed = channelFormSchema.safeParse({
    name: formData.get("name"),
    returnTo: formData.get("returnTo") ?? undefined,
    type: formData.get("type") ?? "TEXT",
  });
  const returnTo = parsed.success ? parsed.data.returnTo ?? "" : "";

  if (!parsed.success) {
    return redirectAfterChannelSubmit(
      request,
      groupId,
      returnTo,
      "error",
      "Channel name is required.",
    );
  }

  try {
    await requireGroupRole(user.id, groupId, ["OWNER", "ADMIN"]);
  } catch (error) {
    if (error instanceof SecurityError && error.status === 404) {
      return NextResponse.redirect(new URL("/dashboard", request.url), {
        status: 303,
      });
    }

    return redirectAfterChannelSubmit(
      request,
      groupId,
      returnTo,
      "error",
      "Only owners and admins can create channels.",
    );
  }

  const name = normalizeChannelName(parsed.data.name);
  const type = parsed.data.type;
  const existingChannel = await prisma.channel.findUnique({
    where: {
      groupId_name: {
        groupId,
        name,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingChannel) {
    return redirectAfterChannelSubmit(
      request,
      groupId,
      returnTo,
      "error",
      "A channel with that name already exists.",
    );
  }

  const channel = await prisma.channel.create({
    data: {
      groupId,
      name,
      type,
    },
    select: {
      id: true,
    },
  });

  await auditSecurityEvent(
    "channel.create",
    {
      actorId: user.id,
      channelId: channel.id,
      groupId,
    },
    request,
  );

  return redirectAfterChannelChange(request, groupId, channel.id, returnTo);
}
