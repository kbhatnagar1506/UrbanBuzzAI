import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not found' },
      { status: 400 }
    )
  }

  try {
    const { location, query, type } = await request.json()

    let lat: number
    let lng: number

    // If location is provided as coordinates
    if (location && typeof location === 'object' && location.lat && location.lng) {
      lat = location.lat
      lng = location.lng
    } else if (location && typeof location === 'string' && location.includes(',')) {
      // If location is provided as "lat,lng" string
      const [latStr, lngStr] = location.split(',')
      lat = parseFloat(latStr.trim())
      lng = parseFloat(lngStr.trim())
    } else {
      return NextResponse.json(
        { error: 'Please provide location coordinates' },
        { status: 400 }
      )
    }

    // Build search query
    let searchQuery = query || ''
    if (type) {
      searchQuery = `${searchQuery} ${type}`.trim()
    }

    // Search for nearby places using Places API (Text Search or Nearby Search)
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=${encodeURIComponent(searchQuery)}&key=${apiKey}`
    
    const placesRes = await fetch(placesUrl)
    const placesData = await placesRes.json()

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: `Places API error: ${placesData.status}` },
        { status: 500 }
      )
    }

    if (!placesData.results || placesData.results.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: `No ${query || 'places'} found nearby. Try a different search term or location.` 
        },
        { status: 200 }
      )
    }

    // Sort by rating (highest first) and distance
    const sortedResults = placesData.results
      .filter((place: any) => place.rating) // Only include places with ratings
      .sort((a: any, b: any) => {
        // Sort by rating first (highest), then by distance
        if (b.rating !== a.rating) {
          return b.rating - a.rating
        }
        const distA = Math.sqrt(
          Math.pow(a.geometry.location.lat - lat, 2) + 
          Math.pow(a.geometry.location.lng - lng, 2)
        )
        const distB = Math.sqrt(
          Math.pow(b.geometry.location.lat - lat, 2) + 
          Math.pow(b.geometry.location.lng - lng, 2)
        )
        return distA - distB
      })

    if (sortedResults.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: `No ${query || 'places'} with ratings found nearby.` 
        },
        { status: 200 }
      )
    }

    // Get distance and duration for the top results
    const topResults = sortedResults.slice(0, 5)
    const resultsWithDistance = await Promise.all(
      topResults.map(async (place: any) => {
        const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${place.geometry.location.lat},${place.geometry.location.lng}&units=imperial&key=${apiKey}`
        const distanceRes = await fetch(distanceUrl)
        const distanceData = await distanceRes.json()

        const distance = distanceData.rows[0]?.elements[0]?.distance?.text || 'Unknown distance'
        const duration = distanceData.rows[0]?.elements[0]?.duration?.text || 'Unknown time'

        return {
          name: place.name,
          address: place.vicinity || place.formatted_address || 'Address not available',
          rating: place.rating,
          user_ratings_total: place.user_ratings_total || 0,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          distance: distance,
          duration: duration,
          place_id: place.place_id,
          types: place.types || [],
        }
      })
    )

    return NextResponse.json({
      success: true,
      query: query || 'places',
      results: resultsWithDistance,
      best_match: resultsWithDistance[0], // Highest rated, closest
    })
  } catch (error) {
    console.error('Error finding nearby places:', error)
    return NextResponse.json(
      { 
        error: 'Failed to find nearby places', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}


