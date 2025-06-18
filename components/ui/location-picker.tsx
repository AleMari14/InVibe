"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTheme as useNextTheme } from "next-themes"
import dynamic from "next/dynamic"

// Importa la mappa in modo dinamico per evitare problemi SSR
const Map = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted animate-pulse rounded-md"></div>,
})

interface LocationPickerProps {
  value?: string
  onChange: (location: string, coordinates: { lat: number; lng: number }) => void
  error?: string
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState(value || "")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme } = useNextTheme()

  // Gestisci i click fuori dal menu dei suggerimenti
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Cerca luoghi quando l'utente digita
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    setShowSuggestions(true)

    try {
      // Usa Nominatim per la ricerca di luoghi
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&addressdetails=1&limit=5&accept-language=it`,
        {
          headers: {
            "User-Agent": "InVibe/1.0",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      } else {
        console.error("Errore nella ricerca dei luoghi:", response.statusText)
        setSuggestions([])
      }
    } catch (error) {
      console.error("Errore nella ricerca dei luoghi:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Gestisci la selezione di un luogo
  const handleSelectLocation = (place: any) => {
    const locationName = place.display_name
    const newCoordinates = {
      lat: Number.parseFloat(place.lat),
      lng: Number.parseFloat(place.lon),
    }

    setSelectedLocation(locationName)
    setCoordinates(newCoordinates)
    setSearchQuery("")
    setSuggestions([])
    setShowSuggestions(false)

    // Notifica il componente padre
    onChange(locationName, newCoordinates)
  }

  // Gestisci il cambio di posizione sulla mappa
  const handleMapLocationChange = (lat: number, lng: number) => {
    const newCoordinates = { lat, lng }
    setCoordinates(newCoordinates)

    // Esegui reverse geocoding per ottenere l'indirizzo
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=it`,
      {
        headers: {
          "User-Agent": "InVibe/1.0",
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.display_name) {
          setSelectedLocation(data.display_name)
          onChange(data.display_name, newCoordinates)
        }
      })
      .catch((error) => {
        console.error("Errore nel reverse geocoding:", error)
      })
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="location" className="text-base font-medium flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Località *
      </Label>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            id="location-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchPlaces(e.target.value)
            }}
            onFocus={() => {
              if (searchQuery.length >= 3) {
                setShowSuggestions(true)
              }
            }}
            placeholder="Cerca una località..."
            className="pl-10 bg-background text-foreground"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Suggerimenti di ricerca */}
        {showSuggestions && suggestions.length > 0 && (
          <Card
            ref={suggestionsRef}
            className="absolute z-[100] mt-1 w-full max-h-60 overflow-auto shadow-lg border border-border bg-card"
          >
            <div className="p-1">
              {suggestions.map((place) => (
                <Button
                  key={place.place_id}
                  variant="ghost"
                  className="w-full justify-start text-left px-3 py-2 h-auto"
                  onClick={() => handleSelectLocation(place)}
                >
                  <div>
                    <div className="font-medium text-foreground">{place.name || place.display_name.split(",")[0]}</div>
                    <div className="text-xs text-muted-foreground truncate">{place.display_name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Mostra la posizione selezionata */}
      {selectedLocation && (
        <div className="text-sm flex items-start gap-2 mt-2">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <span className="text-foreground">{selectedLocation}</span>
        </div>
      )}

      {/* Mappa interattiva */}
      <div className="h-[300px] mt-3 rounded-md overflow-hidden border-2 border-border">
        <Map
          center={coordinates || { lat: 41.9028, lng: 12.4964 }} // Default: Roma
          zoom={coordinates ? 15 : 5}
          onLocationChange={handleMapLocationChange}
          selectedLocation={coordinates}
          isDarkMode={theme === "dark"}
        />
      </div>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  )
}
