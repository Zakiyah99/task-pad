import { auth } from "./auth";

export function jsonError(message: string, status: number, errors?: Record<string, string>) {
  return Response.json({ error: message, ...(errors && { errors }) }, { status });
}

/** Returns the signed-in user's id, or null. */
export async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);
