"use client"

import { StreetViewGallery } from "./StreetViewGallery"

interface StreetViewGalleryWrapperProps {
  origin: string
  destination: string
}

export function StreetViewGalleryWrapper({ origin, destination }: StreetViewGalleryWrapperProps) {
  return (
    <div className="w-full">
      <StreetViewGallery initialOrigin={origin} initialDestination={destination} />
    </div>
  )
}

