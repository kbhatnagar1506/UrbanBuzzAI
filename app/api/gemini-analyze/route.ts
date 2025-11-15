import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not found' },
      { status: 400 }
    )
  }

  try {
    const { imageBase64, label } = await request.json()
    
    // Use gemini-2.5-flash for image analysis (supports multimodal, stable version)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this Street View image from ${label} direction. Provide a comprehensive analysis focusing on:

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
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        }
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
        { error: errorData.error?.message || errorData.error || `Gemini API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Check if Gemini returned an error in the response
    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || data.error || 'Gemini API returned an error', details: data },
        { status: 400 }
      )
    }
    
    // Check if response has candidates with content
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected Gemini response structure:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { error: 'Unexpected response structure from Gemini API', details: 'Response missing candidates or content', fullResponse: data },
        { status: 500 }
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

