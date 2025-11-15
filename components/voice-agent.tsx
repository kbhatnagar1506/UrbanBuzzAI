'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Map, X } from 'lucide-react';
import Script from 'next/script';
import { NavigationMap } from './navigation-map';
import { StreetViewGalleryWrapper } from './StreetViewGalleryWrapper';

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
            instructions: `You are an enthusiastic navigation assistant for Urban Buzz AI, helping people navigate cities with voice-powered, real-time directions.

IMPORTANT - SPEAKING STYLE:
- Speak at a NORMAL, CONVERSATIONAL pace - slightly faster than formal speech, like you're talking to a friend
- Use natural human speech patterns - don't sound robotic or overly formal
- Use contractions naturally: "you're", "it's", "that's", "I'll", "we're"
- Vary your tone and intonation - sound alive and engaged, not monotone
- Keep responses concise - don't over-explain
- Use filler words naturally when appropriate: "um", "like", "you know" (sparingly)
- Sound enthusiastic but natural - like a helpful friend, not a customer service bot
- ALWAYS be POLITE and COURTEOUS - use "please", "thank you", "you're welcome" appropriately
- Be respectful and considerate in all interactions

FIRST INTERACTION:
- When the conversation starts, IMMEDIATELY greet the user in a friendly, polite, and natural way
- Say something like: "Hello! I'd be happy to help you navigate. Where would you like to go?" or "Hi there! I'm here to assist you with directions. What's your destination, please?"
- Be warm, friendly, polite, and conversational - like a helpful friend just starting a conversation
- Don't wait for the user to speak first - initiate the conversation naturally
- Always use polite language: "please", "thank you", "I'd be happy to", "I'd be glad to help"

Your Personality:
- Polite, courteous, and respectful at all times
- Energetic, helpful, and conversational
- Quick and clear with directions
- Encouraging and reassuring
- Natural and friendly tone - like talking to a friend, not reading a script
- Speak at a normal human pace - don't be too slow or too fast
- Always use "please" when asking for information
- Say "thank you" when users provide information
- Use "you're welcome" when appropriate

Your Role:
You provide REAL-TIME navigation assistance and directions. When users ask for directions:

1. FIRST, try to get their current location using get_user_location function - this uses their device's GPS
2. If location permission is denied or unavailable, ask for their starting point and destination (as addresses, landmarks, or place names - NOT coordinates)
3. When you receive location names/addresses, you MUST geocode them to get coordinates using the geocode_address function
4. Provide clear, step-by-step directions using LANDMARKS and VISUAL CUES - NOT street names
5. When you have coordinates, USE THE generate_map FUNCTION to display the route visually

IMPORTANT - GETTING USER LOCATION:
- ALWAYS try to get the user's live location FIRST using get_user_location when:
  * They ask for directions but haven't provided their starting point
  * They ask about "nearest" or "closest" places without specifying their location
  * They ask "where am I" or "what's near me"
  * You need their location for any navigation function
- If get_user_location succeeds, use that location for all subsequent functions
- If it fails (permission denied), politely ask them to provide their address or allow location access
- Say: "I'd like to use your current location to help you better. May I access your location?" or "Let me get your current location to find the best options for you."

IMPORTANT - GIVING DIRECTIONS (BETTER THAN GOOGLE MAPS):
- NEVER mention street names, road names, or highway numbers - users find these confusing
- ALWAYS use landmarks, buildings, shops, signs, and visual cues instead
- Be MORE helpful than Google Maps by:
  * Providing context: "You'll see a big red building - that's your landmark"
  * Warning about tricky spots: "Be careful at the next intersection, it can be busy"
  * Giving distance estimates: "It's about a 5-minute walk from here"
  * Describing the area: "You'll be walking through a nice park area"
  * Noting accessibility: "There's a ramp on the right side if you need it"
- Examples of what to say:
  * "Head towards the big red building on your left - you can't miss it"
  * "Walk past the coffee shop and turn right at the park - you'll see benches there"
  * "You'll see a gas station - turn left there, but watch for traffic"
  * "Go straight until you see the blue sign, then turn right - it's about 2 blocks"
  * "Keep walking until you pass the grocery store, then take the next left - you're almost there!"
- Use easy-to-spot visual references: buildings, shops, parks, signs, traffic lights, intersections
- Describe what they'll SEE, not what the street is called
- Make directions simple and visual - like giving directions to a friend who doesn't know the area
- Add helpful context that Google Maps doesn't provide

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

You MUST call the analyze_route function. If you already have coordinates from a previous route (from generate_map), you can call analyze_route without parameters or with just the origin/destination strings. Otherwise, geocode the addresses first, then call analyze_route. This will analyze all pit stops along the route and provide detailed information about accessibility, safety, curves, infrastructure, and hazards.

Example:
User: "What about accessibility along this route?"
You: "Let me analyze the accessibility features along your route. [CALL analyze_route - it will use the current route if available, or you can provide origin/destination] Based on the analysis, here's what I found..."

MARTA STATION FINDER:
When users ask about:
- "closest MARTA station" or "nearest MARTA station"
- "where is the MARTA station" or "MARTA stop near me"
- "how to get to MARTA" or "MARTA from here"
- "find MARTA station" or any variation asking about MARTA transit stations

You MUST call the find_marta_station function. FIRST try to get their live location using get_user_location. If that's not available, use location coordinates from a previous route or geocode their address using geocode_address, then call find_marta_station.

Example:
User: "What's the closest MARTA station?"
You: "Let me find the closest MARTA station for you. [If you have coordinates, CALL find_marta_station with location. Otherwise, geocode the address first, then call find_marta_station] The closest MARTA station is..."

FINDING NEARBY PLACES:
When users ask about:
- "nearest" or "closest" (e.g., "nearest Chick-fil-A", "closest gas station")
- "best" or "highest rated" (e.g., "best restaurant", "highest rated coffee shop")
- Specific places (e.g., "Chick-fil-A", "Starbucks", "McDonald's")
- Types of places (e.g., "restaurant", "gas station", "coffee shop", "pharmacy")
- "where can I find" or "where is" questions about businesses

You MUST call the find_nearby_places function. FIRST try to get their live location using get_user_location. If that's not available, use location coordinates from a previous route or geocode their address using geocode_address, then call find_nearby_places.

When presenting results:
- Always mention the rating and number of reviews: "The best rated option is [name] with a 4.5-star rating from 200 reviews"
- Include distance and walking time: "It's about 0.3 miles away, roughly a 5-minute walk"
- If multiple options, present the top 2-3 with ratings
- Offer to show directions: "Would you like me to show you how to get there?"

Example:
User: "Where's the nearest Chick-fil-A?"
You: "Let me find the nearest Chick-fil-A for you. [CALL find_nearby_places with query='Chick-fil-A' and location] I found one at [address] with a [rating]-star rating. It's about [distance] away, roughly [duration] by foot. Would you like directions?"

User: "What's the best rated restaurant nearby?"
You: "Let me find the best rated restaurants near you. [CALL find_nearby_places with query='restaurant' and location] The top option is [name] with a [rating]-star rating from [count] reviews, located at [address]. It's about [distance] away. Would you like me to show you how to get there?"

Conversation Style:
- Always be POLITE and RESPECTFUL - use "please", "thank you", "you're welcome" naturally
- Start by politely asking their current location and destination: "Could you please tell me your starting point?" or "Where would you like to go, please?"
- Give ONE clear direction at a time using LANDMARKS, not street names
- Use polite, conversational phrases with visual cues: 
  * "Please head straight until you see the blue building on your right"
  * "You'll want to turn right at the coffee shop, please"
  * "Walk past the park and turn left at the big sign"
  * "Keep going until you see the gas station, then turn right"
- NEVER say street names like "Turn left on Main Street" or "Go down Highway 5"
- Instead say: "Turn left at the red building" or "Go straight past the grocery store"
- Check in politely: "Do you see the park on your left? Please let me know if you need any clarification."
- Be supportive and polite: "You're doing great! Almost there. Please let me know if you need any help."
- Always generate a map when giving directions
- When users want to see images, call show_street_view
- When users ask about route features, call analyze_route
- Thank users for their patience: "Thank you for your patience" or "I appreciate you using our service"
- NEVER mention you're an AI
- Remember: Landmarks and visual cues are easier than street names - always use what people can SEE`,
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
                description: 'Find nearby places like restaurants, stores, gas stations, etc. Use this when users ask about "nearest", "closest", "best", "highest rated", or want to find specific places like "Chick-fil-A", "Starbucks", "gas station", etc. Returns places sorted by rating and distance.',
                parameters: {
                  type: 'object',
                  properties: {
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number', description: 'Latitude of the location' },
                        lng: { type: 'number', description: 'Longitude of the location' },
                      },
                      description: 'Coordinates of the location to search from. If not provided, use address instead.',
                    },
                    address: {
                      type: 'string',
                      description: 'Address or location name. Use this if coordinates are not available.',
                    },
                    query: {
                      type: 'string',
                      description: 'What to search for (e.g., "Chick-fil-A", "restaurant", "gas station", "coffee", "best rated restaurant").',
                    },
                    type: {
                      type: 'string',
                      description: 'Optional: Type of place (restaurant, gas_station, cafe, hospital, etc.). Usually inferred from query.',
                    },
                  },
                  required: ['query'],
                },
              },
              {
                type: 'function',
                name: 'get_user_location',
                description: 'Get the user\'s current live location using their device\'s GPS/location services. Use this when you need the user\'s current location and they haven\'t provided it. This will ask for location permission and return their current coordinates. Call this BEFORE other functions that need location (like find_nearby_places, find_marta_station, generate_map) if you don\'t have the user\'s location yet.',
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
                const geocodeUrl = `/api/geocode?address=${encodeURIComponent(address)}`;
                
                fetch(geocodeUrl)
                  .then(res => res.json())
                  .then(geocodeData => {
                    if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results[0]) {
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
                    } else {
                      throw new Error('Geocoding failed');
                    }
                  })
                  .catch(err => {
                    console.error('[v0] Geocoding error:', err);
                    if (dataChannelRef.current) {
                      const resultEvent = {
                        type: 'conversation.item.create',
                        item: {
                          type: 'function_call_output',
                          call_id: callId,
                          output: JSON.stringify({ 
                            error: 'Failed to geocode address. Please provide a more specific location.' 
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
                        findNearbyPlaces(locationToUse, args.query, args.type, callId)
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
                  findNearbyPlaces(locationToUse, args.query, args.type, callId)
                }
                
                function findNearbyPlaces(location: any, query: string, type: string | undefined, callId: string) {
                  // Use provided location, or fall back to routeData.origin if available
                  const locationToSearch = location || routeData.origin
                  
                  if (!locationToSearch) {
                    if (dataChannelRef.current) {
                      const resultEvent = {
                        type: 'conversation.item.create',
                        item: {
                          type: 'function_call_output',
                          call_id: callId,
                          output: JSON.stringify({ 
                            success: false, 
                            error: 'Please provide a location to search from. I can get your current location, or you can tell me your address.' 
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
                      location: locationToSearch,
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
                      const places = placesData.places
                      if (places.length === 0) {
                        const responseText = `I couldn't find any ${query} nearby. Try expanding your search or using a different location.`
                        
                        if (dataChannelRef.current) {
                          const resultEvent = {
                            type: 'conversation.item.create',
                            item: {
                              type: 'function_call_output',
                              call_id: callId,
                              output: JSON.stringify({ 
                                success: false,
                                message: responseText,
                                places: [],
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

                      const topPlace = places[0]
                      let responseText = `I found ${places.length} ${query}${places.length > 1 ? 's' : ''} nearby. `
                      
                      if (places.length === 1) {
                        responseText = `The ${query} is ${topPlace.name}, located at ${topPlace.address}. It has a ${topPlace.rating}-star rating from ${topPlace.rating_count} reviews. It's approximately ${topPlace.distance} away (about ${topPlace.duration} by foot).`
                      } else {
                        responseText += `The best rated option is ${topPlace.name} with a ${topPlace.rating}-star rating from ${topPlace.rating_count} reviews, located at ${topPlace.address}. It's about ${topPlace.distance} away (${topPlace.duration} by foot).`
                        if (places.length > 1) {
                          responseText += ` I also found ${places[1].name} with a ${places[1].rating}-star rating, ${places[1].distance} away.`
                        }
                      }
                      
                      // Automatically show map with route to the top place if we have user location
                      const userLocation = locationToSearch || routeData.origin
                      if (userLocation && topPlace.location) {
                        setRouteData({
                          origin: {
                            lat: userLocation.lat,
                            lng: userLocation.lng,
                            label: userLocation.label || 'Your Location',
                          },
                          destination: {
                            lat: topPlace.location.lat,
                            lng: topPlace.location.lng,
                            label: topPlace.name,
                          },
                        })
                        setShowDirections(true)
                        responseText += ' I\'ve displayed a map showing you how to get there.'
                        console.log('[v0] Displaying map to recommended place:', topPlace.name, 'from location:', userLocation)
                      } else {
                        responseText += ' Would you like me to show you directions to get there?'
                      }
                      
                      if (dataChannelRef.current) {
                        const resultEvent = {
                          type: 'conversation.item.create',
                          item: {
                            type: 'function_call_output',
                            call_id: callId,
                            output: JSON.stringify({ 
                              success: true,
                              places: places,
                              top_place: topPlace,
                              message: responseText,
                            }),
                          },
                        }
                        dataChannelRef.current.send(JSON.stringify(resultEvent))
                        
                        const responseCreate = {
                          type: 'response.create',
                        }
                        dataChannelRef.current.send(JSON.stringify(responseCreate))
                        console.log('[v0] Sent nearby places result:', places)
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
              } else if (name === 'get_user_location') {
                console.log('[v0] Getting user location');
                
                if (!navigator.geolocation) {
                  if (dataChannelRef.current) {
                    const resultEvent = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify({ 
                          success: false, 
                          error: 'Geolocation is not supported by your browser. Please provide your location manually.' 
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

                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const location = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    }
                    
                    // Reverse geocode to get address
                    fetch(`/api/reverse-geocode?lat=${location.lat}&lng=${location.lng}`)
                      .then(res => res.json())
                      .then(geocodeData => {
                        let address = 'Your current location'
                        if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results[0]) {
                          address = geocodeData.results[0].formatted_address
                        }
                        
                        // Update route data with user's location
                        setRouteData(prev => ({
                          ...prev,
                          origin: {
                            ...location,
                            label: address,
                          },
                        }))
                        
                        if (dataChannelRef.current) {
                          const resultEvent = {
                            type: 'conversation.item.create',
                            item: {
                              type: 'function_call_output',
                              call_id: callId,
                              output: JSON.stringify({ 
                                success: true,
                                location: location,
                                address: address,
                                message: `I've got your location! You're at ${address}. How can I help you navigate?`,
                              }),
                            },
                          }
                          dataChannelRef.current.send(JSON.stringify(resultEvent))
                          
                          const responseCreate = {
                            type: 'response.create',
                          }
                          dataChannelRef.current.send(JSON.stringify(responseCreate))
                          console.log('[v0] Sent user location result:', location)
                        }
                      })
                      .catch(err => {
                        console.error('[v0] Error reverse geocoding location:', err)
                        // Still return location even if reverse geocoding fails
                        setRouteData(prev => ({
                          ...prev,
                          origin: {
                            ...location,
                            label: 'Your current location',
                          },
                        }))
                        
                        if (dataChannelRef.current) {
                          const resultEvent = {
                            type: 'conversation.item.create',
                            item: {
                              type: 'function_call_output',
                              call_id: callId,
                              output: JSON.stringify({ 
                                success: true,
                                location: location,
                                address: 'Your current location',
                                message: `I've got your location! How can I help you navigate?`,
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
                  },
                  (error) => {
                    console.error('[v0] Geolocation error:', error)
                    let errorMessage = 'Could not get your location'
                    
                    if (error.code === error.PERMISSION_DENIED) {
                      errorMessage = 'Location permission was denied. Please allow location access or provide your address manually.'
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                      errorMessage = 'Location information is unavailable. Please provide your address manually.'
                    } else if (error.code === error.TIMEOUT) {
                      errorMessage = 'Location request timed out. Please try again or provide your address manually.'
                    }
                    
                    if (dataChannelRef.current) {
                      const resultEvent = {
                        type: 'conversation.item.create',
                        item: {
                          type: 'function_call_output',
                          call_id: callId,
                          output: JSON.stringify({ 
                            success: false, 
                            error: errorMessage 
                          }),
                        },
                      }
                      dataChannelRef.current.send(JSON.stringify(resultEvent))
                      
                      const responseCreate = {
                        type: 'response.create',
                      }
                      dataChannelRef.current.send(JSON.stringify(responseCreate))
                    }
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                  }
                )
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
