import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not found' },
      { status: 400 }
    )
  }

  try {
    const { imageBase64, label, address, coordinates, routeInfo, direction } = await request.json()
    
    // Build location context
    let locationContext = ''
    if (address) {
      locationContext += `Location: ${address}\n`
    }
    if (coordinates) {
      locationContext += `Coordinates: ${coordinates.lat}, ${coordinates.lng}\n`
    }
    if (routeInfo) {
      locationContext += `Route: ${routeInfo.origin} → ${routeInfo.destination}\n`
    }
    if (direction) {
      locationContext += `View Direction: ${direction}\n`
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${locationContext ? `Context:\n${locationContext}\n\n` : ''}Analyze this Street View image${locationContext ? ` from the location above` : ` from ${label}`}. Provide a comprehensive analysis focusing on:

1. CURVES: Identify all curves, turns, bends in the road/path. Describe their sharpness, radius, visibility.
2. ACCESSIBILITY: Evaluate accessibility features - ramps, curb cuts, sidewalks, crosswalks, wheelchair accessibility, pedestrian infrastructure.
3. SAFETY: Assess safety factors - traffic patterns, visibility, lighting, signage, pedestrian safety, potential hazards.
4. INFRASTRUCTURE: Note infrastructure elements - road conditions, sidewalks, bike lanes, public transit access, street furniture.
5. HAZARDS: Identify any potential hazards - obstacles, blind spots, dangerous intersections, construction.
6. FEATURES: List key visual features - buildings, landmarks, signs, vehicles, people, vegetation.

Return as JSON with this exact structure:
{
  "description": "2-3 sentence overview",
  "curves": ["curve description 1", "curve description 2"],
  "accessibility": ["accessibility feature 1", "accessibility feature 2"],
  "safety": ["safety observation 1", "safety observation 2"],
  "infrastructure": ["infrastructure element 1", "infrastructure element 2"],
  "hazards": ["hazard 1", "hazard 2"],
  "features": ["feature 1", "feature 2"]
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` }
      }
      return NextResponse.json(
        { error: errorData.error?.message || errorData.error || `OpenAI API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Check if OpenAI returned an error in the response
    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || data.error || 'OpenAI API returned an error', details: data },
        { status: 400 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

