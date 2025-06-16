"use client"

import { useEffect, useRef, useState } from "react"
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
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [leaflet, setLeaflet] = useState<any>(null)

  // Carica Leaflet solo lato client
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        // Fix Leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        })
        setLeaflet(L)
      })
    }
  }, [])

  // Inizializza la mappa quando Leaflet è caricato
  useEffect(() => {
    if (!leaflet || !mapContainerRef.current || mapRef.current) return

    // Importa il CSS di Leaflet
    import("leaflet/dist/leaflet.css")

    // Crea la mappa
    const map = leaflet.map(mapContainerRef.current, {
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

    // Aggiungi il layer di OpenStreetMap
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(map)

    // Aggiungi marker se fornito
    if (marker) {
      markerRef.current = leaflet.marker(marker).addTo(map)
    }

    // Aggiungi handler per click sulla mappa
    if (interactive && onMarkerChange) {
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng

        // Aggiorna la posizione del marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = leaflet.marker([lat, lng]).addTo(map)
        }

        // Chiama la callback
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
  }, [leaflet, center, zoom, marker, onMarkerChange, interactive])

  // Aggiorna la posizione del marker quando cambia la prop marker
  useEffect(() => {
    if (!leaflet || !mapRef.current || !marker) return

    if (markerRef.current) {
      markerRef.current.setLatLng(marker)
    } else {
      markerRef.current = leaflet.marker(marker).addTo(mapRef.current)
    }

    // Centra la mappa sul marker
    mapRef.current.setView(marker, mapRef.current.getZoom())
  }, [leaflet, marker])

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
