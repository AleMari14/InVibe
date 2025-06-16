"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Skeleton } from "./skeleton"

// Risolve il problema delle icone di Leaflet in Next.js
const createMarkerIcon = () => {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

// Componente per aggiornare la vista della mappa quando cambiano le coordinate
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

// Componente per gestire gli eventi della mappa
function MapEventHandler({ onMarkerChange }: { onMarkerChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onMarkerChange(e.latlng.lat, e.latlng.lng)
    },
  })

  return null
}

interface MapProps {
  center: [number, number] | null
  marker?: [number, number] | null
  onMarkerChange?: (lat: number, lng: number) => void
  height?: string
  zoom?: number
  interactive?: boolean
  className?: string
}

export function Map({
  center,
  marker,
  onMarkerChange,
  height = "300px",
  zoom = 13,
  interactive = true,
  className = "",
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const markerRef = useRef<L.Marker | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const defaultCenter: [number, number] = [41.9028, 12.4964] // Roma come default

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Gestisce il trascinamento del marker
  const handleMarkerDrag = (e: L.DragEndEvent) => {
    if (onMarkerChange) {
      const marker = e.target
      const position = marker.getLatLng()
      onMarkerChange(position.lat, position.lng)
    }
  }

  if (!isMounted) {
    return <Skeleton className={`w-full ${className}`} style={{ height }} />
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <MapContainer
        center={center || defaultCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl={false}
        whenCreated={(map) => {
          mapRef.current = map
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {center && <MapUpdater center={center} />}

        {onMarkerChange && <MapEventHandler onMarkerChange={onMarkerChange} />}

        {marker && (
          <Marker
            position={marker}
            icon={createMarkerIcon()}
            draggable={!!onMarkerChange}
            eventHandlers={{
              dragend: handleMarkerDrag,
            }}
            ref={markerRef}
          />
        )}
      </MapContainer>
    </div>
  )
}
