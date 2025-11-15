import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const openAiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

  if (!apiKey || !openAiKey) {
    return NextResponse.json(
      { error: 'API keys not configured' },
      { status: 400 }
    )
  }

  try {
    const { origin, destination } = await request.json()

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination required' },
        { status: 400 }
      )
    }

    // Convert addresses to coordinates if needed (if they're not already in lat,lng format)
    let originCoords = origin
    let destCoords = destination

    // Check if origin is an address (not coordinates)
    if (typeof origin === 'string' && !origin.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(origin)}&key=${apiKey}`
      const geocodeRes = await fetch(geocodeUrl)
      const geocodeData = await geocodeRes.json()
      if (geocodeData.status === 'OK' && geocodeData.results[0]) {
        const loc = geocodeData.results[0].geometry.location
        originCoords = `${loc.lat},${loc.lng}`
      }
    }

    // Check if destination is an address (not coordinates)
    if (typeof destination === 'string' && !destination.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${apiKey}`
      const geocodeRes = await fetch(geocodeUrl)
      const geocodeData = await geocodeRes.json()
      if (geocodeData.status === 'OK' && geocodeData.results[0]) {
        const loc = geocodeData.results[0].geometry.location
        destCoords = `${loc.lat},${loc.lng}`
      }
    }

    // Get route with waypoints (pit stops)
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(originCoords)}&destination=${encodeURIComponent(destCoords)}&key=${apiKey}`
    const directionsRes = await fetch(directionsUrl)
    const directionsData = await directionsRes.json()

    if (directionsData.status !== 'OK' || !directionsData.routes[0]) {
      return NextResponse.json(
        { error: 'Failed to get route' },
        { status: 400 }
      )
    }

    const route = directionsData.routes[0]
    const leg = route.legs[0]
    
    // Generate pit stops along the route (every ~2km or so)
    const totalDistance = leg.distance.value // in meters
    const numStops = Math.min(Math.max(Math.floor(totalDistance / 2000), 3), 15) // 3-15 stops
    const pitStops: Array<{ lat: number; lng: number; address: string }> = []

    for (let i = 1; i <= numStops; i++) {
      const distanceRatio = i / (numStops + 1)
      const steps = leg.steps
      let accumulatedDistance = 0
      const targetDistance = totalDistance * distanceRatio

      for (const step of steps) {
        const stepDistance = step.distance.value
        if (accumulatedDistance + stepDistance >= targetDistance) {
          const ratio = (targetDistance - accumulatedDistance) / stepDistance
          const lat = step.start_location.lat + (step.end_location.lat - step.start_location.lat) * ratio
          const lng = step.start_location.lng + (step.end_location.lng - step.start_location.lng) * ratio
          
          // Reverse geocode to get address
          const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
          const reverseRes = await fetch(reverseGeocodeUrl)
          const reverseData = await reverseRes.json()
          
          const address = reverseData.status === 'OK' && reverseData.results[0]
            ? reverseData.results[0].formatted_address
            : `${lat.toFixed(6)}, ${lng.toFixed(6)}`

          pitStops.push({ lat, lng, address })
          break
        }
        accumulatedDistance += stepDistance
      }
    }

    // Analyze each pit stop with OpenAI Vision
    const analyses = []
    for (const stop of pitStops) {
      try {
        // Get Street View image
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${stop.lat},${stop.lng}&heading=0&pitch=0&fov=90&key=${apiKey}`
        
        // Convert to base64
        const imageRes = await fetch(streetViewUrl)
        const blob = await imageRes.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1]
            resolve(base64String)
          }
          reader.readAsDataURL(blob)
        })

        // Analyze with OpenAI
        const analysisRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this Street View image from ${stop.address}. Focus on:

1. ACCESSIBILITY: Evaluate accessibility features - ramps, curb cuts, sidewalks, crosswalks, wheelchair accessibility, pedestrian infrastructure, obstacles.
2. SAFETY: Assess safety factors - traffic patterns, visibility, lighting, signage, pedestrian safety, potential hazards, blind spots.
3. CURVES: Identify curves, turns, bends in the road/path. Describe their sharpness, radius, visibility.
4. INFRASTRUCTURE: Note infrastructure elements - road conditions, sidewalks, bike lanes, public transit access, street furniture.
5. HAZARDS: Identify any potential hazards - obstacles, blind spots, dangerous intersections, construction, poor lighting.

Return as JSON:
{
  "accessibility": ["feature 1", "feature 2"],
  "safety": ["observation 1", "observation 2"],
  "curves": ["curve description 1"],
  "infrastructure": ["element 1", "element 2"],
  "hazards": ["hazard 1", "hazard 2"],
  "overall_score": "good/fair/poor"
}`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`
                  }
                }
              ]
            }],
            max_tokens: 1000,
          }),
        })

        if (analysisRes.ok) {
          const analysisData = await analysisRes.json()
          const content = analysisData.choices?.[0]?.message?.content || '{}'
          
          let parsed
          try {
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
            parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content)
          } catch {
            parsed = {
              accessibility: [],
              safety: [],
              curves: [],
              infrastructure: [],
              hazards: [],
              overall_score: 'unknown'
            }
          }

          analyses.push({
            location: stop.address,
            coordinates: { lat: stop.lat, lng: stop.lng },
            ...parsed
          })
        }
      } catch (err) {
        console.error(`Error analyzing stop ${stop.address}:`, err)
      }
    }

    // Aggregate and summarize
    const summary = {
      total_stops_analyzed: analyses.length,
      accessibility_summary: {
        features: [...new Set(analyses.flatMap(a => a.accessibility || []))],
        overall: analyses.filter(a => a.overall_score === 'good').length > analyses.length / 2 ? 'good' : 
                analyses.filter(a => a.overall_score === 'poor').length > analyses.length / 2 ? 'poor' : 'fair'
      },
      safety_summary: {
        observations: [...new Set(analyses.flatMap(a => a.safety || []))],
        hazards: [...new Set(analyses.flatMap(a => a.hazards || []))]
      },
      curves_summary: [...new Set(analyses.flatMap(a => a.curves || []))],
      infrastructure_summary: [...new Set(analyses.flatMap(a => a.infrastructure || []))],
      detailed_analyses: analyses
    }

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze route', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

