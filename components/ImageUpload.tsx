"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation";
import { ImageIcon, Spinner, TrashIcon } from "./Icons";

export type UploadedImage = { publicId: string; url: string };

/** Picks an image, uploads it to Cloudinary via /api/upload, and reports the result. */
export default function ImageUpload({
  value,
  onChange,
  onUploadingChange,
  error: externalError,
}: {
  value: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  onUploadingChange: (uploading: boolean) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!IMAGE_TYPES.includes(file.type)) return setError("Only JPG, PNG, WebP or GIF images");
    if (file.size > MAX_IMAGE_BYTES) return setError("Image must be 5 MB or smaller");

    setUploading(true);
    onUploadingChange(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      onUploadingChange(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  const shownError = error ?? externalError;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />

      {value ? (
        <div className="group relative h-40 overflow-hidden rounded-xl border border-line bg-surface-2">
          <Image src={value.url} alt="Task image" fill sizes="512px" className="object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
              <Spinner width={24} height={24} />
            </div>
          )}
          <div className="absolute right-2 bottom-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/75"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={uploading}
              className="btn bg-black/60 p-1.5 text-white backdrop-blur hover:bg-danger"
              aria-label="Remove image"
            >
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition ${
            dragging
              ? "border-accent bg-accent-soft text-accent"
              : "border-line text-muted hover:border-accent/50 hover:bg-surface-2"
          }`}
        >
          {uploading ? <Spinner width={22} height={22} className="text-accent" /> : <ImageIcon width={22} height={22} />}
          <span className="font-medium text-ink">
            {uploading ? "Uploading…" : dragging ? "Drop to upload" : "Click or drag an image"}
          </span>
          {!uploading && <span className="text-xs">JPG, PNG, WebP or GIF · up to 5 MB</span>}
        </button>
      )}

      {shownError && <p className="mt-1.5 text-xs text-danger">{shownError}</p>}
    </div>
  );
}
