import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return redirectWithError(request, "Space name is required.");
  }

  const group = await prisma.$transaction(async (tx) => {
    const createdGroup = await tx.group.create({
      data: {
        name,
        description: description || null,
        ownerId: user.id,
      },
      select: {
        id: true,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: createdGroup.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    await tx.channel.createMany({
      data: [
        {
          groupId: createdGroup.id,
          name: "general",
          type: "TEXT",
        },
        {
          groupId: createdGroup.id,
          name: "lounge",
          type: "VOICE",
        },
      ],
    });

    return createdGroup;
  });

  return NextResponse.redirect(
    new URL(`/dashboard/groups/${group.id}`, request.url),
    { status: 303 },
  );
}
