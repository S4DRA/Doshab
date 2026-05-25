import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RequestActionProps = {
  params: Promise<{
    requestId: string;
  }>;
};

function redirectFriends(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/friends?message=${encodeURIComponent(message)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest, { params }: RequestActionProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { requestId } = await params;
  const friendRequest = await prisma.friendRequest.findFirst({
    where: {
      id: requestId,
      receiverId: user.id,
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (!friendRequest) {
    return redirectFriends(request, "Friend request not found.");
  }

  await prisma.friendRequest.update({
    where: { id: friendRequest.id },
    data: { status: "REJECTED" },
  });

  return redirectFriends(request, "Friend request rejected.");
}
