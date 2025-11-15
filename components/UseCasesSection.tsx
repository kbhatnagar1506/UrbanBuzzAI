import { Plane, Accessibility, UsersIcon, Map } from 'lucide-react'

const useCases = [
  {
    icon: Plane,
    title: "Tourists Lost in New Cities",
    description: "Instantly locates underground bus stations, hidden entrances, or less obvious landmarks that traditional maps miss."
  },
  {
    icon: Accessibility,
    title: "Mobility-Impaired Users",
    description: "Finds barrier-free routes, ramps, and ensures stair-free options for every trip with complete accessibility support."
  },
  {
    icon: UsersIcon,
    title: "Seniors & Family Members",
    description: "Avoids unsafe locations and suggests the safest, most comfortable navigation paths for peace of mind."
  },
  {
    icon: Map,
    title: "Locals & Daily Commuters",
    description: "Discovers shortcuts, new amenities, or alternative routes for everyday efficiency and time savings."
  }
]

export function UseCasesSection() {
  return (
    <section className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Perfect for Every Urban Explorer
          </h2>
          <p className="text-lg text-muted-foreground">
            Urban Buzz makes city navigation safe, simple, and fun for everyone
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className="flex gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <useCase.icon className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">{useCase.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{useCase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
