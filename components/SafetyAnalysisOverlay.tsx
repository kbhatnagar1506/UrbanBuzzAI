"use client"

import { useState, useEffect } from 'react'
import { X, Search, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface SafetyAnalysisOverlayProps {
  location: string
  onClose: () => void
}

export function SafetyAnalysisOverlay({ location, onClose }: SafetyAnalysisOverlayProps) {
  const [searchLocation, setSearchLocation] = useState(location)
  const [loading, setLoading] = useState(false)
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (location) {
      handleSearch(location)
    }
  }, [location])

  const handleSearch = async (locationToSearch?: string) => {
    const searchLoc = locationToSearch || searchLocation.trim()
    if (!searchLoc) {
      setError('Please enter a location')
      return
    }

    setLoading(true)
    setError(null)
    setSafetyData(null)

    try {
      // First geocode the location
      const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(searchLoc)}`)
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
          location: searchLoc,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Safety Analysis</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Location</CardTitle>
              <CardDescription>Enter an address, landmark, or city name</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="e.g., Times Square, New York or 120 Piedmont Ave NE, Atlanta, GA"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={() => handleSearch()} disabled={loading}>
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

              {/* Time-based Safety */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="h-5 w-5" />
                      Day Safety
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{safetyData.timeBasedSafety.day} / 100</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreBgColor(safetyData.timeBasedSafety.day)}`}
                        style={{ width: `${safetyData.timeBasedSafety.day}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Moon className="h-5 w-5" />
                      Night Safety
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{safetyData.timeBasedSafety.night} / 100</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreBgColor(safetyData.timeBasedSafety.night)}`}
                        style={{ width: `${safetyData.timeBasedSafety.night}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Crime Statistics Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Crime Statistics</CardTitle>
                  <CardDescription>Breakdown by crime type (percentage)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Crime Type</th>
                          <th className="text-right p-2">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Theft</td>
                          <td className="text-right p-2 font-semibold">{safetyData.crimeStats.theft}%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Assault</td>
                          <td className="text-right p-2 font-semibold">{safetyData.crimeStats.assault}%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Vandalism</td>
                          <td className="text-right p-2 font-semibold">{safetyData.crimeStats.vandalism}%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Burglary</td>
                          <td className="text-right p-2 font-semibold">{safetyData.crimeStats.burglary}%</td>
                        </tr>
                        <tr>
                          <td className="p-2">Other</td>
                          <td className="text-right p-2 font-semibold">{safetyData.crimeStats.other}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Factors Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Safety Factors</CardTitle>
                  <CardDescription>Multi-dimensional safety assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Factor</th>
                          <th className="text-right p-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Lighting</td>
                          <td className="text-right p-2 font-semibold">{safetyData.safetyFactors.lighting} / 100</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Police Presence</td>
                          <td className="text-right p-2 font-semibold">{safetyData.safetyFactors.policePresence} / 100</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Community Watch</td>
                          <td className="text-right p-2 font-semibold">{safetyData.safetyFactors.communityWatch} / 100</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Public Transport</td>
                          <td className="text-right p-2 font-semibold">{safetyData.safetyFactors.publicTransport} / 100</td>
                        </tr>
                        <tr>
                          <td className="p-2">Pedestrian Safety</td>
                          <td className="text-right p-2 font-semibold">{safetyData.safetyFactors.pedestrianSafety} / 100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Trends Table */}
              {safetyData.safetyTrends && safetyData.safetyTrends.length > 0 && (
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
                            <th className="text-left p-2">Month</th>
                            <th className="text-right p-2">Safety Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safetyData.safetyTrends.map((trend, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{trend.month}</td>
                              <td className="text-right p-2 font-semibold">{trend.score} / 100</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Incidents */}
              {safetyData.recentIncidents && Array.isArray(safetyData.recentIncidents) && safetyData.recentIncidents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Incidents (Last 5 Cases)</CardTitle>
                    <CardDescription>Most recent reported incidents in the area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {safetyData.recentIncidents.map((incident, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{incident.type}</span>
                            <span className="text-sm text-muted-foreground">{incident.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{incident.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {safetyData.recommendations && Array.isArray(safetyData.recommendations) && safetyData.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Safety Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {safetyData.recommendations.map((rec, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}


