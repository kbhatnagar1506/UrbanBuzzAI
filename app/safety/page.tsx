"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Moon, Sun } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { motion } from 'framer-motion'

interface SafetyData {
  overallScore: number
  crimeStats: {
    theft: number
    assault: number
    vandalism: number
    burglary: number
    other: number
  }
  safetyTrends: Array<{
    month: string
    score: number
  }>
  recentIncidents: Array<{
    date: string
    type: string
    description: string
  }>
  safetyFactors: {
    lighting: number
    policePresence: number
    communityWatch: number
    publicTransport: number
    pedestrianSafety: number
  }
  timeBasedSafety: {
    day: number
    night: number
  }
  recommendations: string[]
  summary: string
}

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e']

export default function SafetyAnalysisPage() {
  const searchParams = useSearchParams()
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Read location from query parameter and auto-search
  useEffect(() => {
    const locationParam = searchParams.get('location')
    if (locationParam && !safetyData && !loading) {
      setLocation(locationParam)
      // Trigger search after a small delay to ensure state is set
      const timer = setTimeout(() => {
        handleSearch(locationParam)
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSearch = async (locationToSearch?: string) => {
    const searchLocation = locationToSearch || location.trim()
    if (!searchLocation) {
      setError('Please enter a location')
      return
    }

    setLoading(true)
    setError(null)
    setSafetyData(null)

    try {
      // First geocode the location
      const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(searchLocation)}`)
      const geocodeData = await geocodeResponse.json()

      if (!geocodeResponse.ok) {
        throw new Error(geocodeData.error || 'Failed to geocode location')
      }

      const { lat, lng, formatted_address } = geocodeData

      // Then get safety analysis
      const safetyResponse = await fetch('/api/safety-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: searchLocation,
          address: formatted_address,
          coordinates: { lat, lng },
        }),
      })

      const safetyResult = await safetyResponse.json()

      if (!safetyResponse.ok) {
        throw new Error(safetyResult.error || 'Failed to analyze safety')
      }

      setSafetyData(safetyResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const crimeData = safetyData ? [
    { name: 'Theft', value: safetyData.crimeStats.theft },
    { name: 'Assault', value: safetyData.crimeStats.assault },
    { name: 'Vandalism', value: safetyData.crimeStats.vandalism },
    { name: 'Burglary', value: safetyData.crimeStats.burglary },
    { name: 'Other', value: safetyData.crimeStats.other },
  ] : []

  const radarData = safetyData ? [
    { factor: 'Lighting', value: safetyData.safetyFactors.lighting },
    { factor: 'Police', value: safetyData.safetyFactors.policePresence },
    { factor: 'Community', value: safetyData.safetyFactors.communityWatch },
    { factor: 'Transport', value: safetyData.safetyFactors.publicTransport },
    { factor: 'Pedestrian', value: safetyData.safetyFactors.pedestrianSafety },
  ] : []

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Safety Analysis</h1>
          <p className="text-muted-foreground">Get comprehensive safety statistics for any location</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Location</CardTitle>
            <CardDescription>Enter an address, landmark, or city name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="e.g., Times Square, New York or 120 Piedmont Ave NE, Atlanta, GA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {safetyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Overall Score - Top */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-6">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-full border-8 border-muted flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="text-center">
                        <div className={`text-6xl font-bold ${getScoreColor(safetyData.overallScore)}`}>
                          {safetyData.overallScore}
                        </div>
                        <div className="text-lg text-muted-foreground mt-2">/ 100</div>
                      </div>
                    </div>
                    <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full ${getScoreBgColor(safetyData.overallScore)} flex items-center justify-center shadow-lg`}>
                      {safetyData.overallScore >= 80 ? (
                        <CheckCircle2 className="h-7 w-7 text-white" />
                      ) : safetyData.overallScore >= 60 ? (
                        <AlertTriangle className="h-7 w-7 text-white" />
                      ) : (
                        <AlertTriangle className="h-7 w-7 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Safety Score</h2>
                    <p className="text-muted-foreground">{safetyData.summary || 'Safety assessment for this location'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Crime Statistics Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Crime Statistics</CardTitle>
                  <CardDescription>Breakdown by crime type (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Crime Type</th>
                          <th className="text-right py-3 px-4 font-semibold">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crimeData.map((crime, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">{crime.name}</td>
                            <td className="text-right py-3 px-4 font-semibold">{crime.value}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Factors Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Safety Factors</CardTitle>
                  <CardDescription>Assessment scores (0-100)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Factor</th>
                          <th className="text-right py-3 px-4 font-semibold">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {radarData.map((factor, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">{factor.factor}</td>
                            <td className="text-right py-3 px-4 font-semibold">{factor.value}/100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Trends Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Safety Trends (Last 6 Months)</CardTitle>
                  <CardDescription>Monthly safety score progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Month</th>
                          <th className="text-right py-3 px-4 font-semibold">Safety Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safetyData.safetyTrends && Array.isArray(safetyData.safetyTrends) && safetyData.safetyTrends.length > 0 ? (
                          safetyData.safetyTrends.map((trend, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4">{trend.month}</td>
                              <td className="text-right py-3 px-4 font-semibold">{trend.score}/100</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-3 px-4 text-center text-muted-foreground">No trend data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Time-Based Safety Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Time-Based Safety</CardTitle>
                  <CardDescription>Day vs Night safety scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Time</th>
                          <th className="text-right py-3 px-4 font-semibold">Safety Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-2">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            Day
                          </td>
                          <td className="text-right py-3 px-4 font-semibold">{safetyData.timeBasedSafety?.day || 'N/A'}/100</td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-2">
                            <Moon className="h-4 w-4 text-blue-500" />
                            Night
                          </td>
                          <td className="text-right py-3 px-4 font-semibold">{safetyData.timeBasedSafety?.night || 'N/A'}/100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Incidents (Last 5 Cases)
                </CardTitle>
                <CardDescription>Most recent reported incidents in the area</CardDescription>
              </CardHeader>
              <CardContent>
                {safetyData.recentIncidents && Array.isArray(safetyData.recentIncidents) && safetyData.recentIncidents.length > 0 ? (
                  <div className="space-y-4">
                    {safetyData.recentIncidents.map((incident, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{incident.type}</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{new Date(incident.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                      </div>
                    </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No recent incidents data available for this location.</p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Safety Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safetyData.recommendations && Array.isArray(safetyData.recommendations) && safetyData.recommendations.length > 0 ? (
                  <ul className="space-y-2">
                    {safetyData.recommendations.map((rec, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No specific recommendations available for this location.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      <Footer 
        companyName="Urban Buzz AI"
        tagline="AI-powered urban navigation that finds what maps can't"
        sections={[
          {
            title: "Product",
            links: [
              { label: "Features", href: "/#features" },
              { label: "How It Works", href: "/#how-it-works" },
              { label: "Solutions", href: "/#solutions" },
              { label: "Pricing", href: "/#pricing" },
            ],
          },
          {
            title: "Solutions",
            links: [
              { label: "For Individuals", href: "/#solutions" },
              { label: "For Universities", href: "/#solutions" },
              { label: "For Government", href: "/#solutions" },
              { label: "Enterprise", href: "/#solutions" },
            ],
          },
          {
            title: "Resources",
            links: [
              { label: "Documentation", href: "/#docs" },
              { label: "Help Center", href: "/#help" },
              { label: "Community", href: "/#community" },
              { label: "Blog", href: "/#blog" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About Us", href: "/#about" },
              { label: "Careers", href: "/#careers" },
              { label: "Contact", href: "/#contact" },
              { label: "Privacy", href: "/#privacy" },
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

