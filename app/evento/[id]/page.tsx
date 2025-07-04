"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  User,
  Shield,
  Award,
  Camera,
  Wifi,
  Car,
  Music,
  Utensils,
  Gamepad2,
  Sparkles,
  TrendingUp,
  Eye,
  Send,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { MessageHostButton } from "@/components/event/message-host-button"

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

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: {
    address: string
    city: string
    coordinates?: [number, number]
  }
  price: number
  maxParticipants: number
  currentParticipants: number
  category: string
  tags: string[]
  images: string[]
  host: {
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

  // Autoplay per le immagini
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
      console.error("Error fetching event:", error)
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
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Condivisione annullata")
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti!")
    }
  }

  const nextImage = () => {
    if (event?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % getSafeArray(event.images).length)
    }
  }

  const prevImage = () => {
    if (event?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + getSafeArray(event.images).length) % getSafeArray(event.images).length)
    }
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
        body: JSON.stringify({
          eventId,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
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

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    getSafeArray(reviews).forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++
    })
    return distribution
  }

  const getAverageRating = () => {
    if (getSafeArray(reviews).length === 0) return 0
    const sum = getSafeArray(reviews).reduce((acc, review) => acc + review.rating, 0)
    return sum / getSafeArray(reviews).length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento non trovato</h1>
          <Button onClick={() => router.back()}>Torna indietro</Button>
        </div>
      </div>
    )
  }

  const averageRating = getAverageRating()
  const ratingDistribution = getRatingDistribution()
  const safeImages = getSafeArray(event.images)
  const safeTags = getSafeArray(event.tags)
  const safeRequirements = getSafeArray(event.requirements)
  const safeAmenities = getSafeArray(event.amenities)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLike}>
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Galleria Immagini */}
        {safeImages.length > 0 && (
          <Card className="overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <div className="relative h-80 md:h-96">
              <Image
                src={safeImages[currentImageIndex] || "/placeholder.svg?height=400&width=800"}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />

              {/* Controlli Galleria */}
              {safeImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Autoplay Control */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                    onClick={() => setIsAutoplay(!isAutoplay)}
                  >
                    {isAutoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  {/* Indicatori */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {safeImages.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? "bg-white" : "bg-white/50"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Badge HD */}
              <Badge className="absolute top-4 left-4 bg-black/20 text-white border-0">
                HD {currentImageIndex + 1}/{safeImages.length}
              </Badge>

              {/* Fullscreen Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                onClick={() => setIsImageModalOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Informazioni Principali */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{categoryIcons[event.category] || "🎉"}</span>
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {event.category}
                  </Badge>
                  {averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({getSafeArray(reviews).length})</span>
                    </div>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {event.title}
                </h1>
                <p className="text-muted-foreground mb-4">{event.description}</p>
              </div>
            </div>

            {/* Tags */}
            {safeTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {safeTags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-gradient-to-r from-pink-100 to-purple-100">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Statistiche */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <Eye className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-lg font-bold text-blue-600">{event.views || 0}</div>
                <div className="text-xs text-blue-600/70">Visualizzazioni</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                <Heart className="h-5 w-5 mx-auto mb-1 text-red-600" />
                <div className="text-lg font-bold text-red-600">{event.likes || 0}</div>
                <div className="text-xs text-red-600/70">Mi piace</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-lg font-bold text-green-600">{event.currentParticipants}</div>
                <div className="text-xs text-green-600/70">Partecipanti</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-lg font-bold text-purple-600">{averageRating.toFixed(1)}</div>
                <div className="text-xs text-purple-600/70">Rating</div>
              </div>
            </div>

            {/* Dettagli Evento */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">
                    {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: it })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{event.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium">{event.location.address}</div>
                    <div className="text-sm text-muted-foreground">{event.location.city}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">
                    {event.currentParticipants}/{event.maxParticipants} partecipanti
                  </span>
                </div>
                <Progress value={(event.currentParticipants / event.maxParticipants) * 100} className="h-2" />
                <div className="text-2xl font-bold text-green-600">
                  {event.price === 0 ? "Gratuito" : `€${event.price}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Information */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
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
                    <h3 className="font-semibold text-lg">{getSafeName(event.host.name)}</h3>
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
                      <span className="text-sm font-medium">{event.host.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({event.host.totalReviews || 0} recensioni)</span>
                    </div>
                  )}
                </div>
              </div>
              <MessageHostButton
                hostEmail={event.host.email}
                hostName={getSafeName(event.host.name)}
                eventId={eventId}
                eventTitle={event.title}
              />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        {safeAmenities.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Servizi Inclusi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {safeAmenities.map((amenity, index) => {
                  const IconComponent = amenityIcons[amenity.toLowerCase()] || Sparkles
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50"
                    >
                      <IconComponent className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">{amenity}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {safeRequirements.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                Requisiti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {safeRequirements.map((requirement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recensioni */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Recensioni ({getSafeArray(reviews).length})
              </CardTitle>
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Scrivi recensione
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Scrivi una recensione</DialogTitle>
                    <DialogDescription>Condividi la tua esperienza con questo evento</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Valutazione</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="p-1"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Commento</label>
                      <Textarea
                        placeholder="Descrivi la tua esperienza..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={submitReview}
                      disabled={isSubmittingReview}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    >
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Invio...
                        </>
                      ) : (
                        "Invia recensione"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {averageRating > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">{getSafeArray(reviews).length} recensioni</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm w-3">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <Progress
                          value={
                            getSafeArray(reviews).length > 0
                              ? (ratingDistribution[rating as keyof typeof ratingDistribution] /
                                  getSafeArray(reviews).length) *
                                100
                              : 0
                          }
                          className="flex-1 h-2"
                        />
                        <span className="text-sm text-muted-foreground w-8">
                          {ratingDistribution[rating as keyof typeof ratingDistribution]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="h-64">
              <div className="space-y-4">
                {getSafeArray(reviews).map((review) => (
                  <div key={review._id} className="border-b border-border pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.userImage || "/placeholder.svg"} />
                        <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{getSafeName(review.userName)}</span>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verificato
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.createdAt), "d MMMM yyyy", { locale: it })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Politiche */}
        {event.cancellationPolicy && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Politiche di Cancellazione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{event.cancellationPolicy}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border p-4 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-2xl font-bold text-green-600">
              {event.price === 0 ? "Gratuito" : `€${event.price}`}
            </div>
            <div className="text-sm text-muted-foreground">
              {event.maxParticipants - event.currentParticipants} posti disponibili
            </div>
          </div>
          <div className="flex gap-2">
            {event.externalBookingUrl && (
              <Button variant="outline" asChild>
                <Link href={event.externalBookingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Link Esterno
                </Link>
              </Button>
            )}
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8" asChild>
              <Link href={`/prenota/${eventId}`}>Prenota Ora</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Immagini */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full">
            <Image
              src={safeImages[currentImageIndex] || "/placeholder.svg?height=600&width=800"}
              alt={event.title}
              fill
              className="object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {safeImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {safeImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
