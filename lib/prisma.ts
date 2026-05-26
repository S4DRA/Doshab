import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

process.env.DATABASE_URL ??= process.env.DIRECT_URL;

const connectionTimeoutMillis = Number(
  process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 20000,
);

const rawDatabaseUrl = process.env.DATABASE_URL ?? "";
const connectionString =
  rawDatabaseUrl.startsWith("postgresql://") && !rawDatabaseUrl.includes("sslmode=")
    ? `${rawDatabaseUrl}${rawDatabaseUrl.includes("?") ? "&" : "?"}sslmode=require`
    : rawDatabaseUrl;

const adapter = new PrismaPg({
  connectionString,
  connectionTimeoutMillis,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
