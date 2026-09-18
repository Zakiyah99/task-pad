import Link from "next/link";
import { SearchIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <SearchIcon width={26} height={26} />
      </div>
      <h1 className="mt-4 text-xl font-semibold">Task not found</h1>
      <p className="mt-1 max-w-xs text-sm text-muted">
        It may have been deleted, or the link is wrong.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to tasks
      </Link>
    </div>
  );
}
