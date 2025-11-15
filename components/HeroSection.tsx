import { Button } from "@/components/ui/button"
import { Sparkles, Navigation, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Text content */}
          <div className="max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Urban Navigation</span>
            </div>
            
            <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Navigate Cities Like Never Before
            </h1>
            
            <p className="mb-10 text-pretty text-lg text-muted-foreground sm:text-xl leading-relaxed">
              The only navigation platform that analyzes your entire route with AI vision. See Street View images from every pit stop, get detailed accessibility and safety analysis, and ask questions naturally—all powered by advanced AI that understands what you'll encounter along the way.
            </p>

            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8" asChild>
                <Link href="/auth">Try Urban Buzz Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8">
                Watch Demo
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex flex-col items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Voice-First</h3>
                <p className="text-sm text-muted-foreground">Real-time audio directions, no screen needed</p>
              </div>
              
              <div className="flex flex-col items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Safe & Accessible</h3>
                <p className="text-sm text-muted-foreground">Routes optimized for safety and mobility needs</p>
              </div>
              
              <div className="flex flex-col items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">AI Agent Swarms</h3>
                <p className="text-sm text-muted-foreground">Intelligent explorers find hidden city features</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <Image
                src="/images/urban-buzz-logo.png"
                alt="Urban Buzz AI Logo"
                width={600}
                height={600}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
