"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { FriendPerson } from "@/types";

const PeopleContext = createContext<{
  currentUserId: string;
  friends: FriendPerson[];
  updateFriends: Dispatch<SetStateAction<FriendPerson[]>>;
} | null>(null);

export function DashboardPeopleProvider({ children, currentUserId, initialFriends }: {
  children: ReactNode;
  currentUserId: string;
  initialFriends: FriendPerson[];
}) {
  const [friends, updateFriends] = useState(initialFriends);
  const value = useMemo(() => ({ currentUserId, friends, updateFriends }), [currentUserId, friends]);
  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export function useDashboardPeople() {
  const context = useContext(PeopleContext);
  if (!context) throw new Error("Dashboard people require DashboardPeopleProvider.");
  return context;
}
