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

    // Crea icona personalizzata per il marker
    const createCustomIcon = () => {
      return L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })
    }

    // Inizializza la mappa se non esiste
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([center.lat, center.lng], zoom)

      // Aggiungi controlli zoom personalizzati
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map)

      // Scegli il tile layer in base al tema con stili migliorati
      const tileLayer = useDarkTheme
        ? L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
            className: "dark-map-tiles",
          })
        : L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
            className: "light-map-tiles",
          })

      tileLayer.addTo(map)
      mapRef.current = map

      // Aggiungi il marker se c'è una posizione selezionata
      if (selectedLocation) {
        markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
          icon: createCustomIcon(),
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

        // Aggiungi un nuovo marker con icona personalizzata
        markerRef.current = L.marker([lat, lng], {
          icon: createCustomIcon(),
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
            icon: createCustomIcon(),
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
          attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          className: "dark-map-tiles",
        })
      : L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          className: "light-map-tiles",
        })

    tileLayer.addTo(mapRef.current)
  }, [useDarkTheme, isMounted])

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full animate-bounce mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Caricamento mappa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {/* Mappa */}
      <div
        ref={mapContainerRef}
        className="h-full w-full rounded-lg overflow-hidden shadow-lg border-2 border-border"
        style={{
          filter: useDarkTheme ? "contrast(1.1) brightness(0.9)" : "contrast(1.05) brightness(1.02)",
        }}
      />

      {/* Overlay per migliorare la leggibilità */}
      <div className="absolute inset-0 pointer-events-none rounded-lg">
        <div className={`absolute inset-0 ${useDarkTheme ? "bg-slate-900/10" : "bg-white/5"} rounded-lg`}></div>
      </div>

      {/* Indicatore di caricamento */}
      <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-muted-foreground font-medium">Mappa Interattiva</span>
        </div>
      </div>

      {/* Istruzioni */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border max-w-xs">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">💡 Suggerimento:</span> Clicca sulla mappa per posizionare il
          marker
        </p>
      </div>

      {/* Stili CSS personalizzati */}
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        .leaflet-control-zoom a {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          color: #475569 !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #f8fafc !important;
          border-color: #3b82f6 !important;
          color: #3b82f6 !important;
          transform: scale(1.05);
        }
        
        .dark .leaflet-control-zoom a {
          background: #1e293b !important;
          border-color: #475569 !important;
          color: #e2e8f0 !important;
        }
        
        .dark .leaflet-control-zoom a:hover {
          background: #334155 !important;
          border-color: #8b5cf6 !important;
          color: #8b5cf6 !important;
        }
        
        .light-map-tiles {
          filter: contrast(1.05) brightness(1.02) saturate(1.1);
        }
        
        .dark-map-tiles {
          filter: contrast(1.1) brightness(0.9) saturate(0.9);
        }
        
        .leaflet-container {
          font-family: inherit !important;
        }
        
        .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
          border: 1px solid #e2e8f0 !important;
        }
        
        .dark .leaflet-popup-content-wrapper {
          background: #1e293b !important;
          border-color: #475569 !important;
        }
        
        .leaflet-popup-tip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
        }
        
        .dark .leaflet-popup-tip {
          background: #1e293b !important;
          border-color: #475569 !important;
        }
      `}</style>
    </div>
  )
}
