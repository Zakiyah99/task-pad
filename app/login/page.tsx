import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignInButton from "@/components/SignInButton";
import ThemeToggle from "@/components/ThemeToggle";
import { CheckCircleIcon, LogoIcon } from "@/components/Icons";

/** Only same-site paths (blocks open redirects like "//evil.com" or "https://…"). */
const safePath = (value: unknown) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : "/";

const FEATURES = ["Create and organize tasks", "Track progress at a glance", "Works on any device"];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, callbackUrl } = await searchParams;
  const next = safePath(callbackUrl);

  const session = await auth();
  if (session?.user) redirect(next);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <ThemeToggle className="absolute top-4 right-4 z-10" />

      {/* Background glow */}
      <div className="pointer-events-none absolute top-[-20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[400px] w-[400px] rounded-full bg-accent-2/15 blur-[100px]" />

      <div className="relative w-full max-w-md animate-slide-up rounded-3xl border border-line bg-surface/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="gradient-accent mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-accent/30">
          <LogoIcon width={26} height={26} />
        </div>

        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome to TaskPad
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Sign in or create an account to get started.
        </p>

        {error && (
          <p className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error === "OAuthAccountNotLinked"
              ? "This email is already linked to another sign-in method."
              : "Sign in failed. Please try again."}
          </p>
        )}

        <div className="mt-8">
          <SignInButton callbackUrl={next} />
        </div>

        <ul className="mt-8 space-y-2.5 border-t border-line pt-6">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-muted">
              <CheckCircleIcon className="text-accent" width={16} height={16} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
