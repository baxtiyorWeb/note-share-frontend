import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { QueryProvider } from "@/lib/query-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "NoteShare - Share Your Notes, Anytime, Anywhere",
  description: "Create, share, and collaborate on notes easily with NoteShare.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <QueryProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </QueryProvider>
      </body>
    </html>
  );
}

