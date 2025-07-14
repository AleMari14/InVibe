"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Euro,
  Star,
  Heart,
  Share2,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Clock,
  Tag,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getEventImageUrl } from "@/lib/image-utils"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { BookingModal } from "@/components/booking-modal"

interface Event {
  _id: string
  title: string
  description: string
  location: string
  price: number
  rating: number
  reviewCount: number
  images: string[]
  category: string
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  verified: boolean
  host: {
    _id: string
    name: string
    image: string
    email: string
  }
  createdAt: string
}

export default function EventoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const id = params.id as string

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  useEffect(() => {
    if (session && event) {
      checkIfFavorite()
    }
  }, [session, event])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${id}`)
      if (!response.ok) throw new Error("Evento non trovato")
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Impossibile caricare l'evento.")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorite = async () => {
    // This logic can be improved by fetching all favorites at once
    // For now, we check one by one
    try {
      const res = await fetch("/api/favorites")
      if (!res.ok) return
      const { favorites } = await res.json()
      setIsFavorite(favorites.some((fav: Event) => fav._id === event?._id))
    } catch (error) {
      console.error("Error checking favorite status", error)
    }
  }

  const handleToggleFavorite = async () => {
    if (!session) {
      router.push("/auth/login")
      return
    }
    setIsFavoriteLoading(true)
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event?._id }),
      })
      if (!response.ok) throw new Error("Errore nell'operazione")
      const data = await response.json()
      setIsFavorite(data.isFavorite)
      toast.success(data.isFavorite ? "Aggiunto ai preferiti!" : "Rimosso dai preferiti.")
    } catch (error: any) {
      toast.error(error.message || "Qualcosa è andato storto.")
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const handleContactHost = async () => {
    if (!session) {
      router.push("/auth/login")
      return
    }
    if (!event || !event.host) return

    setIsChatLoading(true)
    try {
      const response = await fetch("/api/messages/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event._id,
          eventTitle: event.title,
          hostId: event.host._id,
          hostName: event.host.name,
          hostImage: event.host.image,
          hostEmail: event.host.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nella creazione della chat")
      }

      const { roomId } = await response.json()
      router.push(`/messaggi/${roomId}`)
    } catch (error: any) {
      console.error("Error creating chat:", error)
      toast.error(error.message)
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event?.title,
          text: `Dai un'occhiata a questo evento: ${event?.title}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error))
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiato negli appunti!")
    }
  }

  if (loading) {
    return <EventSkeleton />
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <h1 className="text-2xl font-bold">Evento non trovato</h1>
        <p className="text-muted-foreground">L'evento che stai cercando non esiste o è stato rimosso.</p>
        <Button asChild className="mt-4">
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    )
  }

  const isHost = session?.user?.id === event.host._id

  return (
    <div className="bg-background text-foreground pb-20">
      <div className="relative h-64 md:h-80">
        <Image
          src={getEventImageUrl(event.images[0], 800, 320) || "/placeholder.svg"}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-background/50" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/50"
            onClick={handleToggleFavorite}
            disabled={isFavoriteLoading || isHost}
          >
            {isFavoriteLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-background/50" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative">
        <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl">
          <CardContent className="p-6">
            <Badge variant="secondary" className="mb-2">
              {event.category}
            </Badge>
            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Descrizione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dettagli Evento</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-semibold">Data e Ora</span>
                    <p className="text-muted-foreground">
                      {new Date(event.dateStart).toLocaleDateString("it-IT", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-semibold">Orario Inizio</span>
                    <p className="text-muted-foreground">
                      {new Date(event.dateStart).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-semibold">Posti</span>
                    <p className="text-muted-foreground">
                      {event.availableSpots} / {event.totalSpots} disponibili
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Euro className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-semibold">Prezzo</span>
                    <p className="text-muted-foreground">{event.price > 0 ? `€${event.price}` : "Gratuito"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-semibold">Categoria</span>
                    <p className="text-muted-foreground capitalize">{event.category}</p>
                  </div>
                </div>
                {event.verified && (
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="font-semibold">Verificato</span>
                      <p className="text-muted-foreground">Host affidabile</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organizzato da</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <OptimizedAvatar src={event.host.image} alt={event.host.name} size={48} />
                  <div>
                    <h3 className="font-semibold">{event.host.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{(event.rating || 0).toFixed(1)}</span>
                      <span>({event.reviewCount || 0} recensioni)</span>
                    </div>
                  </div>
                </div>
                {!isHost && (
                  <Button className="w-full mt-4" onClick={handleContactHost} disabled={isChatLoading}>
                    {isChatLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="mr-2 h-4 w-4" />
                    )}
                    Contatta l'host
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Prenota il tuo posto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Non perdere l'occasione di partecipare a questo evento unico!
                </p>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="lg" className="w-full" disabled={isHost}>
                      {isHost ? "Sei l'organizzatore" : "Prenota Ora"}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Prenota il tuo posto</SheetTitle>
                      <SheetDescription>Completa il form per prenotare il tuo posto a questo evento.</SheetDescription>
                    </SheetHeader>
                    <BookingModal eventId={event._id} onClose={() => setIsBookingModalOpen(false)} />
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function EventSkeleton() {
  return (
    <div className="bg-background text-foreground pb-20">
      <div className="relative h-64 md:h-80 bg-muted animate-pulse" />
      <div className="container mx-auto px-4 -mt-16 relative">
        <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
