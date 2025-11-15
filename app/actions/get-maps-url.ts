'use server';

export async function getMapsScriptUrl() {
  // Try multiple ways to get the API key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
                 process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Google Maps API key not found in environment variables');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('MAPS')));
    throw new Error('Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.');
  }
  
  return `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
}
