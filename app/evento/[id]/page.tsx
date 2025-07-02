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
  Play,
  Pause,
  Shield,
  Wifi,
  Car,
  Music,
  Camera,
  Utensils,
  Gamepad2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { MessageHostButton } from "@/components/event/message-host-button"
import { toast } from "sonner"

// Safe utility functions
const getInitials = (name?: string): string => {
  if (!name || typeof name !== "string") return "?"
  return name.charAt(0).toUpperCase()
}

const getSafeName = (name?: string): string => {
  if (!name || typeof name !== "string") return "Utente"
  return name
}

const getSafeArray = <T,>(arr: T[] | undefined): T[] => {
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
  maxGuests: number
  currentGuests: number
  category: string
  tags?: string[]
  images?: string[]
  host: {
    name: string
    email: string
    image?: string
    verified?: boolean
    rating?: number
    totalReviews?: number
  }
  amenities?: string[]
  requirements?: string[]
  cancellationPolicy?: string
  externalBookingUrl?: string
  verified?: boolean
  views?: number
  favorites?: number
}

interface Review {
  _id: string
  eventId: string
  userId: string
  userName: string
  userImage?: string
  rating: number
  comment: string
  createdAt: string
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  music: Music,
  photography: Camera,
  catering: Utensils,
  games: Gamepad2,
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isAutoplay, setIsAutoplay] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchEvent()
      fetchReviews()
    }
  }, [params.id])

  // Autoplay effect
  useEffect(() => {
    if (!isAutoplay || !event?.images?.length) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % (event.images?.length || 1))
    }, 3000)

    return () => clearInterval(interval)
  }, [isAutoplay, event?.images?.length])

  const fetchEvent = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/events/${params.id}`)
      if (!response.ok) throw new Error("Evento non trovato")

      const data = await response.json()
      setEvent(data.event)

      // Check if favorited
      if (session?.user?.email) {
        checkFavoriteStatus()
      }
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Errore nel caricamento dell'evento")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?eventId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(getSafeArray(data.reviews))
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const data = await response.json()
        const favorites = getSafeArray(data.favorites)
        setIsFavorite(favorites.some((fav: any) => fav.eventId === params.id))
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user?.email) {
      toast.error("Devi essere loggato per aggiungere ai preferiti")
      return
    }

    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: params.id }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        toast.success(isFavorite ? "Rimosso dai preferiti" : "Aggiunto ai preferiti")
      }
    } catch (error) {
      toast.error("Errore nell'aggiornamento dei preferiti")
    }
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
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast.success("Link copiato negli appunti!")
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti!")
    }
  }

  const submitReview = async () => {
    if (!session?.user?.email) {
      toast.error("Devi essere loggato per lasciare una recensione")
      return
    }

    if (!newReview.comment.trim()) {
      toast.error("Inserisci un commento")
      return
    }

    try {
      setIsSubmittingReview(true)
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: params.id,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      })

      if (response.ok) {
        toast.success("Recensione inviata con successo!")
        setNewReview({ rating: 5, comment: "" })
        setIsReviewDialogOpen(false)
        fetchReviews()
      } else {
        throw new Error("Errore nell'invio della recensione")
      }
    } catch (error) {
      toast.error("Errore nell'invio della recensione")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const nextImage = () => {
    if (event?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length)
    }
  }

  const prevImage = () => {
    if (event?.images?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length)
    }
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++
      }
    })
    return distribution
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0)
    return sum / reviews.length
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
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Evento non trovato</h1>
          <p className="text-muted-foreground mb-4">L'evento che stai cercando non esiste o è stato rimosso.</p>
          <Link href="/">
            <Button>Torna alla home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const averageRating = getAverageRating()
  const ratingDistribution = getRatingDistribution()
  const safeImages = getSafeArray(event.images)
  const safeTags = getSafeArray(event.tags)
  const safeAmenities = getSafeArray(event.amenities)
  const safeRequirements = getSafeArray(event.requirements)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold truncate">{event.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={shareEvent}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFavorite} className={isFavorite ? "text-red-500" : ""}>
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Image Gallery */}
        {safeImages.length > 0 && (
          <Card className="overflow-hidden">
            <div className="relative h-64 md:h-80">
              <Image
                src={safeImages[currentImageIndex] || "/placeholder.svg?height=320&width=600"}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />

              {/* Gallery Controls */}
              <div className="absolute inset-0 bg-black/20">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-black/50 text-white">
                    {currentImageIndex + 1} / {safeImages.length}
                  </Badge>
                  <Badge className="bg-black/50 text-white">HD</Badge>
                </div>

                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsAutoplay(!isAutoplay)}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    {isAutoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsImageModalOpen(true)}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    Visualizza tutto
                  </Button>
                </div>

                {safeImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Image Indicators */}
              {safeImages.length > 1 && (
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
              )}
            </div>
          </Card>
        )}

        {/* Event Info */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{event.title}</h1>
                  {event.verified && (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificato
                    </Badge>
                  )}
                </div>
                <Badge className="mb-3">{event.category}</Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">€{event.price}</div>
                <div className="text-sm text-muted-foreground">per persona</div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">{event.description}</p>

            {/* Tags */}
            {safeTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {safeTags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">{format(new Date(event.date), "EEEE d MMMM yyyy", { locale: it })}</div>
                  <div className="text-sm text-muted-foreground">Data evento</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">{event.time}</div>
                  <div className="text-sm text-muted-foreground">Orario</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-red-500" />
                <div>
                  <div className="font-medium">{event.location.address}</div>
                  <div className="text-sm text-muted-foreground">{event.location.city}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium">
                    {event.currentGuests} / {event.maxGuests} partecipanti
                  </div>
                  <div className="text-sm text-muted-foreground">Posti disponibili</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Info */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Organizzatore</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={event.host.image || "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(event.host.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{getSafeName(event.host.name)}</h4>
                    {event.host.verified && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Verificato
                      </Badge>
                    )}
                  </div>
                  {event.host.rating && event.host.totalReviews && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{event.host.rating.toFixed(1)}</span>
                      <span>({event.host.totalReviews} recensioni)</span>
                    </div>
                  )}
                </div>
              </div>
              <MessageHostButton
                hostEmail={event.host.email}
                hostName={getSafeName(event.host.name)}
                eventId={event._id}
                eventTitle={event.title}
              />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        {safeAmenities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Servizi inclusi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {safeAmenities.map((amenity, index) => {
                  const IconComponent = amenityIcons[amenity.toLowerCase()] || Info
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-blue-500" />
                      <span className="capitalize">{amenity}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {safeRequirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Requisiti</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {safeRequirements.map((requirement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Cancellation Policy */}
        {event.cancellationPolicy && (
          <Card>
            <CardHeader>
              <CardTitle>Politica di cancellazione</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{event.cancellationPolicy}</p>
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recensioni ({reviews.length})</CardTitle>
              <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Scrivi recensione
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Scrivi una recensione</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Valutazione</label>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="text-2xl"
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
                      <label className="text-sm font-medium">Commento</label>
                      <Textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        placeholder="Condividi la tua esperienza..."
                        className="mt-2"
                      />
                    </div>
                    <Button onClick={submitReview} disabled={isSubmittingReview} className="w-full">
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        "Invia recensione"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {reviews.length > 0 ? (
              <>
                {/* Rating Summary */}
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                      <div className="flex items-center justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">{reviews.length} recensioni</div>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2 mb-1">
                          <span className="text-sm w-3">{rating}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Progress
                            value={
                              (ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100
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

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-border pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.userImage || "/placeholder.svg"} />
                          <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{getSafeName(review.userName)}</h5>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= (review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(review.createdAt), "d MMMM yyyy", { locale: it })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nessuna recensione ancora</p>
                <p className="text-sm text-muted-foreground">Sii il primo a lasciare una recensione!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 sticky bottom-24 z-30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">€{event.price}</div>
                <div className="text-sm text-muted-foreground">per persona</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Posti disponibili</div>
                <div className="font-medium">
                  {event.maxGuests - event.currentGuests} / {event.maxGuests}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Primary booking button - internal */}
              <Link href={`/prenota/${event._id}`}>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Prenota ora
                </Button>
              </Link>

              {/* External booking option */}
              {event.externalBookingUrl && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => window.open(event.externalBookingUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Prenota sul sito esterno
                </Button>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Prenotazione sicura • Cancellazione gratuita fino a 24h prima
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle>Galleria immagini</DialogTitle>
          </DialogHeader>
          <div className="relative flex-1">
            <Image
              src={safeImages[currentImageIndex] || "/placeholder.svg"}
              alt={event.title}
              fill
              className="object-contain"
            />
            {safeImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {safeImages.map((image, index) => (
              <button
                key={index}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  index === currentImageIndex ? "border-blue-500" : "border-transparent"
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${event.title} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
