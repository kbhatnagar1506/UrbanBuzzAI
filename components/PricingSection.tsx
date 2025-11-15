"use client"

import * as React from "react"
import { CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type PlanLevel = "free" | "pro" | "enterprise"

interface PricingFeature {
  name: string
  included: PlanLevel | "all"
}

interface PricingPlan {
  name: string
  level: PlanLevel
  price: {
    monthly: number
    yearly: number
  }
  description: string
  popular?: boolean
}

const features: PricingFeature[] = [
  { name: "Voice-guided navigation", included: "free" },
  { name: "Up to 20 routes per month", included: "free" },
  { name: "Basic accessibility features", included: "free" },
  { name: "Email support", included: "free" },
  { name: "Unlimited routes", included: "pro" },
  { name: "Advanced accessibility mapping", included: "pro" },
  { name: "Custom search queries", included: "pro" },
  { name: "Offline maps (5 cities)", included: "pro" },
  { name: "Priority support", included: "pro" },
  { name: "Campus-wide deployment", included: "enterprise" },
  { name: "City-level analytics dashboard", included: "enterprise" },
  { name: "Custom AI agent training", included: "enterprise" },
  { name: "Dedicated account manager", included: "enterprise" },
  { name: "24/7 phone support", included: "enterprise" },
  { name: "Real-time updates", included: "all" },
  { name: "Safety route preferences", included: "all" },
]

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    level: "free",
    description: "Perfect for casual users exploring their city"
  },
  {
    name: "Pro",
    price: { monthly: 9, yearly: 90 },
    level: "pro",
    popular: true,
    description: "For daily commuters and frequent travelers"
  },
  {
    name: "Enterprise",
    price: { monthly: 0, yearly: 0 },
    level: "enterprise",
    description: "Custom solutions for universities and governments"
  },
]

function shouldShowCheck(included: PricingFeature["included"], level: PlanLevel): boolean {
  if (included === "all") return true
  if (included === "enterprise" && level === "enterprise") return true
  if (included === "pro" && (level === "pro" || level === "enterprise")) return true
  if (included === "free") return true
  return false
}

export function PricingSection() {
  const [isYearly, setIsYearly] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>("pro")

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your navigation needs. All plans include core AI features.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2 rounded-full text-base font-medium transition-all",
                !isYearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2 rounded-full text-base font-medium transition-all",
                isYearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Yearly
              <span className="ml-2 text-sm text-accent">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-8 rounded-xl text-left transition-all border-2 bg-card",
                selectedPlan === plan.level
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/50",
                plan.popular && "ring-2 ring-primary/20"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2 text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  {plan.level === "enterprise" ? (
                    <span className="text-3xl font-bold text-foreground">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-foreground">
                        ${isYearly ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-base text-muted-foreground">
                        /{isYearly ? "year" : "month"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setSelectedPlan(plan.level)}
                className={cn(
                  "w-full",
                  selectedPlan === plan.level
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                {plan.level === "enterprise" ? "Contact Sales" : plan.level === "free" ? "Get Started" : "Start Free Trial"}
              </Button>
            </div>
          ))}
        </div>

        {/* Features Table */}
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <div className="min-w-[768px]">
              {/* Table Header */}
              <div className="flex items-center p-6 bg-muted/50 border-b border-border">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">All Features</h3>
                </div>
                <div className="flex items-center gap-8">
                  {plans.map((plan) => (
                    <div key={plan.level} className="w-24 text-center text-base font-semibold text-foreground">
                      {plan.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Rows */}
              {features.map((feature, index) => (
                <div
                  key={feature.name}
                  className={cn(
                    "flex items-center p-6 transition-colors",
                    index % 2 === 0 ? "bg-background" : "bg-muted/20",
                  )}
                >
                  <div className="flex-1">
                    <span className="text-base text-foreground">{feature.name}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    {plans.map((plan) => (
                      <div key={plan.level} className="w-24 flex justify-center">
                        {shouldShowCheck(feature.included, plan.level) ? (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
