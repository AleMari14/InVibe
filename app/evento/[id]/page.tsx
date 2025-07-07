"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  MapPin,
  Share2,
  Users,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { getEventImageUrl, getProfileImageUrl } from "@/lib/image-utils"
import Link from "next/link"
import { MessageHostButton } from "@/components/event/message-host-button"

interface Event {
  _id: string
  title: string
  description: string
  images: string[]
  category: string
  location: string
  locationCoords: {
    lat: number
    lng: number
  }
  dateStart: string
  price: number
  totalSpots: number
  availableSpots: number
  host: {
    _id: string
    name: string
    image?: string
    verified: boolean
    email: string
  } | null
  participants: any[]
  verified: boolean
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  const eventId = params.id

  useEffect(() => {
    if (eventId) {
      fetchEventDetails()
    }
  }, [eventId])

  useEffect(() => {
    if (session && event) {
      checkIfFavorite()
    }
  }, [session, event])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error("Evento non trovato o errore nel server.")
      }
      const data = await response.json()
      setEvent(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorite = async () => {
    // Questa logica andrebbe implementata recuperando i preferiti dell'utente
    // Per ora, è un placeholder
  }

  const toggleFavorite = async () => {
    if (!session) {
      toast.error("Devi accedere per aggiungere ai preferiti.")
      router.push("/auth/login")
      return
    }
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorited)
        toast.success(data.isFavorited ? "Aggiunto ai preferiti!" : "Rimosso dai preferiti.")
      } else {
        toast.error("Errore nell'aggiornamento dei preferiti.")
      }
    } catch (error) {
      toast.error("Si è verificato un errore.")
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link dell'evento copiato!")
  }

  const openGoogleMaps = () => {
    if (event?.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
      window.open(url, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Oops! Qualcosa è andato storto.</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button onClick={() => router.push("/")}>Torna alla Home</Button>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const isHost = session?.user?.id === event?.host?._id

  const eventDate = new Date(event.dateStart)
  const formattedDate = eventDate.toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = eventDate.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-28">
      <div className="relative h-64 sm:h-80 md:h-96 w-full">
        <Image
          src={getEventImageUrl(event.images?.[0], event.category, 1200, 400) || "/placeholder.svg"}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-black/30 backdrop-blur-sm rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="bg-black/30 backdrop-blur-sm rounded-full"
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="bg-black/30 backdrop-blur-sm rounded-full"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-6 left-4 right-4 px-2">
          <Badge className="mb-2 bg-blue-500 text-white">{event.category}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white shadow-lg">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Host Info */}
            {event.host && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-blue-400">
                      <AvatarImage
                        src={getProfileImageUrl(event.host.image) || "/placeholder.svg"}
                        alt={event.host.name}
                      />
                      <AvatarFallback>{event.host.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-400">Organizzato da</p>
                      <p className="text-xl font-bold flex items-center gap-2">
                        {event.host.name}
                        {event.host.verified && <CheckCircle className="h-5 w-5 text-green-400" />}
                      </p>
                    </div>
                  </div>
                  {!isHost && (
                    <MessageHostButton
                      hostId={event.host._id}
                      hostName={event.host.name}
                      hostEmail={event.host.email}
                      eventId={event._id}
                      eventTitle={event.title}
                      className="border-blue-400 text-blue-400 hover:bg-blue-400/10 hover:text-blue-300 bg-transparent"
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Details */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8 text-purple-400" />
                  <p className="font-semibold text-lg">{formattedDate}</p>
                  <p className="text-gray-400">Data</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Clock className="h-8 w-8 text-green-400" />
                  <p className="font-semibold text-lg">{formattedTime}</p>
                  <p className="text-gray-400">Orario</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-yellow-400" />
                  <p className="font-semibold text-lg">
                    {event.availableSpots} / {event.totalSpots}
                  </p>
                  <p className="text-gray-400">Posti disponibili</p>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-gray-200">Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-gray-200">Luogo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-red-400" />
                  <p className="text-gray-300">{event.location}</p>
                </div>
                <Button onClick={openGoogleMaps} className="w-full bg-blue-600 hover:bg-blue-700">
                  Vedi su Google Maps
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Sidebar for Booking */}
          <div className="lg:sticky top-24 self-start">
            <Card className="bg-gray-800 border-2 border-blue-500/50 shadow-xl shadow-blue-500/10">
              <CardContent className="p-6">
                <div className="flex items-baseline justify-center gap-2 mb-6">
                  <span className="text-4xl font-bold text-green-400">€{event.price}</span>
                  <span className="text-gray-400">/ persona</span>
                </div>
                {isHost ? (
                  <Button size="lg" className="w-full h-14 text-lg font-bold bg-gray-600 cursor-not-allowed" disabled>
                    Questo è il tuo evento
                  </Button>
                ) : (
                  <Link href={`/prenota/${event._id}`} className="w-full">
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
                      disabled={event.availableSpots === 0}
                    >
                      {event.availableSpots > 0 ? "Prenota il tuo posto" : "Posti esauriti"}
                    </Button>
                  </Link>
                )}
                <p className="text-center text-xs text-gray-500 mt-4">Pagamento sicuro e protetto</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
