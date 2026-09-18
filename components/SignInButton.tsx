"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleIcon, Spinner } from "./Icons";

export default function SignInButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={() => {
        setLoading(true);
        signIn("google", { callbackUrl });
      }}
      disabled={loading}
      className="btn w-full border border-line bg-surface py-3 text-ink shadow-card hover:border-accent/40 hover:bg-surface-2"
    >
      {loading ? <Spinner /> : <GoogleIcon />}
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}
