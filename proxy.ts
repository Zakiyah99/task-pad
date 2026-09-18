import { NextResponse, type NextRequest } from "next/server";



// "__Secure-" prefix is used when NEXTAUTH_URL is https (production).
const SESSION_COOKIES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

// Reachable without signing in.
const PUBLIC_PATHS = ["/login", "/api/auth"];

const isPublic = (path: string) => PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Send them to login, then back to where they were going.
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
