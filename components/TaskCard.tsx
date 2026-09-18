"use client";

import Image from "next/image";
import Link from "next/link";
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status } from "@/lib/validation";
import { CalendarIcon, EditIcon, EyeIcon, FlagIcon, TrashIcon } from "./Icons";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const STATUS_STYLE: Record<Status, { badge: string; dot: string }> = {
  TODO: { badge: "bg-slate-500/10 text-slate-600 dark:text-slate-300", dot: "bg-slate-400" },
  IN_PROGRESS: { badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300", dot: "bg-amber-400" },
  DONE: { badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
};

export const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: "text-sky-600 dark:text-sky-300",
  MEDIUM: "text-amber-600 dark:text-amber-300",
  HIGH: "text-rose-600 dark:text-rose-300",
};

/** Whole days from today (local) to the due date; negative = overdue. */
export function daysUntil(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function dueInfo(iso: string, done: boolean) {
  const days = daysUntil(iso);
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (done) return { label: date, style: "bg-surface-2 text-muted" };
  if (days < 0)
    return { label: `Overdue · ${date}`, style: "bg-danger-soft text-danger font-medium" };
  if (days === 0) return { label: "Due today", style: "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium" };
  if (days === 1) return { label: "Due tomorrow", style: "bg-accent-soft text-accent" };
  return { label: `Due ${date}`, style: "bg-surface-2 text-muted" };
}

const NEXT: Record<Status, Status> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO" };

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TaskCard({
  task,
  onStatus,
  onEdit,
  onDelete,
  onView,
}: {
  task: Task;
  onStatus: (task: Task, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
}) {
  const done = task.status === "DONE";
  const style = STATUS_STYLE[task.status];
  const due = task.dueDate ? dueInfo(task.dueDate, done) : null;
  const overdue = !done && task.dueDate !== null && daysUntil(task.dueDate) < 0;

  return (
    <li className={`group flex animate-slide-up gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-accent/30 sm:p-5 ${
        overdue ? "border-l-4 border-l-danger" : task.priority === "HIGH" && !done ? "border-l-4 border-l-rose-400" : ""
      }`}>
      <button
        onClick={() => onStatus(task, done ? "TODO" : "DONE")}
        aria-label={done ? "Mark as to do" : "Mark as done"}
        className={`mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition ${
          done
            ? "border-transparent bg-emerald-500 text-white"
            : task.status === "IN_PROGRESS"
              ? "border-amber-400 hover:bg-amber-400/15"
              : "border-line hover:border-accent"
        }`}
      >
        {done && (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="m5 12 5 5L20 7" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <h3
          className={`font-medium break-words transition ${done ? "text-muted line-through decoration-muted/50" : ""}`}
        >
          <Link href={`/tasks/${task.id}`} className="decoration-accent/40 underline-offset-4 hover:text-accent hover:underline">
            {task.title}
          </Link>
        </h3>
        {task.description && (
          <p className="mt-1 text-sm break-words whitespace-pre-line text-muted line-clamp-3">
            {task.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onStatus(task, NEXT[task.status])}
            title="Click to change status"
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition hover:brightness-95 ${style.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {STATUS_LABEL[task.status]}
          </button>
          <span className={`inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-medium ${PRIORITY_STYLE[task.priority]}`}>
            <FlagIcon width={12} height={12} />
            {PRIORITY_LABEL[task.priority]}
          </span>
          {due && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${due.style}`}>
              <CalendarIcon width={12} height={12} />
              {due.label}
            </span>
          )}
          <span className="text-muted">{timeAgo(task.createdAt)}</span>
        </div>
      </div>

      {task.imageUrl && (
        <button
          onClick={() => onView(task)}
          aria-label="View image"
          className="relative h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-line bg-surface-2 transition hover:ring-4 hover:ring-accent/15 sm:h-20 sm:w-20"
        >
          <Image src={task.imageUrl} alt="" fill sizes="80px" className={`object-cover ${done ? "opacity-50 grayscale" : ""}`} />
        </button>
      )}

      <div className="flex shrink-0 flex-col gap-1 transition sm:flex-row sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <Link href={`/tasks/${task.id}`} className="btn-ghost p-2" aria-label="View details">
          <EyeIcon width={16} height={16} />
        </Link>
        <button onClick={() => onEdit(task)} className="btn-ghost p-2" aria-label="Edit task">
          <EditIcon width={16} height={16} />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="btn-ghost p-2 hover:bg-danger-soft hover:text-danger"
          aria-label="Delete task"
        >
          <TrashIcon width={16} height={16} />
        </button>
      </div>
    </li>
  );
}
