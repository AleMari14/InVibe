"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Label } from "./label"
import { Alert, AlertDescription } from "./alert"
import { MapPin, Loader2, X } from "lucide-react"
import { Button } from "./button"
import { Map } from "./map"
import { debounce } from "lodash"
import { Card } from "./card"

interface LocationPickerProps {
  value: string
  onChange: (location: string, coordinates: { lat: number; lng: number }) => void
  error?: string
}

interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string
    location: { lat: number; lng: number }
  } | null>(null)

  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Funzione per cercare luoghi con Nominatim
  const searchPlaces = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 3) return

      setIsLoading(true)
      try {
        // Utilizziamo l'API Nominatim per cercare luoghi
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query,
          )}&countrycodes=it&limit=5&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "it",
              "User-Agent": "InVibe/1.0",
            },
          },
        )

        if (!response.ok) {
          throw new Error("Errore nella ricerca dei luoghi")
        }

        const data: NominatimResult[] = await response.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch (error) {
        console.error("Errore nella ricerca dei luoghi:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [],
  )

  useEffect(() => {
    if (searchQuery.length >= 3) {
      searchPlaces(searchQuery)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, searchPlaces])

  const handleSelect = (place: NominatimResult) => {
    const lat = Number.parseFloat(place.lat)
    const lng = Number.parseFloat(place.lon)

    onChange(place.display_name, { lat, lng })
    setCoordinates([lat, lng])
    setSelectedPlace({ name: place.display_name, location: { lat, lng } })
    setSearchQuery("")
    setShowSuggestions(false)
  }

  const handleMarkerChange = (lat: number, lng: number) => {
    // Reverse geocoding per ottenere l'indirizzo dalle coordinate
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        "Accept-Language": "it",
        "User-Agent": "InVibe/1.0",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.display_name) {
          onChange(data.display_name, { lat, lng })
          setSelectedPlace({ name: data.display_name, location: { lat, lng } })
        }
      })
      .catch((error) => {
        console.error("Errore nel reverse geocoding:", error)
        // Fallback: usa le coordinate come nome del luogo
        const locationName = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
        onChange(locationName, { lat, lng })
        setSelectedPlace({ name: locationName, location: { lat, lng } })
      })
  }

  // Chiudi i suggerimenti quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Aggiorna le coordinate quando cambia il valore
  useEffect(() => {
    if (!value) {
      setCoordinates(null)
      setSelectedPlace(null)
    } else if (value && !selectedPlace) {
      // Se abbiamo un valore ma non un luogo selezionato, proviamo a geocodificarlo
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=1`, {
        headers: {
          "Accept-Language": "it",
          "User-Agent": "InVibe/1.0",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.length > 0) {
            const lat = Number.parseFloat(data[0].lat)
            const lng = Number.parseFloat(data[0].lon)
            setCoordinates([lat, lng])
            setSelectedPlace({ name: value, location: { lat, lng } })
          }
        })
        .catch((error) => {
          console.error("Errore nella geocodifica:", error)
        })
    }
  }, [value, selectedPlace])

  const handleClearSelection = () => {
    setSelectedPlace(null)
    setCoordinates(null)
    onChange("", { lat: 0, lng: 0 })
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Località *</Label>

      {/* Campo di ricerca */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          id="location"
          placeholder="Cerca una località..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Suggerimenti */}
      {showSuggestions && (
        <div ref={suggestionsRef} className="relative z-50">
          <Card className="absolute w-full max-h-60 overflow-y-auto shadow-lg">
            <div className="p-1">
              {suggestions.length === 0 && searchQuery.length >= 3 && !isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Nessun risultato trovato</div>
              ) : (
                suggestions.map((place) => (
                  <Button
                    key={place.place_id}
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 h-auto"
                    onClick={() => handleSelect(place)}
                  >
                    <div>
                      <div className="font-medium">{place.display_name.split(",")[0]}</div>
                      <div className="text-xs text-muted-foreground truncate">{place.display_name}</div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Luogo selezionato */}
      {selectedPlace && (
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{selectedPlace.name.split(",")[0]}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedPlace.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearSelection} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Mappa */}
      <Map
        center={coordinates || undefined}
        marker={coordinates || undefined}
        onMarkerChange={handleMarkerChange}
        height="250px"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
