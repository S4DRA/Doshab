export const mobileHomeSections = ["conversations", "spaces", "friends", "requests"] as const;
export type MobileHomeSection = typeof mobileHomeSections[number];

export function normalizeMobileHomeOrder(value: unknown): MobileHomeSection[] {
  const saved = Array.isArray(value) ? value : [];
  return [...new Set([...saved, ...mobileHomeSections])]
    .filter((id): id is MobileHomeSection => mobileHomeSections.includes(id));
}

export function moveMobileHomeSection(order: readonly MobileHomeSection[], id: MobileHomeSection, index: number) {
  const next = order.filter((section) => section !== id);
  next.splice(Math.max(0, Math.min(index, next.length)), 0, id);
  return next;
}

export function mobileHomeOrderKey(userId: string) { return `val:home-order:v1:${userId}`; }
