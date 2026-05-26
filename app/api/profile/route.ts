import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserStatus } from "@/types";

const allowedStatuses: UserStatus[] = [
  "ONLINE",
  "IDLE",
  "DO_NOT_DISTURB",
  "OFFLINE",
];

function redirectWithMessage(
  request: NextRequest,
  type: "error" | "message",
  message: string,
) {
  return NextResponse.redirect(
    new URL(`/dashboard/profile?${type}=${encodeURIComponent(message)}`, request.url),
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
  const status = String(formData.get("status") ?? "");
  const removeImage = String(formData.get("removeImage") ?? "") === "on";
  const imageFile = formData.get("profileImage");

  if (name.length < 2 || name.length > 40) {
    return redirectWithMessage(
      request,
      "error",
      "Display name must be 2 to 40 characters.",
    );
  }

  if (!allowedStatuses.includes(status as UserStatus)) {
    return redirectWithMessage(request, "error", "Choose a valid status.");
  }

  let image: string | null = user.image;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!imageFile.type.startsWith("image/")) {
      return redirectWithMessage(request, "error", "Please upload a valid image file.");
    }

    if (imageFile.size > 3_145_728) {
      return redirectWithMessage(request, "error", "Image must be under 3 MB.");
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    image = `data:${imageFile.type};base64,${base64}`;
  } else if (removeImage) {
    image = null;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name,
      image,
      status: status as UserStatus,
    },
  });

  return redirectWithMessage(request, "message", "Profile updated.");
}
