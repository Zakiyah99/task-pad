import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import { isStatus } from "@/lib/validation";

export default async function Home({ searchParams }: PageProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, email, image } = session.user;
  // ?filter=TODO etc. — used by the sidebar on the task details page
  const { filter } = await searchParams;
  return <Dashboard user={{ name, email, image }} initialFilter={isStatus(filter) ? filter : "ALL"} />;
}
