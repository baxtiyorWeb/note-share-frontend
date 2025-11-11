"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { FileText, Plus, Share2, Globe, Settings } from "lucide-react"

const menuItems = [
  { icon: Globe, label: "Explore", href: "/dashboard/explore" },
  { icon: FileText, label: "Notes", href: "/dashboard" },
  { icon: Plus, label: "New", href: "/dashboard/new" },
  { icon: Share2, label: "Shared", href: "/dashboard/shared" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function BottomBar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[64px] border-t border-slate-200 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md lg:hidden shadow-[0_-3px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
      <nav className="h-full flex justify-around items-center max-w-lg mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
              )}
            >
              {/* 🔹 Icon scale animation */}
              <motion.div
                animate={{
                  scale: isActive ? 1.25 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 22,
                }}
              >
                <Icon className="w-6 h-6 mt-1" />
              </motion.div>

              <span className="mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
