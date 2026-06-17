"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChannelList } from "@/components/groups/channel-list";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatUserStatus } from "@/lib/utils";
import type { GroupChannel, GroupMemberItem } from "@/types";

type ChannelHeaderActionsProps = {
  canInvite?: boolean;
  canManageSpace?: boolean;
  channels: GroupChannel[];
  currentUserId?: string;
  groupId: string;
  groupName?: string;
  members: GroupMemberItem[];
  selectedChannelId?: string;
};

type OpenPanel = "channels" | "members" | "more" | null;

export function ChannelHeaderActions({
  canInvite = false,
  canManageSpace = false,
  channels,
  currentUserId,
  groupId,
  groupName,
  members,
  selectedChannelId,
}: ChannelHeaderActionsProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node) || panelRef.current?.contains(target)) {
        return;
      }

      setOpenPanel(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [openPanel]);

  const openPanelDialog = openPanel ? (
    <div className="fixed inset-0 z-[120] flex items-end bg-black/50 min-[1180px]:items-start min-[1180px]:justify-end min-[1180px]:bg-black/20">
      <div
        className="app-panel mx-3 mb-[calc(env(safe-area-inset-bottom)+6rem)] flex max-h-[72dvh] w-full max-w-xl flex-col overflow-hidden rounded-[1.4rem] p-4 min-[1180px]:mx-0 min-[1180px]:mr-7 min-[1180px]:mt-[7.25rem] min-[1180px]:mb-0 min-[1180px]:max-h-[calc(100dvh_-_9rem)] min-[1180px]:rounded-lg min-[1180px]:p-5"
        ref={panelRef}
        role="dialog"
      >
        {openPanel === "channels" ? (
          <PanelShell
            description="Switch channels without losing your place in this space."
            onClose={() => setOpenPanel(null)}
            title="Channels"
          >
            <div className="max-h-[50dvh] min-h-0 overflow-y-auto pr-1">
              {channels.length ? (
                <ChannelList
                  channels={channels}
                  groupId={groupId}
                  onNavigate={() => setOpenPanel(null)}
                  selectedChannelId={selectedChannelId}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-400">
                  No channels yet in {groupName ?? "this space"}.
                </div>
              )}
            </div>
          </PanelShell>
        ) : null}

        {openPanel === "members" ? (
          <PanelShell
            description="See who is in the conversation and jump straight into a private chat."
            onClose={() => setOpenPanel(null)}
            title="Members"
          >
            <div className="grid gap-2">
              {members.length ? (
                members.map((member) => {
                  const memberLabel = member.user.name || member.user.email;

                  return (
                    <div
                      className="app-row flex min-w-0 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center"
                      key={member.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <AvatarInitials imageUrl={member.user.image} value={memberLabel} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {memberLabel}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {member.user.email}
                          </span>
                          <span className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="app-status-dot" data-status={member.user.status ?? "OFFLINE"} />
                            {formatUserStatus(member.user.status)}
                          </span>
                        </span>
                      </div>
                      {currentUserId && member.user.id !== currentUserId ? (
                        <div className="flex w-full gap-2 sm:w-auto">
                          <form action="/api/private-messages" className="min-w-0 flex-1 sm:flex-none" method="post">
                            <input name="friendId" type="hidden" value={member.user.id} />
                            <button
                              className="app-button-secondary h-10 w-full rounded-lg px-3 text-sm font-semibold transition sm:w-auto"
                              type="submit"
                            >
                              Message
                            </button>
                          </form>
                          <form action="/api/friend-calls/start" className="min-w-0 flex-1 sm:flex-none" method="post">
                            <input name="friendId" type="hidden" value={member.user.id} />
                            <button
                              className="app-button-primary h-10 w-full rounded-lg px-3 text-sm font-semibold transition sm:w-auto"
                              type="submit"
                            >
                              Call
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="app-badge w-fit px-3 py-1 text-[11px] font-semibold">
                          {formatRoleLabel(member.role)}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-400">
                  No members available right now.
                </div>
              )}
            </div>
          </PanelShell>
        ) : null}

        {openPanel === "more" ? (
          <PanelShell
            description="Extra space actions stay grouped here on mobile so the header stays calm."
            onClose={() => setOpenPanel(null)}
            title="More"
          >
            <div className="grid gap-2">
              <Link
                className="app-row flex min-h-12 items-center justify-between gap-3 px-3 py-3"
                href="/dashboard/messages"
                onClick={() => setOpenPanel(null)}
              >
                <span className="text-sm font-semibold text-white">Open messages</span>
                <span className="text-[11px] font-semibold text-[#FFB199]">Go</span>
              </Link>
              {canInvite ? (
                <Link
                  className="app-row flex min-h-12 items-center justify-between gap-3 px-3 py-3"
                  href={`/dashboard/groups/${groupId}/settings#invite-friends`}
                  onClick={() => setOpenPanel(null)}
                >
                  <span className="text-sm font-semibold text-white">Invite friends</span>
                  <span className="text-[11px] font-semibold text-[#FFB199]">Open</span>
                </Link>
              ) : null}
              {canManageSpace ? (
                <Link
                  className="app-row flex min-h-12 items-center justify-between gap-3 px-3 py-3"
                  href={`/dashboard/groups/${groupId}/settings`}
                  onClick={() => setOpenPanel(null)}
                >
                  <span className="text-sm font-semibold text-white">Space settings</span>
                  <span className="text-[11px] font-semibold text-[#FFB199]">Open</span>
                </Link>
              ) : null}
              {!canInvite && !canManageSpace ? (
                <div className="rounded-lg border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-400">
                  Space owners and admins see invite and settings actions here.
                </div>
              ) : null}
            </div>
          </PanelShell>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="flex shrink-0 flex-wrap justify-end gap-2 min-[1180px]:items-center">
        <HeaderActionButton
          active={openPanel === "channels"}
          label="Channels"
          onClick={() => setOpenPanel((current) => (current === "channels" ? null : "channels"))}
        />
        <HeaderActionButton
          active={openPanel === "members"}
          label="Members"
          onClick={() => setOpenPanel((current) => (current === "members" ? null : "members"))}
        />
        <HeaderActionButton
          active={openPanel === "more"}
          className="min-[1180px]:hidden"
          label="More"
          onClick={() => setOpenPanel((current) => (current === "more" ? null : "more"))}
        />
        {canInvite ? (
          <Link
            className="hidden h-9 items-center rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 transition hover:border-[#FF5F25] hover:text-white min-[1180px]:inline-flex"
            href={`/dashboard/groups/${groupId}/settings#invite-friends`}
          >
            Invite
          </Link>
        ) : null}
        {canManageSpace ? (
          <Link
            className="hidden h-9 items-center rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 transition hover:border-[#FF5F25] hover:text-white min-[1180px]:inline-flex"
            href={`/dashboard/groups/${groupId}/settings`}
          >
            Space settings
          </Link>
        ) : null}
      </div>

      {openPanelDialog ? createPortal(openPanelDialog, document.body) : null}
    </>
  );
}

function HeaderActionButton({
  active,
  className,
  label,
  onClick,
}: {
  active: boolean;
  className?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
        active
          ? "border-[#FF5F25]/70 bg-[#FF5F25]/14 text-white"
          : "border-white/15 text-slate-200 hover:border-[#FF5F25] hover:text-white"
      } ${className ?? ""}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function PanelShell({
  children,
  description,
  onClose,
  title,
}: {
  children: React.ReactNode;
  description: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="app-section-title">{title}</p>
          <p className="mt-2 text-sm leading-5 text-slate-400">{description}</p>
        </div>
        <button
          aria-label={`Close ${title}`}
          className="app-icon-button h-10 w-10 shrink-0"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </>
  );
}

function formatRoleLabel(role: GroupMemberItem["role"]) {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    default:
      return "Member";
  }
}
