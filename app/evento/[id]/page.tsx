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
  MessageCircle,
  ExternalLink,
  Shield,
  CheckCircle,
  Eye,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { MessageHostButton } from "@/components/event/message-host-button"

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
  host?: {
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
      const data = await response.json()
      console.log("Fetched event data:", data)
      console.log("Host data:", data.host)
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
      const favorites = await response.json()
      setIsFavorite(favorites.some((fav: Event) => fav._id === params.id))
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
      const data = await response.json()
      setIsFavorite(data.isFavorite)
    } catch (error) {
      console.error("Error toggling favorite:", error)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const startFormatted = start.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })

    if (!endDate) return startFormatted

    const end = new Date(endDate)
    const endFormatted = end.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })

    return `${startFormatted} - ${endFormatted}`
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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      {/* Header */}
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-background backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-background backdrop-blur-sm">
            <Share className="h-4 w-4" />
          </Button>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background backdrop-blur-sm"
              onClick={toggleFavorite}
              disabled={favoriteLoading || !session}
            >
              {favoriteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-foreground"}`} />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Image Gallery */}
        <div className="overflow-x-auto">
          <div className="flex gap-2">
            {event.images && event.images.length > 0 ? (
              event.images.map((image, index) => (
                <Image
                  key={index}
                  src={image || "/placeholder.svg"}
                  alt={`${event.title} ${index + 1}`}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover flex-shrink-0"
                />
              ))
            ) : (
              <Image
                src="/placeholder.svg?height=300&width=400"
                alt={event.title}
                width={400}
                height={300}
                className="w-full h-64 object-cover flex-shrink-0"
              />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
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

        {/* Title and Rating */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold leading-tight text-foreground">{event.title}</h1>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{event.rating || 4.8}</span>
              <span className="text-muted-foreground">({event.reviewCount || 0})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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

          <div className="flex gap-2">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="ring-2 ring-blue-200">
                  <AvatarImage src={event.host.image || "/placeholder.svg?height=40&width=40"} />
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
                    {event.host.rating} • {event.host.reviewCount} recensioni
                  </div>
                </div>
              </div>
              <MessageHostButton
                hostId={event.host.email}
                hostName={event.host.name}
                eventId={event._id}
                eventTitle={event.title}
              />
            </div>
          </motion.div>
        )}

        <Separator />

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-semibold mb-2">Descrizione</h3>
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        </motion.div>

        {/* Amenities */}
        {event.amenities && event.amenities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="font-semibold mb-3">Servizi Inclusi</h3>
            <div className="flex flex-wrap gap-2">
              {event.amenities.map((amenity) => (
                <Badge
                  key={amenity}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Booking Link */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="font-semibold mb-3">Prenotazione Ufficiale</h3>
          <a
            href={event.bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border border-blue-200 rounded-lg hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600 font-medium">Prenota su piattaforma ufficiale</span>
          </a>
        </motion.div>
      </div>

      {/* Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border p-4 safe-area-pb">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-foreground">€{event.price}</div>
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

      {/* Bottom padding for fixed booking bar */}
      <div className="h-20"></div>
    </div>
  )
}
