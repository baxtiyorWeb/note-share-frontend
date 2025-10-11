"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Kerakli hooklar va ikonkalarni shu faylga import qilamiz
import { useMyProfile } from "@/hooks/use-profile"
import { logout } from "@/services/auth-service"
import { BookOpen, FileText, Plus, Share2, Settings, LogOut, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// Menyular ro'yxati
const menuItems = [
  { icon: FileText, label: "My Notes", href: "/dashboard" },
  { icon: Plus, label: "New Note", href: "/dashboard/new" },
  { icon: Share2, label: "Shared with Me", href: "/dashboard/shared" },
];
const settingsMenuItem = { icon: Settings, label: "Settings", href: "/dashboard/settings" };


interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useMyProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/login');
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  const displayName = user?.profile?.username || user?.email?.split('@')[0] || "Foydalanuvchi";
  const initials = getInitials(user?.profile?.username, user?.email);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-64 border-r bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 z-50 lg:hidden flex flex-col"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
                <BookOpen className="w-6 h-6 text-violet-500 dark:text-violet-400" />
                <span className="font-bold text-lg text-slate-900 dark:text-slate-50">NoteShare</span>
              </Link>
              <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/60 dark:bg-slate-800/50 animate-pulse">
                  <div className="w-10 h-10 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" /><div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" /></div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/60 dark:bg-slate-800/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profile?.avatar} alt={displayName} />
                    <AvatarFallback className="bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                        : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    )}
                  >
                    {isActive && <motion.div layoutId="mobile-active-pill" className="absolute left-0 top-2 bottom-2 w-1 bg-violet-500 dark:bg-violet-400 rounded-r-full"></motion.div>}
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
              {(() => {
                const Icon = settingsMenuItem.icon;
                const isActive = pathname === settingsMenuItem.href;
                return (
                  <Link
                    href={settingsMenuItem.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full",
                      isActive
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                        : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    )}
                  >
                    {isActive && <motion.div layoutId="mobile-active-pill" className="absolute left-0 top-2 bottom-2 w-1 bg-violet-500 dark:bg-violet-400 rounded-r-full"></motion.div>}
                    <Icon className="w-5 h-5" />
                    <span>{settingsMenuItem.label}</span>
                  </Link>
                )
              })()}

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-slate-600 hover:bg-red-100 hover:text-red-700 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors px-3 py-2.5 h-auto text-sm font-medium"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Chiqilmoqda...</span></>
                ) : (
                  <><LogOut className="h-5 w-5" /><span>Chiqish</span></>
                )}
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}