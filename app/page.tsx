import { Footer } from "@/components/footer"
import { LandingPage } from "@/components/features"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingPage />
      <Footer />
    </div>
  )
}