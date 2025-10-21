"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, Users, Zap, CheckCircle, Rocket, PenTool, Database } from "lucide-react"
import { motion, Variants } from "framer-motion"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.17, 0.55, 0.55, 1] } }, // Custom bezier ease
}
const NoteCard = ({ title, date, color, isPlaceholder }: { title: string, date: string, color: string, isPlaceholder?: boolean }) => (
  <div className={`p-4 rounded-lg flex justify-between items-center ${color} ${isPlaceholder ? 'text-slate-500' : 'text-slate-50 shadow-md'}`}>
    <p className={`font-medium ${isPlaceholder ? 'italic' : ''}`}>{title}</p>
    {!isPlaceholder && <span className="text-xs opacity-70">{date}</span>}
  </div>
)

export function LandingPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 antialiased">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
    </div>
  )
}


function Navbar() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/70"
    >
      <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center text-2xl font-bold text-slate-50">
          <span className="text-violet-500 mr-1">Note</span>
          <span className="text-cyan-400">Share</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {['Features', 'Docs', 'Blog'].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-slate-300 font-medium hover:text-cyan-400 transition-colors duration-200">
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-slate-300 font-medium hover:text-violet-400 transition-colors duration-200 hidden sm:block">
            Login
          </Link>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/signup" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full text-slate-950 bg-violet-500 hover:bg-violet-400 transition-all duration-300 shadow-lg shadow-violet-500/30">
              Get Started
              <Rocket className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}


function HeroSection() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-900/30 rounded-full blur-[200px] z-0 opacity-70" />

      <div className="container mx-auto max-w-7xl px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-12">

        <div className="text-left">
          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tighter text-slate-50"
          >
            Share Your Notes,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-slate-200">
              Anytime, Anywhere
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-6 text-xl text-slate-400 max-w-md"
          >
            Create, view, and organize notes easily. It's fast, free, and ready for your first idea.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 100 }}
            className="mt-10"
          >
            <Link href="/sign-up" className="inline-flex items-center justify-center px-8 py-3 text-lg font-bold rounded-full text-slate-900 bg-violet-500 hover:bg-violet-400 transition-all duration-300 shadow-xl shadow-violet-500/40 transform hover:scale-[1.03]">
              Get Started
              <Rocket className="ml-3 w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, rotateY: -30, x: 50 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="mt-12 md:mt-0 perspective-1000"
        >
          <div
            className="w-full h-auto min-h-[450px] bg-slate-800/70 border border-slate-700/50 rounded-2xl shadow-3xl shadow-violet-900/50 relative overflow-hidden transform rotate-y-3 z-20" // 3D effekt
            style={{ transform: 'rotateY(-8deg) rotateX(4deg) scale(1.05)' }}
          >
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                <h4 className="text-lg font-semibold text-cyan-400">Project Alpha Notes</h4>
                <Users className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-grow space-y-4 pt-4">
                <NoteCard title="✨ Initial Idea Brainstorm" date="Oct 20, 2025" color="bg-violet-600" />
                <NoteCard title="✅ CRUD Implementation Steps" date="Oct 18, 2025" color="bg-cyan-600" />
                <NoteCard title="📚 Tailwind CSS Class Cheatsheet" date="Oct 15, 2025" color="bg-slate-600" />
                <NoteCard title="➕ Add New Note..." date="" color="bg-slate-700/50 border border-dashed border-slate-600" isPlaceholder={true} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}




const featuresData = [
  { icon: PenTool, title: "Clean Interface", description: "A distraction-free editor designed for focused writing and quick editing." },
  { icon: Share2, title: "Simple Sharing", description: "Share your notes with a direct link for easy access and viewing." },
  { icon: Users, title: "Quick Access", description: "Find, view, and organize your notes efficiently across all devices." },
  { icon: Database, title: "Data Persistence", description: "Your notes are saved instantly and securely, ensuring zero data loss." },
  { icon: CheckCircle, title: "Easy Organization", description: "Keep track of your thoughts with simple folder and tag structures." },
  { icon: Zap, title: "Fast Loading", description: "Experience quick performance built on modern infrastructure." },
]

function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-slate-950">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-extrabold text-slate-50">
            Essential <span className="text-violet-500">Tools</span> for Getting Started
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            The core features you need to start creating and sharing your ideas today.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {featuresData.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="relative bg-slate-900 border border-slate-800 hover:border-violet-600 transition-all duration-300 shadow-xl hover:shadow-violet-800/20 rounded-2xl overflow-hidden group h-full transform hover:-translate-y-1">
                  {/* Violet glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-violet-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <CardHeader className="relative z-10 p-6">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-5 border-2 border-cyan-500/30 transform group-hover:rotate-6 transition-transform duration-500">
                      <Icon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <CardTitle className="text-2xl font-semibold text-slate-50 group-hover:text-cyan-300 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 p-6 pt-0">
                    <p className="text-slate-400 text-base leading-relaxed">
                      {feature.description}
                    </p>
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



function CtaSection() {
  return (
    <section className="py-24 px-6 bg-slate-950 border-t border-slate-900">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 50 }}
          className="p-12 md:p-16 rounded-3xl text-center bg-gradient-to-br from-violet-900/50 to-slate-900/50 border-2 border-violet-700/50 shadow-2xl shadow-violet-900/30"
        >
          <h3 className="text-4xl md:text-5xl font-extrabold text-slate-50 leading-snug">
            Ready to <span className="text-cyan-400">Start Creating</span>?
          </h3>
          <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
            Join the first wave of users and start your journey today. Access is 100% free.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10"
          >
            <Link href="#" className="inline-flex items-center justify-center px-10 py-4 text-xl font-bold rounded-full text-slate-900 bg-violet-500 hover:bg-violet-400 transition-all duration-300 shadow-2xl shadow-violet-500/40 transform hover:scale-[1.05]">
              Sign Up Today
              <Rocket className="ml-3 w-6 h-6" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}