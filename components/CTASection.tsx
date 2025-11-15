import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Ready to Transform Urban Navigation?
          </h2>
          <p className="text-lg mb-10 text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of users discovering what maps can't show. Start your free trial today and experience navigation powered by AI agent swarms.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" className="h-12 px-8 bg-background text-foreground hover:bg-background/90">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 border-primary-foreground/20 hover:bg-primary-foreground/10 text-black text-black">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
