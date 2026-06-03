export type ChannelKind = "text" | "voice" | "video";

export type DashboardChannel = {
  id: string;
  name: string;
  kind: ChannelKind;
};

export type DashboardGroup = {
  id: string;
  name: string;
  description: string | null;
  image?: string | null;
  isDirectMessage?: boolean;
  channels?: GroupChannel[];
  members?: GroupMemberItem[];
};

export type GroupChannel = {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
};

export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DO_NOT_DISTURB";

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: Date | string;
  sender: {
    id?: string;
    name: string;
    email: string;
    image?: string | null;
    status?: UserStatus;
  };
};

export type FriendPerson = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  status?: UserStatus;
};

export type FriendRequestItem = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  sender?: FriendPerson;
  receiver?: FriendPerson;
};

export type GroupMemberItem = {
  id: string;
  role: GroupRole;
  createdAt: Date;
  user: FriendPerson;
};

export type GroupInviteItem = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  group: DashboardGroup;
  inviter: FriendPerson;
};

export type MessageThread = {
  id: string;
  channelId: string;
  name: string;
  friend: FriendPerson | null;
};

export type DashboardNotification = {
  actor: FriendPerson | null;
  body: string;
  callId?: string | null;
  createdAt: Date | string;
  dataJson?: unknown;
  expiresAt?: Date | string | null;
  href: string;
  id: string;
  readAt: Date | string | null;
  title: string;
  type:
    | "FRIEND_REQUEST"
    | "GROUP_INVITE"
    | "INCOMING_CALL"
    | "MESSAGE"
    | "MISSED_CALL"
    | "SYSTEM";
};
