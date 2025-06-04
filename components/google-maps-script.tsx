"use client"

import { useEffect, useState } from "react"
import Script from "next/script"

declare global {
  interface Window {
    google: any
  }
}

export function GoogleMapsScript() {
  const [scriptUrl, setScriptUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMapsScriptUrl() {
      try {
        const response = await fetch("/api/maps")

        if (!response.ok) {
          throw new Error("Failed to fetch Google Maps script URL")
        }

        const data = await response.json()
        setScriptUrl(data.url)
      } catch (err) {
        console.error("Error loading Google Maps:", err)
        setError("Failed to load Google Maps")
      }
    }

    fetchMapsScriptUrl()
  }, [])

  if (error) {
    console.warn("Google Maps API could not be loaded:", error)
    return null
  }

  return scriptUrl ? (
    <Script
      src={scriptUrl}
      strategy="afterInteractive"
      onError={(e) => {
        console.error("Google Maps script failed to load", e)
      }}
    />
  ) : null
}
