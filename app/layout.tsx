import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AxeDev } from "@/components/layout/axe-dev";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EveryMind.ai",
  description:
    "AI-powered, accessibility-first educational platform for students with disabilities and diverse learning preferences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} font-[family-name:var(--font-inter)] antialiased`}>
          {children}
          <Toaster />
          {process.env.NODE_ENV !== "production" && <AxeDev />}
        </body>
      </html>
    </ClerkProvider>
  );
}
