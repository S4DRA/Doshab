import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  auditSecurityEvent,
  requireAuth,
  requireGroupRole,
  SecurityError,
} from "@/lib/security/permissions";

type DeleteChannelRouteProps = {
  params: Promise<{
    channelId: string;
    groupId: string;
  }>;
};

function redirectAfterChannelDelete(
  request: NextRequest,
  groupId: string,
  type: "error" | "message",
  message: string,
  returnTo: string,
) {
  const pathname =
    returnTo === "settings"
      ? `/dashboard/groups/${groupId}/settings`
      : `/dashboard/groups/${groupId}`;
  const url = new URL(pathname, request.url);

  url.searchParams.set(type, message);

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(
  request: NextRequest,
  { params }: DeleteChannelRouteProps,
) {
  const user = await requireAuth().catch(() => null);
  const { channelId, groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const returnTo = String(formData.get("returnTo") ?? "");

  const membership = await requireGroupRole(user.id, groupId, ["OWNER", "ADMIN"]).catch(
    (error: unknown) => {
      if (error instanceof SecurityError && error.status === 404) {
        return null;
      }

      return undefined;
    },
  );

  if (membership === null) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (!membership) {
    return redirectAfterChannelDelete(
      request,
      groupId,
      "error",
      "Only owners and admins can delete channels.",
      returnTo,
    );
  }

  const channel = await prisma.channel.findFirst({
    where: {
      groupId,
      id: channelId,
    },
    select: {
      id: true,
    },
  });

  if (!channel) {
    return redirectAfterChannelDelete(
      request,
      groupId,
      "error",
      "That channel could not be found.",
      returnTo,
    );
  }

  await prisma.channel.delete({
    where: {
      id: channel.id,
    },
  });

  await auditSecurityEvent(
    "channel.delete",
    {
      actorId: user.id,
      channelId: channel.id,
      groupId,
    },
    request,
  );

  return redirectAfterChannelDelete(
    request,
    groupId,
    "message",
    "Channel deleted.",
    returnTo,
  );
}
