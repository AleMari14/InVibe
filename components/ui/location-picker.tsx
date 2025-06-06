"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Label } from "./label"
import { Alert, AlertDescription } from "./alert"
import { MapPin, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import type { google } from "googlemaps"

interface LocationPickerProps {
  value: string
  onChange: (location: string, coordinates: { lat: number; lng: number }) => void
  error?: string
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Array<{ description: string; placeId: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)

  useEffect(() => {
    // Initialize Google Places services
    if (typeof window !== "undefined" && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService()
      geocoder.current = new window.google.maps.Geocoder()
    }
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || !autocompleteService.current) return

    setIsLoading(true)
    try {
      const response = await autocompleteService.current.getPlacePredictions({
        input: query,
        types: ["(cities)"],
        componentRestrictions: { country: "it" }, // Restrict to Italy
      })

      setSuggestions(
        response.predictions.map((prediction) => ({
          description: prediction.description,
          placeId: prediction.place_id,
        })),
      )
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSelect = useCallback(
    async (placeId: string, description: string) => {
      if (!geocoder.current) return

      try {
        const response = await geocoder.current.geocode({ placeId })
        if (response.results[0]) {
          const location = response.results[0].geometry.location
          onChange(description, {
            lat: location.lat(),
            lng: location.lng(),
          })
          setOpen(false)
        }
      } catch (error) {
        console.error("Error getting location details:", error)
      }
    },
    [onChange],
  )

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
              onValueChange={(value) => {
                setSearchQuery(value)
                fetchSuggestions(value)
              }}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  "Nessun risultato trovato."
                )}
              </CommandEmpty>
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.placeId}
                    value={suggestion.description}
                    onSelect={() => handleSelect(suggestion.placeId, suggestion.description)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {suggestion.description}
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
