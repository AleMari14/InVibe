"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  Users,
  Eye,
  Star,
  Edit3,
  Trash2,
  MoreVertical,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
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
  amenities: string[]
  bookingLink: string
  verified: boolean
  views: number
  createdAt: string
  updatedAt: string
}

export default function UserEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

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
      setLoading(true)
      setError("")

      console.log("🔍 Fetching user events...")

      const response = await fetch("/api/user/events", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📋 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 User events data received:", data?.length || 0, "events")

      if (Array.isArray(data)) {
        setEvents(data)
      } else {
        console.error("❌ Data is not an array:", typeof data)
        setEvents([])
        setError("Formato dati non valido ricevuto dal server")
      }
    } catch (error: any) {
      console.error("💥 Error fetching user events:", error)
      setError(error.message || "Errore nel caricamento degli eventi. Riprova.")
      setEvents([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchUserEvents()
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setDeleting(true)

      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'eliminazione")
      }

      const data = await response.json()
      toast.success(data.message || "Evento eliminato con successo!")

      // Remove event from list
      setEvents((prev) => prev.filter((event) => event._id !== eventId))
      setDeleteEventId(null)
    } catch (error: any) {
      console.error("💥 Error deleting event:", error)
      toast.error(error.message || "Errore durante l'eliminazione dell'evento")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const startFormatted = start.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })

    if (!endDate) return startFormatted

    const end = new Date(endDate)
    const endFormatted = end.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })

    return `${startFormatted} - ${endFormatted}`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "casa":
        return "🏠"
      case "viaggio":
        return "✈️"
      case "evento":
        return "🎉"
      case "esperienza":
        return "🌟"
      default:
        return "📅"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "casa":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      case "viaggio":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      case "evento":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      case "esperienza":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="flex">
                  <Skeleton className="w-32 h-24 flex-shrink-0" />
                  <div className="flex-1 p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">I Miei Eventi</h1>
              <p className="text-white/80">Gestisci i tuoi eventi creati</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {events.length} eventi
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {events.reduce((sum, event) => sum + event.views, 0)} visualizzazioni
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Link href="/crea-evento">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Evento
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
            <p>
              <strong>Debug:</strong> User: {session?.user?.email}, Events found: {events.length}
            </p>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 && !loading ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nessun evento creato</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Non hai ancora creato nessun evento. Inizia a condividere le tue esperienze!
            </p>
            <Link href="/crea-evento">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8">
                <Plus className="h-4 w-4 mr-2" />
                Crea il tuo primo evento
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {events.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex">
                      {/* Event Image */}
                      <div className="relative w-32 h-24 flex-shrink-0">
                        <Image
                          src={getEventImageUrl(event.images?.[0], 128, 96) || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className={`text-xs ${getCategoryColor(event.category)}`}>
                            {getCategoryIcon(event.category)} {event.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1 mb-1">{event.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location.split(",")[0]}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateRange(event.dateStart, event.dateEnd)}
                              </span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/evento/${event._id}`} className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Visualizza
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/evento/${event._id}/edit`} className="flex items-center gap-2">
                                  <Edit3 className="h-4 w-4" />
                                  Modifica
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteEventId(event._id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.availableSpots}/{event.totalSpots} posti
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {event.views} visualizzazioni
                            </span>
                            {event.rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {event.rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-blue-600">€{event.price}</div>
                              <div className="text-xs text-muted-foreground">per persona</div>
                            </div>
                            {event.verified ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">✓ Verificato</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                In revisione
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteEventId}
        onOpenChange={() => setDeleteEventId(null)}
        title="Elimina Evento"
        description="Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata."
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={() => deleteEventId && handleDeleteEvent(deleteEventId)}
        loading={deleting}
        variant="destructive"
      />
    </div>
  )
}
