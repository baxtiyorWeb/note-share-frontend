import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { OneSignalClient } from "@/components/OneSignalClient"; // 🆕 qo‘shildi

export const metadata: Metadata = {
  title: "NoteShare - Eslatmalar va Kod",
  description: "Yozing, saqlang, eslatma oling – OneSignal bilan telefonga push!",
  generator: "v0.app",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async></script>
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <QueryProvider>
          <Suspense fallback={null}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <Toaster position="top-right" />
              <OneSignalClient /> {/* 🔥 Bu clientda ishlaydi */}
            </ThemeProvider>
          </Suspense>
          <Analytics />
        </QueryProvider>
      </body>
    </html>
  );
}
