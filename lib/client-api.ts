/** Browser fetch wrapper: throws with the API's error message, status and field errors. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? "Something went wrong"), {
      status: res.status,
      errors: body.errors,
    });
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
