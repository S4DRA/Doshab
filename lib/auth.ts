import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= 8;
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
      },
    });
  } catch {
    return null;
  }
}
