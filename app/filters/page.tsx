"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, Calendar, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function FiltersPage() {
  const [priceRange, setPriceRange] = useState([50, 500])
  const [guestCount, setGuestCount] = useState([2, 10])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [location, setLocation] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const amenities = [
    "Pool",
    "Beach Access",
    "DJ Setup",
    "Full Kitchen",
    "Parking",
    "WiFi",
    "Hot Tub",
    "Game Room",
    "Outdoor Space",
    "Pet Friendly",
    "Smoking Allowed",
  ]

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]))
  }

  const clearFilters = () => {
    setPriceRange([50, 500])
    setGuestCount([2, 10])
    setSelectedAmenities([])
    setLocation("")
    setDateFrom("")
    setDateTo("")
    localStorage.removeItem("invibe-filters")
  }

  const handleApplyFilters = () => {
    const filters = {
      priceRange,
      guestCount,
      selectedAmenities,
      location,
      dateFrom,
      dateTo,
    }
    localStorage.setItem("invibe-filters", JSON.stringify(filters))
  }

  // Riepilogo filtri attivi
  const activeFilters = [
    ...(dateFrom ? [{ label: `Dal ${dateFrom}`, icon: <Calendar className="h-4 w-4 text-green-400" /> }] : []),
    ...(dateTo ? [{ label: `Al ${dateTo}`, icon: <Calendar className="h-4 w-4 text-green-400" /> }] : []),
    ...(priceRange[0] !== 50 || priceRange[1] !== 500 ? [{ label: `€${priceRange[0]} - €${priceRange[1]}`, icon: <DollarSign className="h-4 w-4 text-yellow-400" /> }] : []),
    ...(guestCount[0] !== 2 || guestCount[1] !== 10 ? [{ label: `${guestCount[0]}-${guestCount[1]} ospiti`, icon: <Users className="h-4 w-4 text-purple-400" /> }] : []),
    ...selectedAmenities.map(a => ({ label: a, icon: <Badge className="bg-pink-500 text-white animate-pulse">✓</Badge> })),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-purple-900 text-white p-0 sm:p-0">
      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-900 to-purple-800 border-b border-blue-700 px-4 py-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">Filtri</h1>
          </div>
          <Button variant="outline" onClick={clearFilters} className="border-blue-400 text-blue-300 hover:bg-blue-900/30">
            Cancella tutto
          </Button>
        </div>
        {/* Badge filtri attivi */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((f, i) => (
              <Badge key={i} className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-fade-in">
                {f.icon}
                {f.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Date */}
        <Card className="bg-white/10 border-blue-800 shadow-2xl rounded-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-300">
              <Calendar className="h-5 w-5 text-green-400" />
              Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom" className="text-gray-300">Dal</Label>
                <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-gray-800 border-blue-700 text-white focus:border-green-400" />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-gray-300">Al</Label>
                <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-gray-800 border-blue-700 text-white focus:border-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Range */}
        <Card className="bg-white/10 border-blue-800 shadow-2xl rounded-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-300">
              <DollarSign className="h-5 w-5 text-yellow-400" />
              Prezzo (€)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-2">
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={1000}
                min={0}
                step={25}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-yellow-200">
              <span>€{priceRange[0]}</span>
              <span>€{priceRange[1]}+</span>
            </div>
          </CardContent>
        </Card>

        {/* Guest Count */}
        <Card className="bg-white/10 border-blue-800 shadow-2xl rounded-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-purple-300">
              <Users className="h-5 w-5 text-purple-400" />
              Ospiti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-2">
              <Slider value={guestCount} onValueChange={setGuestCount} max={50} min={1} step={1} className="w-full" />
            </div>
            <div className="flex justify-between text-sm text-purple-200">
              <span>{guestCount[0]} ospiti</span>
              <span>{guestCount[1]}+ ospiti</span>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="bg-white/10 border-blue-800 shadow-2xl rounded-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg text-pink-300">Servizi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-400 duration-150",
                    selectedAmenities.includes(amenity)
                      ? "border-pink-500 bg-pink-500/30 text-white shadow-lg scale-105 animate-pulse"
                      : "border-gray-700 bg-gray-800 hover:border-pink-400 text-gray-300 hover:scale-105"
                  )}
                  aria-pressed={selectedAmenities.includes(amenity)}
                >
                  <span className="text-lg transition-all duration-150">{selectedAmenities.includes(amenity) ? "✓" : ""}</span>
                  {amenity}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Apply Filters Button */}
        <div className="pt-6">
          <Link href="/">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg h-14 shadow-2xl hover:scale-105 transition-transform duration-200 ring-2 ring-blue-400/40 hover:ring-purple-500/60 animate-glow"
              onClick={handleApplyFilters}
            >
              <span className="drop-shadow-lg">Applica Filtri</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
