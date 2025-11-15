"use client"

import { Check, X, Eye, Mic, Brain, Shield, Map, Image as ImageIcon, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

const competitors = [
  {
    name: "Google Maps",
    features: {
      voiceNavigation: true,
      streetView: true,
      accessibility: false,
      aiAnalysis: false,
      routeAnalysis: false,
      visualExploration: false,
    }
  },
  {
    name: "Apple Maps",
    features: {
      voiceNavigation: true,
      streetView: false,
      accessibility: false,
      aiAnalysis: false,
      routeAnalysis: false,
      visualExploration: false,
    }
  },
  {
    name: "Waze",
    features: {
      voiceNavigation: true,
      streetView: false,
      accessibility: false,
      aiAnalysis: false,
      routeAnalysis: false,
      visualExploration: false,
    }
  },
  {
    name: "Urban Buzz AI",
    features: {
      voiceNavigation: true,
      streetView: true,
      accessibility: true,
      aiAnalysis: true,
      routeAnalysis: true,
      visualExploration: true,
    },
    highlight: true
  }
]

const featureLabels = {
  voiceNavigation: "Voice Navigation",
  streetView: "Street View",
  accessibility: "Accessibility Analysis",
  aiAnalysis: "AI Image Analysis",
  routeAnalysis: "Route Safety Analysis",
  visualExploration: "Visual Route Exploration"
}

export function CompetitiveAdvantageSection() {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
              Why Urban Buzz AI Stands Out
            </h2>
            <p className="text-xl text-muted-foreground">
              We don't just show you the route—we analyze it, visualize it, and make it accessible for everyone
            </p>
          </motion.div>
        </div>

        {/* Comparison Table */}
        <div className="mx-auto max-w-6xl mb-16">
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Feature</th>
                  {competitors.map((comp, idx) => (
                    <th
                      key={idx}
                      className={`px-6 py-4 text-center text-sm font-semibold ${
                        comp.highlight
                          ? 'bg-primary/10 text-primary border-l-2 border-r-2 border-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(featureLabels).map(([key, label], idx) => (
                  <tr
                    key={key}
                    className={`border-b border-border/50 ${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{label}</td>
                    {competitors.map((comp, compIdx) => (
                      <td
                        key={compIdx}
                        className={`px-6 py-4 text-center ${
                          comp.highlight ? 'bg-primary/5' : ''
                        }`}
                      >
                        {comp.features[key as keyof typeof comp.features] ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unique Features Grid */}
        <div className="mx-auto max-w-6xl">
          <h3 className="text-2xl font-bold text-center mb-12 text-foreground">
            What Makes Us Different
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">AI-Powered Route Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Get detailed analysis of accessibility, safety, curves, and hazards along your entire route—not just directions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">Visual Route Exploration</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                See Street View images from every pit stop along your route. Click any image for AI analysis of accessibility and safety.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">Conversational AI Assistant</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Ask questions naturally: "Show me images", "What about accessibility?", "Is it safe?"—get instant, detailed answers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">Comprehensive Safety Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Every route is analyzed for safety factors: visibility, lighting, traffic patterns, hazards, and pedestrian safety.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">On-Demand Image Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Click any Street View image to get instant AI analysis of curves, accessibility features, safety concerns, and infrastructure.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">Pit Stop Intelligence</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                We analyze multiple strategic points along your route, not just the start and end. Get insights for the entire journey.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Key Differentiators */}
        <div className="mt-16 mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
          >
            <h3 className="text-2xl font-bold text-center mb-6 text-foreground">
              The Urban Buzz AI Difference
            </h3>
            <div className="space-y-4 text-center">
              <p className="text-lg text-muted-foreground">
                <strong className="text-foreground">Other platforms</strong> show you where to go.
              </p>
              <p className="text-lg text-muted-foreground">
                <strong className="text-foreground">Urban Buzz AI</strong> shows you what you'll encounter, analyzes it for safety and accessibility, and helps you make informed decisions about your route.
              </p>
              <p className="text-lg text-muted-foreground">
                We don't just navigate—we <strong className="text-foreground">understand</strong> your route and make it accessible for everyone.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

