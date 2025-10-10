"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { motion } from "framer-motion"

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <BookOpen className="w-6 h-6 text-violet-400" />
          <span className="font-bold text-xl text-slate-50">NoteShare</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-slate-300 hover:bg-slate-800 hover:text-slate-50">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-violet-600 text-white hover:bg-violet-500 transition-colors">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  )
}