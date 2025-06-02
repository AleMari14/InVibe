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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Filters</h1>
          </div>
          <Button variant="ghost" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter city, state, or region"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">From</Label>
                <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dateTo">To</Label>
                <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Range */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price Range
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
            <div className="flex justify-between text-sm text-gray-600">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}+</span>
            </div>
          </CardContent>
        </Card>

        {/* Guest Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Number of Guests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-2">
              <Slider value={guestCount} onValueChange={setGuestCount} max={50} min={1} step={1} className="w-full" />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{guestCount[0]} guests</span>
              <span>{guestCount[1]}+ guests</span>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {amenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label htmlFor={amenity} className="text-sm cursor-pointer">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>

            {selectedAmenities.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Selected:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedAmenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Filters Button */}
        <Link href="/">
          <Button size="lg" className="w-full">
            Apply Filters
          </Button>
        </Link>
      </div>

      {/* Bottom padding */}
      <div className="h-4"></div>
    </div>
  )
}
