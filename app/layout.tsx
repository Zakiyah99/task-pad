import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskPad — Simple task manager",
  description: "Organize your work, one task at a time.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Dark by default; light only if the user picked it (see ThemeToggle).
  const dark = (await cookies()).get(THEME_COOKIE)?.value !== "light";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${dark ? "dark" : ""}`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
