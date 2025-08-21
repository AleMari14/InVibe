"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Heart,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ReviewSection } from "@/components/event/review-section"
import { MessageHostButton } from "@/components/event/message-host-button"
import { motion } from "framer-motion"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface Event {
  _id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: {
    address: string
    coordinates?: [number, number]
  }
  price: number
  maxParticipants: number
  currentParticipants: number
  images: string[]
  amenities: string[]
  hostId: string
  host: {
    name: string
    image?: string
    rating?: number
    reviewCount?: number
    verified?: boolean
  }
  rating?: number
  reviewCount?: number
  views?: number
  createdAt: string
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const eventId = params.id as string

  useEffect(() => {
    if (eventId) {
      fetchEvent()
      checkFavoriteStatus()
    }
  }, [eventId, session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      } else {
        toast.error("Evento non trovato")
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Errore nel caricamento dell'evento")
    } finally {
      setLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    if (!session) return

    try {
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const favorites = await response.json()
        setIsFavorite(favorites.some((fav: any) => fav._id === eventId))
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session) {
      toast.error("Devi essere loggato per aggiungere ai preferiti")
      return
    }

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.added)
        toast.success(data.added ? "Aggiunto ai preferiti" : "Rimosso dai preferiti")
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
        console.error("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti")
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Evento eliminato con successo")
        router.push("/")
      } else {
        toast.error("Errore nell'eliminazione dell'evento")
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Errore nell'eliminazione dell'evento")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
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
    return timeString || "Orario da definire"
  }

  const isOwner =
    session?.user?.email && event?.host && (session.user.email === event.host.email || session.user.id === event.hostId)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Evento non trovato</h1>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla Home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold truncate">{event.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFavorite}>
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/evento/${eventId}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
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
      </motion.div>

      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Event Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-video rounded-xl overflow-hidden"
        >
          <Image
            src={event.images?.[0] || "/placeholder.svg?height=400&width=800"}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-black/50 text-white">
              {event.category}
            </Badge>
          </div>
          {event.views && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
              <Eye className="h-3 w-3" />
              {event.views}
            </div>
          )}
        </motion.div>

        {/* Event Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(event.time)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">€{event.price}</div>
                  <div className="text-sm text-muted-foreground">per persona</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.location.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {event.currentParticipants}/{event.maxParticipants} partecipanti
                  </span>
                </div>
              </div>

              {event.rating && event.reviewCount && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(event.rating!) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{event.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({event.reviewCount} recensioni)</span>
                </div>
              )}

              {isOwner && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Questo è il tuo evento. Puoi modificarlo o eliminarlo usando il menu in alto a destra.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Host Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <OptimizedAvatar src={event.host.image} alt={event.host.name} size={48} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.host.name}</h3>
                      {event.host.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verificato
                        </Badge>
                      )}
                    </div>
                    {event.host.rating && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {event.host.rating.toFixed(1)} ({event.host.reviewCount} recensioni)
                      </div>
                    )}
                  </div>
                </div>
                {!isOwner && (
                  <MessageHostButton hostId={event.hostId} hostName={event.host.name} eventTitle={event.title} />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Descrizione</h3>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Amenities */}
        {event.amenities && event.amenities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Servizi Inclusi</h3>
                <div className="flex flex-wrap gap-2">
                  {event.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <ReviewSection eventId={eventId} />
        </motion.div>

        {/* Book Button */}
        {!isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="sticky bottom-20 z-10"
          >
            <Card className="bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">€{event.price}</div>
                    <div className="text-sm text-muted-foreground">per persona</div>
                  </div>
                  <Button asChild size="lg" className="px-8">
                    <Link href={`/prenota/${eventId}`}>Prenota Ora</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
