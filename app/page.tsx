"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { MapPin, Calendar, Users, Heart, Search, Filter, Star, Euro } from "lucide-react"
import { toast } from "sonner"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  price: number
  maxParticipants: number
  currentParticipants: number
  images: string[]
  category: string
  host: {
    _id: string
    name: string
    email: string
    image?: string
  }
  isFavorite?: boolean
  rating?: number
  reviewCount?: number
}

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchEvents()
    if (session) {
      fetchFavorites()
    }
  }, [session])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (!response.ok) throw new Error("Errore nel caricamento degli eventi")
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Errore nel caricamento degli eventi")
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites || [])
      }
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  const toggleFavorite = async (eventId: string) => {
    if (!session) {
      toast.error("Devi essere loggato per aggiungere ai preferiti")
      return
    }

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) throw new Error("Errore nell'aggiornamento dei preferiti")

      const data = await response.json()
      setFavorites(data.favorites)
      toast.success(data.message)
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Errore nell'aggiornamento dei preferiti")
    }
  }

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const getAvailabilityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-orange-600"
    return "text-green-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Benvenuto su InVibe! 🎉</h1>
          <p className="text-xl opacity-90 mb-6">Scopri eventi incredibili nella tua zona</p>

          {/* Barra di ricerca */}
          <div className="flex gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca eventi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
              />
            </div>
            <Button variant="secondary" size="icon" onClick={() => router.push("/filtri")}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Eventi */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{searchTerm ? `Risultati per "${searchTerm}"` : "Eventi in evidenza"}</h2>
          <span className="text-muted-foreground">
            {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventi"}
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Nessun evento trovato</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Prova a modificare i termini di ricerca" : "Non ci sono eventi disponibili al momento"}
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm("")} variant="outline">
                  Mostra tutti gli eventi
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event._id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-border/30 dark:border-gray-600 bg-card/90 dark:bg-gray-800/90 backdrop-blur-sm"
                onClick={() => router.push(`/evento/${event._id}`)}
              >
                {/* Immagine evento */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.images?.[0] || "/placeholder.svg?height=200&width=400"}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-gray-800 font-medium">{event.category}</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="bg-white/90 hover:bg-white text-gray-800 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(event._id)
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(event._id) ? "fill-red-500 text-red-500" : "text-gray-600"
                        }`}
                      />
                    </Button>
                  </div>
                  {event.price === 0 && (
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-green-500 text-white">Gratuito</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Titolo e rating */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    {event.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{event.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({event.reviewCount} recensioni)</span>
                      </div>
                    )}
                  </div>

                  {/* Descrizione */}
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

                  {/* Info evento */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(event.date)} alle {formatTime(event.time)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className={getAvailabilityColor(event.currentParticipants, event.maxParticipants)}>
                        {event.currentParticipants}/{event.maxParticipants} partecipanti
                      </span>
                    </div>

                    {event.price > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4" />
                        <span className="font-medium text-primary">€{event.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Host */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <OptimizedAvatar src={event.host.image} alt={event.host.name} size={24} />
                    <span className="text-xs text-muted-foreground">Organizzato da {event.host.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
