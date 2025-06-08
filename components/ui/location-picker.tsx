"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Label } from "./label"
import { Alert, AlertDescription } from "./alert"
import { MapPin, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
// import type { google } from "googlemaps"

interface LocationPickerProps {
  value: string
  onChange: (location: string, coordinates: { lat: number; lng: number }) => void
  error?: string
}

// Lista delle principali città italiane con le loro coordinate
const italianCities = [
  { name: "Roma", lat: 41.9028, lng: 12.4964 },
  { name: "Milano", lat: 45.4642, lng: 9.1900 },
  { name: "Napoli", lat: 40.8518, lng: 14.2681 },
  { name: "Torino", lat: 45.0703, lng: 7.6869 },
  { name: "Palermo", lat: 38.1157, lng: 13.3615 },
  { name: "Genova", lat: 44.4056, lng: 8.9463 },
  { name: "Bologna", lat: 44.4949, lng: 11.3426 },
  { name: "Firenze", lat: 43.7696, lng: 11.2558 },
  { name: "Bari", lat: 41.1171, lng: 16.8719 },
  { name: "Catania", lat: 37.5079, lng: 15.0830 },
  { name: "Venezia", lat: 45.4408, lng: 12.3155 },
  { name: "Verona", lat: 45.4384, lng: 10.9917 },
  { name: "Messina", lat: 38.1938, lng: 15.5540 },
  { name: "Padova", lat: 45.4064, lng: 11.8768 },
  { name: "Trieste", lat: 45.6495, lng: 13.7768 },
  { name: "Taranto", lat: 40.4647, lng: 17.2470 },
  { name: "Brescia", lat: 45.5416, lng: 10.2118 },
  { name: "Prato", lat: 43.8808, lng: 11.0966 },
  { name: "Parma", lat: 44.8015, lng: 10.3279 },
  { name: "Modena", lat: 44.6471, lng: 10.9252 },
  { name: "Reggio Calabria", lat: 38.1147, lng: 15.6490 },
  { name: "Reggio Emilia", lat: 44.6981, lng: 10.6302 },
  { name: "Perugia", lat: 43.1107, lng: 12.3908 },
  { name: "Ravenna", lat: 44.4175, lng: 12.2012 },
  { name: "Livorno", lat: 43.5528, lng: 10.3089 },
  { name: "Cagliari", lat: 39.2238, lng: 9.1217 },
  { name: "Foggia", lat: 41.4624, lng: 15.5440 },
  { name: "Rimini", lat: 44.0678, lng: 12.5695 },
  { name: "Salerno", lat: 40.6824, lng: 14.7680 },
  { name: "Ferrara", lat: 44.8381, lng: 11.6198 },
  { name: "Sassari", lat: 40.7259, lng: 8.5557 },
  { name: "Latina", lat: 41.4675, lng: 12.9039 },
  { name: "Giugliano in Campania", lat: 40.9319, lng: 14.1955 },
  { name: "Monza", lat: 45.5800, lng: 9.2725 },
  { name: "Siracusa", lat: 37.0755, lng: 15.2866 },
  { name: "Pescara", lat: 42.4617, lng: 14.2162 },
  { name: "Bergamo", lat: 45.6983, lng: 9.6773 },
  { name: "Forlì", lat: 44.2218, lng: 12.0414 },
  { name: "Vicenza", lat: 45.5489, lng: 11.5474 },
  { name: "Terni", lat: 42.5675, lng: 12.6460 },
  { name: "Bolzano", lat: 46.4983, lng: 11.3548 },
  { name: "Novara", lat: 45.4467, lng: 8.6217 },
  { name: "Piacenza", lat: 45.0522, lng: 9.6934 },
  { name: "Udine", lat: 46.0715, lng: 13.2346 },
  { name: "Ancona", lat: 43.6158, lng: 13.5189 },
  { name: "Andria", lat: 41.2317, lng: 16.2979 },
  { name: "Arezzo", lat: 43.4628, lng: 11.8807 },
  { name: "Cesena", lat: 44.1391, lng: 12.2431 },
  { name: "Pesaro", lat: 43.9098, lng: 12.9131 },
  { name: "Alessandria", lat: 44.9127, lng: 8.6157 },
  { name: "La Spezia", lat: 44.1024, lng: 9.8241 },
  { name: "Lucca", lat: 43.8427, lng: 10.5027 },
]

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  // const [suggestions, setSuggestions] = useState<Array<{ description: string; placeId: string }>>([])
  // const [isLoading, setIsLoading] = useState(false)
  // const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  // const geocoder = useRef<google.maps.Geocoder | null>(null)

  // useEffect(() => {
  //   // Initialize Google Places services
  //   if (typeof window !== "undefined" && window.google) {
  //     autocompleteService.current = new window.google.maps.places.AutocompleteService()
  //     geocoder.current = new window.google.maps.Geocoder()
  //   }
  // }, [])

  // const fetchSuggestions = useCallback(async (query: string) => {
  //   if (!query.trim() || !autocompleteService.current) return

  //   setIsLoading(true)
  //   try {
  //     const response = await autocompleteService.current.getPlacePredictions({
  //       input: query,
  //       types: ["(cities)"],
  //       componentRestrictions: { country: "it" }, // Restrict to Italy
  //     })

  //     setSuggestions(
  //       response.predictions.map((prediction) => ({
  //         description: prediction.description,
  //         placeId: prediction.place_id,
  //       })),
  //     )
  //   } catch (error) {
  //     console.error("Error fetching suggestions:", error)
  //     setSuggestions([])
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }, [])

  // const handleSelect = useCallback(
  //   async (placeId: string, description: string) => {
  //     if (!geocoder.current) return

  //     try {
  //       const response = await geocoder.current.geocode({ placeId })
  //       if (response.results[0]) {
  //         const location = response.results[0].geometry.location
  //         onChange(description, {
  //           lat: location.lat(),
  //           lng: location.lng(),
  //         })
  //         setOpen(false)
  //       }
  //     } catch (error) {
  //       console.error("Error getting location details:", error)
  //     }
  //   },
  //   [onChange],
  // )

  const filteredCities = italianCities.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (city: typeof italianCities[0]) => {
    onChange(city.name, { lat: city.lat, lng: city.lng })
    setOpen(false)
  }

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
            <CommandInput
              placeholder="Cerca una località..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>Nessun risultato trovato.</CommandEmpty>
              <CommandGroup>
                {filteredCities.map((city) => (
                  <CommandItem
                    key={city.name}
                    value={city.name}
                    onSelect={() => handleSelect(city)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {city.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {value && <p className="text-sm text-muted-foreground">Località selezionata: {value}</p>}
    </div>
  )
}
