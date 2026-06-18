import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  auditSecurityEvent,
  requireAuth,
  requireGroupRole,
  SecurityError,
} from "@/lib/security/permissions";

const maxGroupImageBytes = 2 * 1024 * 1024;
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

async function saveGroupImageUpload(file: File, groupId: string) {
  if (!file.size) {
    return null;
  }

  if (file.size > maxGroupImageBytes) {
    return {
      error: "Space picture must be 2 MB or smaller.",
      image: null,
    };
  }

  const extension =
    allowedGroupImageTypes.get(file.type) || extname(file.name).toLowerCase();

  if (!allowedGroupImageTypes.has(file.type) || !extension) {
    return {
      error: "Upload a PNG, JPG, WebP, GIF, or SVG image.",
      image: null,
    };
  }

  const uploadsDir = join(process.cwd(), "public", "uploads", "groups");
  const filename = `${groupId}-${randomUUID()}${extension}`;

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

  return {
    error: null,
    image: `/uploads/groups/${filename}`,
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
    const uploadResult = await saveGroupImageUpload(imageUpload, groupId);

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
