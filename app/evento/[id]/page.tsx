"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Clock, Users, Star, Heart, Share2, MessageCircle, Shield, Eye, Loader2, AlertCircle, CheckCircle, Camera, Tag, Euro } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { getEventImageUrl } from "@/lib/image-utils"

interface Event {
  _id: string
  title: string
  description: string
  category: string
  location: string
  coordinates?: { lat: number; lng: number }
  price: number
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  amenities: string[]
  images: string[]
  bookingLink: string
  verified: boolean
  hostId: string
  views: number
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
  host?: {
    _id?: string
    name: string
    email: string
    image?: string
    rating?: number
    verified?: boolean
  }
}

const categoryIcons: Record<string, string> = {
  casa: "🏠",
  viaggio: "✈️",
  evento: "🎉",
  esperienza: "🌟",
  festa: "🎉",
  compleanno: "🎂",
  matrimonio: "💒",
  aziendale: "🏢",
  musica: "🎵",
  sport: "⚽",
  arte: "🎨",
  cibo: "🍽️",
}

// Safe date formatting functions
const formatSafeDate = (dateString: string): string => {
  if (!dateString) return "Data non disponibile"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Data non valida"
    
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Data non disponibile"
  }
}

const formatSafeTime = (dateString: string): string => {
  if (!dateString) return "00:00"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "00:00"
    
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting time:", error)
    return "00:00"
  }
}

const formatSafeDateTime = (dateString: string): string => {
  if (!dateString) return "Data e ora non disponibili"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Data e ora non valide"
    
    return date.toLocaleString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "Data e ora non disponibili"
  }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchEvent()
    }
  }, [params.id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError("")

      console.log("🔍 Fetching event:", params.id)

      const response = await fetch(`/api/events/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Evento non trovato")
        } else {
          setError("Errore nel caricamento dell'evento")
        }
        return
      }

      const data = await response.json()
      console.log("📊 Event data received:", data)

      setEvent(data)

      // Increment view count
      try {
        await fetch(`/api/events/${params.id}/view`, { method: "POST" })
      } catch (viewError) {
        console.warn("Could not increment view count:", viewError)
      }
    } catch (error) {
      console.error("💥 Error fetching event:", error)
      setError("Errore nel caricamento dell'evento")
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user?.email) {
      toast.error("Devi essere loggato per aggiungere ai preferiti")
      router.push("/auth/login")
      return
    }

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: params.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorited)
        toast.success(data.isFavorited ? "Aggiunto ai preferiti" : "Rimosso dai preferiti")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Errore nell'aggiornamento dei preferiti")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti!")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">Caricamento evento...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold mb-2">Evento non trovato</h3>
            <p className="text-muted-foreground mb-6">{error || "L'evento che stai cercando non esiste."}</p>
            <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-pink-100 text-pink-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className="hover:bg-pink-100"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="hover:bg-pink-100"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="relative">
                {event.images && event.images.length > 0 ? (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={getEventImageUrl(event.images[selectedImageIndex], 800, 500) || "/placeholder.svg?height=500&width=800"}
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    
                    {/* Image Counter */}
                    {event.images.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        <Camera className="h-3 w-3 inline mr-1" />
                        {selectedImageIndex + 1} / {event.images.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">{categoryIcons[event.category] || "🎉"}</div>
                      <p className="text-muted-foreground">Nessuna immagine disponibile</p>
                    </div>
                  </div>
                )}

                {/* Image Thumbnails */}
                {event.images && event.images.length > 1 && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      {event.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImageIndex === index
                              ? "border-white shadow-lg"
                              : "border-white/50 hover:border-white/80"
                          }`}
                        >
                          <Image
                            src={getEventImageUrl(image, 64, 48) || "/placeholder.svg?height=48&width=64"}
                            alt={`${event.title} - ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Event Info */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                        {categoryIcons[event.category]} {event.category}
                      </Badge>
                      {event.verified && (
                        <Badge className="bg-green-500 text-white">
                          <Shield className="h-3 w-3 mr-1" />
                          Verificato
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {event.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{event.views} visualizzazioni</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{event.rating.toFixed(1)} ({event.reviewCount} recensioni)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {event.price === 0 ? "Gratuito" : `€${event.price}`}
                    </div>
                    <div className="text-sm text-muted-foreground">per persona</div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Data e ora</div>
                        <div className="text-sm text-muted-foreground">
                          {formatSafeDateTime(event.dateStart)}
                        </div>
                        {event.dateEnd && (
                          <div className="text-sm text-muted-foreground">
                            Fino a: {formatSafeDateTime(event.dateEnd)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Posizione</div>
                        <div className="text-sm text-muted-foreground">{event.location}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Partecipanti</div>
                        <div className="text-sm text-muted-foreground">
                          {event.totalSpots - event.availableSpots} / {event.totalSpots} posti occupati
                        </div>
                        <div className="text-sm text-green-600">
                          {event.availableSpots} posti disponibili
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Euro className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Prezzo</div>
                        <div className="text-sm text-muted-foreground">
                          {event.price === 0 ? "Evento gratuito" : `€${event.price} per persona`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Descrizione</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>

                {/* Amenities */}
                {event.amenities && event.amenities.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Cosa è incluso</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {event.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Info */}
            {event.host && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Organizzatore</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={event.host.image || "/placeholder.svg"} alt={event.host.name} />
                      <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                        {event.host.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {event.host.name}
                        {event.host.verified && (
                          <Shield className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {event.host.rating && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{event.host.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {session?.user?.email !== event.host.email && (
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contatta l'organizzatore
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Booking Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {event.price === 0 ? "Gratuito" : `€${event.price}`}
                  </div>
                  {event.price > 0 && (
                    <div className="text-sm text-muted-foreground">per persona</div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Posti disponibili:</span>
                    <span className="font-medium text-green-600">{event.availableSpots}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Posti totali:</span>
                    <span className="font-medium">{event.totalSpots}</span>
                  </div>
                </div>

                {event.availableSpots > 0 ? (
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                  >
                    <Link href={`/prenota/${event._id}`}>
                      Prenota ora
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Evento al completo
                  </Button>
                )}

                <div className="text-xs text-center text-muted-foreground mt-3">
                  Prenotazione gratuita • Cancellazione flessibile
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Informazioni rapide</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Categoria:</span>
                    <span className="font-medium">{event.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creato il:</span>
                    <span className="font-medium">{formatSafeDate(event.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ultimo aggiornamento:</span>
                    <span className="font-medium">{formatSafeDate(event.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
