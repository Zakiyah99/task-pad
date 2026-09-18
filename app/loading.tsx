import { Spinner } from "@/components/Icons";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-accent">
      <Spinner width={28} height={28} />
    </div>
  );
}
