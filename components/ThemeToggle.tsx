"use client";

import { useSyncExternalStore } from "react";
import { THEME_COOKIE } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./Icons";

// The server renders <html class="dark"> from the cookie; this just flips the class.
const isDark = () => document.documentElement.classList.contains("dark");
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.cookie = `${THEME_COOKIE}=${dark ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((cb) => cb());
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => true);

  return (
    <button
      onClick={() => setTheme(!dark)}
      className={`btn-ghost p-2 ${className}`}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
