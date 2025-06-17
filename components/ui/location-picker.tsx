"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Label } from "./label"
import { Alert, AlertDescription } from "./alert"
import { MapPin, Loader2, X, Search, Navigation, Globe } from "lucide-react"
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
  address?: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
}

interface GooglePlacesResult {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
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
  const [showMap, setShowMap] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Funzione per ottenere la posizione corrente
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("La geolocalizzazione non è supportata dal tuo browser")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        try {
          // Reverse geocoding per ottenere l'indirizzo
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=it`,
            {
              headers: {
                "User-Agent": "InVibe/1.0",
              },
            },
          )

          if (response.ok) {
            const data = await response.json()
            if (data.display_name) {
              onChange(data.display_name, { lat, lng })
              setCoordinates([lat, lng])
              setSelectedPlace({ name: data.display_name, location: { lat, lng } })
              setShowMap(true)
            }
          }
        } catch (error) {
          console.error("Errore nel reverse geocoding:", error)
          // Fallback: usa le coordinate come nome del luogo
          const locationName = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
          onChange(locationName, { lat, lng })
          setSelectedPlace({ name: locationName, location: { lat, lng } })
          setShowMap(true)
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error("Errore nella geolocalizzazione:", error)
        setIsGettingLocation(false)
        alert("Impossibile ottenere la posizione corrente")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minuti
      },
    )
  }, [onChange])

  // Funzione migliorata per cercare luoghi
  const searchPlaces = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        // Cerca prima in Italia, poi globalmente
        const searches = [
          // Ricerca specifica per l'Italia
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query,
          )}&countrycodes=it&limit=5&addressdetails=1&accept-language=it`,
          // Ricerca globale se non troviamo risultati in Italia
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query,
          )}&limit=3&addressdetails=1&accept-language=it`,
        ]

        let allResults: NominatimResult[] = []

        for (const searchUrl of searches) {
          try {
            const response = await fetch(searchUrl, {
              headers: {
                "User-Agent": "InVibe/1.0",
              },
            })

            if (response.ok) {
              const data: NominatimResult[] = await response.json()
              allResults = [...allResults, ...data]
            }
          } catch (error) {
            console.error("Errore in una ricerca:", error)
          }
        }

        // Rimuovi duplicati basati su place_id
        const uniqueResults = allResults.filter(
          (result, index, self) => index === self.findIndex((r) => r.place_id === result.place_id),
        )

        // Ordina per importanza e rilevanza
        const sortedResults = uniqueResults
          .sort((a, b) => {
            // Priorità per luoghi in Italia
            const aIsItaly =
              a.display_name.toLowerCase().includes("italia") || a.display_name.toLowerCase().includes("italy")
            const bIsItaly =
              b.display_name.toLowerCase().includes("italia") || b.display_name.toLowerCase().includes("italy")

            if (aIsItaly && !bIsItaly) return -1
            if (!aIsItaly && bIsItaly) return 1

            // Poi per importanza
            return (b.importance || 0) - (a.importance || 0)
          })
          .slice(0, 8)

        setSuggestions(sortedResults)
        setShowSuggestions(sortedResults.length > 0)
      } catch (error) {
        console.error("Errore nella ricerca dei luoghi:", error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [],
  )

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPlaces(searchQuery)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, searchPlaces])

  const formatDisplayName = (place: NominatimResult) => {
    const parts = place.display_name.split(",")
    const mainPart = parts[0]?.trim()
    const secondaryPart = parts.slice(1, 3).join(",").trim()

    return {
      main: mainPart || place.display_name,
      secondary: secondaryPart || parts.slice(1).join(",").trim(),
    }
  }

  const getPlaceIcon = (place: NominatimResult) => {
    const type = place.type?.toLowerCase()
    const className = place.class?.toLowerCase()

    if (type === "city" || type === "town" || type === "village") return "🏙️"
    if (type === "house" || className === "building") return "🏠"
    if (type === "restaurant" || type === "cafe") return "🍽️"
    if (type === "hotel" || type === "guest_house") return "🏨"
    if (className === "tourism") return "🎯"
    if (className === "leisure") return "🎪"
    if (type === "beach") return "🏖️"
    if (type === "mountain" || type === "peak") return "⛰️"
    return "📍"
  }

  const handleSelect = (place: NominatimResult) => {
    const lat = Number.parseFloat(place.lat)
    const lng = Number.parseFloat(place.lon)

    onChange(place.display_name, { lat, lng })
    setCoordinates([lat, lng])
    setSelectedPlace({ name: place.display_name, location: { lat, lng } })
    setSearchQuery("")
    setShowSuggestions(false)
    setShowMap(true)
  }

  const handleMarkerChange = (lat: number, lng: number) => {
    // Reverse geocoding per ottenere l'indirizzo dalle coordinate
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
      setShowMap(false)
    } else if (value && !selectedPlace) {
      // Se abbiamo un valore ma non un luogo selezionato, proviamo a geocodificarlo
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=1&accept-language=it`,
        {
          headers: {
            "User-Agent": "InVibe/1.0",
          },
        },
      )
        .then((response) => response.json())
        .then((data) => {
          if (data && data.length > 0) {
            const lat = Number.parseFloat(data[0].lat)
            const lng = Number.parseFloat(data[0].lon)
            setCoordinates([lat, lng])
            setSelectedPlace({ name: value, location: { lat, lng } })
            setShowMap(true)
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
    setShowMap(false)
    setSearchQuery("")
    onChange("", { lat: 0, lng: 0 })
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const toggleMap = () => {
    setShowMap(!showMap)
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="location" className="text-sm font-medium">
        Località *
      </Label>

      {/* Campo di ricerca con pulsante geolocalizzazione */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          ref={inputRef}
          id="location"
          placeholder="Cerca una località (es. Roma, Milano, Firenze...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 pr-20 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="h-6 w-6 p-0"
            title="Usa posizione corrente"
          >
            {isGettingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Suggerimenti migliorati */}
      {showSuggestions && (
        <div ref={suggestionsRef} className="relative z-50">
          <Card className="absolute w-full max-h-80 overflow-y-auto shadow-lg border-border">
            <div className="p-1">
              {suggestions.length === 0 && searchQuery.length >= 2 && !isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessun risultato trovato
                  <p className="text-xs mt-1">Prova con un termine di ricerca diverso</p>
                </div>
              ) : (
                suggestions.map((place) => {
                  const formatted = formatDisplayName(place)
                  const icon = getPlaceIcon(place)

                  return (
                    <Button
                      key={place.place_id}
                      variant="ghost"
                      className="w-full justify-start text-left px-3 py-3 h-auto hover:bg-accent"
                      onClick={() => handleSelect(place)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{formatted.main}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{formatted.secondary}</div>
                          {place.address?.country && (
                            <div className="text-xs text-blue-600 mt-1">{place.address.country}</div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex-shrink-0">{place.type}</div>
                      </div>
                    </Button>
                  )
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Luogo selezionato */}
      {selectedPlace && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-1">{selectedPlace.name.split(",")[0]}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{selectedPlace.name}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedPlace.location.lat.toFixed(4)}, {selectedPlace.location.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={toggleMap} className="h-8 w-8 p-0">
                <MapPin className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearSelection} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mappa */}
      {showMap && coordinates && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Posizione sulla mappa</Label>
            <Button variant="outline" size="sm" onClick={toggleMap} className="text-xs">
              {showMap ? "Nascondi" : "Mostra"} Mappa
            </Button>
          </div>
          <div className="rounded-md overflow-hidden border border-border">
            <Map center={coordinates} marker={coordinates} onMarkerChange={handleMarkerChange} height="200px" />
          </div>
          <p className="text-xs text-muted-foreground">Trascina il marker per regolare la posizione esatta</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
