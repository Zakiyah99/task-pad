"use client";

import { useState, type FormEvent } from "react";
import {
  DESCRIPTION_MAX,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  TITLE_MAX,
  validateTask,
  type TaskErrors,
  type TaskInput,
} from "@/lib/validation";
import { Spinner } from "./Icons";
import ImageUpload, { type UploadedImage } from "./ImageUpload";

export const EMPTY_TASK: TaskInput = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  imagePublicId: "",
};

const PRIORITY_ACTIVE: Record<(typeof PRIORITIES)[number], string> = {
  LOW: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  MEDIUM: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  HIGH: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export default function TaskForm({
  initial = EMPTY_TASK,
  initialImageUrl,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: TaskInput;
  /** Preview URL for `initial.imagePublicId`. */
  initialImageUrl?: string | null;
  submitLabel: string;
  /** Resolves to server-side field errors, or null on success. */
  onSubmit: (data: TaskInput) => Promise<TaskErrors | null>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<TaskInput>(initial);
  const [errors, setErrors] = useState<TaskErrors>({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<UploadedImage | null>(
    initial.imagePublicId && initialImageUrl
      ? { publicId: initial.imagePublicId, url: initialImageUrl }
      : null,
  );

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched) setErrors(validateTask(next).errors ?? {});
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const { errors: clientErrors } = validateTask(values);
    if (clientErrors) return setErrors(clientErrors);

    setSaving(true);
    const serverErrors = await onSubmit(values);
    setSaving(false);

    if (serverErrors) setErrors(serverErrors);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          className="field"
          placeholder="e.g. Design the landing page"
          value={values.title}
          maxLength={TITLE_MAX + 20}
          onChange={(e) => set("title", e.target.value)}
          aria-invalid={!!errors.title}
          autoFocus
        />
        {errors.title && <p className="mt-1.5 text-xs text-danger">{errors.title}</p>}
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="description" className="text-sm font-medium">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <span
            className={`text-xs tabular-nums ${values.description.length > DESCRIPTION_MAX ? "text-danger" : "text-muted"}`}
          >
            {values.description.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <textarea
          id="description"
          rows={3}
          className="field resize-none"
          placeholder="Add a few details…"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className="mt-1.5 text-xs text-danger">{errors.description}</p>}
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Status</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {STATUSES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => set("status", s)}
              className={`cursor-pointer rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm ${
                values.status === s ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Priority</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => set("priority", p)}
                className={`cursor-pointer rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm ${
                  values.priority === p ? `${PRIORITY_ACTIVE[p]} shadow-card` : "text-muted hover:text-ink"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due date <span className="font-normal text-muted">(optional)</span>
            </label>
            {values.dueDate && (
              <button
                type="button"
                onClick={() => set("dueDate", "")}
                className="cursor-pointer text-xs text-muted hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
          <input
            id="dueDate"
            type="date"
            className="field py-2"
            value={values.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            aria-invalid={!!errors.dueDate}
          />
          {errors.dueDate && <p className="mt-1.5 text-xs text-danger">{errors.dueDate}</p>}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">
          Image <span className="font-normal text-muted">(optional)</span>
        </p>
        <ImageUpload
          value={image}
          onChange={(img) => {
            setImage(img);
            set("imagePublicId", img?.publicId ?? "");
          }}
          onUploadingChange={setUploading}
          error={errors.imagePublicId}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving || uploading} className="btn-primary min-w-28">
          {saving && <Spinner width={16} height={16} />}
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
