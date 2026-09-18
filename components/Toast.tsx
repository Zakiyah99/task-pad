"use client";

import { useCallback, useState } from "react";
import { AlertIcon, CheckCircleIcon } from "./Icons";

type Toast = { id: number; message: string; type: "success" | "error" };

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return { toasts, notify };
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex animate-slide-up items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium shadow-card"
        >
          {t.type === "success" ? (
            <CheckCircleIcon className="text-emerald-500" />
          ) : (
            <AlertIcon className="text-danger" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
