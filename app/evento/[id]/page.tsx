"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Shield,
  Camera,
  Wifi,
  Car,
  Music,
  Utensils,
  Gamepad2,
  Sparkles,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "sonner"
import { MessageHostButton } from "@/components/event/message-host-button"
import { getEventImageUrl } from "@/lib/image-utils"

// Safe utility functions
const getInitials = (name?: string): string => {
  if (!name || typeof name !== "string") return "?"
  return name.charAt(0).toUpperCase()
}

const getSafeName = (name?: string): string => {
  if (!name || typeof name !== "string") return "Utente"
  return name
}

const getSafeArray = <T,>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : []
}

const formatSafeDate = (dateInput: any): string => {
  try {
    if (!dateInput) return "Data non disponibile"
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return "Data non valida"
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return date.toLocaleDateString("it-IT", options)
  } catch (error) {
    return "Data non disponibile"
  }
}

const formatSafeTime = (timeInput: any): string => {
  try {
    if (!timeInput) return "Orario da definire"
    if (typeof timeInput === "string" && /^\d{1,2}:\d{2}$/.test(timeInput)) return timeInput
    const date = new Date(timeInput)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false })
    }
    return "Orario da definire"
  } catch (error) {
    return "Orario da definire"
  }
}

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  coordinates: {
    lat: number
    lng: number
  }
  price: number
  maxParticipants: number
  currentParticipants: number
  category: string
  tags: string[]
  images: string[]
  host: {
    _id: string
    name: string
    email: string
    image?: string
    verified?: boolean
    rating?: number
    totalReviews?: number
  }
  requirements?: string[]
  amenities?: string[]
  cancellationPolicy?: string
  externalBookingUrl?: string
  views?: number
  likes?: number
  rating?: number
  totalReviews?: number
  dateStart?: string
  dateEnd?: string
}

interface Review {
  _id: string
  userId: string
  userName: string
  userImage?: string
  rating: number
  comment: string
  createdAt: string
  verified?: boolean
}

const categoryIcons: Record<string, any> = {
  festa: "🎉",
  compleanno: "🎂",
  matrimonio: "💒",
  aziendale: "🏢",
  musica: "🎵",
  sport: "⚽",
  arte: "🎨",
  cibo: "🍽️",
  casa: "🏠",
  viaggio: "✈️",
  evento: "🎉",
  esperienza: "🌟",
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parcheggio: Car,
  musica: Music,
  catering: Utensils,
  giochi: Gamepad2,
  fotografia: Camera,
}

export default function EventoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isAutoplay, setIsAutoplay] = useState(true)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const eventId = params.id as string

  useEffect(() => {
    if (eventId) {
      fetchEvent()
      fetchReviews()
    }
  }, [eventId])

  useEffect(() => {
    if (isAutoplay && event?.images && getSafeArray(event.images).length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % getSafeArray(event.images).length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isAutoplay, event?.images])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error("Evento non trovato")
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      toast.error("Errore nel caricamento dell'evento")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(getSafeArray(data.reviews))
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const handleLike = async () => {
    if (!session) {
      toast.error("Devi essere loggato per mettere mi piace")
      return
    }
    setIsLiked(!isLiked)
    toast.success(isLiked ? "Rimosso dai preferiti" : "Aggiunto ai preferiti")
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: event?.title, text: event?.description, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti!")
    }
  }

  const nextImage = () => {
    if (event?.images) setCurrentImageIndex((prev) => (prev + 1) % getSafeArray(event.images).length)
  }

  const prevImage = () => {
    if (event?.images)
      setCurrentImageIndex((prev) => (prev - 1 + getSafeArray(event.images).length) % getSafeArray(event.images).length)
  }

  const submitReview = async () => {
    if (!session) {
      toast.error("Devi essere loggato per lasciare una recensione")
      return
    }
    if (!newReview.comment.trim()) {
      toast.error("Inserisci un commento")
      return
    }
    setIsSubmittingReview(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, rating: newReview.rating, comment: newReview.comment }),
      })
      if (!response.ok) throw new Error("Errore nell'invio della recensione")
      toast.success("Recensione inviata con successo!")
      setReviewDialogOpen(false)
      setNewReview({ rating: 5, comment: "" })
      fetchReviews()
    } catch (error) {
      toast.error("Errore nell'invio della recensione")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const getAverageRating = () => {
    if (getSafeArray(reviews).length === 0) return 0
    const sum = getSafeArray(reviews).reduce((acc, review) => acc + review.rating, 0)
    return sum / getSafeArray(reviews).length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Caricamento evento...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Evento non trovato</h1>
          <Button onClick={() => router.back()} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            Torna indietro
          </Button>
        </div>
      </div>
    )
  }

  const averageRating = getAverageRating()
  const safeImages = getSafeArray(event.images)
  const safeTags = getSafeArray(event.tags)
  const safeAmenities = getSafeArray(event.amenities)
  const googleMapsUrl = event.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${event.coordinates.lat},${event.coordinates.lng}`
    : "#"

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 pb-20">
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLike}>
              <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Card className="overflow-hidden bg-gray-800/50 border-gray-700 shadow-2xl shadow-black/20">
          <div className="relative h-80 md:h-96">
            <Image
              src={getEventImageUrl(safeImages[0], event.category, 800, 400) || "/placeholder.svg"}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {safeImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full"
              onClick={() => setIsImageModalOpen(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{categoryIcons[event.category] || "🎉"}</span>
              <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">
                {event.category}
              </Badge>
              {averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-white">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({getSafeArray(reviews).length})</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{event.title}</h1>
            <p className="text-gray-400 mb-4">{event.description}</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                  <span className="font-medium text-white">{formatSafeDate(event.dateStart || event.date)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                  <span className="font-medium text-white">{formatSafeTime(event.time)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">{event.location}</p>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Vedi su Google Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-orange-400" />
                  <span className="font-medium text-white">
                    {event.currentParticipants}/{event.maxParticipants} partecipanti
                  </span>
                </div>
                <Progress value={(event.currentParticipants / event.maxParticipants) * 100} className="h-2" />
                <div className="text-3xl font-bold text-green-400">
                  {event.price === 0 ? "Gratuito" : `€${event.price}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {event.host && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-blue-400" />
                Organizzatore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={event.host.image || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                      {getInitials(event.host.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-white">{getSafeName(event.host.name)}</h3>
                      {event.host.verified && (
                        <Badge className="bg-blue-500 text-white">
                          <Shield className="h-3 w-3 mr-1" />
                          Verificato
                        </Badge>
                      )}
                    </div>
                    {event.host.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-white">{event.host.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-400">({event.host.totalReviews || 0} recensioni)</span>
                      </div>
                    )}
                  </div>
                </div>
                <MessageHostButton
                  hostId={event.host._id}
                  hostName={getSafeName(event.host.name)}
                  eventId={eventId}
                  eventTitle={event.title}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {safeAmenities.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Servizi Inclusi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {safeAmenities.map((amenity, index) => {
                  const IconComponent = amenityIcons[amenity.toLowerCase()] || Sparkles
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50">
                      <IconComponent className="h-5 w-5 text-purple-400" />
                      <span className="font-medium text-white">{amenity}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews and other cards... */}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-700 p-4 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {event.price === 0 ? "Gratuito" : `€${event.price}`}
            </div>
            <div className="text-sm text-gray-400">
              {event.maxParticipants - event.currentParticipants} posti disponibili
            </div>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8" asChild>
            <Link href={`/prenota/${eventId}`}>Prenota Ora</Link>
          </Button>
        </div>
      </div>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black/80 border-gray-700">
          <div className="relative w-full h-full">
            <Image
              src={getEventImageUrl(safeImages[currentImageIndex], event.category, 1200, 800) || "/placeholder.svg"}
              alt={event.title}
              fill
              className="object-contain"
              sizes="1200px"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
