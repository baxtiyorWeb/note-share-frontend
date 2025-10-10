"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, Users, Zap } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: Zap,
    title: "Effortless Editor",
    description: "A simple and powerful editor to capture your thoughts without distraction.",
  },
  {
    icon: Share2,
    title: "Seamless Sharing",
    description: "Share your notes with anyone using a secure link, with just one click.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Work together with your team on the same note, at the same time.",
  },
]

export function Features() {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <section className="py-20 px-4 bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-slate-50 to-slate-400 bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="mt-4 text-slate-400">
            A powerful set of features designed for clarity and productivity.
          </p>
        </div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.2 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={cardVariants}>
                <Card className="bg-slate-800/50 border border-slate-700 hover:border-violet-500/50 transition-colors h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <CardTitle className="text-xl text-slate-50">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}