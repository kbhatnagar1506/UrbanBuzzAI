"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from 'lucide-react'

type FAQItem = {
  question: string
  answer: string
}

type FAQSectionProps = {
  title?: string
  faqs?: FAQItem[]
}

const defaultFAQs: FAQItem[] = [
  {
    question: "What is Urban Buzz AI and how does it work?",
    answer:
      "Urban Buzz AI is a voice-first navigation app that uses swarms of intelligent AI agents to explore city infrastructure beyond what standard maps show. Simply ask for what you need—like wheelchair-accessible routes, public restrooms, or safe paths—and our AI agents fan out across digital maps to find the best options for you.",
  },
  {
    question: "How does Urban Buzz protect my privacy and location data?",
    answer:
      "We take privacy seriously. All location data is encrypted end-to-end and processed in real-time—we don't store your movement history. You maintain complete control over what data is shared, and we never sell your information to third parties. Your navigation queries are anonymized and used only to improve route recommendations.",
  },
  {
    question: "Can Urban Buzz work offline?",
    answer:
      "Yes! Pro and Enterprise plans include offline map downloads for up to 5 cities. You can download maps before your trip and use core navigation features without an internet connection. Voice guidance and basic accessibility features work offline, though real-time updates require connectivity.",
  },
  {
    question: "What makes Urban Buzz different from Google Maps or Apple Maps?",
    answer:
      "While traditional maps focus on roads and basic POIs, Urban Buzz specializes in finding infrastructure they miss—accessible entrances, safe routes, hidden shortcuts, and amenities. Our AI agent swarms actively search for what you need rather than just showing what's already mapped. Plus, our voice-first design makes navigation hands-free and accessible.",
  },
  {
    question: "Is Urban Buzz suitable for people with disabilities?",
    answer:
      "Urban Buzz was designed with accessibility as a core principle. We map wheelchair-accessible routes, locate elevators and ramps, find quiet spaces for sensory needs, and provide detailed voice guidance for visually-impaired users. Our AI agents specifically search for accessibility features that standard maps often overlook.",
  },
  {
    question: "How can universities or cities partner with Urban Buzz?",
    answer:
      "We offer custom Enterprise solutions for universities and municipal governments. This includes campus-wide or city-wide deployment, custom AI agent training for your specific infrastructure, analytics dashboards for urban planning insights, and dedicated support. Contact our sales team to discuss your specific needs and see a demo tailored to your organization.",
  },
]

export const FAQSection = ({ title = "Frequently Asked Questions", faqs = defaultFAQs }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="w-full py-24 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Left Column - Title */}
          <div className="lg:col-span-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight sticky top-24">
              {title}
            </h2>
          </div>

          {/* Right Column - FAQ Items */}
          <div className="lg:col-span-8">
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between py-6 text-left group hover:opacity-70 transition-opacity duration-150"
                    aria-expanded={openIndex === index}
                  >
                    <span className="text-lg leading-7 text-foreground pr-8 font-medium">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{
                        rotate: openIndex === index ? 45 : 0,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="flex-shrink-0"
                    >
                      <Plus className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pr-12">
                          <p className="text-base leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
