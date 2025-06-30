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
  Edit3,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  ImageIcon,
  Play,
  Pause,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageHostButton } from "@/components/event/message-host-button"
import { toast } from "sonner"
import { getEventImageUrl } from "@/lib/image-utils"
import { useLanguage } from "@/contexts/language-context"

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

interface Review {
  _id: string
  rating: number
  comment: string
  createdAt: string
  reviewer: {
    name: string
    image?: string
  }
}

export default function EventoDettaglio({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userHasReviewed, setUserHasReviewed] = useState(false)
  const [userCanReview, setUserCanReview] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null)
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  // Check if current user is the event owner
  const isOwner = session?.user?.email && event?.host?.email === session.user.email

  useEffect(() => {
    fetchEvent()
    fetchReviews()
    if (session?.user?.email) {
      checkFavoriteStatus()
      checkReviewStatus()
    }
  }, [params.id, session])

  useEffect(() => {
    // Cleanup autoplay on unmount
    return () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval)
      }
    }
  }, [autoPlayInterval])

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
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const favorites = await response.json()
        setIsFavorite(favorites.some((fav: Event) => fav._id === params.id))
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const checkReviewStatus = async () => {
    try {
      const response = await fetch(`/api/reviews?eventId=${params.id}&checkUser=true`)
      if (response.ok) {
        const data = await response.json()
        setUserHasReviewed(data.hasReviewed)
        setUserCanReview(data.canReview)
      }
    } catch (error) {
      console.error("Error checking review status:", error)
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
        toast.success(data.isFavorite ? "Aggiunto ai preferiti" : "Rimosso dai preferiti")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    try {
      setDeleting(true)

      const response = await fetch(`/api/events/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'eliminazione")
      }

      const data = await response.json()
      toast.success(data.message || "Evento eliminato con successo!")

      // Redirect to user events page
      router.push("/user/events")
    } catch (error: any) {
      console.error("💥 Error deleting event:", error)
      toast.error(error.message || "Errore durante l'eliminazione dell'evento")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewRating || !event?.hostId) return

    try {
      setSubmittingReview(true)

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: params.id,
          hostId: event.hostId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'invio della recensione")
      }

      const data = await response.json()
      toast.success(data.message || "Recensione inviata con successo!")

      // Reset form and close dialog
      setReviewRating(0)
      setReviewComment("")
      setShowReviewDialog(false)
      setUserHasReviewed(true)

      // Refresh event data and reviews
      fetchEvent()
      fetchReviews()
    } catch (error: any) {
      console.error("Error submitting review:", error)
      toast.error(error.message || "Errore durante l'invio della recensione")
    } finally {
      setSubmittingReview(false)
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

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
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
      toast.success("Link copiato negli appunti!")
    }
  }

  const nextImage = () => {
    if (event?.images && event.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length)
      setImageLoading(true)
    }
  }

  const prevImage = () => {
    if (event?.images && event.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length)
      setImageLoading(true)
    }
  }

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval)
        setAutoPlayInterval(null)
      }
      setIsAutoPlaying(false)
    } else {
      const interval = setInterval(() => {
        nextImage()
      }, 3000) // Change image every 3 seconds
      setAutoPlayInterval(interval)
      setIsAutoPlaying(true)
    }
  }

  const handleBooking = () => {
    if (!session?.user) {
      toast.error("Devi effettuare l'accesso per prenotare")
      router.push("/auth/login")
      return
    }

    if (event?.availableSpots === 0) {
      toast.error("Non ci sono più posti disponibili")
      return
    }

    // Navigate to internal booking page instead of external link
    router.push(`/prenota/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="relative">
          <Skeleton className="aspect-[4/3] w-full" />
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header with Enhanced Image Gallery */}
      <div className="relative">
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
          <Link href={isOwner ? "/user/events" : "/"}>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/60 backdrop-blur-xl hover:bg-black/70 text-white border border-white/30 shadow-2xl transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/60 backdrop-blur-xl hover:bg-black/70 text-white border border-white/30 shadow-2xl transition-all duration-300"
              onClick={shareEvent}
            >
              <Share className="h-4 w-4" />
            </Button>
            {!isOwner && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 backdrop-blur-xl hover:bg-black/70 text-white border border-white/30 shadow-2xl transition-all duration-300"
                  onClick={toggleFavorite}
                  disabled={favoriteLoading || !session}
                >
                  {favoriteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-4 w-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`}
                    />
                  )}
                </Button>
              </motion.div>
            )}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/60 backdrop-blur-xl hover:bg-black/70 text-white border border-white/30 shadow-2xl transition-all duration-300"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/evento/${event._id}/edit`} className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Modifica
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Enhanced Image Gallery with Premium UX */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-900 dark:to-black">
          {event.images && event.images.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.05, rotateY: 5 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.95, rotateY: -5 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative w-full h-full cursor-pointer group"
                  onClick={() => setShowImageModal(true)}
                >
                  {/* Loading Skeleton with Animation */}
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-white/70" />
                      </div>
                    </div>
                  )}

                  <Image
                    src={getEventImageUrl(event.images[currentImageIndex], 1200, 900) || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className={`object-cover transition-all duration-700 group-hover:scale-110 ${
                      imageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    priority={currentImageIndex === 0}
                    sizes="100vw"
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />

                  {/* Premium Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />

                  {/* Interactive Hover Effect */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />

                  {/* Premium Click to Expand Hint */}
                  <motion.div
                    className="absolute bottom-6 right-6 bg-black/70 backdrop-blur-lg text-white px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-2 shadow-2xl border border-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Clicca per ingrandire
                  </motion.div>

                  {/* Image Quality Badge */}
                  <div className="absolute top-6 left-6 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    HD
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Enhanced Image Navigation */}
              {event.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-xl hover:bg-black/80 text-white border border-white/30 z-20 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-3xl"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-xl hover:bg-black/80 text-white border border-white/30 z-20 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-3xl"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>

                  {/* Auto-play Control */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 bottom-20 bg-black/60 backdrop-blur-xl hover:bg-black/80 text-white border border-white/30 z-20 shadow-2xl transition-all duration-300"
                    onClick={toggleAutoPlay}
                  >
                    {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </>
              )}

              {/* Enhanced Image Indicators */}
              {event.images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                  {event.images.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index)
                        setImageLoading(true)
                      }}
                      className={`relative transition-all duration-300 ${
                        index === currentImageIndex
                          ? "w-8 h-3 bg-white rounded-full shadow-lg ring-2 ring-white/50"
                          : "w-3 h-3 bg-white/60 hover:bg-white/80 rounded-full hover:scale-125"
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {index === currentImageIndex && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                          layoutId="activeIndicator"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Premium Image Counter */}
              <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-xl text-white px-4 py-2 rounded-full text-sm border border-white/30 z-20 shadow-2xl font-medium">
                {currentImageIndex + 1} / {event.images.length}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Calendar className="h-24 w-24 mx-auto mb-4 opacity-50" />
                </motion.div>
                <p className="text-xl font-medium">Nessuna immagine disponibile</p>
                <p className="text-sm opacity-70 mt-2">Le immagini verranno aggiunte presto</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Title and Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground pr-4 leading-tight">{event.title}</h1>
            {event.verified && (
              <Badge className="bg-green-100 text-green-700 flex-shrink-0 shadow-sm">
                <Shield className="h-3 w-3 mr-1" />
                Verificato
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="font-medium">{event.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>{event.views} visualizzazioni</span>
            </div>
            {event.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">
                  {event.rating.toFixed(1)} ({event.reviewCount})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {formatDateRange(event.dateStart, event.dateEnd)}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
              <Users className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-300">
                {event.availableSpots}/{event.totalSpots} posti disponibili
              </span>
            </div>
          </div>
        </motion.div>

        {/* Host Info */}
        {event.host && !isOwner && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-blue-100 dark:ring-blue-900">
                      <AvatarImage src={event.host.image || "/placeholder.svg"} alt={event.host.name} />
                      <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {event.host.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{event.host.name}</h3>
                        {event.host.verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
                      </div>
                      {event.host.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">
                            {event.host.rating.toFixed(1)} • {event.host.reviewCount} recensioni
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">Organizzatore dell'evento</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <MessageHostButton
                      hostId={event.hostId || event.host._id || ""}
                      hostName={event.host.name}
                      hostEmail={event.host.email}
                      eventId={event._id}
                      eventTitle={event.title}
                    />
                    {userCanReview && !userHasReviewed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewDialog(true)}
                        className="flex items-center gap-2 hover:bg-yellow-50 hover:border-yellow-300"
                      >
                        <Star className="h-4 w-4" />
                        Recensisci
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Owner Info */}
        {isOwner && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <strong>Questo è il tuo evento.</strong> Puoi modificarlo o eliminarlo usando il menu in alto a destra.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                Descrizione
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">{event.description}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Amenities */}
        {event.amenities && event.amenities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                  Servizi Inclusi
                </h2>
                <div className="flex flex-wrap gap-3">
                  {event.amenities.map((amenity, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm px-3 py-1 bg-gradient-to-r from-green-50 to-blue-50 text-green-700 border border-green-200 hover:shadow-md transition-shadow"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  Recensioni
                  {event.reviewCount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700">
                      {event.reviewCount}
                    </Badge>
                  )}
                </h2>
                {userCanReview && !userHasReviewed && session && (
                  <Button
                    onClick={() => setShowReviewDialog(true)}
                    size="sm"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Scrivi recensione
                  </Button>
                )}
              </div>

              {event.rating > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950/20 dark:via-orange-950/20 dark:to-red-950/20 rounded-xl p-6 mb-6 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-600 mb-1">{event.rating.toFixed(1)}</div>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(event.rating) ? "text-yellow-500 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">su {event.reviewCount} recensioni</div>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviews.filter((r) => r.rating === rating).length
                          const percentage = event.reviewCount > 0 ? (count / event.reviewCount) * 100 : 0
                          return (
                            <div key={rating} className="flex items-center gap-3 text-sm">
                              <span className="w-4 font-medium">{rating}</span>
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                <motion.div
                                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ delay: 0.5, duration: 1 }}
                                />
                              </div>
                              <span className="w-8 text-xs text-muted-foreground font-medium">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reviewsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                              <AvatarImage
                                src={review.reviewer.image || "/placeholder.svg"}
                                alt={review.reviewer.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                                {review.reviewer.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-foreground">{review.reviewer.name}</h4>
                                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                                  {formatReviewDate(review.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mb-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-sm font-medium ml-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                  {review.rating}/5
                                </span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-10 w-10 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nessuna recensione ancora</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Sii il primo a lasciare una recensione per questo evento e aiuta altri utenti a scoprire questa
                    esperienza!
                  </p>
                  {userCanReview && !userHasReviewed && session && (
                    <Button
                      onClick={() => setShowReviewDialog(true)}
                      size="lg"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Scrivi la prima recensione
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="my-8" />

        {/* Price and Booking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    €{event.price}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">per persona</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground font-medium">Posti disponibili</div>
                  <div className="text-3xl font-bold text-green-600">{event.availableSpots}</div>
                  <div className="text-xs text-muted-foreground">su {event.totalSpots} totali</div>
                </div>
              </div>

              {!isOwner && (
                <>
                  {event.availableSpots > 0 ? (
                    <Button
                      onClick={handleBooking}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-6"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Unisciti al Gruppo
                    </Button>
                  ) : (
                    <Button disabled size="lg" className="w-full text-lg py-6">
                      Evento al completo
                    </Button>
                  )}

                  {/* External booking link as secondary option */}
                  {event.bookingLink && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-muted-foreground mb-2 text-center">
                        Oppure prenota direttamente sulla piattaforma ufficiale:
                      </p>
                      <Button asChild variant="outline" size="sm" className="w-full hover:bg-gray-50 bg-transparent">
                        <a href={event.bookingLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Prenota su piattaforma esterna
                        </a>
                      </Button>
                    </div>
                  )}
                </>
              )}

              {isOwner && (
                <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-blue-700 dark:text-blue-300 text-center font-medium">
                    Questo è il tuo evento. Le prenotazioni verranno gestite tramite la piattaforma InVibe.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-7xl w-full h-[95vh] p-0 bg-black">
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white border border-white/20"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {event.images && event.images.length > 0 && (
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={getEventImageUrl(event.images[currentImageIndex]) || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>

                {event.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border border-white/20"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border border-white/20"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>

                    {/* Thumbnail Navigation */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-2xl overflow-x-auto p-2 bg-black/50 backdrop-blur-lg rounded-lg">
                      {event.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                            index === currentImageIndex
                              ? "border-white shadow-lg"
                              : "border-transparent opacity-70 hover:opacity-100 hover:border-white/50"
                          }`}
                        >
                          <Image
                            src={getEventImageUrl(image, 80, 64) || "/placeholder.svg"}
                            alt={`${event.title} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Star className="h-6 w-6 text-yellow-500" />
              Scrivi una recensione
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Rating */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">La tua valutazione</Label>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className="transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Star
                      className={`h-10 w-10 ${
                        i < reviewRating ? "text-yellow-500 fill-current" : "text-gray-300 hover:text-yellow-400"
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              {reviewRating > 0 && (
                <motion.p
                  className="text-center text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {reviewRating === 1 && "😞 Pessimo"}
                  {reviewRating === 2 && "😐 Scarso"}
                  {reviewRating === 3 && "🙂 Nella media"}
                  {reviewRating === 4 && "😊 Buono"}
                  {reviewRating === 5 && "🤩 Eccellente"}
                </motion.p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <Label htmlFor="review-comment" className="text-base font-semibold">
                Il tuo commento (opzionale)
              </Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Condividi la tua esperienza con questo evento... Cosa ti è piaciuto di più? Cosa consiglieresti ad altri?"
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">{reviewComment.length}/500 caratteri</div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmitReview}
                disabled={!reviewRating || submittingReview}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Invia recensione
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewDialog(false)
                  setReviewRating(0)
                  setReviewComment("")
                }}
                disabled={submittingReview}
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Elimina Evento"
        description="Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata e tutti i partecipanti riceveranno una notifica."
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={handleDeleteEvent}
        loading={deleting}
        variant="destructive"
      />
    </div>
  )
}
