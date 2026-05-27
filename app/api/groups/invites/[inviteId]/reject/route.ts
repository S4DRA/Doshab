import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RejectInviteContext = {
  params: Promise<{
    inviteId: string;
  }>;
};

function redirectWithMessage(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/friends?message=${encodeURIComponent(message)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest, context: RejectInviteContext) {
  const user = await getCurrentUser();

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
    return redirectWithMessage(request, "That space invite is no longer available.");
  }

  await prisma.groupInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      status: "REJECTED",
    },
  });

  return redirectWithMessage(request, "Space invite rejected.");
}
