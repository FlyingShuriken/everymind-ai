import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { SkipNav } from "@/components/layout/skip-nav";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AxeDev } from "@/components/layout/axe-dev";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SkipNav />
          <Header />
          <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-8rem)]">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
          <Toaster />
          {process.env.NODE_ENV !== 'production' && <AxeDev />}
        </body>
      </html>
    </ClerkProvider>
  );
}
