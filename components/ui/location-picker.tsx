"use client"

import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface LocationPickerProps {
  value: string
  onChange: (location: string, coordinates: { lat: number; lng: number }) => void
  error?: string
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Carica la mappa solo lato client
  useEffect(() => {
    setMapLoaded(true)
  }, [])

  // Funzione per cercare luoghi
  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) return

    setLoading(true)
    try {
      // Simuliamo i risultati di ricerca per questa demo
      const mockResults = [
        {
          name: `${query} - Centro`,
          address: `Via Roma 123, ${query}`,
          coordinates: { lat: 41.9028, lng: 12.4964 },
        },
        {
          name: `${query} - Stazione`,
          address: `Piazza della Stazione, ${query}`,
          coordinates: { lat: 41.9018, lng: 12.5014 },
        },
        {
          name: `${query} - Parco`,
          address: `Viale dei Giardini, ${query}`,
          coordinates: { lat: 41.9048, lng: 12.4924 },
        },
      ]

      // Simuliamo un ritardo di rete
      await new Promise((resolve) => setTimeout(resolve, 500))

      setSuggestions(mockResults)
    } catch (error) {
      console.error("Errore nella ricerca luoghi:", error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Gestisce la selezione di un luogo
  const handleSelectPlace = (place: any) => {
    onChange(place.name, place.coordinates)
    setSearchTerm(place.name)
    setSuggestions([])
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Località *</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          id="location"
          placeholder="Inserisci una località..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            searchPlaces(e.target.value)
          }}
          className="pl-10"
          required
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggerimenti */}
      {suggestions.length > 0 && (
        <Card className="absolute z-10 w-full max-h-60 overflow-y-auto shadow-lg">
          <div className="p-1">
            {suggestions.map((place, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left px-3 py-2 h-auto"
                onClick={() => handleSelectPlace(place)}
              >
                <div>
                  <div className="font-medium">{place.name}</div>
                  <div className="text-xs text-muted-foreground">{place.address}</div>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Mappa */}
      {mapLoaded && (
        <div className="h-48 bg-gray-100 rounded-md mt-2 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-blue-500 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">
                {value ? value : "Seleziona una località dalla ricerca"}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
