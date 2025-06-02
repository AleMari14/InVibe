"use client"

import { useState } from "react"
import { ArrowLeft, Star, MapPin, Calendar, Users, Share, Heart, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"

export default function ListingDetail() {
  const [isFavorite, setIsFavorite] = useState(false)

  const listing = {
    id: 1,
    title: "Luxury Beach House Party",
    location: "Malibu, CA",
    price: 150,
    rating: 4.8,
    reviews: 24,
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    host: {
      name: "Sarah M.",
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 4.9,
      reviews: 156,
    },
    date: "December 15-17, 2024",
    guests: "8-12 people",
    description:
      "Join us for an unforgettable weekend at this stunning beachfront property in Malibu. Perfect for celebrating special occasions with friends, this luxury house features panoramic ocean views, a private pool, and direct beach access.",
    amenities: ["Private Pool", "Beach Access", "DJ Setup", "Full Kitchen", "Parking", "WiFi"],
    rules: ["No smoking indoors", "Respect neighbors", "Clean up after yourself", "Music until 11 PM"],
    included: ["Welcome drinks", "Pool towels", "Beach chairs", "Sound system"],
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white">
            <Share className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/80 hover:bg-white"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </Button>
        </div>

        {/* Image Gallery */}
        <div className="overflow-x-auto">
          <div className="flex gap-2">
            {listing.images.map((image, index) => (
              <Image
                key={index}
                src={image || "/placeholder.svg"}
                alt={`${listing.title} ${index + 1}`}
                width={400}
                height={300}
                className="w-full h-64 object-cover flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Title and Rating */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{listing.rating}</span>
              <span className="text-gray-500">({listing.reviews})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-gray-600 mb-3">
            <MapPin className="h-4 w-4" />
            <span>{listing.location}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{listing.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{listing.guests}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Host Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={listing.host.avatar || "/placeholder.svg"} />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">Hosted by {listing.host.name}</div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {listing.host.rating} • {listing.host.reviews} reviews
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
        </div>

        <Separator />

        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2">About this party</h3>
          <p className="text-gray-700 leading-relaxed">{listing.description}</p>
        </div>

        {/* What's Included */}
        <div>
          <h3 className="font-semibold mb-3">What's included</h3>
          <div className="grid grid-cols-2 gap-2">
            {listing.included.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h3 className="font-semibold mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary">
                {amenity}
              </Badge>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div>
          <h3 className="font-semibold mb-3">House rules</h3>
          <div className="space-y-2">
            {listing.rules.map((rule) => (
              <div key={rule} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">${listing.price}</div>
            <div className="text-sm text-gray-500">per person</div>
          </div>
          <Link href={`/booking/${listing.id}`}>
            <Button size="lg" className="px-8">
              Book Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom padding for fixed booking bar */}
      <div className="h-20"></div>
    </div>
  )
}
