import Link from "next/link"
import { BookOpen } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">NoteShare</span>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tighter">Xush Kelibsiz!</h1>
            <p className="text-muted-foreground">Davom etish uchun hisobingizga kiring</p>
          </div>
        </div>

        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz yo'qmi?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Ro'yxatdan o'tish
          </Link>
        </p>
      </div>
    </div>
  )
}