"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapPin, Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "./button"
import { Card } from "./card"

interface MapProps {
  center?: [number, number]
  zoom?: number
  marker?: [number, number]
  onMarkerChange?: (lat: number, lng: number) => void
  height?: string
  interactive?: boolean
  className?: string
}

export function Map({
  center = [41.9028, 12.4964], // Default: Rome
  zoom = 13,
  marker,
  onMarkerChange,
  height = "300px",
  interactive = true,
  className = "",
}: MapProps) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [leaflet, setLeaflet] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Assicurati che il componente sia montato prima di caricare Leaflet
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Carica Leaflet solo lato client
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return

    const loadLeaflet = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Carica Leaflet dinamicamente
        const L = await import("leaflet")

        // Carica il CSS di Leaflet
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
        }

        // Fix per le icone di Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })

        setLeaflet(L)
      } catch (err) {
        console.error("Errore nel caricamento di Leaflet:", err)
        setError("Impossibile caricare la mappa")
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaflet()
  }, [isMounted])

  // Inizializza la mappa quando Leaflet è caricato
  useEffect(() => {
    if (!leaflet || !mapContainerRef.current || mapRef.current || !isMounted || isLoading) return

    try {
      // Crea la mappa
      const map = leaflet.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false, // Rimuoviamo i controlli default per aggiungere i nostri
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        tap: interactive,
        touchZoom: interactive,
        attributionControl: false,
      })

      // Aggiungi il layer di OpenStreetMap con stile migliorato
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map)

      // Aggiungi marker personalizzato se fornito
      if (marker) {
        const customIcon = leaflet.divIcon({
          html: `<div class="custom-marker">
                   <div class="marker-pin"></div>
                   <div class="marker-pulse"></div>
                 </div>`,
          className: "custom-marker-container",
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        })

        markerRef.current = leaflet.marker(marker, { icon: customIcon }).addTo(map)
      }

      // Aggiungi handler per click sulla mappa
      if (interactive && onMarkerChange) {
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng

          // Crea icona personalizzata
          const customIcon = leaflet.divIcon({
            html: `<div class="custom-marker">
                     <div class="marker-pin"></div>
                     <div class="marker-pulse"></div>
                   </div>`,
            className: "custom-marker-container",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          })

          // Aggiorna la posizione del marker
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            markerRef.current = leaflet.marker([lat, lng], { icon: customIcon }).addTo(map)
          }

          // Chiama la callback
          onMarkerChange(lat, lng)
        })
      }

      // Handler per zoom change
      map.on("zoomend", () => {
        setCurrentZoom(map.getZoom())
      })

      mapRef.current = map
      setMapReady(true)
    } catch (err) {
      console.error("Errore nell'inizializzazione della mappa:", err)
      setError("Errore nell'inizializzazione della mappa")
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [leaflet, center, zoom, marker, onMarkerChange, interactive, isMounted, isLoading])

  // Aggiorna la posizione del marker quando cambia la prop marker
  useEffect(() => {
    if (!leaflet || !mapRef.current || !marker || !isMounted || !mapReady) return

    const customIcon = leaflet.divIcon({
      html: `<div class="custom-marker">
               <div class="marker-pin"></div>
               <div class="marker-pulse"></div>
             </div>`,
      className: "custom-marker-container",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    })

    if (markerRef.current) {
      markerRef.current.setLatLng(marker)
    } else {
      markerRef.current = leaflet.marker(marker, { icon: customIcon }).addTo(mapRef.current)
    }

    // Centra la mappa sul marker con animazione
    mapRef.current.setView(marker, mapRef.current.getZoom(), { animate: true, duration: 0.5 })
  }, [leaflet, marker, isMounted, mapReady])

  // Funzioni di controllo
  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }, [])

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }, [])

  const resetView = useCallback(() => {
    if (mapRef.current) {
      const targetCenter = marker || center
      mapRef.current.setView(targetCenter, zoom, { animate: true, duration: 0.5 })
    }
  }, [marker, center, zoom])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Mostra errore se c'è un problema
  if (error) {
    return (
      <Card
        className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">Impossibile caricare la mappa</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Riprova
          </Button>
        </div>
      </Card>
    )
  }

  // Mostra loading durante il caricamento
  if (isLoading || !mapReady) {
    return (
      <Card
        className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="relative">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse"></div>
          </div>
          <p className="text-sm text-blue-700 font-medium">Caricamento mappa...</p>
          <p className="text-xs text-blue-600 mt-1">Preparazione dei controlli interattivi</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      {/* CSS personalizzato per i marker */}
      <style jsx global>{`
        .custom-marker-container {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-marker {
          position: relative;
          width: 30px;
          height: 30px;
        }
        
        .marker-pin {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: absolute;
          top: 5px;
          left: 5px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .marker-pulse {
          width: 30px;
          height: 30px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 0;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .leaflet-container {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.8) !important;
          font-size: 10px !important;
          padding: 2px 4px !important;
        }
      `}</style>

      <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-black" : ""} ${className}`}>
        <div
          ref={mapContainerRef}
          className="w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg"
          style={{ height: isFullscreen ? "100vh" : height }}
        />

        {/* Controlli personalizzati */}
        {mapReady && (
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="h-8 w-8 hover:bg-blue-100"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="h-8 w-8 hover:bg-blue-100"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetView}
                className="h-8 w-8 hover:bg-blue-100"
                title="Reset vista"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 hover:bg-blue-100"
                title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Indicatore zoom */}
        {mapReady && (
          <div className="absolute bottom-3 left-3 z-[1000]">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-3 py-1">
              <span className="text-xs font-medium text-gray-700">Zoom: {currentZoom}</span>
            </div>
          </div>
        )}

        {/* Istruzioni per l'uso */}
        {interactive && onMarkerChange && mapReady && (
          <div className="absolute bottom-3 right-3 z-[1000]">
            <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg shadow-lg border border-blue-500 px-3 py-2 max-w-48">
              <p className="text-xs text-white font-medium">
                <MapPin className="h-3 w-3 inline mr-1" />
                Clicca sulla mappa per posizionare il marker
              </p>
            </div>
          </div>
        )}

        {/* Pulsante chiudi fullscreen */}
        {isFullscreen && (
          <Button
            variant="secondary"
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 z-[1001] bg-white/90 backdrop-blur-sm"
          >
            Chiudi
          </Button>
        )}
      </div>
    </>
  )
}
