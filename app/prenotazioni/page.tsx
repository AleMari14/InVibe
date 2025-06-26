"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getEventImageUrl } from "@/lib/image-utils"

interface Booking {
  _id: string
  eventId: string
  guests: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  totalPrice: number
  specialRequests?: string
  contactInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  createdAt: string
  event: {
    title: string
    location: string
    dateStart: string
    dateEnd?: string
    images: string[]
    price: number
    hostId: string
  }
}

export default function PrenotazioniPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (session?.user?.id) {
      fetchBookings()
    }
  }, [session, status])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bookings")
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confermata"
      case "pending":
        return "In Attesa"
      case "cancelled":
        return "Annullata"
      case "completed":
        return "Completata"
      default:
        return "Sconosciuto"
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true
    return booking.status === activeTab
  })

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Le Mie Prenotazioni
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="all">Tutte</TabsTrigger>
            <TabsTrigger value="confirmed">Confermate</TabsTrigger>
            <TabsTrigger value="pending">In Attesa</TabsTrigger>
            <TabsTrigger value="completed">Completate</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          // Loading skeletons
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-border">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nessuna prenotazione</h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "all"
                ? "Non hai ancora prenotato nessun evento"
                : `Nessuna prenotazione ${getStatusText(activeTab).toLowerCase()}`}
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Esplora Eventi
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="overflow-hidden border-border bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={
                              getEventImageUrl(booking.event.images?.[0], 64, 64) ||
                              "/placeholder.svg?height=64&width=64"
                            }
                            alt={booking.event.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
                              {booking.event.title}
                            </h3>
                            <Badge className={`ml-2 text-xs ${getStatusColor(booking.status)}`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(booking.status)}
                                {getStatusText(booking.status)}
                              </span>
                            </Badge>
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{booking.event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(booking.event.dateStart)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {booking.guests} {booking.guests === 1 ? "persona" : "persone"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="text-sm font-semibold text-foreground">€{booking.totalPrice}</div>
                            <Link href={`/evento/${booking.eventId}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                Vedi Evento
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            <strong>Richieste speciali:</strong> {booking.specialRequests}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
