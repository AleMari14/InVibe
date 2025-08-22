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
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { BookingModal } from "@/components/booking-modal"
import { MessageHostButton } from "@/components/event/message-host-button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { motion } from "framer-motion"

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
        const favorites = await response.json()
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

  const isOwner = session?.user?.email === event?.host?.email

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Caricamento evento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Errore</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">Torna alla Home</Button>
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Evento non trovato</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 pb-20">
      {/* Hero Section with Image */}
      <div className="relative h-80 md:h-96 overflow-hidden">
        {event.images && event.images.length > 0 ? (
          <Image src={event.images[0] || "/placeholder.svg"} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border border-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border border-white/20"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className={`bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/40 ${
                isFavorite ? "text-red-400" : "text-white"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Event Title and Basic Info */}
        <div className="absolute bottom-6 left-4 right-4 z-10">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-blue-600/90 backdrop-blur-sm text-white border-blue-500">
              {getCategoryIcon(event.category)} {event.category}
            </Badge>
            {event.verified && (
              <Badge className="bg-green-600/90 backdrop-blur-sm text-white border-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verificato
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{formatDateShort(event.dateStart)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">
                {event.availableSpots}/{event.totalSpots} posti
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Owner Actions */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-center"
          >
            <Link href={`/evento/${event._id}/edit`}>
              <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
                <Edit className="h-4 w-4 mr-2" />
                Modifica Evento
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Elimina
            </Button>
          </motion.div>
        )}

        {/* Event Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Dettagli Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300 leading-relaxed text-lg">{event.description}</p>

              <Separator className="bg-gray-700" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                  <p className="text-sm font-medium text-white mb-1">Data e Ora</p>
                  <p className="text-xs text-gray-400">{formatDate(event.dateStart)}</p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                  <Euro className="h-8 w-8 mx-auto mb-3 text-green-400" />
                  <p className="text-sm font-medium text-white mb-1">Prezzo</p>
                  <p className="text-xs text-gray-400">{event.price === 0 ? "Gratuito" : `€${event.price}`}</p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                  <Users className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                  <p className="text-sm font-medium text-white mb-1">Disponibilità</p>
                  <p className="text-xs text-gray-400">
                    {event.availableSpots}/{event.totalSpots} posti
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                  <Clock className="h-8 w-8 mx-auto mb-3 text-orange-400" />
                  <p className="text-sm font-medium text-white mb-1">Durata</p>
                  <p className="text-xs text-gray-400">{event.dateEnd ? "Multi-giorno" : "Giornata singola"}</p>
                </div>
              </div>

              {event.amenities && event.amenities.length > 0 && (
                <>
                  <Separator className="bg-gray-700" />
                  <div>
                    <h4 className="font-semibold mb-3 text-white">Servizi Inclusi</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Host Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Organizzatore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <OptimizedAvatar
                  src={event.host?.image}
                  alt={event.host?.name || "Host"}
                  size={80}
                  className="ring-2 ring-blue-500/20"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-xl text-white mb-2">
                    {event.host?.name || "Nome non disponibile"}
                  </h3>
                  {event.host?.bio && <p className="text-gray-400 text-sm mb-3 leading-relaxed">{event.host.bio}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {event.host?.eventsHosted && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span>{event.host.eventsHosted} eventi organizzati</span>
                      </div>
                    )}
                    {event.host?.rating && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{event.host.rating.toFixed(1)} stelle</span>
                      </div>
                    )}
                    {event.host?.responseRate && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>{event.host.responseRate}% tasso di risposta</span>
                      </div>
                    )}
                    {event.host?.responseTime && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span>Risponde in {event.host.responseTime}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {event.host?._id && (
                    <Link href={`/user/${event.host._id}`}>
                      <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
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
        </motion.div>

        {/* Additional Images */}
        {event.images && event.images.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Altre Immagini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.images.slice(1).map((image, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${event.title} - ${index + 2}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Participants */}
        {event.bookings && event.bookings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  Partecipanti ({event.bookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.bookings.map((booking, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                    >
                      <OptimizedAvatar src={booking.userImage} alt={booking.userName} size={48} />
                      <div className="flex-1">
                        <p className="font-medium text-white">{booking.userName}</p>
                        <p className="text-sm text-gray-400">
                          {booking.spots} {booking.spots === 1 ? "posto" : "posti"} •{" "}
                          {formatDateShort(booking.bookedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Booking Section */}
        {!isOwner && event.availableSpots > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">
                      {event.price === 0 ? "Gratuito" : `€${event.price}`}
                    </p>
                    <p className="text-blue-200 text-sm mb-2">per persona</p>
                    <p className="text-blue-200 text-sm">
                      {event.availableSpots} {event.availableSpots === 1 ? "posto disponibile" : "posti disponibili"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => setShowBookingModal(true)}
                      size="lg"
                      className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                    >
                      Prenota Ora
                    </Button>
                    {event.bookingLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-blue-400 text-blue-300 hover:bg-blue-600/20 bg-transparent"
                      >
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
          </motion.div>
        )}

        {!isOwner && event.availableSpots === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-red-600/20 backdrop-blur-sm border-red-500/30">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-300 font-semibold text-lg mb-2">Evento al completo</p>
                <p className="text-red-400 text-sm">Non ci sono più posti disponibili per questo evento.</p>
              </CardContent>
            </Card>
          </motion.div>
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
