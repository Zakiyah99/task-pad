import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isObjectId } from "@/lib/api";
import TaskDetail from "@/components/TaskDetail";
import type { Filter } from "@/components/Sidebar";

/** The signed-in user's task, or null (missing, malformed id, or someone else's). */
async function getTask(id: string, userId: string) {
  if (!isObjectId(id)) return null;
  return prisma.task.findFirst({ where: { id, userId } });
}

export async function generateMetadata({ params }: PageProps<"/tasks/[id]">): Promise<Metadata> {
  const session = await auth();
  const task = session?.user && (await getTask((await params).id, session.user.id));
  return { title: task ? `${task.title} — TaskPad` : "Task not found — TaskPad" };
}

export default async function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [task, statuses] = await Promise.all([
    getTask(id, session.user.id),
    prisma.task.findMany({ where: { userId: session.user.id }, select: { status: true } }),
  ]);
  if (!task) notFound();

  const counts: Record<Filter, number> = { ALL: statuses.length, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  statuses.forEach((t) => counts[t.status]++);

  const { name, email, image } = session.user;
  return (
    <TaskDetail
      user={{ name, email, image }}
      initialCounts={counts}
      // Dates → ISO strings, the same shape the API returns
      initialTask={JSON.parse(JSON.stringify(task))}
    />
  );
}
