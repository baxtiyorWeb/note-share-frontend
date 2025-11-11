"use client"

import type React from "react"
import { useState } from "react"

import { Sidebar } from "@/components/dashboard/sidebar" // <-- Asl Sidebar import qilinadi
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { BottomBar } from "./mobile-sidebar"
import { OneSignalClient } from "../OneSignalClient"


export function DashboardLayout({ children }: { children: React.ReactNode }) {



  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-900">
      <Sidebar />

      <BottomBar />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="lg:hidden flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-30">
          <button
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <ThemeToggle />
        </header>


        <main className="flex-1 min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}