"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Users,
  Share,
  Heart,
  ExternalLink,
  Shield,
  CheckCircle,
  Eye,
  Loader2,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"

interface Event {
  _id: string
  title: string
  description: string
  location: string
  price: number
  rating: number
  reviewCount: number
  images: string[]
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  amenities: string[]
  bookingLink: string
  verified: boolean
  views: number
  hostId?: string
  host?: {
    _id?: string
    name: string
    email: string
    image?: string
    rating: number
    reviewCount: number
    verified: boolean
  }
  participants: string[]
}

export default function EventoDettaglio({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { data: session } = useSession()

  useEffect(() => {
    fetchEvent()
    if (session?.user?.email) {
      checkFavoriteStatus()
    }
  }, [params.id, session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Fetched event data:", data)
      setEvent(data)
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const favorites = await response.json()
        setIsFavorite(favorites.some((fav: Event) => fav._id === params.id))
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user?.email) return

    try {
      setFavoriteLoading(true)
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: params.id }),
      })
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const startFormatted = start.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    if (!endDate) return startFormatted

    const end = new Date(endDate)
    const endFormatted = end.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    return `${startFormatted} - ${endFormatted}`
  }

  const shareEvent = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="absolute top-4 left-4">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Evento non trovato</h2>
          <p className="text-muted-foreground mb-4">L'evento che stai cercando non esiste o è stato rimosso.</p>
          <Link href="/">
            <Button>Torna alla Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Image Gallery */}
      <div className="relative">
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-black/30 backdrop-blur-sm hover:bg-black/40 text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 backdrop-blur-sm hover:bg-black/40 text-white"
              onClick={shareEvent}
            >
              <Share className="h-4 w-4" />
            </Button>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/30 backdrop-blur-sm hover:bg-black/40 text-white"
                onClick={toggleFavorite}
                disabled={favoriteLoading || !session}
              >
                {favoriteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} />
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={event.images?.[currentImageIndex] || "/placeholder.svg?height=400&width=600&query=event"}
            alt={event.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Image indicators */}
          {event.images && event.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {event.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 pb-24">
        {/* Verification Badge */}
        {event.verified && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                <strong>Evento Verificato</strong> - Link di prenotazione confermato su piattaforma ufficiale
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Title and Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold leading-tight text-foreground pr-4">{event.title}</h1>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{event.rating || 4.8}</span>
              <span className="text-muted-foreground text-sm">({event.reviewCount || 0})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{event.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange(event.dateStart, event.dateEnd)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {event.availableSpots}/{event.totalSpots} posti disponibili
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{event.views} visualizzazioni</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {event.availableSpots} posti liberi
            </Badge>
            {event.availableSpots <= 3 && event.availableSpots > 0 && (
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                Ultimi posti!
              </Badge>
            )}
            {event.availableSpots === 0 && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Sold Out</Badge>
            )}
          </div>
        </motion.div>

        <Separator />

        {/* Host Info */}
        {event.host && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-sm bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="ring-2 ring-blue-200">
                      <AvatarImage src={event.host.image || "/placeholder.svg?height=40&width=40&query=host"} />
                      <AvatarFallback>
                        {event.host.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Organizzato da {event.host.name}</span>
                        {event.host.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {event.host.rating || 4.8} • {event.host.reviewCount || 0} recensioni
                      </div>
                    </div>
                  </div>
                  {session?.user?.email !== event.host.email && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Separator />

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-semibold mb-3 text-lg">Descrizione</h3>
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        </motion.div>

        {/* Amenities */}
        {event.amenities && event.amenities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="font-semibold mb-3 text-lg">Servizi Inclusi</h3>
            <div className="grid grid-cols-2 gap-2">
              {event.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{amenity}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Booking Link */}
        {event.bookingLink && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h3 className="font-semibold mb-3 text-lg">Prenotazione Ufficiale</h3>
            <a
              href={event.bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-blue-600 font-medium">Prenota su piattaforma ufficiale</span>
                <p className="text-xs text-muted-foreground">Clicca per prenotare l'alloggio</p>
              </div>
            </a>
          </motion.div>
        )}
      </div>

      {/* Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 safe-area-pb">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">€{event.price}</div>
            <div className="text-sm text-muted-foreground">a persona</div>
          </div>
          {event.availableSpots > 0 ? (
            <Link href={`/prenota/${event._id}`}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Unisciti al Gruppo
                </Button>
              </motion.div>
            </Link>
          ) : (
            <Button size="lg" disabled className="px-8">
              Sold Out
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
