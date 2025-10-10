// src/components/dashboard/dashboard-layout.tsx

"use client"

import type React from "react"
import { useState } from "react"

import { Sidebar } from "@/components/dashboard/sidebar" // <-- Asl Sidebar import qilinadi
// import { MobileSidebar } from "@/components/dashboard/mobile-sidebar" // <-- Bu alohida fayl bo'lishi kerak
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// MobileSidebar'ni ham alohida faylga chiqargan ma'qul, hozircha shu yerda turishi mumkin
// Agar alohida faylda bo'lsa, uni import qilasiz
// import { MobileSidebar } from "./mobile-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-900">

      {/* 1. Desktop Sidebar to'g'ridan-to'g'ri chaqiriladi */}
      <Sidebar />

      {/* 2. MobileSidebar alohida chaqiriladi */}
      {/* <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} /> */}
      {/* Agar MobileSidebar kodi kerak bo'lsa, alohida so'rang, men uni ham to'g'ri variantini beraman */}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="lg:hidden flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <ThemeToggle />
        </header>
        <div className="hidden lg:block fixed top-6 right-8 z-50">
          <ThemeToggle />
        </div>

        <main className="flex-1 min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}