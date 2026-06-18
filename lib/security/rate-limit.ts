import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  identifiers?: Array<string | null | undefined>;
  key: string;
  limit: number;
  windowMs: number;
};

export function getClientIp(request: NextRequest | Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function cleanIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._:-]/g, "_").slice(0, 160);
}

function rateLimitKey(request: NextRequest, options: RateLimitOptions) {
  const parts = [options.key, `ip:${getClientIp(request)}`];

  for (const identifier of options.identifiers ?? []) {
    const cleaned = typeof identifier === "string" ? cleanIdentifier(identifier) : "";

    if (cleaned) {
      parts.push(cleaned);
    }
  }

  return parts.join(":");
}

export async function rateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);
  const key = rateLimitKey(request, options);
  const created = await prisma.rateLimitBucket
    .create({
      data: {
        count: 1,
        key,
        resetAt,
      },
    })
    .then(() => true)
    .catch(() => false);

  if (created) {
    return null;
  }

  const update = await prisma.rateLimitBucket.updateMany({
    data: {
      count: {
        increment: 1,
      },
    },
    where: {
      count: {
        lt: options.limit,
      },
      key,
      resetAt: {
        gt: now,
      },
    },
  });

  if (update.count) {
    return null;
  }

  const expiredReset = await prisma.rateLimitBucket.updateMany({
    data: {
      count: 1,
      resetAt,
    },
    where: {
      key,
      resetAt: {
        lte: now,
      },
    },
  });

  if (expiredReset.count) {
    return null;
  }

  const bucket = await prisma.rateLimitBucket.findUnique({
    where: {
      key,
    },
    select: {
      resetAt: true,
    },
  });
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(((bucket?.resetAt.getTime() ?? resetAt.getTime()) - now.getTime()) / 1000),
  );

  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    {
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
      status: 429,
    },
  );
}
