"use client"
import { motion } from "framer-motion"
import { Search, Map, CheckCircle, Navigation } from 'lucide-react'

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Tell Us What You Need",
    description: "Simply speak or type your destination and any special requirements—wheelchair access, quiet routes, specific entrances."
  },
  {
    icon: Map,
    step: "02",
    title: "AI Agents Explore",
    description: "Our swarm of intelligent agents fans out across digital maps, searching for the perfect route based on your needs."
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Get Personalized Routes",
    description: "Receive tailored navigation with real-time updates, safety considerations, and accessibility features highlighted."
  },
  {
    icon: Navigation,
    step: "04",
    title: "Navigate with Confidence",
    description: "Follow voice-guided directions with visual cues, knowing every step has been optimized for your journey."
  }
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            How Urban Buzz Works
          </h2>
          <p className="text-lg text-muted-foreground">
            AI-powered navigation in four simple steps
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex flex-col items-start">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="text-sm font-bold text-primary mb-2">{step.step}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-8" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
