"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, FileText, Plus, Share2, Settings, LogOut, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: FileText, label: "My Notes", href: "/dashboard" },
  { icon: Plus, label: "New Note", href: "/dashboard/new" },
  { icon: Share2, label: "Shared with Me", href: "/dashboard/shared" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />

      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-sidebar z-50 lg:hidden flex flex-col">
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <BookOpen className="w-6 h-6 text-sidebar-primary" />
            <span className="font-semibold text-lg">NoteShare</span>
          </Link>
          <button onClick={onClose} className="p-2 hover:bg-sidebar-accent rounded-md" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">John Doe</p>
              <p className="text-sm text-sidebar-foreground/60 truncate">john@example.com</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3" asChild>
            <Link href="/login" onClick={onClose}>
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Link>
          </Button>
        </div>
      </aside>
    </>
  )
}
