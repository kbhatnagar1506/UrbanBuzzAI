import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not found' },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') || 'Atlanta, GA'
  const city = searchParams.get('city') || 'Atlanta'
  const state = searchParams.get('state') || 'GA'

  try {
    const prompt = `You are a safety analysis expert. Analyze the safety of this specific location based on your knowledge of crime statistics, safety patterns, and area characteristics.

LOCATION INFORMATION:
- Location: ${location}
- City: ${city}
- State: ${state}

TASK: Based on your knowledge of this location, provide a comprehensive safety assessment including:
1. Overall Safety Score (0-100) based on known crime rates and safety patterns for this area
2. Crime Statistics breakdown by category (theft, assault, vandalism, burglary, other) - use percentages that reflect actual patterns for this type of location
3. Safety Trends (last 6 months) - show monthly safety score progression based on typical patterns
4. Recent incidents - provide realistic examples of the types of incidents that occur in similar areas
5. Safety factors assessment:
   - Lighting quality (0-100)
   - Police presence (0-100)
   - Community watch activity (0-100)
   - Public transportation safety (0-100)
   - Pedestrian safety (0-100)
6. Time-based Safety (day vs night safety scores)
7. Recommendations for staying safe in this area

IMPORTANT:
- Base your assessment on actual knowledge of this location or similar locations
- Consider the city's overall crime reputation, neighborhood type, and area characteristics
- Use realistic numbers that reflect actual crime patterns for this type of area
- If you don't have specific knowledge, base it on similar locations with similar characteristics
- Be honest about uncertainty - if data is limited, reflect that in the scores

Return as JSON with NUMERIC values only (no text descriptions):
{
  "overallScore": 75,
  "crimeStats": {
    "theft": 35,
    "assault": 15,
    "vandalism": 20,
    "burglary": 18,
    "other": 12
  },
  "safetyTrends": [
    {"month": "Jan", "score": 72},
    {"month": "Feb", "score": 74},
    {"month": "Mar", "score": 73},
    {"month": "Apr", "score": 75},
    {"month": "May", "score": 76},
    {"month": "Jun", "score": 75}
  ],
  "recentIncidents": [
    {"date": "2024-06-15", "type": "Theft", "description": "Vehicle break-in reported"},
    {"date": "2024-06-10", "type": "Vandalism", "description": "Graffiti on public property"}
  ],
  "safetyFactors": {
    "lighting": 80,
    "policePresence": 70,
    "communityWatch": 65,
    "publicTransport": 75,
    "pedestrianSafety": 78
  },
  "timeBasedSafety": {
    "day": 85,
    "night": 65
  },
  "recommendations": [
    "Stay aware of surroundings, especially at night",
    "Use well-lit paths when walking after dark",
    "Keep valuables out of sight in vehicles"
  ],
  "summary": "Safety assessment based on location characteristics and known patterns",
  "dataSource": "OpenAI Knowledge Base",
  "dataAvailable": true
}

CRITICAL: All numeric fields (overallScore, crimeStats values, safetyFactors values, timeBasedSafety values, safetyTrends scores) MUST be NUMBERS (0-100), not strings or text descriptions. Recommendations MUST be an array of strings, not a single string. Base all values on your actual knowledge of this location or similar locations.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a safety analysis expert with knowledge of crime statistics, safety patterns, and area characteristics for locations worldwide. You provide safety assessments based on your training data and knowledge of specific locations, cities, neighborhoods, and their typical crime patterns. You base your assessments on factual information you know about these locations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'OpenAI API error',
        status: response.status,
        statusText: response.statusText,
        errorDetails: errorText
      }, { status: response.status })
    }

    const rawData = await response.json()

    return NextResponse.json({
      request: {
        location,
        city,
        state,
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
      },
      rawOpenAIResponse: rawData,
      messageContent: rawData.choices?.[0]?.message?.content || 'No content',
      usage: rawData.usage,
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to call OpenAI',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


