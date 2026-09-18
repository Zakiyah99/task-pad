"use client";

import Image from "next/image";
import { useState } from "react";

export default function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initials =
    (name ?? "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?";

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full ring-2 ring-surface outline-2 outline-accent/40"
      style={{ width: size, height: size }}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={name ?? "Avatar"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="gradient-accent flex h-full w-full items-center justify-center text-sm font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}
