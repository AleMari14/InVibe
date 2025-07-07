"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin } from "lucide-react"
import { useDebounce } from "use-debounce"

interface Suggestion {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface LocationSearchInputProps {
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void
}

export function LocationSearchInput({ onLocationSelect }: LocationSearchInputProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [debouncedQuery] = useDebounce(query, 500)

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery,
        )}&format=json&addressdetails=1&limit=5`,
      )
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error("Error fetching location suggestions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useState(() => {
    fetchSuggestions(debouncedQuery)
  })

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.display_name)
    setSuggestions([])
    onLocationSelect(suggestion.display_name, {
      lat: Number.parseFloat(suggestion.lat),
      lng: Number.parseFloat(suggestion.lon),
    })
  }

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location-search" className="text-base font-medium text-gray-300">
        Cerca una località *
      </Label>
      <div className="relative">
        <Input
          id="location-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Es: Via Roma 1, Milano"
          className="h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 cursor-pointer hover:bg-gray-700 flex items-start gap-3"
            >
              <MapPin className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-300">{suggestion.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
