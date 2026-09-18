"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import type { Status } from "@/lib/validation";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import {
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  ListIcon,
  LogoIcon,
  LogoutIcon,
  Spinner,
  XIcon,
} from "./Icons";

export type Filter = "ALL" | Status;

export type SidebarUser = { name?: string | null; email?: string | null; image?: string | null };

const NAV: { key: Filter; label: string; Icon: typeof ListIcon }[] = [
  { key: "ALL", label: "All tasks", Icon: ListIcon },
  { key: "TODO", label: "To do", Icon: CircleIcon },
  { key: "IN_PROGRESS", label: "In progress", Icon: ClockIcon },
  { key: "DONE", label: "Completed", Icon: CheckCircleIcon },
];

export default function Sidebar({
  user,
  filter,
  counts,
  open,
  onClose,
  onFilter,
}: {
  user: SidebarUser;
  /** Highlighted nav item; null when on a page that isn't a task list. */
  filter: Filter | null;
  counts: Record<Filter, number>;
  open: boolean;
  onClose: () => void;
  onFilter: (f: Filter) => void;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const progress = counts.ALL ? Math.round((counts.DONE / counts.ALL) * 100) : 0;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface p-5 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="gradient-accent flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg shadow-accent/30">
              <LogoIcon />
            </div>
            <span className="text-lg font-semibold tracking-tight">TaskPad</span>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 lg:hidden" aria-label="Close menu">
            <XIcon />
          </button>
        </div>

        {/* Profile */}
        <div className="mt-7 flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <Avatar src={user.image} name={user.name} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name ?? "Anonymous"}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <p className="mt-7 mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">Tasks</p>
        <nav className="space-y-1">
          {NAV.map(({ key, label, Icon }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => {
                  onFilter(key);
                  onClose();
                }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon />
                <span className="flex-1 text-left">{label}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs tabular-nums ${
                    active ? "bg-accent text-white" : "bg-surface-2 text-muted"
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Progress */}
        <div className="gradient-accent relative mt-auto overflow-hidden rounded-2xl p-4 text-white">
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
          <p className="text-sm font-medium opacity-90">Your progress</p>
          <p className="mt-1 text-2xl font-semibold">{progress}%</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs opacity-80">
            {counts.DONE} of {counts.ALL} tasks completed
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1">
          <button
            onClick={() => {
              setSigningOut(true);
              signOut({ callbackUrl: "/login" });
            }}
            disabled={signingOut}
            className="btn-ghost flex-1 justify-start hover:bg-danger-soft hover:text-danger"
          >
            {signingOut ? <Spinner /> : <LogoutIcon />}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
