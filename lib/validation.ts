// Shared between the API routes and the client forms.

export const STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * `dueDate` is a "YYYY-MM-DD" string, or "" for no due date.
 * `imagePublicId` is a Cloudinary public id from /api/upload, or "" for no image.
 */
export type TaskInput = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  imagePublicId: string;
};
export type TaskErrors = Partial<Record<keyof TaskInput, string>>;

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates a task payload. With `partial`, missing fields are allowed (for updates).
 * Returns the cleaned data or a map of field errors.
 */
export function validateTask(
  body: unknown,
  partial = false,
): { data: Partial<TaskInput>; errors: TaskErrors | null } {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: TaskErrors = {};
  const data: Partial<TaskInput> = {};

  if (input.title !== undefined || !partial) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title) errors.title = "Title is required";
    else if (title.length < 3) errors.title = "Title must be at least 3 characters";
    else if (title.length > TITLE_MAX) errors.title = `Title must be under ${TITLE_MAX} characters`;
    else data.title = title;
  }

  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== "string") errors.description = "Description must be text";
    else if (input.description.trim().length > DESCRIPTION_MAX)
      errors.description = `Description must be under ${DESCRIPTION_MAX} characters`;
    else data.description = input.description.trim();
  }

  if (input.status !== undefined) {
    if (!isStatus(input.status)) errors.status = "Invalid status";
    else data.status = input.status;
  }

  if (input.priority !== undefined) {
    if (!isPriority(input.priority)) errors.priority = "Invalid priority";
    else data.priority = input.priority;
  }

  if (input.dueDate !== undefined) {
    const due = input.dueDate ?? "";
    if (typeof due !== "string" || (due && (!DATE_RE.test(due) || isNaN(Date.parse(due)))))
      errors.dueDate = "Invalid date";
    else data.dueDate = due;
  }

  if (input.imagePublicId !== undefined) {
    const id = input.imagePublicId ?? "";
    if (typeof id !== "string" || id.length > 255) errors.imagePublicId = "Invalid image";
    else data.imagePublicId = id;
  }

  return { data, errors: Object.keys(errors).length ? errors : null };
}

/** "YYYY-MM-DD" → Date at UTC midnight, "" → null. */
export const toDueDate = (value: string) => (value ? new Date(`${value}T00:00:00.000Z`) : null);
