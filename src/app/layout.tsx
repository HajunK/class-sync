import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "ClassSync — Shared class calendar & AI notes", template: "%s · ClassSync" },
  description:
    "A shared class calendar and AI note-merging platform that helps students keep track of quizzes, exams, and deadlines while building one complete set of class notes together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { borderRadius: 14 } }} />
      </body>
    </html>
  );
}
