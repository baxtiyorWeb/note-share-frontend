"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen, FileText, Plus, Share2, Settings, LogOut,
  Loader2, Globe, Bookmark, Video // YANGI: Video icon Reels uchun
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMyProfile } from "@/hooks/use-profile"
import { logout } from "@/services/auth-service"
import { useState } from "react"
import { motion } from "framer-motion"
import { ThemeToggle } from "../theme-toggle"

const menuItems = [
  { icon: Globe, label: "Explore", href: "/dashboard/explore" },
  // 🔥 YANGI ELEMENT QO'SHILDI
  { icon: Video, label: "Reels", href: "/dashboard/reels" },
  { icon: FileText, label: "My Notes", href: "/dashboard" },
  { icon: Plus, label: "New Note", href: "/dashboard/new" },
  { icon: Share2, label: "Shared with Me", href: "/dashboard/shared" },
  { icon: Bookmark, label: "Saved Notes", href: "/dashboard/saved" },
];

const settingsMenuItem = { icon: Settings, label: "Settings", href: "/dashboard/settings" };

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useMyProfile()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    logout()
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push('/login')
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    if (email) return email.substring(0, 2).toUpperCase()
    return "U"
  }

  const displayName = user?.profile?.username || user?.email?.split('@')[0] || "User"
  const initials = getInitials(user?.profile?.username, user?.email)

  return (
    <aside className="hidden lg:flex w-64 h-screen flex-col fixed inset-y-0 z-50 bg-slate-100 border-r border-slate-200 dark:bg-slate-950 dark:border-slate-800">
      {/* Logo */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <BookOpen className="w-6 h-6 text-violet-500 dark:text-violet-400" />
          <span className="font-bold text-lg text-slate-900 dark:text-slate-50">NoteShare</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/60 dark:bg-slate-800/50 animate-pulse">
            <div className="w-10 h-10 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/60 dark:bg-slate-800/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profile?.avatar} alt={displayName} />
              <AvatarFallback className="bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative group",
                isActive
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 top-2 bottom-2 w-1 bg-violet-500 dark:bg-violet-400 rounded-r-full"
                />
              )}
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {/* Hover effect */}
              {!isActive && (
                <div className="absolute inset-0 rounded-md bg-slate-200/50 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="flex justify-start items-center px-4 py-2">
        <ThemeToggle />
      </div>

      {/* Settings + Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {(() => {
          const Icon = settingsMenuItem.icon
          const isActive = pathname === settingsMenuItem.href
          return (
            <Link
              href={settingsMenuItem.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full relative group",
                isActive
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              {isActive && (
                <motion.div layoutId="active-pill" className="absolute left-0 top-2 bottom-2 w-1 bg-violet-500 dark:bg-violet-400 rounded-r-full" />
              )}
              <Icon className="w-5 h-5" />
              <span>{settingsMenuItem.label}</span>
              {!isActive && <div className="absolute inset-0 rounded-md bg-slate-200/50 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />}
            </Link>
          )
        })()}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-600 hover:bg-red-100 hover:text-red-700 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-colors px-3 py-2.5 h-auto text-sm font-medium"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Chiqilmoqda...</span>
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              <span>Chiqish</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}