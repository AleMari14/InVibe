"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin } from "lucide-react"

interface MapProps {
  center?: [number, number]
  zoom?: number
  marker?: [number, number]
  onMarkerChange?: (lat: number, lng: number) => void
  height?: string
  interactive?: boolean
}

export function Map({
  center = [41.9028, 12.4964], // Default: Rome
  zoom = 13,
  marker,
  onMarkerChange,
  height = "300px",
  interactive = true,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Fix Leaflet icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    })

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      tap: interactive,
      touchZoom: interactive,
    })

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add marker if provided
    if (marker) {
      markerRef.current = L.marker(marker).addTo(map)
    }

    // Add click handler for interactive maps
    if (interactive && onMarkerChange) {
      map.on("click", (e) => {
        const { lat, lng } = e.latlng

        // Update marker position
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map)
        }

        // Call callback
        onMarkerChange(lat, lng)
      })
    }

    mapRef.current = map
    setMapReady(true)

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [center, zoom, marker, onMarkerChange, interactive])

  // Update marker position when marker prop changes
  useEffect(() => {
    if (!mapRef.current || !marker) return

    if (markerRef.current) {
      markerRef.current.setLatLng(marker)
    } else {
      markerRef.current = L.marker(marker).addTo(mapRef.current)
    }

    // Center map on marker
    mapRef.current.setView(marker, mapRef.current.getZoom())
  }, [marker])

  return (
    <div className="relative w-full rounded-md overflow-hidden" style={{ height }}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center">
            <MapPin className="h-6 w-6 text-muted-foreground animate-bounce" />
            <span className="text-sm text-muted-foreground mt-2">Caricamento mappa...</span>
          </div>
        </div>
      )}
    </div>
  )
}
