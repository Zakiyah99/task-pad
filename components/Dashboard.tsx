"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { STATUS_LABEL, type Status, type TaskErrors, type TaskInput } from "@/lib/validation";
import Sidebar, { type Filter, type SidebarUser } from "./Sidebar";
import TaskCard, { daysUntil, type Task } from "./TaskCard";
import TaskForm, { EMPTY_TASK } from "./TaskForm";
import Modal from "./Modal";
import { Toasts, useToasts } from "./Toast";
import { api } from "@/lib/client-api";
import { AlertIcon, CalendarIcon, MenuIcon, PlusIcon, SearchIcon, Spinner } from "./Icons";

type Sort = "newest" | "due" | "priority";

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

const SORTERS: Record<Sort, (a: Task, b: Task) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  // Tasks without a due date go last.
  due: (a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard({
  user,
  initialFilter = "ALL",
}: {
  user: SidebarUser;
  initialFilter?: Filter;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [viewing, setViewing] = useState<Task | null>(null);
  const { toasts, notify } = useToasts();
  const router = useRouter();

  /** Shows an error toast, or sends the user to /login if their session expired. */
  const fail = useCallback(
    (e: unknown) => {
      const err = e as Error & { status?: number; errors?: TaskErrors };
      if (err.status === 401) router.replace("/login");
      else notify(err.message, "error");
      return err.errors ?? {};
    },
    [router, notify],
  );

  const fetchTasks = useCallback(
    () =>
      api<Task[]>("/api/tasks")
        .then(setTasks)
        .catch((e) => {
          if ((e as { status?: number }).status === 401) router.replace("/login");
          setLoadError((e as Error).message);
        })
        .finally(() => setLoading(false)),
    [router],
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchTasks();
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: tasks.length, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    tasks.forEach((t) => c[t.status]++);
    return c;
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter(
        (t) =>
          (filter === "ALL" || t.status === filter) &&
          (!q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)),
      )
      .sort(SORTERS[sort]);
  }, [tasks, filter, query, sort]);

  const overdue = useMemo(
    () => tasks.filter((t) => t.status !== "DONE" && t.dueDate && daysUntil(t.dueDate) < 0).length,
    [tasks],
  );

  // --- mutations ---------------------------------------------------------

  async function createTask(data: TaskInput): Promise<TaskErrors | null> {
    try {
      const task = await api<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) });
      setTasks((t) => [task, ...t]);
      setCreating(false);
      notify("Task created");
      return null;
    } catch (e) {
      return fail(e);
    }
  }

  async function updateTask(data: TaskInput): Promise<TaskErrors | null> {
    if (!editing) return null;
    try {
      const task = await api<Task>(`/api/tasks/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setTasks((t) => t.map((x) => (x.id === task.id ? task : x)));
      setEditing(null);
      notify("Task updated");
      return null;
    } catch (e) {
      return fail(e);
    }
  }

  // Optimistic: update the UI immediately, roll back if the request fails.
  async function changeStatus(task: Task, status: Status) {
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status } : x)));
    try {
      await api(`/api/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      if (status === "DONE") notify("Nice work! Task completed 🎉");
    } catch (e) {
      setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: task.status } : x)));
      fail(e);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/api/tasks/${deleting.id}`, { method: "DELETE" });
      setTasks((t) => t.filter((x) => x.id !== deleting.id));
      notify("Task deleted");
      setDeleting(null);
    } catch (e) {
      fail(e);
    } finally {
      setDeleteBusy(false);
    }
  }

  // --- render ------------------------------------------------------------

  const firstName = user.name?.split(" ")[0] ?? "there";
  const heading = filter === "ALL" ? "All tasks" : STATUS_LABEL[filter];

  return (
    <div className="min-h-screen">
      <Sidebar
        user={user}
        filter={filter}
        counts={counts}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFilter={setFilter}
      />

      <main className="lg:pl-72">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
          {/* Header */}
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-ghost -ml-2 p-2 lg:hidden"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <div>
                <p className="text-sm text-muted" suppressHydrationWarning>
                  {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl" suppressHydrationWarning>
                  {greeting()}, {firstName} 👋
                </h1>
                {!loading && overdue > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-xs font-medium text-danger">
                    <CalendarIcon width={13} height={13} />
                    {overdue} overdue {overdue === 1 ? "task" : "tasks"}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setCreating(true)} className="btn-primary shrink-0 px-3 sm:px-4">
              <PlusIcon />
              <span className="hidden sm:inline">New task</span>
            </button>
          </header>

          {/* Stats */}
          <section className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {(["TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? "ALL" : s)}
                className={`cursor-pointer rounded-2xl border bg-surface p-3 text-left shadow-card transition hover:-translate-y-0.5 sm:p-5 ${
                  filter === s ? "border-accent ring-4 ring-accent/10" : "border-line"
                }`}
              >
                <p className="text-xs text-muted sm:text-sm">{STATUS_LABEL[s]}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
                  {loading ? <span className="skeleton inline-block h-7 w-8 rounded-md" /> : counts[s]}
                </p>
              </button>
            ))}
          </section>

          {/* Toolbar */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">
              {heading}
              <span className="ml-2 text-sm font-normal text-muted">{visible.length}</span>
            </h2>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="field w-auto cursor-pointer pr-8"
                aria-label="Sort tasks"
              >
                <option value="newest">Newest</option>
                <option value="due">Due date</option>
                <option value="priority">Priority</option>
              </select>
              <div className="relative flex-1 sm:w-64">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
                <input
                  className="field pl-10"
                  placeholder="Search tasks…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search tasks"
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="mt-4">
            {loading ? (
              <ul className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex gap-3.5 rounded-2xl border border-line bg-surface p-5">
                    <div className="skeleton h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-2.5">
                      <div className="skeleton h-4 w-2/5 rounded" />
                      <div className="skeleton h-3 w-4/5 rounded" />
                      <div className="skeleton h-5 w-20 rounded-full" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : loadError ? (
              <div className="flex flex-col items-center rounded-2xl border border-danger/30 bg-danger-soft px-6 py-12 text-center">
                <AlertIcon width={32} height={32} className="text-danger" />
                <p className="mt-3 font-medium">Couldn&apos;t load your tasks</p>
                <p className="mt-1 text-sm text-muted">{loadError}</p>
                <button onClick={retry} className="btn-primary mt-5">
                  Try again
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  {query ? <SearchIcon width={24} height={24} /> : <PlusIcon width={24} height={24} />}
                </div>
                <p className="mt-4 font-medium">{query ? "No matching tasks" : "Nothing here yet"}</p>
                <p className="mt-1 max-w-xs text-sm text-muted">
                  {query
                    ? `No tasks match “${query}”. Try another search.`
                    : "Create your first task and start getting things done."}
                </p>
                {!query && (
                  <button onClick={() => setCreating(true)} className="btn-primary mt-5">
                    <PlusIcon /> New task
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatus={changeStatus}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                    onView={setViewing}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Create */}
      <Modal open={creating} title="New task" onClose={() => setCreating(false)}>
        <TaskForm
          submitLabel="Create task"
          onSubmit={createTask}
          onCancel={() => setCreating(false)}
          initial={{ ...EMPTY_TASK, status: filter === "ALL" ? "TODO" : filter }}
        />
      </Modal>

      {/* Edit */}
      <Modal open={!!editing} title="Edit task" onClose={() => setEditing(null)}>
        {editing && (
          <TaskForm
            key={editing.id}
            submitLabel="Save changes"
            initial={{
              title: editing.title,
              description: editing.description ?? "",
              status: editing.status,
              priority: editing.priority,
              dueDate: editing.dueDate?.slice(0, 10) ?? "",
              imagePublicId: editing.imagePublicId ?? "",
            }}
            initialImageUrl={editing.imageUrl}
            onSubmit={updateTask}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete */}
      <Modal open={!!deleting} title="Delete task?" onClose={() => !deleteBusy && setDeleting(null)}>
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">“{deleting?.title}”</span> will be permanently deleted.
          This can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="btn-ghost">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={deleteBusy} className="btn-danger min-w-24">
            {deleteBusy && <Spinner width={16} height={16} />}
            {deleteBusy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>

      {/* Image viewer */}
      <Modal open={!!viewing} title={viewing?.title ?? ""} onClose={() => setViewing(null)}>
        {viewing?.imageUrl && (
          <div className="relative -mx-2 aspect-[4/3] overflow-hidden rounded-2xl bg-surface-2">
            <Image src={viewing.imageUrl} alt={viewing.title} fill sizes="(max-width: 640px) 100vw, 512px" className="object-contain" />
          </div>
        )}
      </Modal>

      <Toasts toasts={toasts} />
    </div>
  );
}
