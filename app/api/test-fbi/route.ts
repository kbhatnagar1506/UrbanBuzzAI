import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const fbiApiKey = process.env.FBI_API_KEY || 'hmJUskd4QYhF11FfwVkfN7lwzMtaeFyEAJuBacge'
  
  // Get state from query params (default to GA for testing)
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') || 'GA'
  const city = searchParams.get('city') || 'Atlanta'

  try {
    const results: any = {
      state,
      city,
      apiKey: fbiApiKey.substring(0, 10) + '...', // Show partial key for security
      endpoints: {},
      errors: [],
    }

    // 1. Get state-level crime data
    // Date format should be MM-YYYY
    const fromDate = '01-2020'
    const toDate = '12-2023'
    
    // Try different offense types - "all" is invalid, try specific types
    const offenseTypes = ['violent-crime', 'property-crime', 'larceny', 'burglary', 'robbery', 'assault']
    
    // Try without offense type first (might list available types)
    const stateUrlBase = `https://api.usa.gov/crime/fbi/cde/arrest/state/${state}?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
    
    // Try multiple offense types
    results.endpoints.state = {
      attempts: []
    }
    
    for (const offenseType of ['violent-crime', 'property-crime', 'larceny', 'burglary']) {
      const testUrl = `https://api.usa.gov/crime/fbi/cde/arrest/state/${state}/${offenseType}?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
      
      try {
        console.log(`Trying offense type: ${offenseType}`)
        const res = await fetch(testUrl, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        const attempt: any = {
          offenseType,
          url: testUrl.replace(fbiApiKey, 'API_KEY_HIDDEN'),
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        }
        
        if (res.ok) {
          const data = await res.json()
          attempt.data = data
          attempt.dataSize = JSON.stringify(data).length
          results.endpoints.state.success = attempt
          break // Found a working endpoint
        } else {
          const errorText = await res.text()
          attempt.error = errorText
        }
        
        results.endpoints.state.attempts.push(attempt)
      } catch (err) {
        results.endpoints.state.attempts.push({
          offenseType,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    
    // Also try the base endpoint (might list available types)
    try {
      const baseRes = await fetch(stateUrlBase, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (baseRes.ok) {
        const baseData = await baseRes.json()
        results.endpoints.state.baseEndpoint = {
          url: stateUrlBase.replace(fbiApiKey, 'API_KEY_HIDDEN'),
          data: baseData,
          note: 'Base endpoint - might show available offense types'
        }
      }
    } catch (err) {
      // Ignore base endpoint errors
    }

    // 2. Get agency-level data - try both query param and header auth
    const agencyUrl = `https://api.usa.gov/crime/fbi/cde/agency/${state}?API_KEY=${fbiApiKey}`
    const agencyUrlWithHeader = `https://api.usa.gov/crime/fbi/cde/agency/${state}`
    
    try {
      console.log('Fetching FBI agency data from:', agencyUrl.replace(fbiApiKey, 'API_KEY_HIDDEN'))
      
      // Try with query parameter first
      let agencyRes = await fetch(agencyUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      // If that fails, try with header
      if (!agencyRes.ok && agencyRes.status === 403) {
        console.log('Trying agency endpoint with header auth')
        agencyRes = await fetch(agencyUrlWithHeader, {
          headers: {
            'Accept': 'application/json',
            'X-API-Key': fbiApiKey,
            'API-Key': fbiApiKey,
          },
        })
      }
      
      results.endpoints.agency = {
        url: agencyUrl.replace(fbiApiKey, 'API_KEY_HIDDEN'),
        status: agencyRes.status,
        statusText: agencyRes.statusText,
        ok: agencyRes.ok,
      }
      
      if (agencyRes.ok) {
        const agencyData = await agencyRes.json()
        results.endpoints.agency.data = agencyData
        results.endpoints.agency.dataSize = JSON.stringify(agencyData).length
      } else {
        const errorText = await agencyRes.text()
        results.endpoints.agency.error = errorText
        results.errors.push(`Agency endpoint error: ${agencyRes.status} - ${errorText}`)
      }
    } catch (err) {
      results.endpoints.agency.error = err instanceof Error ? err.message : 'Unknown error'
      results.errors.push(`Agency endpoint exception: ${results.endpoints.agency.error}`)
    }

    // 3. Get NIBRS data
    const nibrsUrl = `https://api.usa.gov/crime/fbi/cde/nibrs/${state}?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
    const nibrsUrlWithHeader = `https://api.usa.gov/crime/fbi/cde/nibrs/${state}?from=${fromDate}&to=${toDate}`
    
    try {
      console.log('Fetching FBI NIBRS data from:', nibrsUrl.replace(fbiApiKey, 'API_KEY_HIDDEN'))
      
      // Try with query parameter first
      let nibrsRes = await fetch(nibrsUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      // If that fails, try with header
      if (!nibrsRes.ok && nibrsRes.status === 403) {
        console.log('Trying NIBRS endpoint with header auth')
        nibrsRes = await fetch(nibrsUrlWithHeader, {
          headers: {
            'Accept': 'application/json',
            'X-API-Key': fbiApiKey,
            'API-Key': fbiApiKey,
          },
        })
      }
      
      results.endpoints.nibrs = {
        url: nibrsUrl.replace(fbiApiKey, 'API_KEY_HIDDEN'),
        status: nibrsRes.status,
        statusText: nibrsRes.statusText,
        ok: nibrsRes.ok,
      }
      
      if (nibrsRes.ok) {
        const nibrsData = await nibrsRes.json()
        results.endpoints.nibrs.data = nibrsData
        results.endpoints.nibrs.dataSize = JSON.stringify(nibrsData).length
      } else {
        const errorText = await nibrsRes.text()
        results.endpoints.nibrs.error = errorText
        results.errors.push(`NIBRS endpoint error: ${nibrsRes.status} - ${errorText}`)
      }
    } catch (err) {
      results.endpoints.nibrs.error = err instanceof Error ? err.message : 'Unknown error'
      results.errors.push(`NIBRS endpoint exception: ${results.endpoints.nibrs.error}`)
    }

    // Also try alternative FBI endpoints with valid offense types
    results.endpoints.summarized = {
      attempts: []
    }
    
    for (const offenseType of ['violent-crime', 'property-crime', 'larceny']) {
      const altUrl = `https://api.usa.gov/crime/fbi/cde/summarized/state/${state}/${offenseType}?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
      
      try {
        const altRes = await fetch(altUrl, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        const attempt: any = {
          offenseType,
          url: altUrl.replace(fbiApiKey, 'API_KEY_HIDDEN'),
          status: altRes.status,
          statusText: altRes.statusText,
          ok: altRes.ok,
        }
        
        if (altRes.ok) {
          const altData = await altRes.json()
          attempt.data = altData
          attempt.dataSize = JSON.stringify(altData).length
          results.endpoints.summarized.success = attempt
          break
        } else {
          const errorText = await altRes.text()
          attempt.error = errorText
        }
        
        results.endpoints.summarized.attempts.push(attempt)
      } catch (err) {
        results.endpoints.summarized.attempts.push({
          offenseType,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Test county-level data if we have coordinates
    const testLat = searchParams.get('lat')
    const testLng = searchParams.get('lng')
    
    if (testLat && testLng) {
      results.countyTest = {
        coordinates: { lat: testLat, lng: testLng },
        attempts: []
      }
      
      // Get county from coordinates
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${testLat},${testLng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        const geoRes = await fetch(geocodeUrl)
        const geoData = await geoRes.json()
        
        if (geoData.status === 'OK' && geoData.results[0]) {
          const components = geoData.results[0].address_components
          let county = ''
          let countyState = ''
          
          for (const component of components) {
            if (component.types.includes('administrative_area_level_2')) {
              county = component.long_name.replace(' County', '').replace(' Parish', '')
            }
            if (component.types.includes('administrative_area_level_1')) {
              countyState = component.short_name || component.long_name
            }
          }
          
          if (county && countyState) {
            results.countyTest.county = county
            results.countyTest.state = countyState
            
            // Try county endpoints
            const countyName = county.replace(/\s+/g, '-').toLowerCase()
            for (const offenseType of ['violent-crime', 'property-crime']) {
              const countyUrl = `https://api.usa.gov/crime/fbi/cde/summarized/county/${countyState}/${countyName}/${offenseType}?from=${fromDate}&to=${toDate}&API_KEY=${fbiApiKey}`
              
              try {
                const countyRes = await fetch(countyUrl, {
                  headers: {
                    'Accept': 'application/json',
                  },
                })
                
                const attempt: any = {
                  offenseType,
                  url: countyUrl.replace(fbiApiKey, 'API_KEY_HIDDEN'),
                  status: countyRes.status,
                  statusText: countyRes.statusText,
                  ok: countyRes.ok,
                }
                
                if (countyRes.ok) {
                  const data = await countyRes.json()
                  attempt.data = data
                  attempt.dataSize = JSON.stringify(data).length
                  results.countyTest.success = attempt
                } else {
                  const errorText = await countyRes.text()
                  attempt.error = errorText
                }
                
                results.countyTest.attempts.push(attempt)
              } catch (err) {
                results.countyTest.attempts.push({
                  offenseType,
                  error: err instanceof Error ? err.message : 'Unknown error'
                })
              }
            }
          }
        }
      } catch (err) {
        results.countyTest.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch FBI data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

