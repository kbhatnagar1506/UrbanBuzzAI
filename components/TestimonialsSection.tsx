"use client"
import { motion } from "framer-motion"
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Tourist in Barcelona",
    content: "Urban Buzz helped me navigate Barcelona's Gothic Quarter with confidence. The voice navigation was perfect when I didn't want to keep looking at my phone.",
    rating: 5,
    avatar: "/woman-tourist.jpg"
  },
  {
    name: "Dr. James Chen",
    role: "Accessibility Advocate",
    content: "Finally, a navigation app that understands accessibility needs! Finding wheelchair-accessible entrances and routes has never been easier.",
    rating: 5,
    avatar: "/asian-man-doctor.jpg"
  },
  {
    name: "Maria Rodriguez",
    role: "University Student",
    content: "Our campus is huge and confusing. Urban Buzz made it so easy to find buildings, accessible entrances, and even quiet study spots. Game changer!",
    rating: 5,
    avatar: "/latina-student.jpg"
  },
  {
    name: "Robert Thompson",
    role: "Senior Citizen",
    content: "I was nervous about using new technology, but Urban Buzz's voice guidance is so natural and helpful. I feel safe exploring the city again.",
    rating: 5,
    avatar: "/elderly-man-contemplative.png"
  },
  {
    name: "Lisa Park",
    role: "City Planner",
    content: "We partnered with Urban Buzz for our city's accessibility initiative. The data insights have been invaluable for urban planning.",
    rating: 5,
    avatar: "/asian-woman-professional.png"
  },
  {
    name: "Ahmed Hassan",
    role: "Daily Commuter",
    content: "The custom searches are amazing. I can find the safest route home late at night, and it even shows me well-lit paths. Brilliant!",
    rating: 5,
    avatar: "/middle-eastern-man.png"
  }
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground">
            Hear from people who navigate cities with confidence using Urban Buzz
          </p>
        </div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-card-foreground leading-relaxed mb-6 flex-1">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src={testimonial.avatar || "/placeholder.svg"} 
                  alt={testimonial.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
