"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Euro,
  Heart,
  Share2,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  Star,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { BookingModal } from "@/components/booking-modal"
import { MessageHostButton } from "@/components/event/message-host-button"
import { ReviewSection } from "@/components/event/review-section"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface Event {
  _id: string
  title: string
  description: string
  location: string
  coordinates: {
    lat: number
    lng: number
  }
  price: number
  category: string
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  amenities: string[]
  images: string[]
  bookingLink: string
  verified: boolean
  host: {
    _id: string
    name: string
    email: string
    image?: string
    bio?: string
    joinedDate?: string
    eventsHosted?: number
    rating?: number
    responseRate?: number
    responseTime?: string
  }
  bookings: Array<{
    userId: string
    userName: string
    userImage?: string
    bookedAt: string
    spots: number
  }>
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (params?.id) {
      fetchEvent()
      if (session) {
        checkFavoriteStatus()
      }
    }
  }, [params?.id, session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError("")

      if (!params?.id) {
        setError("ID evento non valido")
        return
      }

      const response = await fetch(`/api/events/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Evento non trovato")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Event data received:", data)

      // Validate required fields
      if (!data || !data._id) {
        setError("Dati evento non validi")
        return
      }

      setEvent(data)
    } catch (error) {
      console.error("💥 Error fetching event:", error)
      setError("Errore nel caricamento dell'evento")
    } finally {
      setLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      if (!session || !params?.id) return

      const response = await fetch("/api/favorites")
      if (response.ok) {
        const data = await response.json()
        // Ensure we have a valid response structure
        const favorites = data?.favorites || data || []
        // Ensure favorites is an array before calling .some()
        const favoritesArray = Array.isArray(favorites) ? favorites : []
        setIsFavorite(favoritesArray.some((fav: any) => fav._id === params.id))
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session) {
      toast.error("Devi essere autenticato per aggiungere ai preferiti")
      return
    }

    if (!params?.id) {
      toast.error("ID evento non valido")
      return
    }

    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: params.id }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        toast.success(isFavorite ? "Rimosso dai preferiti" : "Aggiunto ai preferiti")
      } else {
        throw new Error("Errore nell'operazione")
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
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti!")
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.")) {
      return
    }

    if (!params?.id) {
      toast.error("ID evento non valido")
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/events/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Evento eliminato con successo")
        router.push("/user/events")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'eliminazione")
      }
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'eliminazione dell'evento")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data non disponibile"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Data non valida"
    }
  }

  const formatDateShort = (dateString: string) => {
    if (!dateString) return "Data non disponibile"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return "Data non valida"
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      casa: "🏠",
      viaggio: "✈️",
      evento: "🎉",
      esperienza: "🌟",
      festa: "🥳",
    }
    return icons[category] || "📅"
  }

  const handleGoBack = () => {
    // Check if we came from profile page by looking at the referrer or using a query param
    if (document.referrer.includes("/profile") || window.history.length <= 2) {
      router.push("/profile")
    } else {
      router.back()
    }
  }

  const isOwner = session?.user?.email === event?.host?.email

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento evento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Errore</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Link href="/">
              <Button>Torna alla Home</Button>
            </Link>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Riprova
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Evento non trovato</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleGoBack} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-white hover:bg-white/20">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className={`text-white hover:bg-white/20 ${isFavorite ? "text-red-300" : ""}`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Event Images */}
        {event.images && event.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.images.map((image, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${event.title} - ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Event Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-sm">
                  {getCategoryIcon(event.category)} {event.category}
                </Badge>
                {event.verified && (
                  <Badge variant="default" className="text-sm">
                    ✓ Verificato
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{event.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{event.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formatDateShort(event.dateStart)}</span>
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Link href={`/evento/${event._id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={handleDeleteEvent} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Data</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.dateStart)}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Euro className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Prezzo</p>
                <p className="text-xs text-muted-foreground">€{event.price}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Posti</p>
                <p className="text-xs text-muted-foreground">
                  {event.availableSpots}/{event.totalSpots}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Durata</p>
                <p className="text-xs text-muted-foreground">{event.dateEnd ? "Multi-giorno" : "Giornata singola"}</p>
              </div>
            </div>

            {event.amenities && event.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Servizi Inclusi</h4>
                <div className="flex flex-wrap gap-2">
                  {event.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Host Information */}
        <Card>
          <CardHeader>
            <CardTitle>Organizzatore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <OptimizedAvatar src={event.host?.image} alt={event.host?.name || "Host"} size={60} />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{event.host?.name || "Nome non disponibile"}</h3>
                {event.host?.bio && <p className="text-muted-foreground text-sm mb-2">{event.host.bio}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {event.host?.eventsHosted && <span>📅 {event.host.eventsHosted} eventi organizzati</span>}
                  {event.host?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{event.host.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {event.host?.responseRate && event.host?.responseTime && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>📊 {event.host.responseRate}% tasso di risposta</span>
                    <span>⏱️ Risponde in {event.host.responseTime}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {event.host?._id && (
                  <Link href={`/user/${event.host._id}`}>
                    <Button variant="outline" size="sm">
                      Vedi Profilo
                    </Button>
                  </Link>
                )}
                {!isOwner && event.host?._id && event.host?.name && (
                  <MessageHostButton
                    hostId={event.host._id}
                    hostName={event.host.name}
                    hostEmail={event.host.email}
                    eventId={event._id}
                    eventTitle={event.title}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        {event.bookings && event.bookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Partecipanti ({event.bookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.bookings.map((booking, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <OptimizedAvatar src={booking.userImage} alt={booking.userName} size={40} />
                    <div className="flex-1">
                      <p className="font-medium">{booking.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.spots} {booking.spots === 1 ? "posto" : "posti"} • {formatDateShort(booking.bookedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <ReviewSection eventId={event._id} />

        {/* Booking Section */}
        {!isOwner && event.availableSpots > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">€{event.price}</p>
                  <p className="text-sm text-muted-foreground">per persona</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.availableSpots} {event.availableSpots === 1 ? "posto disponibile" : "posti disponibili"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setShowBookingModal(true)} size="lg" className="min-w-[120px]">
                    Prenota Ora
                  </Button>
                  {event.bookingLink && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={event.bookingLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Link Esterno
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isOwner && event.availableSpots === 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 font-semibold">Evento al completo</p>
              <p className="text-red-500 text-sm">Non ci sono più posti disponibili per questo evento.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && event && (
        <BookingModal
          event={{
            id: event._id,
            title: event.title,
            price: event.price,
            availableSpots: event.availableSpots,
            dateStart: event.dateStart,
            location: event.location,
            image: event.images?.[0],
          }}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false)
            fetchEvent() // Refresh event data
          }}
        />
      )}
    </div>
  )
}
