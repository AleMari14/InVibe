"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Clock, MapPin, Users, Heart, Share2, Edit, Trash2, Star, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { ReviewSection } from "@/components/event/review-section"
import { MessageHostButton } from "@/components/event/message-host-button"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: {
    address: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  price: number
  maxParticipants: number
  currentParticipants: number
  category: string
  images: string[]
  hostId: string
  hostName: string
  hostImage?: string
  hostEmail: string
  createdAt: string
  tags?: string[]
  requirements?: string[]
  amenities?: string[]
}

interface Booking {
  _id: string
  eventId: string
  userId: string
  status: string
  createdAt: string
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userBooking, setUserBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eventId = params.id as string

  useEffect(() => {
    if (eventId) {
      fetchEvent()
      if (session?.user) {
        checkFavoriteStatus()
        checkBookingStatus()
      }
    }
  }, [eventId, session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Evento non trovato")
        } else {
          setError("Errore nel caricamento dell'evento")
        }
        return
      }

      const eventData = await response.json()

      // Ensure images is always an array
      if (eventData.images && !Array.isArray(eventData.images)) {
        eventData.images = []
      }

      setEvent(eventData)
    } catch (error) {
      console.error("Error fetching event:", error)
      setError("Errore nel caricamento dell'evento")
      toast.error("Errore nel caricamento dell'evento")
    } finally {
      setLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const favorites = await response.json()
        const favoriteIds = Array.isArray(favorites) ? favorites.map((f: any) => f.eventId || f._id) : []
        setIsFavorite(favoriteIds.includes(eventId))
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const checkBookingStatus = async () => {
    try {
      const response = await fetch("/api/bookings")
      if (response.ok) {
        const bookings = await response.json()
        const eventBooking = Array.isArray(bookings) ? bookings.find((b: Booking) => b.eventId === eventId) : null
        setUserBooking(eventBooking || null)
      }
    } catch (error) {
      console.error("Error checking booking status:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user) {
      toast.error("Devi effettuare l'accesso per aggiungere ai preferiti")
      return
    }

    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        toast.success(isFavorite ? "Rimosso dai preferiti" : "Aggiunto ai preferiti")
      } else {
        toast.error("Errore nell'aggiornamento dei preferiti")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Errore nell'aggiornamento dei preferiti")
    }
  }

  const handleBooking = async () => {
    if (!session?.user) {
      toast.error("Devi effettuare l'accesso per prenotare")
      return
    }

    if (!event) return

    if (event.hostId === session.user.id) {
      toast.error("Non puoi prenotare il tuo stesso evento")
      return
    }

    if (event.currentParticipants >= event.maxParticipants) {
      toast.error("Evento al completo")
      return
    }

    setBookingLoading(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        const booking = await response.json()
        setUserBooking(booking)
        setEvent((prev) => (prev ? { ...prev, currentParticipants: prev.currentParticipants + 1 } : null))
        toast.success("Prenotazione effettuata con successo!")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Errore nella prenotazione")
      }
    } catch (error) {
      console.error("Error booking event:", error)
      toast.error("Errore nella prenotazione")
    } finally {
      setBookingLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!userBooking) return

    setBookingLoading(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        setUserBooking(null)
        setEvent((prev) => (prev ? { ...prev, currentParticipants: prev.currentParticipants - 1 } : null))
        toast.success("Prenotazione cancellata")
      } else {
        toast.error("Errore nella cancellazione")
      }
    } catch (error) {
      console.error("Error canceling booking:", error)
      toast.error("Errore nella cancellazione")
    } finally {
      setBookingLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!event || !session?.user) return

    if (event.hostId !== session.user.id) {
      toast.error("Non puoi eliminare questo evento")
      return
    }

    if (confirm("Sei sicuro di voler eliminare questo evento?")) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          toast.success("Evento eliminato con successo")
          router.push("/profile")
        } else {
          toast.error("Errore nell'eliminazione dell'evento")
        }
      } catch (error) {
        console.error("Error deleting event:", error)
        toast.error("Errore nell'eliminazione dell'evento")
      }
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
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copiato negli appunti")
      } catch (error) {
        console.error("Error copying to clipboard:", error)
        toast.error("Errore nella condivisione")
      }
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
    return timeString
  }

  const formatPrice = (price: number) => {
    return price === 0 ? "Gratuito" : `€${price.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Errore</h1>
        <p className="text-muted-foreground mb-4">{error || "Evento non trovato"}</p>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla home
        </Button>
      </div>
    )
  }

  const isOwner = session?.user?.id === event.hostId
  const canBook = session?.user && !isOwner && !userBooking && event.currentParticipants < event.maxParticipants
  const isBooked = !!userBooking
  const isFull = event.currentParticipants >= event.maxParticipants

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFavorite}>
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isOwner && (
              <>
                <Button variant="ghost" size="icon" onClick={() => router.push(`/evento/${eventId}/edit`)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDeleteEvent}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Event Images */}
        {event.images && Array.isArray(event.images) && event.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-64 md:h-96 rounded-lg overflow-hidden"
          >
            <img
              src={event.images[0] || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.jpg"
              }}
            />
            {event.images.length > 1 && (
              <Badge className="absolute top-4 right-4 bg-black/50 text-white">+{event.images.length - 1} foto</Badge>
            )}
          </motion.div>
        )}

        {/* Event Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                  <Badge variant="secondary" className="mb-4">
                    {event.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatPrice(event.price)}</div>
                  {event.price > 0 && <div className="text-sm text-muted-foreground">per persona</div>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{event.description}</p>

              <Separator />

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{formatDate(event.date)}</div>
                    <div className="text-sm text-muted-foreground">Data evento</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{formatTime(event.time)}</div>
                    <div className="text-sm text-muted-foreground">Orario</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{event.location.address}</div>
                    <div className="text-sm text-muted-foreground">Luogo</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">
                      {event.currentParticipants}/{event.maxParticipants} partecipanti
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isFull
                        ? "Evento al completo"
                        : `${event.maxParticipants - event.currentParticipants} posti disponibili`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {event.tags && Array.isArray(event.tags) && event.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Tag</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Requirements */}
              {event.requirements && Array.isArray(event.requirements) && event.requirements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Requisiti</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {event.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Amenities */}
              {event.amenities && Array.isArray(event.amenities) && event.amenities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Servizi inclusi</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {event.amenities.map((amenity, index) => (
                        <li key={index}>{amenity}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Host Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <OptimizedAvatar src={event.hostImage} alt={event.hostName} size={48} />
                <div>
                  <div className="font-semibold">{event.hostName}</div>
                  <div className="text-sm text-muted-foreground">Organizzatore</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground">Valutazione host disponibile a breve</span>
              </div>
              {!isOwner && session?.user && (
                <div className="mt-4">
                  <MessageHostButton
                    hostId={event.hostId}
                    hostName={event.hostName}
                    hostImage={event.hostImage}
                    eventTitle={event.title}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ReviewSection eventId={eventId} />
        </motion.div>

        {/* Booking Actions */}
        {session?.user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sticky bottom-4"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{formatPrice(event.price)}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.currentParticipants}/{event.maxParticipants} partecipanti
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isOwner ? (
                      <Button onClick={() => router.push(`/evento/${eventId}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifica evento
                      </Button>
                    ) : isBooked ? (
                      <Button variant="destructive" onClick={handleCancelBooking} disabled={bookingLoading}>
                        {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Cancella prenotazione
                      </Button>
                    ) : canBook ? (
                      <Button onClick={handleBooking} disabled={bookingLoading || isFull}>
                        {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isFull ? "Evento al completo" : "Prenota ora"}
                      </Button>
                    ) : (
                      <Button disabled>
                        {!session.user ? "Accedi per prenotare" : isFull ? "Evento al completo" : "Non disponibile"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
