"use client"

import { useState, useCallback, useEffect } from "react"
import { Label } from "./label"
import { Alert, AlertDescription } from "./alert"
import { MapPin, Loader2, Search } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Map } from "./map"
import { debounce } from "lodash"

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
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)

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
    }
  }, [searchQuery, searchPlaces])

  const handleSelect = (place: NominatimResult) => {
    onChange(place.display_name, {
      lat: Number.parseFloat(place.lat),
      lng: Number.parseFloat(place.lon),
    })
    setCoordinates([Number.parseFloat(place.lat), Number.parseFloat(place.lon)])
    setOpen(false)
    setSearchQuery("")
  }

  const handleMarkerChange = (lat: number, lng: number) => {
    // Reverse geocoding to get address from coordinates
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
        }
      })
      .catch((error) => {
        console.error("Errore nel reverse geocoding:", error)
        // Fallback: use coordinates as location name
        onChange(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`, { lat, lng })
      })
  }

  // Update coordinates when value changes
  useEffect(() => {
    if (!value) {
      setCoordinates(null)
    }
  }, [value])

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Località *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {value || "Seleziona una località..."}
            <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Cerca una località..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex-1 border-0 outline-none focus:ring-0"
              />
              {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
            </div>
            <CommandList>
              <CommandEmpty>
                {searchQuery.length < 3 ? "Digita almeno 3 caratteri per cercare" : "Nessun risultato trovato."}
              </CommandEmpty>
              <CommandGroup>
                {suggestions.map((place) => (
                  <CommandItem key={place.place_id} value={place.display_name} onSelect={() => handleSelect(place)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    <div className="overflow-hidden">
                      <div className="truncate">{place.display_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {place.type} in {place.class}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Mappa interattiva */}
      <div className="mt-2">
        <Map
          center={coordinates || undefined}
          marker={coordinates || undefined}
          onMarkerChange={handleMarkerChange}
          height="250px"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {value && <p className="text-sm text-muted-foreground">Località selezionata: {value}</p>}
    </div>
  )
}
