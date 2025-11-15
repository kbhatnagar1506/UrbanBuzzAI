import { Search, Volume2, Users, MapPin, Heart, Zap } from 'lucide-react'

const features = [
  {
    icon: Search,
    title: "AI Route Analysis",
    description: "Get comprehensive analysis of accessibility, safety, curves, and hazards along your entire route—not just turn-by-turn directions."
  },
  {
    icon: MapPin,
    title: "Visual Route Exploration",
    description: "See Street View images from every pit stop along your route. Click any image for instant AI-powered analysis of what you'll encounter."
  },
  {
    icon: Volume2,
    title: "Conversational Voice AI",
    description: "Ask naturally: 'Show me images', 'What about accessibility?', 'Is it safe?'—get detailed, intelligent responses about your route."
  },
  {
    icon: Heart,
    title: "Accessibility Intelligence",
    description: "Every route analyzed for wheelchair access, curb cuts, ramps, sidewalks, and pedestrian infrastructure. Know before you go."
  },
  {
    icon: Users,
    title: "Safety-First Analysis",
    description: "Comprehensive safety assessment: visibility, lighting, traffic patterns, hazards, and blind spots at every point along your route."
  },
  {
    icon: Zap,
    title: "On-Demand Insights",
    description: "Click any Street View image to get instant analysis of curves, infrastructure, hazards, and features—all powered by advanced AI vision."
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
            AI-powered route analysis, visual exploration, and conversational intelligence—features that no other navigation platform offers
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
