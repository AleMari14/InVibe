"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Label } from "./label"
import { Alert, AlertDescription } from "./alert"
import { MapPin, Loader2, X, Search, Navigation, Globe, Eye, EyeOff } from "lucide-react"
import { Button } from "./button"
import { Map } from "./map"
import { debounce } from "lodash"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

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
    <div className="space-y-4">
      <Label htmlFor="location" className="text-base font-medium">
        Località *
      </Label>

      {/* Campo di ricerca migliorato */}
      <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              ref={inputRef}
              id="location"
              placeholder="Cerca una località (es. Roma, Milano, Firenze...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-12 w-full rounded-lg border-0 bg-transparent px-12 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="h-8 w-8 p-0 hover:bg-blue-100"
                title="Usa posizione corrente"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 text-blue-600" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggerimenti migliorati */}
      {showSuggestions && (
        <div ref={suggestionsRef} className="relative z-50">
          <Card className="absolute w-full max-h-80 overflow-y-auto shadow-xl border-2 border-blue-200 bg-white">
            <CardContent className="p-2">
              {suggestions.length === 0 && searchQuery.length >= 2 && !isLoading ? (
                <div className="py-8 text-center text-gray-500">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nessun risultato trovato</p>
                  <p className="text-sm mt-1">Prova con un termine di ricerca diverso</p>
                </div>
              ) : (
                suggestions.map((place) => {
                  const formatted = formatDisplayName(place)
                  const icon = getPlaceIcon(place)

                  return (
                    <Button
                      key={place.place_id}
                      variant="ghost"
                      className="w-full justify-start text-left p-4 h-auto hover:bg-blue-50 rounded-lg"
                      onClick={() => handleSelect(place)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <span className="text-2xl flex-shrink-0 mt-1">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-base text-gray-800 truncate">{formatted.main}</div>
                          <div className="text-sm text-gray-600 line-clamp-2 mt-1">{formatted.secondary}</div>
                          {place.address?.country && (
                            <div className="text-xs text-blue-600 mt-2 font-medium">{place.address.country}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 bg-gray-100 px-2 py-1 rounded">
                          {place.type}
                        </div>
                      </div>
                    </Button>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Luogo selezionato migliorato */}
      {selectedPlace && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 line-clamp-1">{selectedPlace.name.split(",")[0]}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{selectedPlace.name}</p>
                  <p className="text-xs text-blue-600 mt-2 font-mono bg-white/50 px-2 py-1 rounded">
                    {selectedPlace.location.lat.toFixed(4)}, {selectedPlace.location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMap}
                  className="h-9 px-3 bg-white/80 hover:bg-white border-blue-300"
                >
                  {showMap ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showMap ? "Nascondi" : "Mostra"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-9 w-9 p-0 bg-white/80 hover:bg-red-50 border-red-300 text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mappa migliorata */}
      {showMap && coordinates && (
        <Card className="border-2 border-blue-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Posizione sulla mappa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Map
              center={coordinates}
              marker={coordinates}
              onMarkerChange={handleMarkerChange}
              height="300px"
              interactive={true}
            />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
