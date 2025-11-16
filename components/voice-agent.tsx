'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Map, X } from 'lucide-react';
import Script from 'next/script';
import { NavigationMap } from './navigation-map';
import { StreetViewGalleryWrapper } from './StreetViewGalleryWrapper';
import { SafetyAnalysisOverlay } from './SafetyAnalysisOverlay';

type ConversationItem = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type RoutePoint = {
  lat: number;
  lng: number;
  label?: string;
};

type RouteData = {
  origin?: RoutePoint;
  destination?: RoutePoint;
  waypoints?: RoutePoint[];
};

export function VoiceAgent() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [routeData, setRouteData] = useState<RouteData>({});
  const [showDirections, setShowDirections] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showSafetyAnalysis, setShowSafetyAnalysis] = useState(false);
  const [safetyAnalysisLocation, setSafetyAnalysisLocation] = useState<string>('');
  const [splineLoaded, setSplineLoaded] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioElementRef.current) {
      audioElementRef.current = document.createElement('audio');
      audioElementRef.current.autoplay = true;
      // Configure audio element for high-quality playback
      audioElementRef.current.volume = 1.0;
      audioElementRef.current.preload = 'auto';
    }
  }, []);

  async function startVoiceSession() {
    try {
      setStatus('connecting');
      setError(null);
      setConversation([]);
      setRouteData({});
      setShowDirections(false);

      console.log('[v0] Fetching ephemeral key...');
      
      const tokenResponse = await fetch('/api/realtime-token');
      if (!tokenResponse.ok) {
        const data = await tokenResponse.json();
        throw new Error(data.error || 'Failed to get realtime token');
      }
      
      const { ephemeral_key } = await tokenResponse.json();
      console.log('[v0] Got ephemeral key');

      // Configure RTCPeerConnection for high-quality audio
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });
      
      peerConnectionRef.current = pc;

      if (audioElementRef.current) {
        pc.ontrack = (e) => {
          console.log('[v0] Received remote audio track');
          if (audioElementRef.current) {
            audioElementRef.current.srcObject = e.streams[0];
          }
        };
      }

      console.log('[v0] Requesting microphone access...');
      // Request high-quality audio with optimal settings
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // High-quality sample rate
          channelCount: 1,
        }
      });
      pc.addTrack(ms.getTracks()[0]);
      console.log('[v0] Added local audio track with high-quality settings');

      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      
      dc.onopen = () => {
        console.log('[v0] Data channel opened');
        const sessionUpdate = {
          type: 'session.update',
          session: {
            instructions: `You are a professional navigation and route optimization assistant for Urban Buzz AI, specializing in delivery logistics and efficient route planning for businesses and delivery services.

IMPORTANT - PROFESSIONAL SPEAKING STYLE:
- Speak in a CLEAR, PROFESSIONAL, and EFFICIENT manner - like a business assistant
- Use professional language while remaining approachable and friendly
- Be concise and direct - time is valuable in delivery operations
- Use contractions naturally: "you're", "it's", "that's", "I'll", "we're" - but maintain professionalism
- Sound confident and knowledgeable - you're an expert in logistics and navigation
- Keep responses focused and actionable - delivery drivers need clear, quick information
- ALWAYS be POLITE and PROFESSIONAL - use "please", "thank you" appropriately
- Be respectful and efficient - like a professional logistics coordinator

YOUR ROLE - DELIVERY & LOGISTICS FOCUS:
You are a professional route optimization assistant designed for delivery services, logistics operations, and efficient navigation. You help:
- Delivery drivers optimize their routes
- Businesses plan efficient delivery schedules
- Logistics coordinators analyze route conditions
- Ensure timely and safe deliveries

FIRST INTERACTION:
- When the conversation starts, IMMEDIATELY greet the user in a professional, efficient manner
- Say something like: "Hello, I'm your route optimization assistant. I can help you plan an efficient delivery route. What's your pickup and delivery location?" or "Good day, I'm here to assist with route planning. Please provide your starting point and destination."
- Be professional, courteous, and efficient - like a logistics coordinator
- Don't wait for the user to speak first - initiate the conversation professionally
- Always use professional language: "please", "thank you", "I can help you", "I'll assist you"
- When asking for locations, be flexible - accept addresses, landmarks, place names, or city names
- If a location is unclear, professionally request clarification: "Could you please provide more specific details? For example, include the city and state, or a nearby landmark."

Your Professional Approach:
- Professional, courteous, and efficient at all times
- Clear, direct, and solution-focused
- Quick and precise with route information
- Business-oriented and results-driven
- Professional yet approachable tone - like a logistics expert
- Speak at a clear, professional pace - efficient but not rushed
- Always use "please" when requesting information
- Acknowledge information professionally: "Thank you" or "Got it"
- Use "you're welcome" when appropriate

Your Professional Role:
You are a PROFESSIONAL route optimization assistant - designed for delivery and logistics operations. You provide:
- Efficient route planning optimized for delivery operations
- Real-time traffic and condition analysis
- Professional route analysis (accessibility, safety, efficiency)
- Business-grade navigation assistance
- Delivery-focused route optimization
- Landmark-based directions for practical navigation
- Visual route confirmation and analysis

LOCATION DETECTION - CRITICAL:
- When users provide ANY location information (names, addresses, landmarks, cities), IMMEDIATELY use the geocode_address function
- Be flexible with location formats - try geocoding even if the address seems incomplete
- **WORKS WORLDWIDE** - Supports locations in the UK, US, and globally
- Common location formats that work:
  * **US locations:**
    - City names: "Atlanta", "New York", "Los Angeles"
    - City with state: "Atlanta, GA", "New York, NY"
    - Full addresses: "120 Piedmont Ave NE, Atlanta, GA"
    - Landmarks: "Times Square", "Central Park", "Empire State Building"
    - Neighborhoods: "Midtown Atlanta", "Downtown Manhattan"
  * **UK locations:**
    - City names: "London", "Manchester", "Birmingham"
    - City with area: "London, UK", "Manchester, England"
    - UK postcodes: "SW1A 1AA", "M1 1AA", "B1 1AA"
    - Full UK addresses: "10 Downing Street, London, UK", "Oxford Street, London"
    - UK landmarks: "Big Ben", "Tower Bridge", "Buckingham Palace", "Hyde Park"
    - UK neighborhoods: "Westminster", "Camden", "Shoreditch", "Soho"
    - UK train stations: "King's Cross Station", "Paddington Station", "Victoria Station"
  * **International:**
    - Any city name with country: "Paris, France", "Tokyo, Japan"
    - International landmarks and addresses
- If geocoding fails with status "ZERO_RESULTS":
  * Politely ask: "I couldn't find that location. Could you please provide a more specific address? For example, include the city and country (or state for US), or a nearby landmark."
  * Try alternative phrasings if the user provides more context
- If geocoding returns "REQUEST_DENIED" or other errors:
  * Inform the user: "I'm having trouble accessing location services. Please try again in a moment."
- ALWAYS try to geocode first - don't assume a location won't work
- If the user says "here" or "my location", ask them to provide their current address or a nearby landmark

When users ask for directions:

1. Ask for their starting point and destination (as addresses, landmarks, or place names - NOT coordinates)
2. When you receive location names/addresses, you MUST geocode them to get coordinates using the geocode_address function
3. If geocoding fails, ask the user for a more complete address with city and state
4. Provide clear, step-by-step directions using LANDMARKS and VISUAL CUES - NOT street names
5. When you have coordinates, USE THE generate_map FUNCTION to display the route visually
6. Offer route analysis for accessibility, safety, and best paths
7. Help users find nearby places with ratings and recommendations

IMPORTANT - GIVING DIRECTIONS:
- NEVER mention street names, road names, or highway numbers - users find these confusing
- ALWAYS use landmarks, buildings, shops, signs, and visual cues instead
- Examples of what to say:
  * "Head towards the big red building on your left"
  * "Walk past the coffee shop and turn right at the park"
  * "You'll see a gas station - turn left there"
  * "Go straight until you see the blue sign, then turn right"
  * "Keep walking until you pass the grocery store, then take the next left"
- Use easy-to-spot visual references: buildings, shops, parks, signs, traffic lights, intersections
- Describe what they'll SEE, not what the street is called
- Make directions simple and visual - like giving directions to a friend who doesn't know the area

IMPORTANT: 
- NEVER ask users for latitude/longitude coordinates - they will give you addresses, place names, or landmarks
- When users provide location names, FIRST call geocode_address to convert them to coordinates
- Then use those coordinates in generate_map or show_street_view functions
- Always use the label field to store the original address/name the user provided

STREET VIEW IMAGES:
When users say things like:
- "show images"
- "show me the views"
- "show street view"
- "show me what it looks like"
- "show pictures along the way"
- "I want to see the route"
- "show me images from origin to destination"
- Or any variation asking to see images/views/pictures of the route

You MUST call the show_street_view function. If you already have coordinates from a previous route, use those. Otherwise, geocode the addresses first using geocode_address, then call show_street_view.

Example:
User: "Show me images along the way"
You: "Absolutely! Let me show you Street View images along your route. [If you have coordinates, CALL show_street_view directly. Otherwise, first geocode addresses, then call show_street_view]"

ROUTE ANALYSIS:
When users ask about:
- "accessibility" or "wheelchair access" or "accessible"
- "safety" or "is it safe" or "safety concerns"
- "curves" or "turns" or "sharp turns"
- "infrastructure" or "sidewalks" or "bike lanes"
- "hazards" or "obstacles" or "dangerous areas"
- "what's along the route" or "route conditions"
- Or any question about features/conditions along the route

**IMPORTANT**: If you already have route data with pit stops from a previous analyze_route or show_street_view call, you ALREADY KNOW the pit stops and their analysis. Use that existing information instead of calling analyze_route again. Reference specific pit stops by step number: "At Step 3, you'll encounter..."

You MUST call the analyze_route function if you don't have existing pit stop data. If you already have coordinates from a previous route (from generate_map), you can call analyze_route without parameters or with just the origin/destination strings. Otherwise, geocode the addresses first, then call analyze_route. This will analyze all pit stops along the route and provide detailed information about accessibility, safety, curves, infrastructure, and hazards.

Example:
User: "What about accessibility along this route?"
You: "Let me analyze the accessibility features along your route. [If you have pit stop data, use it. Otherwise CALL analyze_route] Based on the analysis, here's what I found about accessibility, safety, and infrastructure along your route. At Step 1, you'll find [detailed accessibility info]. At Step 2, there's [detailed info]. [Continue for each pit stop with specific details]"

SAFETY ANALYSIS:
When users ask about:
- "show safety analysis" or "safety analysis" or "safety stats"
- "safety statistics" or "crime statistics" or "safety data"
- "how safe is [location]" or "safety report for [location]"
- "show me safety information" or "safety details"
- Or any request to see comprehensive safety analysis for a specific location

You MUST call the show_safety_analysis function. If the user provides a location, use it. If they don't specify a location, ask them which location they'd like to analyze, or use their current location/destination if available from previous conversation.

Example:
User: "Show safety analysis"
You: "I'd be happy to show you the safety analysis. Which location would you like me to analyze? [If they provide a location, CALL show_safety_analysis with that location]"

CLOSING OVERLAYS:
When users say:
- "close" or "close that" or "close it"
- "close the overlay" or "close the images" or "close the map"
- "close safety analysis" or "close street view"
- "hide that" or "hide the overlay"
- "go back" or "back" (when an overlay is open)
- "dismiss" or "close everything"
- Or any variation asking to close or hide an open overlay

You MUST call the close_overlay function. If the user specifies which overlay (e.g., "close the images"), use that specific type. Otherwise, use "all" to close everything. This allows users to control the interface completely by voice without touching the keyboard.

Example:
User: "Close that"
You: "I'll close the overlay for you. [CALL close_overlay with overlay_type="all"]"

User: "Close the map"
You: "I'll close the map for you. [CALL close_overlay with overlay_type="map"]"

ENDING CONVERSATION:
When users say:
- "end conversation" or "end the conversation"
- "stop" or "stop talking" or "stop the conversation"
- "goodbye" or "bye" or "see you later"
- "that's all" or "I'm done" or "we're done"
- "finish" or "end session" or "disconnect"
- Or any variation asking to end or stop the conversation

You MUST call the end_conversation function. Be polite and say goodbye before calling it.

Example:
User: "End conversation"
You: "Thank you for using Urban Buzz AI! Have a great day! [CALL end_conversation]"

User: "That's all, thanks"
You: "You're welcome! It was great helping you. Goodbye! [CALL end_conversation]"

MARTA STATION FINDER:
When users ask about:
- "closest MARTA station" or "nearest MARTA station"
- "where is the MARTA station" or "MARTA stop near me"
- "how to get to MARTA" or "MARTA from here"
- "find MARTA station" or any variation asking about MARTA transit stations

You MUST call the find_marta_station function. If you have the user's current location coordinates (from a previous route or geocode), use those. Otherwise, first ask the user for their location or geocode their address using geocode_address, then call find_marta_station with the coordinates or address.

Example:
User: "What's the closest MARTA station?"
You: "Let me find the closest MARTA station for you. [If you have coordinates, CALL find_marta_station with location. Otherwise, geocode the address first, then call find_marta_station] The closest MARTA station is..."

NEARBY PLACES FINDER:
When users ask about:
- "nearest" or "closest" places (e.g., "nearest Chick-fil-A", "closest coffee shop", "nearest gas station")
- "best rated" places (e.g., "best rated restaurant", "highest rated pizza place")
- "nearby" places (e.g., "nearby restaurants", "nearby stores", "nearby pharmacy")
- Any question about finding businesses, restaurants, stores, services near a location

You MUST call the find_nearby_places function. If you have the user's current location coordinates (from a previous route or geocode), use those. Otherwise, first geocode their address using geocode_address, then call find_nearby_places with the coordinates or address and the search query.

The function returns results sorted by rating (best first) and distance, so you can tell users about the best-rated options.

Example:
User: "Where's the nearest Chick-fil-A?"
You: "Let me find the nearest Chick-fil-A for you. [CALL find_nearby_places with location and query='Chick-fil-A'] The nearest Chick-fil-A is [name], located at [address]. It has a [rating] star rating with [number] reviews, and it's about [distance] away ([duration] by car)."

User: "What's the best rated restaurant nearby?"
You: "Let me find the best rated restaurants near you. [CALL find_nearby_places with location and query='restaurant'] The best rated restaurant nearby is [name] with a [rating] star rating..."

DISABILITY ASSISTANCE - CRITICAL:
When assisting users with disabilities, provide EXTREMELY DETAILED analysis:

For Wheelchair Users:
- Curb cuts and ramps: Describe every curb cut, ramp, and accessible entry point along the route
- Sidewalk conditions: Detail sidewalk width, surface quality, cracks, obstacles, and maintenance
- Elevation changes: Warn about hills, slopes, and elevation changes that may be challenging
- Accessible crossings: Identify all accessible crosswalks, pedestrian signals, and crossing points
- Obstacles: Mention every potential obstacle - poles, signs, bins, construction, parked vehicles
- Rest areas: Point out benches, rest stops, and places to pause along the route
- Building access: Note accessible entrances, automatic doors, and step-free access

For Visual Impairments:
- Landmarks: Provide detailed descriptions of landmarks, buildings, and visual cues
- Audio cues: Mention traffic sounds, pedestrian signals, and environmental audio cues
- Tactile guidance: Note tactile paving, guide paths, and physical navigation aids
- Lighting: Describe lighting conditions, especially at night or in tunnels
- Clear paths: Identify clear, unobstructed paths and warn about narrow passages

For Mobility Impairments:
- Step-free routes: Prioritize routes without stairs or steps
- Elevators and lifts: Identify all elevators, lifts, and escalators along the route
- Seating: Point out benches, seating areas, and rest stops
- Distance: Provide accurate distances between key points
- Surface conditions: Detail pavement quality, slippery surfaces, and uneven terrain

For All Disabilities:
- Be patient and thorough - Provide more detail than you would for able-bodied users
- Use clear, descriptive language - Describe exactly what they'll encounter
- Anticipate challenges - Warn about potential difficulties before they encounter them
- Offer alternatives - If a route has accessibility issues, suggest alternative routes
- Be encouraging - Acknowledge challenges but remain positive and supportive

DEEP CURVE ANALYSIS - CRITICAL:
When discussing curves, turns, or bends, provide EXTREMELY DETAILED analysis:

For EVERY curve along the route, describe:
1. Location: Which step/pit stop the curve is at (e.g., "At Step 3, approximately 50 meters after the coffee shop")
2. Sharpness: 
   - Gentle curve (wide, gradual turn)
   - Moderate curve (noticeable turn, but manageable)
   - Sharp curve (tight turn requiring slower speed)
   - Very sharp curve (extremely tight, potentially dangerous)
3. Radius: Estimate the curve radius if possible (e.g., "approximately 10-meter radius")
4. Visibility:
   - Clear visibility ahead (can see oncoming traffic/pedestrians)
   - Limited visibility (partial obstruction)
   - Poor visibility (blind curve, cannot see around the corner)
5. Direction: Left turn, right turn, or S-curve
6. Surface conditions: Road/path surface quality at the curve
7. Accessibility concerns:
   - For wheelchair users: Is the curve wide enough? Are there obstacles?
   - For visual impairments: Are there tactile cues? Is the path clearly marked?
   - For mobility impairments: Is the curve on a slope? Are there handrails?
8. Safety factors:
   - Traffic patterns at the curve
   - Pedestrian safety considerations
   - Lighting conditions
   - Signage and warnings
9. Landmarks at the curve: What will they see at or near the curve to help identify it
10. Recommendations: Speed suggestions, cautionary advice, alternative paths if needed

Example of detailed curve analysis:
"At Step 4, about 30 meters after you pass the red brick building on your left, you'll encounter a moderate right-hand curve. The curve has approximately a 15-meter radius, so it's not too sharp, but you'll need to slow down slightly. Visibility is good - you can see about 50 meters ahead around the curve. The road surface is smooth asphalt with good traction. For wheelchair users, the curve is wide enough with no obstacles, and there's a well-maintained sidewalk throughout. There's a blue sign on the right side of the curve that says 'Slow' - that's your landmark. The curve is well-lit at night with streetlights on both sides. I recommend taking this curve at a comfortable walking pace, and you'll see a small park on your left as you complete the turn."

USING EXISTING PIT STOP DATA:
- When you've called analyze_route or show_street_view, you receive detailed pit stop information
- This includes: step numbers, addresses, coordinates, images, and analysis for each pit stop
- DO NOT call analyze_route again if you already have this data - use what you know
- Reference specific steps: "At Step 2, the analysis shows..." or "According to the pit stop data at Step 5..."
- When users ask about accessibility, curves, or route conditions, reference the specific pit stops you already know about
- Provide step-by-step guidance using the pit stop data: "Starting from Step 1, you'll encounter... then at Step 2..."

Professional Communication Style:
- Always be PROFESSIONAL and EFFICIENT - use "please", "thank you" appropriately
- Start by professionally requesting route information: "I can help optimize your route. Please provide your starting location and destination." or "What's your pickup and delivery address?"
- Provide clear, actionable directions using LANDMARKS for easier navigation
- Use professional, efficient language with visual cues: 
  * "Proceed straight until you see the blue building on your right"
  * "Turn right at the coffee shop"
  * "Continue past the park and turn left at the large sign"
  * "Proceed until you see the gas station, then turn right"
- NEVER use street names like "Turn left on Main Street" - use landmarks instead
- Use landmarks: "Turn left at the red building" or "Continue straight past the grocery store"
- Check in professionally: "Do you see the park on your left? Let me know if you need clarification."
- Be supportive and professional: "You're on track. Almost there. Let me know if you need any assistance."
- Always generate a map when providing route directions
- When users request visual confirmation, call show_street_view
- When users need route analysis, call analyze_route
- When users need nearby locations, use find_nearby_places for business information
- Acknowledge professionally: "Thank you" or "I appreciate your business"
- NEVER mention you're an AI - present as a professional navigation system
- Remember: Landmarks and visual cues are more practical than street names for delivery operations
- Be proactive: Offer route optimization and analysis when relevant
- Provide context: Include relevant details about route conditions and delivery considerations
- Be THOROUGH for accessibility - Provide detailed information for accessible delivery routes
- Provide COMPREHENSIVE route analysis - Detailed analysis of all route factors (curves, accessibility, safety, efficiency)
- Use existing route data efficiently - Reference known route information instead of re-analyzing
- Support multiple locations - Handle various address formats including UK postcodes and international addresses
- When users mention disabilities or ask about accessibility, provide comprehensive, step-by-step analysis using pit stop data`,
            voice: 'sage', // Previous voice that was better
            temperature: 0.8, // Higher for more natural, conversational speech
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 200, // Shorter padding for faster response
              silence_duration_ms: 400, // Shorter silence detection for more natural flow
            },
            tools: [
              {
                type: 'function',
                name: 'analyze_route',
                description: 'Analyze the route from origin to destination for accessibility, safety, curves, infrastructure, and hazards. Call this when users ask about route conditions, accessibility, safety, or any features along the way. Returns detailed analysis of all pit stops along the route. If a route is already established (from generate_map), you can call this without parameters or with just address strings - it will use the existing route data.',
                parameters: {
                  type: 'object',
                  properties: {
                    origin: {
                      type: 'string',
                      description: 'Origin address or location name (e.g., "Times Square" or coordinates as "lat,lng"). Optional if route is already established.',
                    },
                    destination: {
                      type: 'string',
                      description: 'Destination address or location name (e.g., "Central Park" or coordinates as "lat,lng"). Optional if route is already established.',
                    },
                  },
                  required: [],
                },
              },
              {
                type: 'function',
                name: 'geocode_address',
                description: 'Convert an address, place name, or landmark to coordinates (latitude and longitude). Use this BEFORE calling generate_map or show_street_view when you only have address names. Call this for each location separately.',
                parameters: {
                  type: 'object',
                  properties: {
                    address: {
                      type: 'string',
                      description: 'The address, place name, landmark, or location description (e.g., "Times Square", "Central Park, New York", "120 piedmont ave ne, Atlanta")',
                    },
                  },
                  required: ['address'],
                },
              },
              {
                type: 'function',
                name: 'show_street_view',
                description: 'Display Street View images along the route from origin to destination. Call this when users ask to see images, views, pictures, or want to visualize what the route looks like. You can use coordinates from previous geocode_address calls or from existing route data.',
                parameters: {
                  type: 'object',
                  properties: {
                    origin: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number', description: 'Latitude of starting point (from geocode_address)' },
                        lng: { type: 'number', description: 'Longitude of starting point (from geocode_address)' },
                        label: { type: 'string', description: 'Original address/name the user provided' },
                      },
                      required: ['lat', 'lng'],
                    },
                    destination: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number', description: 'Latitude of destination point (from geocode_address)' },
                        lng: { type: 'number', description: 'Longitude of destination point (from geocode_address)' },
                        label: { type: 'string', description: 'Original address/name the user provided' },
                      },
                      required: ['lat', 'lng'],
                    },
                  },
                  required: ['origin', 'destination'],
                },
              },
              {
                type: 'function',
                name: 'generate_map',
                description: 'Display a navigation map with route from origin to destination. Call this whenever providing directions between two locations.',
                parameters: {
                  type: 'object',
                  properties: {
                    origin: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number', description: 'Latitude of starting point' },
                        lng: { type: 'number', description: 'Longitude of starting point' },
                        label: { type: 'string', description: 'Name/description of starting point' },
                      },
                      required: ['lat', 'lng'],
                    },
                    destination: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number', description: 'Latitude of destination' },
                        lng: { type: 'number', description: 'Longitude of destination' },
                        label: { type: 'string', description: 'Name/description of destination' },
                      },
                      required: ['lat', 'lng'],
                    },
                    waypoints: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          lat: { type: 'number' },
                          lng: { type: 'number' },
                          label: { type: 'string' },
                        },
                      },
                      description: 'Optional waypoints along the route',
                    },
                  },
                  required: ['origin', 'destination'],
                },
              },
              {
                type: 'function',
                name: 'find_marta_station',
                description: 'Find the closest MARTA (Metropolitan Atlanta Rapid Transit Authority) station to a given location. Use this when users ask about the closest MARTA station, nearest MARTA stop, or how to get to MARTA from their location.',
                parameters: {
                  type: 'object',
                  properties: {
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number', description: 'Latitude of the location' },
                        lng: { type: 'number', description: 'Longitude of the location' },
                      },
                      description: 'Coordinates of the location. If not provided, use address instead.',
                    },
                    address: {
                      type: 'string',
                      description: 'Address or location name (e.g., "120 piedmont ave ne, Atlanta"). Use this if coordinates are not available.',
                    },
                  },
                  required: [],
                },
              },
              {
                type: 'function',
                name: 'find_nearby_places',
                description: 'Find nearby places like restaurants, stores, gas stations, etc. with ratings and distance. Use this when users ask about "nearest", "closest", "best rated", "nearby" places like restaurants, stores, or any business. Returns results sorted by rating (best first) and distance.',
                parameters: {
                  type: 'object',
                  properties: {
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number', description: 'Latitude of the location' },
                        lng: { type: 'number', description: 'Longitude of the location' },
                      },
                      description: 'Coordinates of the location. If not provided, use address instead.',
                    },
                    address: {
                      type: 'string',
                      description: 'Address or location name. Use this if coordinates are not available.',
                    },
                    query: {
                      type: 'string',
                      description: 'What to search for (e.g., "Chick-fil-A", "coffee shop", "gas station", "restaurant", "grocery store", "pharmacy").',
                    },
                    type: {
                      type: 'string',
                      description: 'Optional place type (e.g., "restaurant", "store", "gas_station", "pharmacy", "hospital").',
                    },
                  },
                  required: ['query'],
                },
              },
              {
                type: 'function',
                name: 'close_overlay',
                description: 'Close any open overlay windows (Street View images, Safety Analysis, Maps, etc.). Call this when users say "close", "close that", "close the overlay", "hide that", "close the images", "close the map", "close the safety analysis", "go back", or any variation asking to close or hide an open overlay.',
                parameters: {
                  type: 'object',
                  properties: {
                    overlay_type: {
                      type: 'string',
                      description: 'Type of overlay to close: "street_view", "safety_analysis", "map", or "all" to close everything.',
                      enum: ['street_view', 'safety_analysis', 'map', 'all']
                    },
                  },
                  required: ['overlay_type'],
                },
              },
              {
                type: 'function',
                name: 'end_conversation',
                description: 'End the voice conversation session. Call this when users say "end conversation", "end", "stop", "goodbye", "bye", "that\'s all", "I\'m done", "we\'re done", "finish", or any variation asking to end or stop the conversation.',
                parameters: {
                  type: 'object',
                  properties: {},
                  required: [],
                },
              },
            ],
          },
        };
        
        dc.send(JSON.stringify(sessionUpdate));
        console.log('[v0] Sent session update with map function');
        
        // Make AI speak first with a greeting
        setTimeout(() => {
          if (dataChannelRef.current) {
            const responseCreate = {
              type: 'response.create',
            };
            dataChannelRef.current.send(JSON.stringify(responseCreate));
            console.log('[v0] Triggered initial AI greeting');
          }
        }, 500); // Small delay to ensure session is ready
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('[v0] Received event:', event.type);
          
          if (event.type === 'response.function_call_arguments.done') {
            try {
              console.log('[v0] Function call completed:', event);
              const callId = event.call_id;
              const name = event.name;
              const args = JSON.parse(event.arguments);
              
              if (name === 'geocode_address') {
                console.log('[v0] Geocoding address:', args.address);
                const address = args.address;
                
                if (!address || address.trim() === '') {
                  if (dataChannelRef.current) {
                    const resultEvent = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify({ 
                          error: 'Please provide an address or location name to geocode.' 
                        }),
                      },
                    };
                    dataChannelRef.current.send(JSON.stringify(resultEvent));
                    
                    const responseCreate = {
                      type: 'response.create',
                    };
                    dataChannelRef.current.send(JSON.stringify(responseCreate));
                  }
                  return;
                }
                
                const geocodeUrl = `/api/geocode?address=${encodeURIComponent(address)}`;
                
                fetch(geocodeUrl)
                  .then(res => {
                    if (!res.ok) {
                      throw new Error(`Geocoding API returned status ${res.status}`);
                    }
                    return res.json();
                  })
                  .then(geocodeData => {
                    console.log('[v0] Geocoding response:', geocodeData);
                    
                    if (geocodeData.error) {
                      throw new Error(geocodeData.error);
                    }
                    
                    if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
                      const location = geocodeData.results[0].geometry.location;
                      const result = {
                        lat: location.lat,
                        lng: location.lng,
                        label: geocodeData.results[0].formatted_address || address,
                      };
                      
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify(result),
                          },
                        };
                        dataChannelRef.current.send(JSON.stringify(resultEvent));
                        
                        const responseCreate = {
                          type: 'response.create',
                        };
                        dataChannelRef.current.send(JSON.stringify(responseCreate));
                        console.log('[v0] Sent geocode result:', result);
                      }
                    } else if (geocodeData.status === 'ZERO_RESULTS') {
                      throw new Error(`Could not find the location "${address}". Please try a more specific address or include the city and state.`);
                    } else if (geocodeData.status === 'REQUEST_DENIED') {
                      throw new Error('Geocoding request was denied. Please check your Google Maps API key permissions.');
                    } else {
                      throw new Error(`Geocoding failed: ${geocodeData.status || 'Unknown error'}. Please try a different address.`);
                    }
                  })
                  .catch(err => {
                    console.error('[v0] Geocoding error:', err);
                    const errorMessage = err.message || 'Failed to geocode address. Please provide a more specific location with city and state.';
                    
                    if (dataChannelRef.current) {
                      const resultEvent = {
                        type: 'conversation.item.create',
                        item: {
                          type: 'function_call_output',
                          call_id: callId,
                          output: JSON.stringify({ 
                            error: errorMessage,
                            suggestion: 'Try providing a more complete address, including city and state (e.g., "120 Piedmont Ave NE, Atlanta, GA")'
                          }),
                        },
                      };
                      dataChannelRef.current.send(JSON.stringify(resultEvent));
                      
                      const responseCreate = {
                        type: 'response.create',
                      };
                      dataChannelRef.current.send(JSON.stringify(responseCreate));
                    }
                  });
              } else if (name === 'analyze_route') {
                console.log('[v0] Analyzing route:', args);
                // Use provided args or fall back to existing routeData
                let originToUse = args.origin || routeData.origin;
                let destinationToUse = args.destination || routeData.destination;
                
                // If no args provided, use existing routeData
                if (!args.origin && !args.destination && routeData.origin && routeData.destination) {
                  originToUse = routeData.origin;
                  destinationToUse = routeData.destination;
                }
                
                // Convert coordinates to strings if needed
                const originStr = typeof originToUse === 'object' 
                  ? `${originToUse.lat},${originToUse.lng}` 
                  : typeof originToUse === 'string' ? originToUse
                  : '';
                const destStr = typeof destinationToUse === 'object'
                  ? `${destinationToUse.lat},${destinationToUse.lng}`
                  : typeof destinationToUse === 'string' ? destinationToUse
                  : '';

                if (!originStr || !destStr) {
                  // If no route data available, tell the AI
                  if (dataChannelRef.current) {
                    const resultEvent = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify({ 
                          success: false, 
                          message: 'Please provide origin and destination first. Ask the user for their starting point and destination, or establish a route first using generate_map.' 
                        }),
                      },
                    };
                    dataChannelRef.current.send(JSON.stringify(resultEvent));
                    
                    const responseCreate = {
                      type: 'response.create',
                    };
                    dataChannelRef.current.send(JSON.stringify(responseCreate));
                  }
                  return;
                }

                fetch('/api/route-analysis', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    origin: originStr,
                    destination: destStr,
                  }),
                })
                  .then(res => res.json())
                  .then(analysisData => {
                    if (analysisData.error) {
                      throw new Error(analysisData.error);
                    }

                    // Format the analysis for the AI
                    const summary = `Route Analysis Summary:

Total Stops Analyzed: ${analysisData.total_stops_analyzed}

ACCESSIBILITY:
- Overall Rating: ${analysisData.accessibility_summary.overall}
- Features Found: ${analysisData.accessibility_summary.features.join(', ') || 'None specifically noted'}

SAFETY:
- Observations: ${analysisData.safety_summary.observations.join('; ') || 'No major safety concerns'}
- Hazards: ${analysisData.safety_summary.hazards.join('; ') || 'No significant hazards detected'}

CURVES & TURNS:
${analysisData.curves_summary.length > 0 ? analysisData.curves_summary.map((c: string) => `- ${c}`).join('\n') : '- Mostly straight sections'}

INFRASTRUCTURE:
${analysisData.infrastructure_summary.length > 0 ? analysisData.infrastructure_summary.map((i: string) => `- ${i}`).join('\n') : '- Standard urban infrastructure'}

Detailed analysis available for ${analysisData.total_stops_analyzed} locations along the route.`;

                    if (dataChannelRef.current) {
                      const resultEvent = {
                        type: 'conversation.item.create',
                        item: {
                          type: 'function_call_output',
                          call_id: callId,
                          output: summary,
                        },
                      };
                      dataChannelRef.current.send(JSON.stringify(resultEvent));
                      
                      const responseCreate = {
                        type: 'response.create',
                      };
                      dataChannelRef.current.send(JSON.stringify(responseCreate));
                      console.log('[v0] Sent route analysis result');
                    }
                  })
                  .catch(err => {
                    console.error('[v0] Route analysis error:', err);
                    if (dataChannelRef.current) {
                      const resultEvent = {
                        type: 'conversation.item.create',
                        item: {
                          type: 'function_call_output',
                          call_id: callId,
                          output: JSON.stringify({ 
                            error: 'Failed to analyze route. Please try again.' 
                          }),
                        },
                      };
                      dataChannelRef.current.send(JSON.stringify(resultEvent));
                      
                      const responseCreate = {
                        type: 'response.create',
                      };
                      dataChannelRef.current.send(JSON.stringify(responseCreate));
                    }
                  });
              } else if (name === 'generate_map') {
                console.log('[v0] Generating map with args:', args);
                setRouteData({
                  origin: args.origin,
                  destination: args.destination,
                  waypoints: args.waypoints || [],
                });

                if (dataChannelRef.current) {
                  const resultEvent = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: JSON.stringify({ 
                        success: true, 
                        message: 'Map displayed successfully with route' 
                      }),
                    },
                  };
                  dataChannelRef.current.send(JSON.stringify(resultEvent));
                  
                  const responseCreate = {
                    type: 'response.create',
                  };
                  dataChannelRef.current.send(JSON.stringify(responseCreate));
                  console.log('[v0] Sent function result and requested response');
                }
              } else if (name === 'show_street_view') {
                console.log('[v0] Showing street view with args:', args);
                // Use provided args or fall back to existing routeData
                const originToUse = args.origin || routeData.origin;
                const destinationToUse = args.destination || routeData.destination;
                
                if (originToUse && destinationToUse) {
                  // Update route data if new args provided
                  if (args.origin && args.destination) {
                    setRouteData({
                      origin: args.origin,
                      destination: args.destination,
                      waypoints: args.waypoints || routeData.waypoints || [],
                    });
                  }
                  // Show street view overlay
                  setShowStreetView(true);
                } else {
                  // If no route data available, tell the AI
                  if (dataChannelRef.current) {
                    const resultEvent = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify({ 
                          success: false, 
                          message: 'Please provide origin and destination first. Ask the user for their starting point and destination.' 
                        }),
                      },
                    };
                    dataChannelRef.current.send(JSON.stringify(resultEvent));
                    
                    const responseCreate = {
                      type: 'response.create',
                    };
                    dataChannelRef.current.send(JSON.stringify(responseCreate));
                  }
                  return;
                }

                if (dataChannelRef.current) {
                  const resultEvent = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: JSON.stringify({ 
                        success: true, 
                        message: 'Street View images are now being displayed along your route' 
                      }),
                    },
                  };
                  dataChannelRef.current.send(JSON.stringify(resultEvent));
                  
                  const responseCreate = {
                    type: 'response.create',
                  };
                  dataChannelRef.current.send(JSON.stringify(responseCreate));
                  console.log('[v0] Sent function result and requested response');
                }
              } else if (name === 'find_marta_station') {
                console.log('[v0] Finding MARTA station:', args);
                
                // Determine location - use provided location, or geocode address, or use existing route origin
                let locationToUse = args.location
                let addressToUse = args.address
                
                // If no location provided but we have route data, use origin
                if (!locationToUse && !addressToUse && routeData.origin) {
                  locationToUse = routeData.origin
                }
                
                // If we have an address but no location, geocode it first
                if (addressToUse && !locationToUse) {
                  const geocodeUrl = `/api/geocode?address=${encodeURIComponent(addressToUse)}`
                  
                  fetch(geocodeUrl)
                    .then(res => res.json())
                    .then(geocodeData => {
                      if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results[0]) {
                        const loc = geocodeData.results[0].geometry.location
                        locationToUse = { lat: loc.lat, lng: loc.lng }
                        findMartaStation(locationToUse, addressToUse, callId)
                      } else {
                        throw new Error('Could not find the location')
                      }
                    })
                    .catch(err => {
                      console.error('[v0] Geocoding error for MARTA search:', err)
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify({ 
                              success: false, 
                              error: 'Could not find the location. Please provide a valid address or location.' 
                            }),
                          },
                        }
                        dataChannelRef.current.send(JSON.stringify(resultEvent))
                        
                        const responseCreate = {
                          type: 'response.create',
                        }
                        dataChannelRef.current.send(JSON.stringify(responseCreate))
                      }
                    })
                } else {
                  findMartaStation(locationToUse, addressToUse, callId)
                }
                
                function findMartaStation(location: any, address: string | undefined, callId: string) {
                  // Store the original location for map display
                  const originalLocation = location
                  const originalAddress = address
                  
                  fetch('/api/find-marta-station', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      location: location,
                      address: address,
                    }),
                  })
                    .then(res => res.json())
                    .then(martaData => {
                      if (martaData.error || !martaData.success) {
                        const errorMsg = martaData.message || martaData.error || 'Could not find a MARTA station nearby'
                        if (dataChannelRef.current) {
                          const resultEvent = {
                            type: 'conversation.item.create',
                            item: {
                              type: 'function_call_output',
                              call_id: callId,
                              output: JSON.stringify({ 
                                success: false, 
                                message: errorMsg 
                              }),
                            },
                          }
                          dataChannelRef.current.send(JSON.stringify(resultEvent))
                          
                          const responseCreate = {
                            type: 'response.create',
                          }
                          dataChannelRef.current.send(JSON.stringify(responseCreate))
                        }
                        return
                      }

                      // Format the response for the AI
                      const station = martaData.station
                      const responseText = `The closest MARTA station is ${station.name}, located at ${station.address}. It's approximately ${station.distance} away (about ${station.duration} by foot).`
                      
                      // Automatically show map with route to MARTA station
                      if (originalLocation && station.location) {
                        setRouteData({
                          origin: {
                            lat: originalLocation.lat,
                            lng: originalLocation.lng,
                            label: originalAddress || 'Your Location',
                          },
                          destination: {
                            lat: station.location.lat,
                            lng: station.location.lng,
                            label: station.name,
                          },
                        })
                        setShowDirections(true)
                        console.log('[v0] Displaying map to MARTA station')
                      }
                      
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify({ 
                              success: true,
                              station: {
                                name: station.name,
                                address: station.address,
                                distance: station.distance,
                                duration: station.duration,
                                location: station.location,
                              },
                              message: responseText + ' I\'ve displayed a map showing the route to the station.',
                              all_stations: martaData.all_stations || [],
                            }),
                          },
                        }
                        dataChannelRef.current.send(JSON.stringify(resultEvent))
                        
                        const responseCreate = {
                          type: 'response.create',
                        }
                        dataChannelRef.current.send(JSON.stringify(responseCreate))
                        console.log('[v0] Sent MARTA station result:', station)
                      }
                    })
                    .catch(err => {
                      console.error('[v0] Error finding MARTA station:', err)
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify({ 
                              success: false, 
                              error: 'Failed to find MARTA station. Please try again or provide a more specific location.' 
                            }),
                          },
                        }
                        dataChannelRef.current.send(JSON.stringify(resultEvent))
                        
                        const responseCreate = {
                          type: 'response.create',
                        }
                        dataChannelRef.current.send(JSON.stringify(responseCreate))
                      }
                    })
                }
              } else if (name === 'find_nearby_places') {
                console.log('[v0] Finding nearby places:', args);
                
                // Determine location - use provided location, or geocode address, or use existing route origin
                let locationToUse = args.location
                let addressToUse = args.address
                const query = args.query
                
                // If no location provided but we have route data, use origin
                if (!locationToUse && !addressToUse && routeData.origin) {
                  locationToUse = routeData.origin
                }
                
                // If we have an address but no location, geocode it first
                if (addressToUse && !locationToUse) {
                  const geocodeUrl = `/api/geocode?address=${encodeURIComponent(addressToUse)}`
                  
                  fetch(geocodeUrl)
                    .then(res => res.json())
                    .then(geocodeData => {
                      if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results[0]) {
                        const loc = geocodeData.results[0].geometry.location
                        locationToUse = { lat: loc.lat, lng: loc.lng }
                        findNearbyPlaces(locationToUse, addressToUse, query, args.type, callId)
                      } else {
                        throw new Error('Could not find the location')
                      }
                    })
                    .catch(err => {
                      console.error('[v0] Geocoding error for nearby places search:', err)
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify({ 
                              success: false, 
                              error: 'Could not find the location. Please provide a valid address or location.' 
                            }),
                          },
                        }
                        dataChannelRef.current.send(JSON.stringify(resultEvent))
                        
                        const responseCreate = {
                          type: 'response.create',
                        }
                        dataChannelRef.current.send(JSON.stringify(responseCreate))
                      }
                    })
                } else {
                  findNearbyPlaces(locationToUse, addressToUse, query, args.type, callId)
                }
                
                function findNearbyPlaces(location: any, address: string | undefined, query: string, type: string | undefined, callId: string) {
                  if (!location) {
                    if (dataChannelRef.current) {
                      const resultEvent = {
                        type: 'conversation.item.create',
                        item: {
                          type: 'function_call_output',
                          call_id: callId,
                          output: JSON.stringify({ 
                            success: false, 
                            error: 'Please provide a location to search for nearby places.' 
                          }),
                        },
                      }
                      dataChannelRef.current.send(JSON.stringify(resultEvent))
                      
                      const responseCreate = {
                        type: 'response.create',
                      }
                      dataChannelRef.current.send(JSON.stringify(responseCreate))
                    }
                    return
                  }
                  
                  fetch('/api/find-nearby-places', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      location: location,
                      address: address,
                      query: query,
                      type: type,
                    }),
                  })
                    .then(res => res.json())
                    .then(placesData => {
                      if (placesData.error || !placesData.success) {
                        const errorMsg = placesData.message || placesData.error || `Could not find ${query} nearby`
                        if (dataChannelRef.current) {
                          const resultEvent = {
                            type: 'conversation.item.create',
                            item: {
                              type: 'function_call_output',
                              call_id: callId,
                              output: JSON.stringify({ 
                                success: false, 
                                message: errorMsg 
                              }),
                            },
                          }
                          dataChannelRef.current.send(JSON.stringify(resultEvent))
                          
                          const responseCreate = {
                            type: 'response.create',
                          }
                          dataChannelRef.current.send(JSON.stringify(responseCreate))
                        }
                        return
                      }

                      // Format the response for the AI
                      const bestMatch = placesData.best_match
                      const allResults = placesData.results
                      
                      let responseText = `The nearest ${query} is ${bestMatch.name}, located at ${bestMatch.address}. `
                      responseText += `It has a ${bestMatch.rating} star rating with ${bestMatch.user_ratings_total} reviews, and it's about ${bestMatch.distance} away (${bestMatch.duration} by car).`
                      
                      if (allResults.length > 1) {
                        responseText += ` I found ${allResults.length} options nearby. Would you like to hear about the other options?`
                      }
                      
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify({ 
                              success: true,
                              best_match: bestMatch,
                              all_results: allResults,
                              message: responseText,
                            }),
                          },
                        }
                        dataChannelRef.current.send(JSON.stringify(resultEvent))
                        
                        const responseCreate = {
                          type: 'response.create',
                        }
                        dataChannelRef.current.send(JSON.stringify(responseCreate))
                        console.log('[v0] Sent nearby places result:', bestMatch)
                      }
                    })
                    .catch(err => {
                      console.error('[v0] Error finding nearby places:', err)
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify({ 
                              success: false, 
                              error: 'Failed to find nearby places. Please try again or provide a more specific location.' 
                            }),
                          },
                        }
                        dataChannelRef.current.send(JSON.stringify(resultEvent))
                        
                        const responseCreate = {
                          type: 'response.create',
                        }
                        dataChannelRef.current.send(JSON.stringify(responseCreate))
                      }
                    })
                }
              } else if (name === 'show_safety_analysis') {
                console.log('[v0] Showing safety analysis for:', args);
                
                const location = args.location;
                
                if (!location) {
                  if (dataChannelRef.current) {
                    const resultEvent = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify({ 
                          success: false, 
                          error: 'Please provide a location to analyze. For example: "Atlanta, GA" or "Times Square".' 
                        }),
                      },
                    };
                    dataChannelRef.current.send(JSON.stringify(resultEvent));
                    
                    const responseCreate = {
                      type: 'response.create',
                    };
                    dataChannelRef.current.send(JSON.stringify(responseCreate));
                  }
                  return;
                }
                
                // Show safety analysis overlay
                setSafetyAnalysisLocation(location);
                setShowSafetyAnalysis(true);
                
                // Return success to AI
                if (dataChannelRef.current) {
                  const resultEvent = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: JSON.stringify({ 
                        success: true,
                        message: `I've opened the safety analysis for ${location}. You'll see comprehensive safety statistics, crime data, safety trends, and recommendations for this location.`,
                        location: location,
                      }),
                    },
                  };
                  dataChannelRef.current.send(JSON.stringify(resultEvent));
                  
                  const responseCreate = {
                    type: 'response.create',
                  };
                  dataChannelRef.current.send(JSON.stringify(responseCreate));
                  console.log('[v0] Showing safety analysis overlay for:', location);
                }
              } else if (name === 'close_overlay') {
                console.log('[v0] Closing overlay:', args);
                
                const overlayType = args.overlay_type || 'all';
                
                if (overlayType === 'all' || overlayType === 'street_view') {
                  setShowStreetView(false);
                }
                if (overlayType === 'all' || overlayType === 'safety_analysis') {
                  setShowSafetyAnalysis(false);
                  setSafetyAnalysisLocation('');
                }
                if (overlayType === 'all' || overlayType === 'map') {
                  setShowDirections(false);
                }
                
                // Return success to AI
                if (dataChannelRef.current) {
                  const resultEvent = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: JSON.stringify({ 
                        success: true,
                        message: `I've closed the ${overlayType === 'all' ? 'overlays' : overlayType.replace('_', ' ')}.`,
                        closed: overlayType
                      }),
                    },
                  };
                  dataChannelRef.current.send(JSON.stringify(resultEvent));
                  
                  const responseCreate = {
                    type: 'response.create',
                  };
                  dataChannelRef.current.send(JSON.stringify(responseCreate));
                  console.log('[v0] Closed overlay:', overlayType);
                }
              } else if (name === 'end_conversation') {
                console.log('[v0] Ending conversation');
                
                // Return success to AI first
                if (dataChannelRef.current) {
                  const resultEvent = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: JSON.stringify({ 
                        success: true,
                        message: 'Conversation ended. Thank you for using Urban Buzz AI!',
                      }),
                    },
                  };
                  dataChannelRef.current.send(JSON.stringify(resultEvent));
                  
                  // Small delay before ending to let the message go through
                  setTimeout(() => {
                    stopVoiceSession();
                  }, 500);
                  
                  console.log('[v0] Conversation ending');
                } else {
                  // If data channel is already closed, just stop the session
                  stopVoiceSession();
                }
              }
            } catch (err) {
              console.error('[v0] Error handling function call:', err);
            }
          }
          
          if (event.type === 'conversation.item.created') {
            if (event.item?.content) {
              const content = event.item.content[0];
              if (content?.transcript) {
                const newItem: ConversationItem = {
                  role: event.item.role,
                  content: content.transcript,
                  timestamp: new Date(),
                };
                
                setConversation((prev) => {
                  const exists = prev.some(
                    (item) => 
                      item.role === newItem.role && 
                      item.content === newItem.content &&
                      Math.abs(item.timestamp.getTime() - newItem.timestamp.getTime()) < 2000
                  );
                  if (exists) return prev;
                  return [...prev, newItem];
                });
              }
            }
          } else if (event.type === 'input_audio_buffer.speech_started') {
            setIsListening(true);
          } else if (event.type === 'input_audio_buffer.speech_stopped') {
            setIsListening(false);
          } else if (event.type === 'response.audio.delta') {
            setIsListening(false);
          }
        } catch (err) {
          console.error('[v0] Error parsing event:', err);
        }
      };

      // Create offer with high-quality audio settings
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      
      // Enhance SDP for better audio quality
      if (offer.sdp) {
        // Find Opus codec and add fmtp parameters properly
        const lines = offer.sdp.split('\n');
        let opusPayloadType = null;
        
        // Find Opus payload type
        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/a=rtpmap:(\d+) opus\/48000/);
          if (match) {
            opusPayloadType = match[1];
            break;
          }
        }
        
        // Add fmtp line for Opus if found
        if (opusPayloadType) {
          // Check if fmtp line already exists
          const hasFmtp = lines.some(line => line.includes(`a=fmtp:${opusPayloadType}`));
          if (!hasFmtp) {
            // Find where to insert (after rtpmap line)
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(`a=rtpmap:${opusPayloadType} opus`)) {
                lines.splice(i + 1, 0, `a=fmtp:${opusPayloadType} minptime=10;useinbandfec=1`);
                break;
              }
            }
            offer.sdp = lines.join('\n');
          }
        }
      }
      
      await pc.setLocalDescription(offer);

      console.log('[v0] Sending offer to OpenAI...');
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeral_key}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to OpenAI Realtime API');
      }

      const answerSdp = await sdpResponse.text();
      console.log('[v0] Received answer from OpenAI');
      
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      setStatus('connected');
      console.log('[v0] Connected successfully!');
    } catch (e: any) {
      console.error('[v0] Error starting voice session:', e);
      setStatus('error');
      setError(e?.message ?? 'Unknown error occurred');
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  }

  async function stopVoiceSession() {
    try {
      console.log('[v0] Stopping voice session...');
      
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null;
      }
    } catch (e) {
      console.error('[v0] Error stopping voice session:', e);
    } finally {
      setStatus('idle');
      setIsListening(false);
    }
  }

  async function sendTextMessage() {
    if (!textInput.trim() || !dataChannelRef.current) return;

    try {
      const userMessage: ConversationItem = {
        role: 'user',
        content: textInput,
        timestamp: new Date(),
      };
      
      setConversation((prev) => [...prev, userMessage]);

      const textEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: textInput,
            },
          ],
        },
      };
      
      dataChannelRef.current.send(JSON.stringify(textEvent));
      
      const responseEvent = {
        type: 'response.create',
      };
      dataChannelRef.current.send(JSON.stringify(responseEvent));
      
      setTextInput('');
    } catch (e) {
      console.error('[v0] Error sending text message:', e);
    }
  }

  const isConnected = status === 'connected';

  return (
    <div className="space-y-6">
      <Script
        src="https://unpkg.com/@splinetool/viewer@1.11.4/build/spline-viewer.js"
        type="module"
        onLoad={() => setSplineLoaded(true)}
      />

      {showDirections && (routeData.origin || routeData.destination) && (
        <NavigationMap
          origin={routeData.origin}
          destination={routeData.destination}
          waypoints={routeData.waypoints}
          onClose={() => setShowDirections(false)}
        />
      )}

      {showStreetView && routeData.origin && routeData.destination && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">Street View Images Along Your Route</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStreetView(false)}
                className="hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <StreetViewGalleryWrapper
                origin={routeData.origin.label || `${routeData.origin.lat}, ${routeData.origin.lng}`}
                destination={routeData.destination.label || `${routeData.destination.lat}, ${routeData.destination.lng}`}
              />
            </div>
          </div>
        </div>
      )}

      {showSafetyAnalysis && safetyAnalysisLocation && (
        <SafetyAnalysisOverlay
          location={safetyAnalysisLocation}
          onClose={() => {
            setShowSafetyAnalysis(false);
            setSafetyAnalysisLocation('');
          }}
        />
      )}

      <div className="w-full h-[500px] rounded-lg overflow-hidden bg-black relative">
        <spline-viewer 
          url="https://prod.spline.design/BzGhv2K1X4p0Muz4/scene.splinecode"
          className="w-full h-full"
        />
        {/* Black overlay to hide "Built with Spline" watermark in bottom right */}
        <div className="absolute bottom-0 right-0 w-48 h-16 bg-black pointer-events-none" />
      </div>

      <Card className="p-6 bg-card border-border shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {status === 'idle' && 'Ready to begin'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'connected' && (isListening ? 'Listening...' : 'Speak or type')}
              {status === 'error' && 'Connection error'}
            </h2>
            <p className="text-sm text-muted-foreground text-balance">
              {status === 'idle' &&
                'Click start to begin your navigation conversation with Urban Buzz AI'}
              {status === 'connecting' &&
                'Please allow microphone access when prompted'}
              {status === 'connected' &&
                'Talk naturally or type your message below'}
              {status === 'error' && error}
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <Button
              size="lg"
              onClick={isConnected ? stopVoiceSession : startVoiceSession}
              disabled={status === 'connecting'}
              className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {status === 'connecting' && (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {'Connecting...'}
                </>
              )}
              {status === 'idle' && 'Start Conversation'}
              {status === 'connected' && 'End Conversation'}
              {status === 'error' && 'Try Again'}
            </Button>

            {(routeData.origin || routeData.destination) && (
              <Button
                size="lg"
                onClick={() => setShowDirections(!showDirections)}
                variant="outline"
                className="min-w-[200px] border-primary text-primary hover:bg-primary/10"
              >
                <Map className="mr-2 h-5 w-5" />
                {showDirections ? 'Hide Directions' : 'Show Directions'}
              </Button>
            )}
          </div>

          {isConnected && (
            <div className="w-full flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendTextMessage();
                  }
                }}
                placeholder="Or type your message here..."
                className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={sendTextMessage}
                disabled={!textInput.trim()}
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {conversation.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Conversation</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    item.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {item.role === 'user' ? 'You' : 'Urban Buzz'}
                  </p>
                  <p className="text-sm">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
