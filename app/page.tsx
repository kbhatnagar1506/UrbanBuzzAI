import { Navbar } from "@/components/Navbar"
import { HeroSection } from "@/components/HeroSection"
import { FeaturesSection } from "@/components/FeaturesSection"
import { HowItWorksSection } from "@/components/HowItWorksSection"
import { SolutionsSection } from "@/components/SolutionsSection"
import { StatsSection } from "@/components/StatsSection"
import { UseCasesSection } from "@/components/UseCasesSection"
import { TestimonialsSection } from "@/components/TestimonialsSection"
import { PricingSection } from "@/components/PricingSection"
import { FAQSection } from "@/components/FAQSection"
import { CTASection } from "@/components/CTASection"
import { Footer } from "@/components/Footer"

export default function Page() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SolutionsSection />
      <StatsSection />
      <UseCasesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer 
        companyName="Urban Buzz AI"
        tagline="AI-powered urban navigation that finds what maps can't"
        sections={[
          {
            title: "Product",
            links: [
              { label: "Features", href: "#features" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Solutions", href: "#solutions" },
              { label: "Pricing", href: "#pricing" },
            ],
          },
          {
            title: "Solutions",
            links: [
              { label: "For Individuals", href: "#solutions" },
              { label: "For Universities", href: "#solutions" },
              { label: "For Government", href: "#solutions" },
              { label: "Enterprise", href: "#solutions" },
            ],
          },
          {
            title: "Resources",
            links: [
              { label: "Documentation", href: "#docs" },
              { label: "Help Center", href: "#help" },
              { label: "Community", href: "#community" },
              { label: "Blog", href: "#blog" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About Us", href: "#about" },
              { label: "Careers", href: "#careers" },
              { label: "Contact", href: "#contact" },
              { label: "Privacy", href: "#privacy" },
            ],
          },
        ]}
        socialLinks={{
          twitter: "https://twitter.com/urbanbuzzai",
          linkedin: "https://linkedin.com/company/urbanbuzzai",
          github: "https://github.com/urbanbuzzai",
          email: "hello@urbanbuzz.ai",
        }}
      />
    </>
  )
}
