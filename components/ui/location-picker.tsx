"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTheme as useNextTheme } from "next-themes"
import dynamic from "next/dynamic"

// Carichiamo il componente Leaflet Map in modo dinamico per evitare problemi SSR
const Map = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-muted animate-pulse rounded-md" />,
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { theme } = useNextTheme()

  /* --- Gestione click fuori dal menu dei suggerimenti --- */
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

  /* --- Cleanup timeout in unmount --- */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  /* --- Ricerca luoghi con debounce usando Nominatim (OpenStreetMap) --- */
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      setShowSuggestions(true)

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query,
          )}&addressdetails=1&limit=5&accept-language=it&countrycodes=it`,
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
      } catch (err) {
        console.error("Errore nella ricerca dei luoghi:", err)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  /* --- Selezione di un luogo dai suggerimenti --- */
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

    onChange(locationName, newCoordinates)
  }

  /* --- Selezione tramite click sulla mappa --- */
  const handleMapLocationChange = (lat: number, lng: number) => {
    const newCoordinates = { lat, lng }
    setCoordinates(newCoordinates)

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=it`,
      { headers: { "User-Agent": "InVibe/1.0" } },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.display_name) {
          setSelectedLocation(data.display_name)
          onChange(data.display_name, newCoordinates)
        }
      })
      .catch((err) => console.error("Errore nel reverse geocoding:", err))
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="location" className="text-base font-medium flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Località *
      </Label>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            id="location-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchPlaces(e.target.value)
            }}
            onFocus={() => {
              if (searchQuery.length >= 2) setShowSuggestions(true)
            }}
            placeholder="Cerca una località in Italia..."
            className="pl-10 h-12 text-base bg-background text-foreground border-2 focus:border-primary"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <Card
            ref={suggestionsRef}
            className="absolute z-[9999] mt-2 w-full max-h-48 overflow-auto shadow-2xl border-2 border-primary/20 bg-card backdrop-blur-sm"
          >
            <div className="p-2">
              {suggestions.map((place, index) => (
                <Button
                  key={place.place_id || index}
                  variant="ghost"
                  className="w-full justify-start text-left px-3 py-3 h-auto hover:bg-primary/10 rounded-md"
                  onClick={() => handleSelectLocation(place)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm">
                        {place.name || place.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{place.display_name}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {selectedLocation && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Località selezionata:</p>
              <p className="text-sm text-muted-foreground break-words">{selectedLocation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mappa interattiva (Leaflet) */}
      <div className="relative">
        <div className="h-[250px] rounded-lg overflow-hidden border-2 border-border shadow-sm">
          <Map
            center={coordinates || { lat: 41.9028, lng: 12.4964 }} // Roma di default
            zoom={coordinates ? 15 : 6}
            onLocationChange={handleMapLocationChange}
            selectedLocation={coordinates}
            isDarkMode={theme === "dark"}
          />
        </div>
        <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground border">
          Clicca sulla mappa per selezionare una posizione
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
