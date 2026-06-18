import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

type RejectInviteContext = {
  params: Promise<{
    inviteId: string;
  }>;
};

function redirectToRequestsPanel(request: NextRequest, message: string) {
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("message", message);
  url.hash = "requests-and-invites";

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest, context: RejectInviteContext) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { inviteId } = await context.params;
  const invite = await prisma.groupInvite.findFirst({
    where: {
      id: inviteId,
      receiverId: user.id,
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (!invite) {
    return redirectToRequestsPanel(request, "That space invite is no longer available.");
  }

  await prisma.groupInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      status: "REJECTED",
    },
  });

  await auditSecurityEvent(
    "group-invite.reject",
    {
      actorId: user.id,
      inviteId: invite.id,
    },
    request,
  );

  return redirectToRequestsPanel(request, "Space invite rejected.");
}
