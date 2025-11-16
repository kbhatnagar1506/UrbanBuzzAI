import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!address || !apiKey) {
    return NextResponse.json(
      { error: 'Missing address or API key' },
      { status: 400 }
    )
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Geocoding API error:', response.status, errorText)
      return NextResponse.json(
        { 
          error: `Geocoding API error: ${response.status}`,
          status: 'ERROR',
          details: errorText
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Log for debugging
    if (data.status !== 'OK') {
      console.error('Geocoding failed:', data.status, data.error_message)
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to geocode address', 
        status: 'ERROR',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

