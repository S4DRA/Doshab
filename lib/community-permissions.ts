import {
  canManageChannel as canManageSpace,
  requireChannelMember,
  requireMessageAccess,
} from "@/lib/security/permissions";

export async function getMessageAccess(messageId: string, userId: string) {
  return requireMessageAccess(userId, messageId).catch(() => null);
}

export async function getChannelMembership(channelId: string, userId: string) {
  return requireChannelMember(userId, channelId).catch(() => null);
}

export { canManageSpace };
