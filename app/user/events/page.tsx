"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, MapPin, Users, Star, Eye, Edit, Trash2, Plus, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { getEventImageUrl } from "@/lib/image-utils"

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
  date: string
  time: string
  totalSpots: number
  availableSpots: number
  maxParticipants: number
  currentParticipants: number
  amenities: string[]
  bookingLink: string
  verified: boolean
  views: number
  createdAt: string
  updatedAt: string
}

const categoryIcons: Record<string, string> = {
  festa: "🎉",
  compleanno: "🎂",
  matrimonio: "💒",
  aziendale: "🏢",
  musica: "🎵",
  sport: "⚽",
  arte: "🎨",
  cibo: "🍽️",
  casa: "🏠",
  viaggio: "✈️",
  evento: "🎉",
  esperienza: "🌟",
}

// Safe date formatting functions
const formatSafeDate = (dateString: string): string => {
  if (!dateString) return "Data non disponibile"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Data non valida"
    
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Data non disponibile"
  }
}

const formatSafeTime = (dateString: string): string => {
  if (!dateString) return "00:00"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "00:00"
    
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting time:", error)
    return "00:00"
  }
}

export default function UserEventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchUserEvents()
    }
  }, [status, router])

  const fetchUserEvents = async () => {
    try {
      console.log("🔍 Fetching user events...")
      const response = await fetch("/api/user/events")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nel caricamento")
      }

      const data = await response.json()
      console.log("📊 User events received:", data)
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setEvents(data)
        console.log("✅ Events set:", data.length)
      } else {
        console.error("❌ Data is not an array:", typeof data)
        setEvents([])
      }
    } catch (error) {
      console.error("Error fetching user events:", error)
      toast.error("Errore nel caricamento degli eventi")
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingEventId(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Errore nell'eliminazione dell'evento")
      }

      toast.success("Evento eliminato con successo")
      setEvents(events.filter((event) => event._id !== eventId))
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Errore nell'eliminazione dell'evento")
    } finally {
      setDeletingEventId(null)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">Caricamento eventi...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-200 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                I Miei Eventi
              </h1>
              <p className="text-muted-foreground mt-1">Gestisci i tuoi eventi creati</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              <Link href="/crea-evento">
                <Plus className="h-4 w-4 mr-2" />
                Crea Evento
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{events.length}</div>
              <div className="text-sm text-muted-foreground">Eventi Totali</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Array.isArray(events) ? events.reduce((sum, event) => sum + (event.currentParticipants || 0), 0) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Partecipanti</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Array.isArray(events) ? events.reduce((sum, event) => sum + (event.views || 0), 0) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Visualizzazioni</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Array.isArray(events) && events.length > 0
                  ? (events.reduce((sum, event) => sum + (event.rating || 0), 0) / events.length).toFixed(1)
                  : "0.0"}
              </div>
              <div className="text-sm text-muted-foreground">Rating Medio</div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        {!Array.isArray(events) || events.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nessun evento creato</h3>
              <p className="text-muted-foreground mb-6">
                Non hai ancora creato nessun evento. Inizia creando il tuo primo evento!
              </p>
              <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                <Link href="/crea-evento">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea il tuo primo evento
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event._id}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="relative">
                  {event.images && event.images.length > 0 ? (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <Image
                        src={getEventImageUrl(event.images[0], 400, 300) || "/placeholder.svg?height=300&width=400"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-gray-800">
                          {categoryIcons[event.category]} {event.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        {event.verified && <Badge className="bg-green-500 text-white">Verificato</Badge>}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{categoryIcons[event.category] || "🎉"}</div>
                        <p className="text-sm text-muted-foreground">Nessuna immagine</p>
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{formatSafeDate(event.dateStart)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>{formatSafeTime(event.dateStart)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">
                        {event.currentParticipants || 0}/{event.maxParticipants || event.totalSpots}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {event.price === 0 ? "Gratuito" : `€${event.price}`}
                    </div>
                  </div>

                  <Progress 
                    value={((event.currentParticipants || 0) / (event.maxParticipants || event.totalSpots || 1)) * 100} 
                    className="h-2 mb-4" 
                  />

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Eye className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <div className="text-xs font-medium text-blue-600">{event.views || 0}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-yellow-50">
                      <Star className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
                      <div className="text-xs font-medium text-yellow-600">{(event.rating || 0).toFixed(1)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50">
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <div className="text-xs font-medium text-purple-600">{event.reviewCount || 0}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <Link href={`/evento/${event._id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizza
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/evento/${event._id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Elimina evento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteEvent(event._id)}
                            disabled={deletingEventId === event._id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingEventId === event._id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Eliminazione...
                              </>
                            ) : (
                              "Elimina"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
