"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, FileText, Plus, Share2, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMyProfile } from "@/hooks/use-profile"
import { logout } from "@/services/auth-service"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

const menuItems = [
  { icon: FileText, label: "My Notes", href: "/dashboard" },
  { icon: Plus, label: "New Note", href: "/dashboard/new" },
  { icon: Share2, label: "Shared with Me", href: "/dashboard/shared" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
}

const profileVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

const navVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useMyProfile()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    logout()
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
    router.push('/login')
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const displayName = user?.profile?.username || user?.email?.split('@')[0] || "User"
  const initials = getInitials(displayName)

  return (
    <motion.aside
      className="w-64 border-r-2 border-primary/10 bg-gradient-to-b from-background via-primary/5 to-accent/5 h-screen flex flex-col"
      variants={containerVariants}
      initial={false}
      animate="visible"
    >
      {/* Logo */}
      <motion.div
        className="p-6 border-b border-primary/10"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NoteShare
          </span>
        </Link>
      </motion.div>

      {/* Profile */}
      <motion.div
        className="p-6 border-b border-primary/10"
        variants={profileVariants}
      >
        {isLoading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 group">
            {/* Profile */}
            <motion.div
              className="px-3 border-b border-primary/10"
              variants={profileVariants}
            >
              {isLoading ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <Avatar className="ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
                      {user?.profile?.avatar ? (
                        <img
                          src={user.profile.avatar}
                          alt={displayName}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </motion.div>
                  <motion.div
                    className="flex-1 min-w-0 group-hover:opacity-80 transition-opacity"
                    whileHover={{ x: 2 }}
                  >
                    <p className="font-semibold truncate">{displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </motion.div>
                </div>
              )}
            </motion.div>

            <motion.div
              className="flex-1 min-w-0 group-hover:opacity-80 transition-opacity"
              whileHover={{ x: 2 }}
            >
              <p className="font-semibold truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <motion.nav
        className="flex-1 p-4 space-y-2"
        variants={navVariants}
      >
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <motion.div key={item.href} variants={itemVariants}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25"
                    : "hover:bg-primary/10 text-foreground hover:translate-x-1",
                )}
                style={{ originX: 0 }}
              >
                <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span>{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>

      {/* Logout */}
      <motion.div
        className="p-4 border-t border-primary/10"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.1 }}
      >
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 ease-in-out"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <span className="flex items-center justify-start">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Logging out...</span>
            </span>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </>
          )}
        </Button>
      </motion.div>
    </motion.aside>
  )
}