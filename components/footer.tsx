
import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-8 px-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-500" />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} NoteShare. All Rights Reserved.</p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">
            Terms of Service
          </Link>
          <Link href="/contact" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}