"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, MapPin, Loader2, Maximize2, Navigation, Route } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ImageAnalysis {
  description: string
  curves: string[]
  accessibility: string[]
  safety: string[]
  features: string[]
  hazards?: string[]
  infrastructure?: string[]
}

interface StreetViewImage {
  url: string
  heading: number
  pitch: number
  fov: number
  label: string
  stopIndex?: number
  direction?: string
  analysis?: ImageAnalysis
  analyzing?: boolean
  address?: string
  coordinates?: { lat: number; lng: number }
  routeInfo?: { origin: string; destination: string }
}

interface StreetViewGalleryProps {
  initialOrigin?: string
  initialDestination?: string
}

export function StreetViewGallery({ initialOrigin = "", initialDestination = "" }: StreetViewGalleryProps = {}) {
  const [origin, setOrigin] = useState(initialOrigin)
  const [destination, setDestination] = useState(initialDestination)
  const [images, setImages] = useState<StreetViewImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [routeStops, setRouteStops] = useState<Array<{ lat: number; lng: number; address: string }>>([])
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const openAiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""

  // Get route from origin to destination and show Street View images along the way
  const generateRouteImages = async (originInput: string, destinationInput: string) => {
    if (!originInput.trim() || !destinationInput.trim()) {
      setError("Please enter both origin and destination")
      return
    }

    setLoading(true)
    setError(null)
    setImages([])
    setRouteStops([])

    try {
      if (!apiKey) {
        throw new Error("Google Maps API key is missing. Please check your environment variables.")
      }

      // Geocode origin using API route
      let originResponse
      try {
        originResponse = await fetch(`/api/geocode?address=${encodeURIComponent(originInput)}`)
      } catch (fetchError) {
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to API'}`)
      }
      
      if (!originResponse.ok) {
        const errorData = await originResponse.json().catch(() => ({}))
        throw new Error(`Geocoding API error: ${originResponse.status} ${errorData.error || originResponse.statusText}`)
      }
      
      const originData = await originResponse.json()

      if (originData.status !== "OK" || !originData.results[0]) {
        throw new Error("Origin location not found. Please try a different address.")
      }

      const originCoords = originData.results[0].geometry.location

      // Geocode destination using API route
      let destResponse
      try {
        destResponse = await fetch(`/api/geocode?address=${encodeURIComponent(destinationInput)}`)
      } catch (fetchError) {
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to API'}`)
      }
      
      if (!destResponse.ok) {
        const errorData = await destResponse.json().catch(() => ({}))
        throw new Error(`Geocoding API error: ${destResponse.status} ${errorData.error || destResponse.statusText}`)
      }
      
      const destData = await destResponse.json()

      if (destData.status !== "OK" || !destData.results[0]) {
        throw new Error("Destination location not found. Please try a different address.")
      }

      const destCoords = destData.results[0].geometry.location

      // Get route using Directions API route
      let directionsResponse
      try {
        directionsResponse = await fetch(`/api/directions?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}`)
      } catch (fetchError) {
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to API'}`)
      }
      
      if (!directionsResponse.ok) {
        const errorData = await directionsResponse.json().catch(() => ({}))
        throw new Error(`Directions API error: ${directionsResponse.status} ${errorData.error || directionsResponse.statusText}`)
      }
      
      const directionsData = await directionsResponse.json()
      
      if (directionsData.status && directionsData.status !== "OK") {
        let errorMessage = `Could not find a route between "${originInput}" and "${destinationInput}".`
        
        if (directionsData.status === "ZERO_RESULTS") {
          errorMessage = `No route found between "${originInput}" and "${destinationInput}". They may be too far apart, on different continents, or there may be no accessible route. Please try locations in the same city or region.`
        } else if (directionsData.status === "NOT_FOUND") {
          errorMessage = `One or both locations could not be found. Please check the addresses and try again with more specific locations (include city and state/country).`
        } else if (directionsData.error_message) {
          errorMessage = `${directionsData.error_message}. Please verify both addresses are correct.`
        }
        
        throw new Error(errorMessage)
      }

      if (directionsData.status !== "OK" || !directionsData.routes[0]) {
        throw new Error(`Could not find a route between "${originInput}" and "${destinationInput}". Please verify both addresses are correct and try again.`)
      }

      const route = directionsData.routes[0]
      const pitStops: Array<{ lat: number; lng: number; address: string }> = []

      // Extract waypoints and intermediate locations from the route
      route.legs.forEach((leg: any) => {
        // Start point (first pit stop)
        pitStops.push({
          lat: leg.start_location.lat,
          lng: leg.start_location.lng,
          address: leg.start_address
        })

        // Get intermediate points along the route (every 3rd step for more pit stops)
        const stepInterval = Math.max(1, Math.floor(leg.steps.length / 8)) // Aim for ~8 pit stops per leg
        leg.steps.forEach((step: any, index: number) => {
          if (index % stepInterval === 0 && index > 0) {
            // Use the step's end location
            const stepLocation = step.end_location
            
            // Reverse geocode to get address for this location
            pitStops.push({
              lat: stepLocation.lat,
              lng: stepLocation.lng,
              address: step.html_instructions.replace(/<[^>]*>/g, '').substring(0, 50) + "..."
            })
          }
        })

        // End point (last pit stop)
        pitStops.push({
          lat: leg.end_location.lat,
          lng: leg.end_location.lng,
          address: leg.end_address
        })
      })

      // Remove duplicates and get addresses for random locations
      const uniqueStops = pitStops.filter((stop, index, self) =>
        index === self.findIndex((s) => 
          Math.abs(s.lat - stop.lat) < 0.0001 && Math.abs(s.lng - stop.lng) < 0.0001
        )
      )

      // Reverse geocode to get proper addresses for each pit stop using API route
      const stopsWithAddresses = await Promise.all(
        uniqueStops.map(async (stop) => {
          try {
            let response
            try {
              response = await fetch(`/api/reverse-geocode?lat=${stop.lat}&lng=${stop.lng}`)
            } catch (fetchError) {
              // Keep original address if fetch fails
              return stop
            }
            
            if (response.ok) {
              const data = await response.json()
              if (data.status === "OK" && data.results[0]) {
                return {
                  ...stop,
                  address: data.results[0].formatted_address
                }
              }
            }
          } catch (err) {
            // Keep original address if reverse geocoding fails
          }
          return stop
        })
      )

      setRouteStops(stopsWithAddresses)

      // Generate 8 Street View images for each pit stop location
      const validImages: StreetViewImage[] = []
      const totalStops = stopsWithAddresses.length
      setProgress({ current: 0, total: totalStops })
      let imageCounter = 1 // Sequential counter for all images

      // For each pit stop, first check with GPT if Street View is available
      for (let stopIndex = 0; stopIndex < stopsWithAddresses.length; stopIndex++) {
        const stop = stopsWithAddresses[stopIndex]
        const { lat, lng, address } = stop

        // Use GPT to determine if Street View is available and what images we can get
        let shouldFetchImages = true
        let recommendedDirections: string[] = []

        if (openAiKey) {
          try {
            const gptResponse = await fetch('/api/openai-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                  role: 'user',
                  content: `For location at coordinates ${lat}, ${lng} (${address}), determine:
1. Is Street View imagery likely available here? (urban areas usually have it)
2. What type of images would be available? (buildings, streets, landmarks, etc.)
3. What directions would have the most interesting views?

Return JSON: { "hasStreetView": true/false, "imageTypes": ["type1", "type2"], "bestDirections": ["North", "East"], "description": "brief description" }`
                }],
                max_tokens: 200,
              }),
            })

            if (gptResponse.ok) {
              const gptData = await gptResponse.json()
              const gptContent = gptData.choices?.[0]?.message?.content || '{}'
              let gptAnalysis
              try {
                const jsonMatch = gptContent.match(/```json\n([\s\S]*?)\n```/) || gptContent.match(/```\n([\s\S]*?)\n```/)
                gptAnalysis = JSON.parse(jsonMatch ? jsonMatch[1] : gptContent)
              } catch {
                gptAnalysis = { hasStreetView: true, imageTypes: [], bestDirections: [] }
              }
              shouldFetchImages = gptAnalysis.hasStreetView !== false
              recommendedDirections = gptAnalysis.bestDirections || []
            }
          } catch (err) {
            // If GPT check fails, still try to get images
            console.log('GPT check failed, proceeding with image fetch')
          }
        }

        // Generate 4 images from 4 cardinal directions (North, East, South, West)
        const directions = [
          { heading: 0, name: "North" },
          { heading: 90, name: "East" },
          { heading: 180, name: "South" },
          { heading: 270, name: "West" },
        ]

        if (shouldFetchImages) {
          // Generate 4 images (North, East, South, West) for each pit stop
          for (const dir of directions) {
            const size = "640x640"
            const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${dir.heading}&pitch=0&fov=90&key=${apiKey}`
            
            validImages.push({
              url: streetViewUrl,
              heading: dir.heading,
              pitch: 0,
              fov: 90,
              label: `Step ${stopIndex + 1} - ${dir.name}: ${address.substring(0, 40)}...`,
              stopIndex: stopIndex,
              direction: dir.name,
              analyzing: false,
              address: address,
              coordinates: { lat, lng },
              routeInfo: { origin: originInput, destination: destinationInput },
            })
          }
        }

        setProgress({ current: stopIndex + 1, total: totalStops })
        setImages([...validImages]) // Update UI progressively
      }

      if (validImages.length === 0) {
        throw new Error("No Street View imagery available along this route.")
      }

      setProgress({ current: totalStops, total: totalStops })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch Street View images"
      console.error("Error generating route images:", err)
      setError(errorMessage)
      setImages([])
      setRouteStops([])
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  // Analyze a single image with OpenAI Vision API when clicked
  const analyzeImage = async (image: StreetViewImage) => {
    if (!openAiKey) {
      setError("OpenAI API key not found. Please set NEXT_PUBLIC_OPENAI_API_KEY in your .env file.")
      return
    }

    // Check if already analyzed
    if (image.analysis) {
      return
    }

    // Mark as analyzing
    setImages(prevImages => {
      const updatedImages = [...prevImages]
      const imageIndex = updatedImages.findIndex(img => 
        img.url === image.url && img.heading === image.heading && img.stopIndex === image.stopIndex
      )
      if (imageIndex >= 0) {
        updatedImages[imageIndex] = { ...updatedImages[imageIndex], analyzing: true }
      }
      return updatedImages
    })

    try {
      // Convert image URL to base64
      const imageResponse = await fetch(image.url)
      const blob = await imageResponse.blob()
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1]
          resolve(base64String)
        }
        reader.readAsDataURL(blob)
      })

      // Call OpenAI Vision API with location context
      const response = await fetch('/api/openai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          label: image.label,
          address: image.address,
          coordinates: image.coordinates,
          routeInfo: image.routeInfo,
          direction: image.direction,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.details || `Failed to analyze image: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }
      
      // Check if OpenAI returned an error
      if (data.error) {
        throw new Error(data.error || 'OpenAI API returned an error')
      }

      const content = data.choices?.[0]?.message?.content || ''
      
      if (!content || content.trim() === '') {
        console.error('Empty content from OpenAI:', data)
        throw new Error('No analysis content received from OpenAI')
      }
      
      // Parse JSON from response
      let parsed: ImageAnalysis
      try {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content)
      } catch {
        // Fallback parsing
        parsed = {
          description: content.substring(0, 200),
          curves: content.match(/curves?[:\s]+\[(.*?)\]/i)?.[1]?.split(',').map((c: string) => c.trim()) || [],
          accessibility: content.match(/accessibility[:\s]+\[(.*?)\]/i)?.[1]?.split(',').map((a: string) => a.trim()) || [],
          safety: content.match(/safety[:\s]+\[(.*?)\]/i)?.[1]?.split(',').map((s: string) => s.trim()) || [],
          features: content.match(/features?[:\s]+\[(.*?)\]/i)?.[1]?.split(',').map((f: string) => f.trim()) || [],
          hazards: content.match(/hazards?[:\s]+\[(.*?)\]/i)?.[1]?.split(',').map((h: string) => h.trim()) || [],
          infrastructure: content.match(/infrastructure[:\s]+\[(.*?)\]/i)?.[1]?.split(',').map((inf: string) => inf.trim()) || [],
        }
      }

      // Update image with analysis
      setImages(prevImages => {
        const updatedImages = [...prevImages]
        const imageIndex = updatedImages.findIndex(img => 
          img.url === image.url && img.heading === image.heading && img.stopIndex === image.stopIndex
        )
        if (imageIndex >= 0) {
          updatedImages[imageIndex] = { 
            ...updatedImages[imageIndex], 
            analysis: parsed,
            analyzing: false,
          }
        }
        return updatedImages
      })
    } catch (err) {
      console.error('Error analyzing image:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
      // Mark as not analyzing even if it failed
      setImages(prevImages => {
        const updatedImages = [...prevImages]
        const imageIndex = updatedImages.findIndex(img => 
          img.url === image.url && img.heading === image.heading && img.stopIndex === image.stopIndex
        )
        if (imageIndex >= 0) {
          updatedImages[imageIndex] = { ...updatedImages[imageIndex], analyzing: false }
        }
        return updatedImages
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generateRouteImages(origin, destination)
  }

  // Auto-submit if initial values are provided
  useEffect(() => {
    if (initialOrigin && initialDestination && !images.length && !loading) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        generateRouteImages(initialOrigin, initialDestination)
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrigin, initialDestination])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <MapPin className="h-4 w-4" />
            <span>Street View Gallery</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Route Street View Explorer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter origin and destination to see Street View images of all stops along your route
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl p-6 lg:p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-sm font-semibold flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Origin
                </Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="origin"
                    type="text"
                    placeholder="e.g., 120 piedmont ave ne, Atlanta"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="pl-11 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Destination
                </Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="destination"
                    type="text"
                    placeholder="e.g., Centennial Olympic Park, Atlanta"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-11 h-11"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {progress.total > 0 ? `Loading ${progress.current}/${progress.total} stops...` : "Finding route..."}
                </>
              ) : (
                <>
                  <Route className="h-4 w-4 mr-2" />
                  Explore Route
                </>
              )}
            </Button>
          </form>

          {!apiKey && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-700 dark:text-yellow-400"
            >
              <p className="font-semibold mb-1">⚠️ API Key Missing</p>
              <p className="text-sm">Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
            >
              <p className="font-semibold mb-1">❌ Error</p>
              <p className="text-sm">{error}</p>
              {error.includes("API key") && (
                <p className="text-xs mt-2 opacity-80">
                  Make sure your API key is valid and has the following APIs enabled:
                  <br />• Geocoding API
                  <br />• Directions API
                  <br />• Street View Static API
                </p>
              )}
            </motion.div>
          )}

          {loading && progress.total > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Fetching images...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {images.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
            >
              <p className="text-sm text-blue-700 dark:text-blue-400">
                💡 <strong>Tip:</strong> Click on any image to analyze it for curves, accessibility, safety, and more!
              </p>
            </motion.div>
          )}
        </div>

        {/* Step-by-Step Navigation Gallery */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Step-by-Step Navigation Guide
                </h2>
                <div className="text-sm text-muted-foreground text-right">
                  <p className="font-semibold text-foreground">{images.length} Steps</p>
                  <p>{origin} → {destination}</p>
                </div>
              </div>

              {/* Step-by-step vertical timeline */}
              <div className="space-y-8">
                {(() => {
                  // Group images by stopIndex
                  const groupedImages = images.reduce((acc, image) => {
                    const stopIndex = image.stopIndex || 0
                    if (!acc[stopIndex]) {
                      acc[stopIndex] = []
                    }
                    acc[stopIndex].push(image)
                    return acc
                  }, {} as Record<number, StreetViewImage[]>)

                  // Sort by stopIndex and process each group
                  const sortedGroups = Object.keys(groupedImages)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map(stopIndex => ({
                      stopIndex,
                      stepNumber: stopIndex + 1,
                      images: groupedImages[stopIndex].sort((a, b) => {
                        // Sort by direction: North, East, South, West
                        const order = { "North": 0, "East": 1, "South": 2, "West": 3 }
                        return (order[a.direction as keyof typeof order] ?? 99) - (order[b.direction as keyof typeof order] ?? 99)
                      })
                    }))

                  return sortedGroups.map((group, groupIndex) => {
                    const isLast = groupIndex === sortedGroups.length - 1
                    const stepAddress = group.images[0]?.address || group.images[0]?.label || 'Location'
                    
                    return (
                      <motion.div
                        key={`step-${group.stepNumber}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                        className="relative"
                      >
                        {/* Timeline connector line */}
                        {!isLast && (
                          <div className="absolute left-8 top-32 bottom-0 w-0.5 bg-primary/20" />
                        )}
                        
                        <div className="flex gap-6 items-start">
                          {/* Step number badge */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg border-4 border-background relative z-10">
                              {group.stepNumber}
                            </div>
                          </div>
                          
                          {/* Step content */}
                          <div className="flex-1 bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                            <div className="p-6">
                              <h3 className="text-xl font-bold text-foreground mb-2">
                                Step {group.stepNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-6">
                                {stepAddress}
                              </p>
                              
                              {/* 4 Images Grid (North, East, South, West) */}
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                {group.images.map((image, imgIndex) => (
                                  <div
                                    key={`${image.url}-${image.direction}`}
                                    className="relative group"
                                  >
                                    <div 
                                      className="aspect-square relative overflow-hidden rounded-lg cursor-pointer border-2 border-border/50 hover:border-primary transition-all"
                                      onClick={() => !image.analysis && !image.analyzing && analyzeImage(image)}
                                    >
                                      <img
                                        src={image.url}
                                        alt={`Step ${group.stepNumber} - ${image.direction}: ${stepAddress}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                      />
                                      
                                      {/* Direction label */}
                                      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md z-10">
                                        <span className="text-xs font-semibold text-foreground">
                                          {image.direction}
                                        </span>
                                      </div>
                                      
                                      {image.analyzing && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                          <div className="text-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-white mx-auto mb-1" />
                                            <p className="text-white text-xs">Analyzing...</p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {!image.analysis && !image.analyzing && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 z-10">
                                          <div className="bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-md">
                                            <p className="text-white text-xs font-semibold">Click to Analyze</p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {image.analysis && (
                                        <div className="absolute bottom-2 right-2 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-md z-10">
                                          <span className="text-xs font-medium text-white">✓</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Analysis Display for this specific image */}
                                    {image.analysis && (
                                      <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                                        <p className="text-xs font-semibold text-foreground">{image.analysis.description}</p>
                                        
                                        {image.analysis.accessibility && image.analysis.accessibility.length > 0 && (
                                          <div>
                                            <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">♿ Accessibility</h4>
                                            <ul className="text-xs text-muted-foreground space-y-0.5">
                                              {image.analysis.accessibility.slice(0, 2).map((acc, i) => (
                                                <li key={i} className="flex items-start gap-1">
                                                  <span className="text-green-600 dark:text-green-400">•</span>
                                                  <span>{acc}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {image.analysis.safety && image.analysis.safety.length > 0 && (
                                          <div>
                                            <h4 className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1">🛡️ Safety</h4>
                                            <ul className="text-xs text-muted-foreground space-y-0.5">
                                              {image.analysis.safety.slice(0, 2).map((safety, i) => (
                                                <li key={i} className="flex items-start gap-1">
                                                  <span className="text-yellow-600 dark:text-yellow-400">•</span>
                                                  <span>{safety}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {!image.analysis && !image.analyzing && (
                                      <Button
                                        onClick={() => analyzeImage(image)}
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-full text-xs"
                                      >
                                        Analyze {image.direction}
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && images.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <Route className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Start Exploring Your Route
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter an origin and destination above to see Street View images of all stops along your route
            </p>
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Street View Full Screen"
                className="w-full h-full object-contain rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-background/90 hover:bg-background"
                onClick={() => setSelectedImage(null)}
              >
                <span className="text-2xl">×</span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

