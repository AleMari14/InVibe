"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useTheme as useNextTheme } from "next-themes"

interface MapProps {
  center: { lat: number; lng: number }
  zoom?: number
  onLocationChange?: (lat: number, lng: number) => void
  selectedLocation?: { lat: number; lng: number } | null
  isDarkMode?: boolean
}

export default function Map({ center, zoom = 13, onLocationChange, selectedLocation, isDarkMode }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const { theme } = useNextTheme()

  // Determina se usare il tema scuro
  const useDarkTheme = isDarkMode !== undefined ? isDarkMode : theme === "dark"

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return

    // Inizializza la mappa se non esiste
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], zoom)

      // Scegli il tile layer in base al tema
      const tileLayer = useDarkTheme
        ? L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
          })
        : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })

      tileLayer.addTo(map)
      mapRef.current = map

      // Aggiungi il marker se c'è una posizione selezionata
      if (selectedLocation) {
        markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
          draggable: true,
        }).addTo(map)

        // Gestisci il trascinamento del marker
        markerRef.current.on("dragend", (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          onLocationChange?.(position.lat, position.lng)
        })
      }

      // Gestisci il click sulla mappa
      map.on("click", (e) => {
        const { lat, lng } = e.latlng

        // Rimuovi il marker esistente se presente
        if (markerRef.current) {
          map.removeLayer(markerRef.current)
        }

        // Aggiungi un nuovo marker
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
        }).addTo(map)

        // Gestisci il trascinamento del nuovo marker
        markerRef.current.on("dragend", (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          onLocationChange?.(position.lat, position.lng)
        })

        onLocationChange?.(lat, lng)
      })
    }

    // Aggiorna il centro della mappa quando cambia
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], zoom)

      // Aggiorna o aggiungi il marker per la posizione selezionata
      if (selectedLocation) {
        if (markerRef.current) {
          markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng])
        } else {
          markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
            draggable: true,
          }).addTo(mapRef.current)

          markerRef.current.on("dragend", (e) => {
            const marker = e.target
            const position = marker.getLatLng()
            onLocationChange?.(position.lat, position.lng)
          })
        }
      }
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [center, zoom, selectedLocation, onLocationChange, isMounted, useDarkTheme])

  // Aggiorna il tile layer quando cambia il tema
  useEffect(() => {
    if (!mapRef.current || !isMounted) return

    // Rimuovi tutti i tile layers esistenti
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer)
      }
    })

    // Aggiungi il nuovo tile layer in base al tema
    const tileLayer = useDarkTheme
      ? L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        })
      : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })

    tileLayer.addTo(mapRef.current)
  }, [useDarkTheme, isMounted])

  if (!isMounted) {
    return <div className="h-full w-full bg-muted animate-pulse rounded-md"></div>
  }

  return <div ref={mapContainerRef} className="h-full w-full" />
}
