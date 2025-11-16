import { NextRequest, NextResponse } from 'next/server'

// Helper function to fetch FBI Crime Data
async function fetchFBICrimeData(city: string, state: string, fbiApiKey: string) {
  try {
    // Date format should be MM-YYYY
    const fromDate = '01-2020'
    const toDate = '12-2023'
    
    // Use the working summarized endpoint with valid offense types
    const offenseTypes = ['violent-crime', 'property-crime', 'homicide', 'rape', 'robbery', 'aggravated-assault', 'burglary', 'larceny', 'motor-vehicle-theft']
    
    const results: any = {
      violentCrime: null,
      propertyCrime: null,
      allOffenses: {},
    }

    // Fetch violent crime data (this endpoint works!)
    try {
      const violentUrl = `https://api.usa.gov/crime/fbi/cde/summarized/state/${state}/violent-crime?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
      const violentRes = await fetch(violentUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (violentRes.ok) {
        results.violentCrime = await violentRes.json()
      }
    } catch (err) {
      console.log('FBI violent crime data fetch error:', err)
    }

    // Fetch property crime data
    try {
      const propertyUrl = `https://api.usa.gov/crime/fbi/cde/summarized/state/${state}/property-crime?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
      const propertyRes = await fetch(propertyUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (propertyRes.ok) {
        results.propertyCrime = await propertyRes.json()
      }
    } catch (err) {
      console.log('FBI property crime data fetch error:', err)
    }

    // Try to fetch additional offense types
    for (const offenseType of ['homicide', 'robbery', 'burglary']) {
      try {
        const url = `https://api.usa.gov/crime/fbi/cde/summarized/state/${state}/${offenseType}?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (res.ok) {
          results.allOffenses[offenseType] = await res.json()
        }
      } catch (err) {
        // Ignore individual offense type errors
      }
    }

    // Return data if any was successfully fetched
    if (results.violentCrime || results.propertyCrime || Object.keys(results.allOffenses).length > 0) {
      return results
    }
  } catch (error) {
    console.log('FBI API error:', error)
  }
  return null
}

// Helper function to get county from coordinates
async function getCountyFromCoordinates(lat: number, lng: number): Promise<{ county: string; state: string } | null> {
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    const res = await fetch(geocodeUrl)
    const data = await res.json()
    
    if (data.status === 'OK' && data.results[0]) {
      const components = data.results[0].address_components
      let county = ''
      let state = ''
      
      for (const component of components) {
        if (component.types.includes('administrative_area_level_2')) {
          county = component.long_name.replace(' County', '').replace(' Parish', '')
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name || component.long_name
        }
      }
      
      if (county && state) {
        return { county, state }
      }
    }
  } catch (err) {
    console.log('Error getting county:', err)
  }
  return null
}

// Helper function to fetch FBI Crime Data by county
async function fetchFBICrimeDataByCounty(county: string, state: string, fbiApiKey: string) {
  try {
    const fromDate = '01-2020'
    const toDate = '12-2023'
    
    const results: any = {
      violentCrime: null,
      propertyCrime: null,
      allOffenses: {},
    }

    // Try county-level endpoints
    // Format: /summarized/county/{state}/{county}/{offense}
    const countyName = county.replace(/\s+/g, '-').toLowerCase()
    
    // Fetch violent crime by county
    try {
      const violentUrl = `https://api.usa.gov/crime/fbi/cde/summarized/county/${state}/${countyName}/violent-crime?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
      const violentRes = await fetch(violentUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (violentRes.ok) {
        results.violentCrime = await violentRes.json()
      } else {
        // If county endpoint fails, try alternative format
        const altUrl = `https://api.usa.gov/crime/fbi/cde/summarized/county/${state}/${encodeURIComponent(county)}/violent-crime?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
        const altRes = await fetch(altUrl, {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (altRes.ok) {
          results.violentCrime = await altRes.json()
        }
      }
    } catch (err) {
      console.log('FBI county violent crime data fetch error:', err)
    }

    // Fetch property crime by county
    try {
      const propertyUrl = `https://api.usa.gov/crime/fbi/cde/summarized/county/${state}/${countyName}/property-crime?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
      const propertyRes = await fetch(propertyUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (propertyRes.ok) {
        results.propertyCrime = await propertyRes.json()
      } else {
        const altUrl = `https://api.usa.gov/crime/fbi/cde/summarized/county/${state}/${encodeURIComponent(county)}/property-crime?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
        const altRes = await fetch(altUrl, {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (altRes.ok) {
          results.propertyCrime = await altRes.json()
        }
      }
    } catch (err) {
      console.log('FBI county property crime data fetch error:', err)
    }

    if (results.violentCrime || results.propertyCrime) {
      return results
    }
  } catch (error) {
    console.log('FBI county API error:', error)
  }
  return null
}

// Helper function to fetch crime data from alternative sources
async function fetchCrimeDataByLocation(lat: number, lng: number, city: string, state: string, fbiApiKey: string) {
  const crimeData: any = {
    fbi: null,
    fbiCounty: null,
    local: null,
    county: null,
  }

  // Get county from coordinates
  const countyInfo = await getCountyFromCoordinates(lat, lng)
  if (countyInfo) {
    crimeData.county = countyInfo.county
    // Try to get county-level FBI data
    if (countyInfo.county && countyInfo.state && fbiApiKey) {
      crimeData.fbiCounty = await fetchFBICrimeDataByCounty(countyInfo.county, countyInfo.state, fbiApiKey)
    }
  }

  // Try FBI state-level data as fallback
  if (state && fbiApiKey) {
    crimeData.fbi = await fetchFBICrimeData(city, state, fbiApiKey)
  }

  // Try to get local crime data from Google Places API (if available)
  // Note: Google Places doesn't directly provide crime data, but we can use it for context
  
  return crimeData
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  const fbiApiKey = process.env.FBI_API_KEY || 'hmJUskd4QYhF11FfwVkfN7lwzMtaeFyEAJuBacge'
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not found' },
      { status: 400 }
    )
  }

  try {
    const { location, address, coordinates } = await request.json()

    if (!location && !address && !coordinates) {
      return NextResponse.json(
        { error: 'Location, address, or coordinates required' },
        { status: 400 }
      )
    }

    // Get detailed location info via reverse geocoding
    let city = ''
    let state = ''
    let country = ''
    let neighborhood = ''
    let areaType = ''
    let formattedAddress = address || ''

    if (coordinates) {
      try {
        const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        const reverseRes = await fetch(reverseGeocodeUrl)
        const reverseData = await reverseRes.json()
        
        if (reverseData.status === 'OK' && reverseData.results[0]) {
          formattedAddress = reverseData.results[0].formatted_address
          const components = reverseData.results[0].address_components
          
          for (const component of components) {
            if (component.types.includes('locality')) {
              city = component.long_name
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name || component.long_name
            }
            if (component.types.includes('country')) {
              country = component.short_name || component.long_name
            }
            if (component.types.includes('neighborhood') || component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) {
              neighborhood = component.long_name
            }
          }
        }
      } catch (err) {
        console.log('Reverse geocode error:', err)
      }
    }

    // Use OpenAI's knowledge directly - ask it what it knows about this location's safety
    const analysisPrompt = `Analyze the safety of this EXACT location using your actual knowledge. DO NOT use template values or repeat the same numbers.

LOCATION: ${formattedAddress || location}
City: ${city || 'Unknown'}
State/Region: ${state || 'Unknown'}
Country: ${country || 'Unknown'}
Neighborhood: ${neighborhood || 'Unknown'}

CRITICAL INSTRUCTIONS:
- Use your ACTUAL knowledge of this specific location's crime statistics and safety reputation
- Each location MUST have DIFFERENT values - never use the same numbers
- Research what you know about this city/area's actual crime rates
- Consider: Is this a high-crime area? Low-crime? Tourist area? Residential? Commercial?
- Base scores on REAL knowledge: If you know this area has high crime, use lower scores. If it's known as safe, use higher scores.
- Vary ALL numbers significantly based on what you actually know about this location
- If this is a major city with known crime issues, reflect that in the scores
- If this is a safe suburban area, reflect that in higher scores
- Make crime statistics percentages reflect actual patterns for this type of location

Provide a JSON response with these fields, using VALUES BASED ON YOUR ACTUAL KNOWLEDGE of this location:
- overallScore: A number 0-100 based on what you know about this area's safety
- crimeStats: An object with theft, assault, vandalism, burglary, other (as percentages that sum to ~100, based on actual crime patterns for this location type)
- safetyTrends: Array of 6 objects with month (Jan-Jun) and score (0-100), showing realistic trends for this area
- recentIncidents: Array of 5 objects with date, type, description - use realistic incident types for this area
- safetyFactors: Object with lighting, policePresence, communityWatch, publicTransport, pedestrianSafety (all 0-100, based on what you know about this area)
- timeBasedSafety: Object with day and night scores (0-100) based on this area's characteristics
- recommendations: Array of 4-5 strings with location-specific safety advice
- summary: 2-3 sentences about this specific location's safety profile
- dataSource: "OpenAI Knowledge Base"
- dataAvailable: true

DO NOT copy example values. Use your actual knowledge. If you know nothing specific, make educated guesses based on location type, but vary them significantly from any examples.`

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
            content: `You are a safety analysis expert. You MUST provide unique, location-specific safety assessments based on your actual knowledge. NEVER use template values or repeat the same numbers for different locations. Each location gets unique values based on what you actually know about that specific place - its crime reputation, area type, city characteristics, and safety patterns. If you know a location is dangerous, use low scores. If you know it's safe, use high scores. Always vary your responses significantly based on the specific location.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.9, // Lower temperature for more factual analysis
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Parse JSON from response
    let safetyData
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
      const jsonString = jsonMatch ? jsonMatch[1] : content
      safetyData = JSON.parse(jsonString)
    } catch (parseError) {
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        safetyData = JSON.parse(jsonObjectMatch[0])
      } else {
        throw new Error('Failed to parse safety data from OpenAI response')
      }
    }

    // Ensure arrays are always arrays, not strings or null
    if (!Array.isArray(safetyData.recommendations)) {
      if (typeof safetyData.recommendations === 'string') {
        // Split by common delimiters if it's a single string
        safetyData.recommendations = safetyData.recommendations
          .split(/[.,;]\s*/)
          .map(r => r.trim())
          .filter(r => r.length > 0)
      } else {
        safetyData.recommendations = []
      }
    }
    
    if (!Array.isArray(safetyData.recentIncidents)) {
      safetyData.recentIncidents = safetyData.recentIncidents || []
    }
    
    if (!Array.isArray(safetyData.safetyTrends)) {
      safetyData.safetyTrends = safetyData.safetyTrends || []
    }

    // Convert string numbers to actual numbers (no hardcoded defaults)
    if (typeof safetyData.overallScore === 'string') {
      const numMatch = safetyData.overallScore.match(/(\d+)/)
      if (numMatch) {
        safetyData.overallScore = parseInt(numMatch[1])
      }
    }

    // Fix time-based safety scores (no hardcoded defaults)
    if (safetyData.timeBasedSafety) {
      if (typeof safetyData.timeBasedSafety.day === 'string') {
        const dayMatch = safetyData.timeBasedSafety.day.match(/(\d+)/)
        if (dayMatch) {
          safetyData.timeBasedSafety.day = parseInt(dayMatch[1])
        }
      }
      if (typeof safetyData.timeBasedSafety.night === 'string') {
        const nightMatch = safetyData.timeBasedSafety.night.match(/(\d+)/)
        if (nightMatch) {
          safetyData.timeBasedSafety.night = parseInt(nightMatch[1])
        }
      }
    }

    // Ensure crime stats are numbers (no hardcoded defaults)
    if (safetyData.crimeStats) {
      Object.keys(safetyData.crimeStats).forEach(key => {
        if (typeof safetyData.crimeStats[key] === 'string') {
          const numMatch = safetyData.crimeStats[key].match(/(\d+)/)
          if (numMatch) {
            safetyData.crimeStats[key] = parseInt(numMatch[1])
          }
        }
      })
    }

    // Ensure safety factors are numbers (no hardcoded defaults)
    if (safetyData.safetyFactors) {
      Object.keys(safetyData.safetyFactors).forEach(key => {
        if (typeof safetyData.safetyFactors[key] === 'string') {
          const numMatch = safetyData.safetyFactors[key].match(/(\d+)/)
          if (numMatch) {
            safetyData.safetyFactors[key] = parseInt(numMatch[1])
          }
        }
      })
    }

    // Add metadata about data sources
    safetyData.locationInfo = {
      address: formattedAddress,
      city,
      state,
      country,
      neighborhood,
      coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null,
    }

    return NextResponse.json(safetyData)
  } catch (error) {
    console.error('Error analyzing safety:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze safety', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
