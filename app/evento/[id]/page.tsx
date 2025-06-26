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
  MessageCircle,
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
import { motion } from "framer-motion"
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

export default function EventoDettaglio({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
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
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  // Check if current user is the event owner
  const isOwner = session?.user?.email && event?.host?.email === session.user.email

  useEffect(() => {
    fetchEvent()
    if (session?.user?.email) {
      checkFavoriteStatus()
      checkReviewStatus()
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
      toast.success(data.message || t("review_success"))

      // Reset form and close dialog
      setReviewRating(0)
      setReviewComment("")
      setShowReviewDialog(false)
      setUserHasReviewed(true)

      // Refresh event data to update rating
      fetchEvent()
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
    }
  }

  const prevImage = () => {
    if (event?.images && event.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="relative">
          <Skeleton className="aspect-[16/9] w-full" />
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("event_not_found")}</h2>
          <p className="text-muted-foreground mb-4">L'evento che stai cercando non esiste o è stato rimosso.</p>
          <Link href="/">
            <Button>{t("back_to_home")}</Button>
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
              className="bg-black/50 backdrop-blur-md hover:bg-black/60 text-white border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 backdrop-blur-md hover:bg-black/60 text-white border border-white/20"
              onClick={shareEvent}
            >
              <Share className="h-4 w-4" />
            </Button>
            {!isOwner && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 backdrop-blur-md hover:bg-black/60 text-white border border-white/20"
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
            )}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 backdrop-blur-md hover:bg-black/60 text-white border border-white/20"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/evento/${event._id}/edit`} className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      {t("edit")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Enhanced Image Gallery */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          {event.images && event.images.length > 0 ? (
            <>
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-full cursor-pointer"
                onClick={() => setShowImageModal(true)}
              >
                <Image
                  src={getEventImageUrl(event.images[currentImageIndex], 800, 600) || "/placeholder.svg"}
                  alt={event.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  priority
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </motion.div>

              {/* Image Navigation */}
              {event.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md hover:bg-black/60 text-white border border-white/20 z-20"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md hover:bg-black/60 text-white border border-white/20 z-20"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Image Indicators */}
              {event.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                  {event.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? "bg-white scale-110 shadow-lg" : "bg-white/50 hover:bg-white/75"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm border border-white/20 z-20">
                {currentImageIndex + 1} / {event.images.length}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Calendar className="h-20 w-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{t("no_image_available")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Title and Basic Info */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground pr-4">{event.title}</h1>
            {event.verified && (
              <Badge className="bg-green-100 text-green-700 flex-shrink-0">
                <Shield className="h-3 w-3 mr-1" />
                {t("verified")}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>
                {event.views} {t("views")}
              </span>
            </div>
            {event.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>
                  {event.rating.toFixed(1)} ({event.reviewCount})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{formatDateRange(event.dateStart, event.dateEnd)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-green-500" />
              <span className="font-medium">
                {event.availableSpots}/{event.totalSpots} {t("available_spots").toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Host Info */}
        {event.host && !isOwner && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={event.host.image || "/placeholder.svg"} alt={event.host.name} />
                    <AvatarFallback>{event.host.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.host.name}</h3>
                      {event.host.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                    </div>
                    {event.host.rating > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>
                          {event.host.rating.toFixed(1)} • {event.host.reviewCount} {t("reviews").toLowerCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <MessageHostButton hostId={event.hostId || event.host._id || ""} hostName={event.host.name} />
                  {userCanReview && !userHasReviewed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReviewDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      {t("write_review")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owner Info */}
        {isOwner && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>{t("this_is_your_event")}</AlertDescription>
          </Alert>
        )}

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t("description")}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>

        {/* Amenities */}
        {event.amenities && event.amenities.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">{t("included_services")}</h2>
            <div className="flex flex-wrap gap-2">
              {event.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Price and Booking */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-blue-600">€{event.price}</div>
              <div className="text-sm text-muted-foreground">{t("per_person")}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{t("available_spots")}</div>
              <div className="text-2xl font-bold text-green-600">{event.availableSpots}</div>
            </div>
          </div>

          {!isOwner && (
            <>
              {event.bookingLink ? (
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <a href={event.bookingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("book_now")}
                  </a>
                </Button>
              ) : (
                <Button disabled className="w-full">
                  {t("booking_link_unavailable")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {event.images && event.images.length > 0 && (
              <>
                <Image
                  src={getEventImageUrl(event.images[currentImageIndex]) || "/placeholder.svg"}
                  alt={event.title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />

                {event.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {t("write_review")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Rating */}
            <div className="space-y-3">
              <Label className="text-base font-medium">{t("your_rating")}</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className="transition-all duration-200 hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        i < reviewRating ? "text-yellow-500 fill-current" : "text-gray-300 hover:text-yellow-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <Label htmlFor="review-comment">{t("your_comment")}</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t("comment_placeholder")}
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">{reviewComment.length}/500</div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={!reviewRating || submittingReview} className="flex-1">
                {submittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("submit_review")}
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
                {t("cancel")}
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
