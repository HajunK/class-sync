import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "ClassSync — Shared class calendar & AI notes", template: "%s · ClassSync" },
  description:
    "A shared class calendar and AI note-merging platform that helps students keep track of quizzes, exams, and deadlines while building one complete set of class notes together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme attribute is set by a script before React loads, so React is told the mismatch is expected.
    <html lang="en" className={`${dmSans.variable} ${jakarta.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { borderRadius: 14 } }} />
      </body>
    </html>
  );
}
