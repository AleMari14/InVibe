"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  X,
  ExternalLink,
  Ticket,
  User,
  Shield,
  Award,
  Eye,
  Loader2,
  AlertCircle,
  Send,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

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
  currency: string
  totalSpots: number
  availableSpots: number
  category: string
  tags: string[]
  images: string[]
  host: {
    _id: string
    name: string
    email: string
    image?: string
    rating: number
    reviewCount: number
    verified: boolean
  }
  bookingLink?: string
  requirements?: string[]
  amenities?: string[]
  cancellationPolicy?: string
  views: number
  favorites: number
  createdAt: string
  updatedAt: string
}

interface Review {
  _id: string
  userId: string
  userName: string
  userImage?: string
  rating: number
  comment: string
  createdAt: string
  helpful: number
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchEvent()
      fetchReviews()
    }
  }, [params.id])

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && event?.images && event.images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % event.images.length)
      }, 4000)
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, event?.images])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)

      if (!response.ok) {
        throw new Error("Evento non trovato")
      }

      const data = await response.json()
      setEvent(data)

      // Check if event is in favorites
      if (session?.user) {
        checkFavoriteStatus()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/reviews?eventId=${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites?eventId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user) {
      toast.error("Devi essere autenticato per aggiungere ai preferiti")
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
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti!")
    }
  }

  const handleBooking = () => {
    if (!session?.user) {
      toast.error("Devi essere autenticato per prenotare")
      router.push("/auth/login")
      return
    }

    if (event?.availableSpots === 0) {
      toast.error("Evento al completo")
      return
    }

    // Navigate to internal booking page
    router.push(`/prenota/${params.id}`)
  }

  const handleExternalBooking = () => {
    if (event?.bookingLink) {
      window.open(event.bookingLink, "_blank")
    }
  }

  const nextImage = () => {
    if (event?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length)
    }
  }

  const prevImage = () => {
    if (event?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length)
    }
  }

  const submitReview = async () => {
    if (!session?.user) {
      toast.error("Devi essere autenticato per lasciare una recensione")
      return
    }

    if (newReview.rating === 0) {
      toast.error("Seleziona una valutazione")
      return
    }

    if (newReview.comment.trim().length < 10) {
      toast.error("Il commento deve essere di almeno 10 caratteri")
      return
    }

    try {
      setSubmittingReview(true)
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: params.id,
          hostId: event?.host._id,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      })

      if (response.ok) {
        toast.success("Recensione inviata con successo!")
        setShowReviewDialog(false)
        setNewReview({ rating: 0, comment: "" })
        fetchReviews()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Errore nell'invio della recensione")
      }
    } catch (error) {
      toast.error("Errore nell'invio della recensione")
    } finally {
      setSubmittingReview(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRatingEmoji = (rating: number) => {
    if (rating >= 5) return "🤩"
    if (rating >= 4) return "😊"
    if (rating >= 3) return "😐"
    if (rating >= 2) return "😕"
    return "😞"
  }

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100 : 0,
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Evento non trovato</h2>
            <p className="text-muted-foreground mb-4">
              {error || "L'evento che stai cercando non esiste o è stato rimosso."}
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Torna alla Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Image Gallery */}
      <div className="relative">
        <motion.div
          className="relative h-80 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {event.images && Array.isArray(event.images) && event.images.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="relative h-full"
                >
                  <Image
                    src={event.images[currentImageIndex] || "/placeholder.svg"}
                    alt={`${event.title} - Immagine ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                    priority={currentImageIndex === 0}
                    onLoad={() => {
                      // Preload next image
                      if (event.images && currentImageIndex < event.images.length - 1) {
                        const img = new window.Image()
                        img.src = event.images[currentImageIndex + 1]
                      }
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* HD Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-4"
                  >
                    <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      HD
                    </Badge>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              {event.images && event.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>

                  {/* Auto-play Control */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 bottom-20 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  >
                    {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </>
              )}

              {/* Image Counter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4"
              >
                <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm">
                  {currentImageIndex + 1} / {event.images.length}
                </Badge>
              </motion.div>

              {/* View All Images Button */}
              <Button
                variant="ghost"
                className="absolute bottom-4 right-4 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                onClick={() => setShowImageModal(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizza tutto
              </Button>

              {/* Dots Indicator */}
              {event.images && event.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {event.images.map((_, index) => (
                    <motion.button
                      key={index}
                      layoutId={`dot-${index}`}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nessuna immagine disponibile</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            onClick={toggleFavorite}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Event Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{event.category}</Badge>
            {event.tags &&
              event.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
          </div>

          <h1 className="text-3xl font-bold leading-tight">{event.title}</h1>

          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{event.views} visualizzazioni</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{event.favorites} preferiti</span>
            </div>
          </div>
        </motion.div>

        {/* Event Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">{formatDate(event.date)}</div>
                  <div className="text-sm text-muted-foreground">{formatTime(event.time)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">{event.location.address}</div>
                  <div className="text-sm text-muted-foreground">{event.location.city}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold">
                    {event.availableSpots} / {event.totalSpots} posti
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {event.availableSpots === 0 ? "Sold out" : "Posti disponibili"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold">{event.price === 0 ? "Gratuito" : `€${event.price}`}</div>
                  <div className="text-sm text-muted-foreground">Prezzo per persona</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Button
            onClick={handleBooking}
            disabled={event.availableSpots === 0}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            {event.availableSpots === 0 ? (
              "Evento al completo"
            ) : (
              <>
                <Ticket className="h-5 w-5 mr-2" />
                Prenota ora - {event.price === 0 ? "Gratuito" : `€${event.price}`}
              </>
            )}
          </Button>

          {event.bookingLink && (
            <Button variant="outline" onClick={handleExternalBooking} className="w-full h-12 bg-transparent">
              <ExternalLink className="h-4 w-4 mr-2" />
              Link esterno di prenotazione
            </Button>
          )}
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Descrizione</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Requirements & Amenities */}
        {(event.requirements || event.amenities) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {event.requirements && Array.isArray(event.requirements) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Requisiti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {event.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {event.amenities && Array.isArray(event.amenities) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Servizi inclusi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {event.amenities.map((amenity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Host Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Organizzatore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={event.host.image || "/placeholder.svg"} alt={event.host.name} />
                  <AvatarFallback>{event.host.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{event.host.name}</h3>
                    {event.host.verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Verificato
                      </Badge>
                    )}
                  </div>
                  {event.host.rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(event.host.rating) ? "text-yellow-500 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {event.host.rating.toFixed(1)} ({event.host.reviewCount} recensioni)
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/messaggi/new?hostId=${event.host._id}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contatta
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/profile/${event.host._id}`}>
                        <User className="h-4 w-4 mr-2" />
                        Profilo
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Recensioni ({reviews.length})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowReviewDialog(true)} disabled={!session?.user}>
                  <Send className="h-4 w-4 mr-2" />
                  Scrivi recensione
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {reviews.length > 0 && (
                <>
                  {/* Rating Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                      <div className="flex items-center justify-center mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(averageRating) ? "text-yellow-500 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">Basato su {reviews.length} recensioni</div>
                    </div>

                    <div className="space-y-2">
                      {ratingDistribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-8">{rating}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-yellow-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.1 * rating, duration: 0.5 }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviewsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ))
                    ) : (
                      <AnimatePresence>
                        {reviews &&
                          Array.isArray(reviews) &&
                          reviews.slice(0, 5).map((review, index) => (
                            <motion.div
                              key={review._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.userImage || "/placeholder.svg"} alt={review.userName} />
                                  <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{review.userName}</span>
                                    <div className="flex items-center">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${
                                            i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {getRatingEmoji(review.rating)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString("it-IT")}
                                    </span>
                                    {review.helpful > 0 && (
                                      <span className="text-xs text-muted-foreground">👍 {review.helpful} utili</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    )}

                    {reviews.length > 5 && (
                      <Button variant="outline" className="w-full bg-transparent">
                        Mostra tutte le recensioni ({reviews.length})
                      </Button>
                    )}
                  </div>
                </>
              )}

              {reviews.length === 0 && !reviewsLoading && (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground mb-4">Nessuna recensione ancora. Sii il primo a lasciarne una!</p>
                  <Button onClick={() => setShowReviewDialog(true)} disabled={!session?.user}>
                    Scrivi la prima recensione
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cancellation Policy */}
        {event.cancellationPolicy && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Politica di cancellazione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{event.cancellationPolicy}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {event.images && (
              <div className="relative h-[70vh]">
                <Image
                  src={event.images[currentImageIndex] || "/placeholder.svg"}
                  alt={`${event.title} - Immagine ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                />

                {event.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Thumbnail Navigation */}
            {event.images &&
              event.images.map((image, index) => (
                <div key={index} className="p-4 bg-gray-50 overflow-x-auto">
                  <div className="flex gap-2">
                    {event.images.map((image, index) => (
                      <button
                        key={index}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-blue-500 scale-105"
                            : "border-transparent hover:border-gray-300"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scrivi una recensione</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Valutazione</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    className={`p-1 transition-all hover:scale-110 ${
                      i < newReview.rating ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                    }`}
                    onClick={() => setNewReview((prev) => ({ ...prev, rating: i + 1 }))}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
              {newReview.rating > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>{getRatingEmoji(newReview.rating)}</span>
                  <span className="text-muted-foreground">
                    {newReview.rating === 5 && "Eccellente!"}
                    {newReview.rating === 4 && "Molto buono"}
                    {newReview.rating === 3 && "Buono"}
                    {newReview.rating === 2 && "Discreto"}
                    {newReview.rating === 1 && "Scarso"}
                  </span>
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Commento</Label>
              <Textarea
                id="comment"
                placeholder="Condividi la tua esperienza..."
                value={newReview.comment}
                onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">{newReview.comment.length}/500 caratteri</div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={submitReview}
                disabled={submittingReview || newReview.rating === 0 || newReview.comment.trim().length < 10}
                className="flex-1"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Invia recensione
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)} disabled={submittingReview}>
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
