import { Button } from "@/components/ui/button"
import { Users, GraduationCap, Building2 } from 'lucide-react'

const solutions = [
  {
    icon: Users,
    title: "For Individual Users",
    subtitle: "B2C Solution",
    description: "Perfect for tourists, seniors, and anyone seeking safer, more accessible urban navigation. Get personalized routes that adapt to your specific needs and preferences.",
    benefits: [
      "Voice-powered navigation for hands-free guidance",
      "Find wheelchair-accessible routes and amenities",
      "Discover hidden shortcuts and local favorites",
      "Safe routes avoiding poorly lit areas"
    ],
    cta: "Start Free Trial"
  },
  {
    icon: GraduationCap,
    title: "For Universities & Students",
    subtitle: "Campus Navigation",
    description: "Help students navigate complex campuses with ease. From finding accessible building entrances to locating hidden study spots, make campus life simpler.",
    benefits: [
      "Campus-wide mapping of all buildings and facilities",
      "Find accessible entrances and elevators",
      "Locate study spaces, cafeterias, and amenities",
      "Integration with campus events and schedules"
    ],
    cta: "Schedule Demo"
  },
  {
    icon: Building2,
    title: "For Government & Cities",
    subtitle: "B2G Solution",
    description: "Enhance city services with AI-powered navigation infrastructure. Improve accessibility, tourism, and urban planning with real-time data insights.",
    benefits: [
      "City-wide accessibility mapping and insights",
      "Real-time crowd management and safety alerts",
      "Tourism enhancement and visitor guidance",
      "Data-driven urban planning insights"
    ],
    cta: "Contact Sales"
  }
]

export function SolutionsSection() {
  return (
    <section id="solutions" className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Solutions for Every Need
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're an individual, institution, or city government, Urban Buzz adapts to your navigation needs
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          {solutions.map((solution, index) => (
            <div 
              key={index}
              className="flex flex-col rounded-xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-6">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <solution.icon className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-accent mb-2">{solution.subtitle}</p>
                <h3 className="text-2xl font-bold text-card-foreground mb-3">{solution.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{solution.description}</p>
              </div>

              <div className="mb-6 flex-1">
                <ul className="space-y-3">
                  {solution.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-card-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {solution.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
