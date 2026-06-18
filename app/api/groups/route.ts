import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

const createGroupSchema = z.object({
  description: z.string().trim().max(180).optional(),
  name: z.string().trim().min(1).max(80),
});

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url),
    { status: 303 },
  );
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, {
    key: "groups:create",
    limit: 12,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const parsed = createGroupSchema.safeParse({
    description: formData.get("description") ?? undefined,
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return redirectWithError(request, "Space name is required.");
  }

  const { name } = parsed.data;
  const description = parsed.data.description ?? "";

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

  await auditSecurityEvent(
    "group.create",
    {
      actorId: user.id,
      groupId: group.id,
    },
    request,
  );

  return NextResponse.redirect(
    new URL(`/dashboard/groups/${group.id}`, request.url),
    { status: 303 },
  );
}
