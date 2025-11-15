import { StreetViewGallery } from "@/components/StreetViewGallery"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export const metadata = {
  title: "Street View Gallery | Urban Buzz AI",
  description: "Explore areas using Google Street View images from multiple angles.",
}

export default function StreetViewPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <StreetViewGallery />
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
    </div>
  )
}

