# Urban Buzz AI

**AI-Powered Urban Navigation That Understands Your Route**

Urban Buzz AI is a voice-first navigation platform that goes beyond traditional maps. Using AI vision analysis, we analyze every step of your route, providing detailed insights about accessibility, safety, curves, and infrastructure—all through natural voice conversation.

## 🎯 Elevator Pitch

**"Navigate cities with AI that sees what you'll encounter—not just where to go."**

Urban Buzz AI is the only navigation platform that analyzes your entire route with AI vision. See Street View images from every pit stop, get detailed accessibility and safety analysis, and ask questions naturally—all powered by advanced AI that understands what you'll encounter along the way.

## ✨ Key Features

- **Voice-First Navigation**: Real-time audio directions with natural conversation
- **AI Vision Analysis**: Analyzes Street View images for accessibility, safety, curves, and infrastructure
- **Step-by-Step Visual Guide**: See your route through sequential Street View images (North, East, South, West views)
- **Landmark-Based Directions**: Uses visual cues and landmarks instead of confusing street names
- **Live Location**: Automatically detects your location using GPS
- **Nearby Places Search**: Find best-rated restaurants, stores, and services with ratings and reviews
- **MARTA Station Finder**: Find the closest transit stations with walking directions
- **Route Analysis**: Comprehensive analysis of accessibility, safety, hazards, and infrastructure along your route

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Google Maps API key (with Geocoding, Directions, Street View Static, and Places APIs enabled)
- OpenAI API key (for voice agent and image analysis)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/urban-buzz.git
cd urban-buzz
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your API keys to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Tech Stack

- **Framework**: Next.js 15
- **UI**: React, Tailwind CSS, Framer Motion
- **Maps**: Google Maps Platform (Geocoding, Directions, Street View, Places)
- **AI**: OpenAI Realtime API (Voice), GPT-4o-mini (Vision Analysis)
- **Real-time**: WebRTC for voice communication

## 📁 Project Structure

```
auralink/
├── app/
│   ├── api/              # API routes for Google Maps and OpenAI
│   ├── auth/              # Authentication page
│   ├── voice-agent/       # Voice agent interface
│   └── street-view/       # Street View gallery
├── components/
│   ├── voice-agent.tsx   # Main voice agent component
│   ├── navigation-map.tsx # Interactive map component
│   ├── StreetViewGallery.tsx # Street View image gallery
│   └── ...                # Other UI components
└── public/                # Static assets
```

## 🎤 Voice Agent Features

The voice agent can:
- Get your live location automatically
- Find nearby places (restaurants, stores, etc.) with ratings
- Provide step-by-step directions using landmarks
- Show Street View images along your route
- Analyze route accessibility and safety
- Find MARTA stations
- Answer general navigation questions

## 🔒 Privacy & Security

- Location data is processed in real-time
- API keys are stored securely in environment variables
- No location history is stored

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.
