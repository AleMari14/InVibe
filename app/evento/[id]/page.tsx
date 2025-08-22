"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, MapPin, Calendar, Clock, Users, Euro, Heart, Share2, Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Separator } from "@/components/ui/separator"
import { BookingModal } from "@/components/booking-modal"
import { MessageHostButton } from "@/components/event/message-host-button"
import { ReviewSection } from "@/components/event/review-section"
import { toast } from "sonner"
import { motion } from "framer-motion"
import Image from "next/image"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: {
    address: string
    lat: number
    lng: number
  }
  category: string
  maxParticipants: number
  currentParticipants: number
  price: number
  images: string[]
  hostId: string
  hostName: string
  hostImage?: string
  hostEmail: string
  createdAt: string
}

interface Booking {
  _id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  status: string
  createdAt: string
}

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [userBooking, setUserBooking] = useState<Booking | null>(null)

  useEffect(() => {
    fetchEvent()
    if (session?.user?.id) {
      checkFavoriteStatus()
      checkUserBooking()
    }
  }, [params.id, session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)

      if (!response.ok) {
        throw new Error("Evento non trovato")
      }

      const eventData = await response.json()
      setEvent(eventData)

      // Fetch bookings if user is the host
      if (session?.user?.id === eventData.hostId) {
        fetchBookings()
      }
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Evento non trovato")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?eventId=${params.id}`)
      if (response.ok) {
        const bookingsData = await response.json()
        setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
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

  const checkUserBooking = async () => {
    try {
      const response = await fetch(`/api/bookings?eventId=${params.id}&userId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setUserBooking(data[0])
        }
      }
    } catch (error) {
      console.error("Error checking user booking:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user?.id) {
      toast.error("Devi essere loggato per aggiungere ai preferiti")
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
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Errore nell'operazione")
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
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti")
    }
  }

  const handleBack = () => {
    // Check if user came from profile or has limited history
    if (document.referrer.includes("/profile") || window.history.length <= 2) {
      router.push("/profile")
    } else {
      router.back()
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
    return timeString.slice(0, 5)
  }

  const isHost = session?.user?.id === event?.hostId
  const canBook = !isHost && !userBooking && event && event.currentParticipants < event.maxParticipants

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Evento non trovato</h2>
          <Button onClick={() => router.push("/")}>Torna alla home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {isHost && (
              <Button variant="outline" size="icon" onClick={() => router.push(`/evento/${params.id}/edit?from=event`)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={toggleFavorite}>
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Images */}
        {event.images && event.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.images.slice(0, 4).map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-lg ${
                  index === 0 && event.images.length > 1 ? "md:row-span-2" : ""
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${event.title} - Immagine ${index + 1}`}
                  width={600}
                  height={index === 0 ? 400 : 200}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Event Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <Badge variant="secondary" className="mb-4">
                  {event.category}
                </Badge>
              </div>
              {event.price > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                    <Euro className="h-5 w-5" />
                    {event.price}
                  </div>
                  <p className="text-sm text-muted-foreground">per persona</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>

            <Separator />

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{formatDate(event.date)}</p>
                  <p className="text-sm text-muted-foreground">Data evento</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{formatTime(event.time)}</p>
                  <p className="text-sm text-muted-foreground">Orario</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{event.location.address}</p>
                  <p className="text-sm text-muted-foreground">Posizione</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {event.currentParticipants}/{event.maxParticipants} partecipanti
                  </p>
                  <p className="text-sm text-muted-foreground">Posti disponibili</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organizzatore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <OptimizedAvatar src={event.hostImage} alt={event.hostName} size={48} />
                <div>
                  <p className="font-medium">{event.hostName}</p>
                  <p className="text-sm text-muted-foreground">Organizzatore</p>
                </div>
              </div>
              {!isHost && (
                <MessageHostButton
                  hostId={event.hostId}
                  hostName={event.hostName}
                  hostEmail={event.hostEmail}
                  eventTitle={event.title}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Section */}
        {!isHost && (
          <Card>
            <CardContent className="p-6">
              {userBooking ? (
                <div className="text-center">
                  <div className="mb-4">
                    <Badge variant={userBooking.status === "confirmed" ? "default" : "secondary"}>
                      {userBooking.status === "confirmed" ? "Prenotazione Confermata" : "In Attesa"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">Hai già prenotato per questo evento</p>
                </div>
              ) : canBook ? (
                <div className="text-center">
                  <Button size="lg" className="w-full" onClick={() => setShowBookingModal(true)}>
                    Prenota Ora
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {event.currentParticipants >= event.maxParticipants ? "Evento al completo" : "Non disponibile"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bookings (Host Only) */}
        {isHost && bookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prenotazioni ({bookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.userName}</p>
                      <p className="text-sm text-muted-foreground">{booking.userEmail}</p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                      {booking.status === "confirmed" ? "Confermata" : "In Attesa"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <ReviewSection eventId={params.id} />
      </div>

      {/* Booking Modal */}
      {showBookingModal && event && (
        <BookingModal
          event={event}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false)
            checkUserBooking()
            fetchEvent()
          }}
        />
      )}
    </div>
  )
}
