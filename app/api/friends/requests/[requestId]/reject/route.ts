import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RequestActionProps = {
  params: Promise<{
    requestId: string;
  }>;
};

function redirectToRequestsPanel(request: NextRequest, message: string) {
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("message", message);
  url.hash = "requests-and-invites";

  return NextResponse.redirect(url, { status: 303 });
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
    return redirectToRequestsPanel(request, "Friend request not found.");
  }

  await prisma.friendRequest.update({
    where: { id: friendRequest.id },
    data: { status: "REJECTED" },
  });

  return redirectToRequestsPanel(request, "Friend request rejected.");
}
