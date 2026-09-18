"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import {
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  type Status,
  type TaskErrors,
  type TaskInput,
} from "@/lib/validation";
import Sidebar, { type Filter, type SidebarUser } from "./Sidebar";
import { PRIORITY_STYLE, STATUS_STYLE, dueInfo, timeAgo, type Task } from "./TaskCard";
import TaskForm from "./TaskForm";
import Modal from "./Modal";
import { Toasts, useToasts } from "./Toast";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, EditIcon, FlagIcon, MenuIcon, Spinner, TrashIcon } from "./Icons";

const fullDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function TaskDetail({
  user,
  initialTask,
  initialCounts,
}: {
  user: SidebarUser;
  initialTask: Task;
  initialCounts: Record<Filter, number>;
}) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [counts, setCounts] = useState(initialCounts);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const { toasts, notify } = useToasts();

  const fail = useCallback(
    (e: unknown) => {
      const err = e as Error & { status?: number; errors?: TaskErrors };
      if (err.status === 401) router.replace("/login");
      else notify(err.message, "error");
      return err.errors ?? {};
    },
    [router, notify],
  );

  /** Keeps the sidebar counts in sync when this task's status changes. */
  function applyUpdate(updated: Task) {
    if (updated.status !== task.status)
      setCounts((c) => ({ ...c, [task.status]: c[task.status] - 1, [updated.status]: c[updated.status] + 1 }));
    setTask(updated);
  }

  async function changeStatus(status: Status) {
    if (status === task.status) return;
    setStatusBusy(true);
    try {
      applyUpdate(await api<Task>(`/api/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ status }) }));
      notify(status === "DONE" ? "Nice work! Task completed 🎉" : `Moved to ${STATUS_LABEL[status]}`);
    } catch (e) {
      fail(e);
    } finally {
      setStatusBusy(false);
    }
  }

  async function updateTask(data: TaskInput): Promise<TaskErrors | null> {
    try {
      applyUpdate(await api<Task>(`/api/tasks/${task.id}`, { method: "PUT", body: JSON.stringify(data) }));
      setEditing(false);
      notify("Task updated");
      router.refresh(); // refresh the page title
      return null;
    } catch (e) {
      return fail(e);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await api(`/api/tasks/${task.id}`, { method: "DELETE" });
      router.replace("/");
    } catch (e) {
      fail(e);
      setDeleteBusy(false);
    }
  }

  const done = task.status === "DONE";
  const due = task.dueDate ? dueInfo(task.dueDate, done) : null;

  return (
    <div className="min-h-screen">
      <Sidebar
        user={user}
        filter={null}
        counts={counts}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFilter={(f) => router.push(f === "ALL" ? "/" : `/?filter=${f}`)}
      />

      <main className="lg:pl-72">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button onClick={() => setSidebarOpen(true)} className="btn-ghost -ml-2 p-2 lg:hidden" aria-label="Open menu">
                <MenuIcon />
              </button>
              <Link href="/" className="btn-ghost -ml-2 px-3 py-2">
                <ArrowLeftIcon width={16} height={16} />
                Back to tasks
              </Link>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="btn border border-line bg-surface text-ink hover:bg-surface-2">
                <EditIcon width={16} height={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setDeleting(true)}
                className="btn border border-line bg-surface text-danger hover:border-danger/40 hover:bg-danger-soft"
                aria-label="Delete task"
              >
                <TrashIcon width={16} height={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="mt-6 animate-slide-up">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${STATUS_STYLE[task.status].badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[task.status].dot}`} />
                {STATUS_LABEL[task.status]}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-medium ${PRIORITY_STYLE[task.priority]}`}>
                <FlagIcon width={12} height={12} />
                {PRIORITY_LABEL[task.priority]} priority
              </span>
              {due && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${due.style}`}>
                  <CalendarIcon width={12} height={12} />
                  {due.label}
                </span>
              )}
            </div>
            <h1
              className={`mt-3 text-2xl font-semibold tracking-tight break-words sm:text-3xl ${
                done ? "text-muted line-through decoration-muted/40" : ""
              }`}
            >
              {task.title}
            </h1>
            <p className="mt-2 text-sm text-muted" suppressHydrationWarning>
              Created {timeAgo(task.createdAt)}
              {task.updatedAt !== task.createdAt && <> · Updated {timeAgo(task.updatedAt)}</>}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Content */}
            <div className="min-w-0 space-y-6">
              {task.imageUrl && (
                <button
                  onClick={() => setImageOpen(true)}
                  className="relative block aspect-video w-full cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card"
                  aria-label="View full image"
                >
                  <Image
                    src={task.imageUrl}
                    alt={task.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-cover transition duration-300 hover:scale-[1.02]"
                  />
                </button>
              )}

              <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
                <h2 className="text-sm font-semibold text-muted">Description</h2>
                {task.description ? (
                  <p className="mt-3 leading-relaxed break-words whitespace-pre-line">{task.description}</p>
                ) : (
                  <p className="mt-3 text-sm text-muted italic">
                    No description.{" "}
                    <button onClick={() => setEditing(true)} className="cursor-pointer text-accent not-italic hover:underline">
                      Add one
                    </button>
                  </p>
                )}
              </section>
            </div>

            {/* Details panel */}
            <aside className="space-y-4">
              <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <h2 className="mb-3 flex items-center justify-between text-sm font-semibold text-muted">
                  Status
                  {statusBusy && <Spinner width={14} height={14} className="text-accent" />}
                </h2>
                <div className="grid gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      disabled={statusBusy}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-wait ${
                        task.status === s ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[s].dot}`} />
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-surface p-5 text-sm shadow-card">
                <h2 className="mb-3 font-semibold text-muted">Details</h2>
                <dl className="space-y-3">
                  <Row icon={<FlagIcon width={15} height={15} />} label="Priority">
                    <span className={`font-medium ${PRIORITY_STYLE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                  </Row>
                  <Row icon={<CalendarIcon width={15} height={15} />} label="Due date">
                    {task.dueDate ? (
                      new Date(task.dueDate.slice(0, 10) + "T00:00").toLocaleDateString(undefined, { dateStyle: "medium" })
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </Row>
                  <Row icon={<ClockIcon width={15} height={15} />} label="Created">
                    <span suppressHydrationWarning>{fullDate(task.createdAt)}</span>
                  </Row>
                  <Row icon={<EditIcon width={15} height={15} />} label="Updated">
                    <span suppressHydrationWarning>{fullDate(task.updatedAt)}</span>
                  </Row>
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <Modal open={editing} title="Edit task" onClose={() => setEditing(false)}>
        {editing && (
          <TaskForm
            submitLabel="Save changes"
            initial={{
              title: task.title,
              description: task.description ?? "",
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate?.slice(0, 10) ?? "",
              imagePublicId: task.imagePublicId ?? "",
            }}
            initialImageUrl={task.imageUrl}
            onSubmit={updateTask}
            onCancel={() => setEditing(false)}
          />
        )}
      </Modal>

      <Modal open={deleting} title="Delete task?" onClose={() => !deleteBusy && setDeleting(false)}>
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">“{task.title}”</span> will be permanently deleted. This can&apos;t be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setDeleting(false)} disabled={deleteBusy} className="btn-ghost">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={deleteBusy} className="btn-danger min-w-24">
            {deleteBusy && <Spinner width={16} height={16} />}
            {deleteBusy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>

      <Modal open={imageOpen} title={task.title} onClose={() => setImageOpen(false)}>
        {task.imageUrl && (
          <div className="relative -mx-2 aspect-[4/3] overflow-hidden rounded-2xl bg-surface-2">
            <Image src={task.imageUrl} alt={task.title} fill sizes="(max-width: 640px) 100vw, 512px" className="object-contain" />
          </div>
        )}
      </Modal>

      <Toasts toasts={toasts} />
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted">
        {icon}
        {label}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
