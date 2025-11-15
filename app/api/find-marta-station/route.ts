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
    const { location, address } = await request.json()

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
    } else if (address) {
      // Geocode the address first
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      const geocodeRes = await fetch(geocodeUrl)
      const geocodeData = await geocodeRes.json()
      
      if (geocodeData.status === 'OK' && geocodeData.results[0]) {
        const loc = geocodeData.results[0].geometry.location
        lat = loc.lat
        lng = loc.lng
      } else {
        return NextResponse.json(
          { error: 'Could not find the location. Please provide a valid address or coordinates.' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Please provide either location coordinates or an address' },
        { status: 400 }
      )
    }

    // Search for nearby MARTA stations using Places API (Nearby Search)
    // MARTA stations are typically labeled as "transit_station" or "subway_station"
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=transit_station&keyword=MARTA&key=${apiKey}`
    
    const placesRes = await fetch(placesUrl)
    const placesData = await placesRes.json()

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: `Places API error: ${placesData.status}` },
        { status: 500 }
      )
    }

    if (!placesData.results || placesData.results.length === 0) {
      // Try a broader search without the MARTA keyword
      const broaderUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=transit_station&key=${apiKey}`
      const broaderRes = await fetch(broaderUrl)
      const broaderData = await broaderRes.json()

      if (broaderData.status === 'OK' && broaderData.results && broaderData.results.length > 0) {
        // Filter for MARTA stations (check if name contains "MARTA" or is a known MARTA station)
        const martaStations = broaderData.results.filter((place: any) => 
          place.name.toLowerCase().includes('marta') ||
          place.name.toLowerCase().includes('station')
        )

        if (martaStations.length > 0) {
          // Sort by distance and get the closest one
          const closest = martaStations[0]
          
          // Get distance using Distance Matrix API
          const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${closest.geometry.location.lat},${closest.geometry.location.lng}&units=imperial&key=${apiKey}`
          const distanceRes = await fetch(distanceUrl)
          const distanceData = await distanceRes.json()

          const distance = distanceData.rows[0]?.elements[0]?.distance?.text || 'Unknown distance'
          const duration = distanceData.rows[0]?.elements[0]?.duration?.text || 'Unknown time'

          return NextResponse.json({
            success: true,
            station: {
              name: closest.name,
              address: closest.vicinity || closest.formatted_address || 'Address not available',
              location: {
                lat: closest.geometry.location.lat,
                lng: closest.geometry.location.lng,
              },
              distance: distance,
              duration: duration,
              place_id: closest.place_id,
            },
            all_stations: martaStations.slice(0, 5).map((place: any) => ({
              name: place.name,
              address: place.vicinity || place.formatted_address || 'Address not available',
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              },
            })),
          })
        }
      }

      return NextResponse.json(
        { 
          success: false,
          message: 'No MARTA stations found nearby. You may be too far from a MARTA station, or there may not be any stations in the area.' 
        },
        { status: 200 }
      )
    }

    // Sort results by distance (closest first)
    const sortedResults = placesData.results.sort((a: any, b: any) => {
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

    const closest = sortedResults[0]

    // Get distance using Distance Matrix API
    const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${closest.geometry.location.lat},${closest.geometry.location.lng}&units=imperial&key=${apiKey}`
    const distanceRes = await fetch(distanceUrl)
    const distanceData = await distanceRes.json()

    const distance = distanceData.rows[0]?.elements[0]?.distance?.text || 'Unknown distance'
    const duration = distanceData.rows[0]?.elements[0]?.duration?.text || 'Unknown time'

    return NextResponse.json({
      success: true,
      station: {
        name: closest.name,
        address: closest.vicinity || closest.formatted_address || 'Address not available',
        location: {
          lat: closest.geometry.location.lat,
          lng: closest.geometry.location.lng,
        },
        distance: distance,
        duration: duration,
        place_id: closest.place_id,
      },
      all_stations: sortedResults.slice(0, 5).map((place: any) => ({
        name: place.name,
        address: place.vicinity || place.formatted_address || 'Address not available',
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
      })),
    })
  } catch (error) {
    console.error('Error finding MARTA station:', error)
    return NextResponse.json(
      { 
        error: 'Failed to find MARTA station', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

