"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { Menu } from "lucide-react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden border-b border-border bg-background/80 backdrop-blur-sm px-4 py-4 sticky top-0 z-10">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-0">{children}</main>
      </div>
    </div>
  )
}
