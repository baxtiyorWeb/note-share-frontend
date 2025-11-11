"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

import { FileText, Plus, Share2, Globe, Settings } from "lucide-react"

const menuItems = [
  { icon: Globe, label: "Explore", href: "/dashboard/explore" },
  { icon: FileText, label: "Notes", href: "/dashboard" }, // Mobil uchun qisqa label
  { icon: Plus, label: "New", href: "/dashboard/new" }, // Mobil uchun qisqa label
  { icon: Share2, label: "Shared", href: "/dashboard/shared" }, // Mobil uchun qisqa label
  { icon: Settings, label: "Settings", href: "/dashboard/settings" }, // Sozlamalarni ham pastga qo'shamiz
];

export function BottomBar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[60px] border-t border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
      <nav className="h-full flex justify-around items-center max-w-lg mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 p-1 text-[10px] font-medium transition-colors relative h-full w-full",
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active-line" // framer-motion uchun yagona ID
                  className="absolute top-0  h-0.5 w-1/2 bg-violet-600 dark:bg-violet-400"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              {isActive ? <Icon className="w-5 h-5 mt-1 scale-150 transition-all duration-200" /> : <Icon className="w-5 h-5 mt-1 transition-all duration-200" />}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}