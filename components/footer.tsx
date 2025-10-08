import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© NoteShare 2025</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
