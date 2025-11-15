import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Urban Buzz AI - Navigate Cities Like Never Before",
  description: "AI-powered urban navigation using swarms of intelligent agents. Get instant, voice-powered guidance that finds what maps can't—safe routes, hidden infrastructure, and accessible paths.",
  generator: "v0.app",
  icons: {
    icon: "/icon.svg",
  },
  keywords: ["urban navigation", "AI navigation", "accessible routes", "voice navigation", "city navigation", "mobility", "wayfinding"],
  openGraph: {
    title: "Urban Buzz AI - Navigate Cities Like Never Before",
    description: "AI-powered urban navigation using swarms of intelligent agents for safe, accessible city exploration.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
