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
};

export type GroupChannel = {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
};

export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: Date | string;
  sender: {
    name: string;
    email: string;
  };
};

export type FriendPerson = {
  id: string;
  name: string;
  email: string;
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
