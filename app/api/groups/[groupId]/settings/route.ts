import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type GroupSettingsRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

function redirectToSettings(
  request: NextRequest,
  groupId: string,
  type: "error" | "message",
  message: string,
) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/groups/${groupId}/settings?${type}=${encodeURIComponent(message)}`,
      request.url,
    ),
    { status: 303 },
  );
}

function normalizeImageUrl(value: string) {
  const image = value.trim();

  if (!image) {
    return null;
  }

  try {
    const url = new URL(image);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export async function POST(
  request: NextRequest,
  { params }: GroupSettingsRouteProps,
) {
  const user = await getCurrentUser();
  const { groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
    select: {
      role: true,
      group: {
        select: {
          isDirectMessage: true,
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
  }

  if (membership.group.isDirectMessage) {
    return redirectToSettings(request, groupId, "error", "Private messages do not have space settings.");
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return redirectToSettings(request, groupId, "error", "Only owners and admins can edit space settings.");
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image = normalizeImageUrl(String(formData.get("image") ?? ""));

  if (name.length < 2 || name.length > 80) {
    return redirectToSettings(request, groupId, "error", "Space name must be 2 to 80 characters.");
  }

  if (description.length > 180) {
    return redirectToSettings(request, groupId, "error", "Description must be 180 characters or fewer.");
  }

  if (image === undefined) {
    return redirectToSettings(request, groupId, "error", "Enter a valid http or https image URL.");
  }

  await prisma.group.update({
    where: {
      id: groupId,
    },
    data: {
      description: description || null,
      image,
      name,
    },
  });

  return redirectToSettings(request, groupId, "message", "Space settings updated.");
}
