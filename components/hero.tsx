import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Share Your Notes, Anytime, Anywhere
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl">
              Create, share, and collaborate on notes easily with NoteShare.
            </p>
            <div>
              <Button size="lg" className="gap-2" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <img
                src="/collaborative-note-taking-illustration-with-people.jpg"
                alt="Note sharing illustration"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
