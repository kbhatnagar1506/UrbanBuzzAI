import { Search, Volume2, Users, MapPin, Heart, Zap } from 'lucide-react'

const features = [
  {
    icon: Search,
    title: "Agent Swarm Exploration",
    description: "Multiple AI explorers fan out across city maps, hunting for hidden infrastructure—bus stops, safe staircases, accessible entrances, and more."
  },
  {
    icon: MapPin,
    title: "Custom Searches",
    description: "Ask for any feature not listed on standard maps. Wheelchair-accessible routes, public bathrooms, specific entrances—just ask."
  },
  {
    icon: Volume2,
    title: "Voice-First Navigation",
    description: "No need to squint at screens. Real-time audio directions perfect for visually-impaired users, elders, and hands-free navigation."
  },
  {
    icon: Heart,
    title: "Safety & Accessibility",
    description: "Routes consider safety, visibility, crowd levels, and accessibility, giving everyone confidence as they move."
  },
  {
    icon: Users,
    title: "Adaptive & Inclusive",
    description: "Adapts to individual needs, from mobility limitations to language preferences, ensuring navigation for everyone."
  },
  {
    icon: Zap,
    title: "Playful Design",
    description: "Bee-themed visuals and friendly tone turn frustrating wayfinding into a game-like adventure."
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Features That Make Navigation Simple
          </h2>
          <p className="text-lg text-muted-foreground">
            Urban Buzz uses AI agent swarms to explore what traditional maps miss
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
