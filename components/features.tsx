import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Share2, Users } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Create Notes",
    description: "Eslatmalarni oddiy va tez yarating.",
  },
  {
    icon: Share2,
    title: "Share Links",
    description: "Bir tugma bilan ulashing.",
  },
  {
    icon: Users,
    title: "Collaborate",
    description: "Jamoa bilan birgalikda yozing.",
  },
]

export function Features() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
