import { prisma } from "@/lib/prisma";
import { getUserId, jsonError, readJson } from "@/lib/api";
import { isStatus, toDueDate, validateTask } from "@/lib/validation";
import { imageUrl, ownsImage } from "@/lib/cloudinary";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError("Unauthorized", 401);

  const status = new URL(request.url).searchParams.get("status");

  try {
    const tasks = await prisma.task.findMany({
      where: { userId, ...(isStatus(status) && { status }) },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks", error);
    return jsonError("Failed to load tasks", 500);
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError("Unauthorized", 401);

  const { data, errors } = validateTask(await readJson(request));
  if (errors) return jsonError("Validation failed", 400, errors);

  const image = data.imagePublicId || null;
  if (image && !ownsImage(image, userId))
    return jsonError("Validation failed", 400, { imagePublicId: "Invalid image" });

  try {
    const task = await prisma.task.create({
      data: {
        title: data.title!,
        description: data.description || null,
        status: data.status ?? "TODO",
        priority: data.priority ?? "MEDIUM",
        dueDate: toDueDate(data.dueDate ?? ""),
        imagePublicId: image,
        imageUrl: image && imageUrl(image),
        userId,
      },
    });
    return Response.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks", error);
    return jsonError("Failed to create task", 500);
  }
}
