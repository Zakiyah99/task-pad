import { prisma } from "@/lib/prisma";
import { getUserId, isObjectId, jsonError, readJson } from "@/lib/api";
import { toDueDate, validateTask } from "@/lib/validation";
import { deleteImage, imageUrl, ownsImage } from "@/lib/cloudinary";

type Ctx = { params: Promise<{ id: string }> };

/** Loads a task only if it belongs to the signed-in user. */
async function findOwnTask(ctx: Ctx) {
  const userId = await getUserId();
  if (!userId) return { error: jsonError("Unauthorized", 401) };

  const { id } = await ctx.params;
  if (!isObjectId(id)) return { error: jsonError("Task not found", 404) };

  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return { error: jsonError("Task not found", 404) };

  return { task, userId };
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { task, error } = await findOwnTask(ctx);
    return error ?? Response.json(task);
  } catch (error) {
    console.error("GET /api/tasks/[id]", error);
    return jsonError("Failed to load task", 500);
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { task, userId, error } = await findOwnTask(ctx);
    if (error) return error;

    const { data, errors } = validateTask(await readJson(request), true);
    if (errors) return jsonError("Validation failed", 400, errors);

    const { dueDate, description, imagePublicId, ...rest } = data;
    const image = imagePublicId === undefined ? undefined : imagePublicId || null;
    if (image && image !== task.imagePublicId && !ownsImage(image, userId))
      return jsonError("Validation failed", 400, { imagePublicId: "Invalid image" });

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...rest,
        ...(description !== undefined && { description: description || null }),
        ...(dueDate !== undefined && { dueDate: toDueDate(dueDate) }),
        ...(image !== undefined && { imagePublicId: image, imageUrl: image && imageUrl(image) }),
      },
    });
    // Image replaced or removed: clean up the old one.
    if (image !== undefined && image !== task.imagePublicId) await deleteImage(task.imagePublicId);
    return Response.json(updated);
  } catch (error) {
    console.error("PUT /api/tasks/[id]", error);
    return jsonError("Failed to update task", 500);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { task, error } = await findOwnTask(ctx);
    if (error) return error;

    await prisma.task.delete({ where: { id: task.id } });
    await deleteImage(task.imagePublicId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/tasks/[id]", error);
    return jsonError("Failed to delete task", 500);
  }
}
