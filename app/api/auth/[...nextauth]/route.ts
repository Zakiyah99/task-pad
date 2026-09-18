import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Handles /api/auth/signin, /api/auth/callback/google, /api/auth/signout, /api/auth/session, ...
// With Google, "register" and "login" are the same flow: the adapter creates the user on first sign-in.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
