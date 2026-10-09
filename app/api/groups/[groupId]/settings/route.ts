import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { maxSettingsImageBytes } from "@/lib/image-upload";
import {
  auditSecurityEvent,
  requireAuth,
  requireGroupRole,
  SecurityError,
} from "@/lib/security/permissions";

const maxGroupImageBytes = maxSettingsImageBytes;
const allowedGroupImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"],
]);

const settingsFormSchema = z.object({
  description: z.string().trim().max(180),
  image: z.string(),
  name: z.string().trim().min(2).max(80),
});

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

  if (/^data:image\/(?:jpeg|png|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) {
    const bytes = Buffer.from(image.slice(image.indexOf(",") + 1), "base64").byteLength;
    return bytes <= maxGroupImageBytes ? image : undefined;
  }

  if (image.startsWith("/uploads/groups/")) {
    return image;
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

async function saveGroupImageUpload(file: File) {
  if (!file.size) {
    return null;
  }

  if (file.size > maxGroupImageBytes) {
    return {
      error: "Space picture must be 2 MB or smaller.",
      image: null,
    };
  }

  if (!allowedGroupImageTypes.has(file.type)) {
    return {
      error: "Upload a PNG, JPG, WebP, GIF, or SVG image.",
      image: null,
    };
  }

  return {
    error: null,
    // The existing image column survives serverless restarts, unlike public/ writes.
    image: `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`,
  };
}

export async function POST(
  request: NextRequest,
  { params }: GroupSettingsRouteProps,
) {
  const user = await requireAuth().catch(() => null);
  const { groupId } = await params;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

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
    return redirectToSettings(request, groupId, "error", "Only owners and admins can edit space settings.");
  }

  if (membership.group.isDirectMessage) {
    return redirectToSettings(request, groupId, "error", "Private messages do not have space settings.");
  }

  const formData = await request.formData();
  const parsed = settingsFormSchema.safeParse({
    description: formData.get("description") ?? "",
    image: formData.get("image") ?? "",
    name: formData.get("name"),
  });
  const imageUpload = formData.get("imageUpload");

  if (!parsed.success) {
    return redirectToSettings(request, groupId, "error", "Space name must be 2 to 80 characters.");
  }

  const { description, name } = parsed.data;
  const imageUrl = normalizeImageUrl(parsed.data.image);

  if (imageUrl === undefined) {
    return redirectToSettings(request, groupId, "error", "Enter a valid http or https image URL.");
  }

  let image = imageUrl;

  if (imageUpload instanceof File && imageUpload.size > 0) {
    const uploadResult = await saveGroupImageUpload(imageUpload);

    if (uploadResult?.error) {
      return redirectToSettings(request, groupId, "error", uploadResult.error);
    }

    image = uploadResult?.image ?? imageUrl;
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

  await auditSecurityEvent(
    "group.settings.update",
    {
      actorId: user.id,
      groupId,
    },
    request,
  );

  return redirectToSettings(request, groupId, "message", "Space settings updated.");
}
