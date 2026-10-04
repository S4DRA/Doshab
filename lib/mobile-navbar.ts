export const mobileNavbarButtons = [
  { id: "home", label: "Home", href: "/dashboard", icon: "home" },
  { id: "groups", label: "Spaces", href: "/dashboard/channels", icon: "spaces" },
  { id: "messages", label: "Messages", href: "/dashboard/messages", icon: "chat" },
  { id: "profile", label: "Profile", href: "/dashboard/profile", icon: "profile" },
  { id: "friends", label: "Friends", href: "/dashboard/friends", icon: "friends" },
  { id: "search", label: "Search", href: "/dashboard/search", icon: "search" },
  { id: "notifications", label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
  { id: "create", label: "Create", href: "/dashboard/create", icon: "plus" },
] as const;

export type MobileNavbarButton = typeof mobileNavbarButtons[number]["id"];
export const mobileNavbarPositions = ["bottom", "top", "left", "right"] as const;
export type MobileNavbarPosition = typeof mobileNavbarPositions[number];
export type MobileNavbarPreferences = {
  buttons: MobileNavbarButton[];
  position: MobileNavbarPosition;
  floating: boolean;
};
export const defaultMobileNavbar: MobileNavbarPreferences = {
  buttons: ["home", "groups", "messages", "profile"], position: "bottom", floating: false,
};

/** Only existing destinations are allowed; an empty selection deliberately hides the bar. */
export function normalizeMobileNavbar(value: unknown): MobileNavbarPreferences {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const buttons = Array.isArray(candidate.buttons)
    ? [...new Set(candidate.buttons.filter((id): id is MobileNavbarButton => mobileNavbarButtons.some(button => button.id === id)))]
    : [...defaultMobileNavbar.buttons];
  const position = mobileNavbarPositions.includes(candidate.position as MobileNavbarPosition)
    ? candidate.position as MobileNavbarPosition : "bottom";
  return { buttons, position, floating: position === "bottom" && candidate.floating === true };
}

export const mobileNavbarKey = (userId: string) => `val:navbar:v1:${userId}`;

export function selectedMobileNavbarButton(path: string, destination: string, buttons: MobileNavbarButton[]) {
  const contextual = mobileNavbarButtons.find(button => button.id !== "home" && path === button.href);
  if (contextual && buttons.includes(contextual.id)) return contextual.id;
  return buttons.includes(destination as MobileNavbarButton) ? destination : undefined;
}
