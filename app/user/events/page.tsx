"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, MapPin, Users, Eye, Edit, Trash2, Plus, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
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
  totalSpots: number
  availableSpots: number
  currentParticipants: number
  verified: boolean
  views: number
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

const formatSafeDate = (dateString: string): string => {
  if (!dateString) return "Data non disponibile"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Data non valida"
    return date.toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  } catch (error) {
    return "Data non disponibile"
  }
}

const formatSafeTime = (dateString: string): string => {
  if (!dateString) return "00:00"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "00:00"
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
  } catch (error) {
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
      setIsLoading(true)
      const response = await fetch("/api/user/events")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nel caricamento")
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setEvents(data)
      } else {
        setEvents([])
      }
    } catch (error) {
      toast.error("Errore nel caricamento degli eventi")
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingEventId(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Errore nell'eliminazione dell'evento")
      toast.success("Evento eliminato con successo")
      setEvents(events.filter((event) => event._id !== eventId))
    } catch (error) {
      toast.error("Errore nell'eliminazione dell'evento")
    } finally {
      setDeletingEventId(null)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Caricamento eventi...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 pb-20">
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  I Miei Eventi
                </h1>
                <p className="text-gray-400 mt-1">Gestisci gli eventi che hai creato</p>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Link href="/crea-evento">
                <Plus className="h-4 w-4 mr-2" />
                Crea Evento
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Eventi Totali", value: events.length, color: "text-blue-400" },
            {
              label: "Partecipanti",
              value: events.reduce((sum, event) => sum + (event.currentParticipants || 0), 0),
              color: "text-green-400",
            },
            {
              label: "Visualizzazioni",
              value: events.reduce((sum, event) => sum + (event.views || 0), 0),
              color: "text-purple-400",
            },
            {
              label: "Rating Medio",
              value:
                events.length > 0
                  ? (events.reduce((sum, event) => sum + (event.rating || 0), 0) / events.length).toFixed(1)
                  : "0.0",
              color: "text-orange-400",
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!Array.isArray(events) || events.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2 text-white">Nessun evento creato</h3>
              <p className="text-gray-400 mb-6">Non hai ancora creato nessun evento. Inizia subito!</p>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
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
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg hover:shadow-blue-500/10 hover:border-blue-700 transition-all duration-300 group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <Image
                    src={getEventImageUrl(event.images?.[0], 400, 300) || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gray-900/70 text-gray-200 border border-gray-600">
                      {categoryIcons[event.category] || "🎉"} {event.category}
                    </Badge>
                  </div>
                  {event.verified && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-600 text-white">Verificato</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 flex-grow flex flex-col">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-white">{event.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{event.description}</p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span>{formatSafeDate(event.dateStart)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-400" />
                      <span>{formatSafeTime(event.dateStart)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-400" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="font-medium">
                          {event.currentParticipants || 0}/{event.totalSpots}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-green-400">
                        {event.price === 0 ? "Gratuito" : `€${event.price}`}
                      </div>
                    </div>
                    <Progress
                      value={((event.currentParticipants || 0) / (event.totalSpots || 1)) * 100}
                      className="h-2 mb-4"
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1 bg-transparent border-gray-600 hover:bg-gray-700"
                      >
                        <Link href={`/evento/${event._id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizza
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="border-gray-600 hover:bg-gray-700 bg-transparent"
                      >
                        <Link href={`/evento/${event._id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-400 border-gray-600 hover:bg-red-900/50 hover:text-red-300 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Elimina evento</AlertDialogTitle>
                            <AlertDialogDescription>Sei sicuro? Questa azione è irreversibile.</AlertDialogDescription>
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
