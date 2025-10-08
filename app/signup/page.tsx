import { SignUpForm } from "@/components/auth/signup-form"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="font-semibold text-2xl">NoteShare</span>
            </Link>
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-muted-foreground">Get started with NoteShare today</p>
          </div>

          <SignUpForm />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
