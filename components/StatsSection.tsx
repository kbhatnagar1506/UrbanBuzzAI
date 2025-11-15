"use client"
import { motion } from "framer-motion"
import { Users, MapPin, Route, Heart } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: "50K+",
    label: "Active Users",
    description: "Trust Urban Buzz daily"
  },
  {
    icon: MapPin,
    value: "100+",
    label: "Cities Mapped",
    description: "Across 20 countries"
  },
  {
    icon: Route,
    value: "2M+",
    label: "Routes Optimized",
    description: "Every single day"
  },
  {
    icon: Heart,
    value: "98%",
    label: "Satisfaction Rate",
    description: "From our users"
  }
]

export function StatsSection() {
  return (
    <section className="py-24 sm:py-32 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Making Cities Accessible for Everyone
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of users who navigate with confidence using Urban Buzz AI
          </p>
        </div>

        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">{stat.value}</div>
              <div className="text-lg font-semibold text-foreground mb-1">{stat.label}</div>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
