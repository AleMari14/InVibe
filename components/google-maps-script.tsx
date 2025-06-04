"use client"

import Script from 'next/script'

declare global {
  interface Window {
    google: typeof google
  }
}

export function GoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn("Google Maps API key is not defined. Maps functionality will be limited.")
    return null
  }

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
      strategy="afterInteractive"
    />
  )
} 