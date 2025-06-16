"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  Star,
  Heart,
  Plus,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { toast } from "sonner"

const categories = [
  { id: "casa", name: "Case", icon: "🏠", gradient: "from-green-500 to-emerald-600" },
  { id: "viaggio", name: "Viaggi", icon: "✈️", gradient: "from-blue-500 to-cyan-600" },
  { id: "evento", name: "Eventi", icon: "🎉", gradient: "from-purple-500 to-pink-600" },
  { id: "esperienza", name: "Esperienze", icon: "🌟", gradient: "from-orange-500 to-red-600" },
]

interface Event {
  _id: string
  title: string
  location: string
  price: number
  rating: number
  reviewCount: number
  images: string[]
  category: string
  dateStart: string
  totalSpots: number
  availableSpots: number
  amenities: string[]
  bookingLink: string
  verified: boolean
  views: number
  host?: {
    name: string
    image?: string
    rating: number
    verified: boolean
  }
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [favorites, setFavorites] = useState<string[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [error, setError] = useState("")
  const { data: session } = useSession()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead } = useNotifications()

  useEffect(() => {
    fetchEvents()
    if (session?.user?.email) {
      fetchFavorites()
    }
  }, [selectedCategory, searchQuery, session])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (searchQuery) params.append("search", searchQuery)

      console.log("🔍 Fetching events with params:", params.toString())

      const response = await fetch(`/api/events?${params}`)
      console.log("📋 Events API response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Events data received:", data?.length || 0, "events")

      if (Array.isArray(data)) {
        setEvents(data)
        // Set featured events (top rated or most viewed)
        const featured = data.filter((event: Event) => event.rating >= 4.8 || event.views > 50).slice(0, 3)
        setFeaturedEvents(featured)
      } else {
        console.error("❌ Data is not an array:", typeof data)
        setEvents([])
        setFeaturedEvents([])
        setError("Formato dati non valido ricevuto dal server")
      }
    } catch (error) {
      console.error("💥 Error fetching events:", error)
      setError("Errore nel caricamento degli eventi. Riprova.")
      setEvents([])
      setFeaturedEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    if (!session?.user?.email) return

    try {
      console.log("💖 Fetching favorites...")
      const response = await fetch("/api/favorites")

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setFavorites(data.map((event: Event) => event._id))
          console.log("✅ Favorites loaded:", data.length)
        }
      }
    } catch (error) {
      console.error("💥 Error fetching favorites:", error)
    }
  }

  const toggleFavorite = async (eventId: string) => {
    if (!session?.user?.email) {
      toast.error("Devi essere loggato per aggiungere ai preferiti")
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
        if (data.isFavorited) {
          setFavorites((prev) => [...prev, eventId])
          toast.success("Aggiunto ai preferiti")
        } else {
          setFavorites((prev) => prev.filter((id) => id !== eventId))
          toast.success("Rimosso dai preferiti")
        }
      }
    } catch (error) {
      console.error("💥 Error toggling favorite:", error)
      toast.error("Errore nell'aggiornamento dei preferiti")
    }
  }

  const handleEventClick = (eventId: string) => {
    router.push(`/evento/${eventId}`)
  }

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification._id)
    if (notification.type === "message") {
      router.push(`/messaggi/${notification.roomId}`)
    } else if (notification.eventId) {
      router.push(`/evento/${notification.eventId}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-16">
      {/* Enhanced Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                InVibe
              </h1>
            </motion.div>

            <div className="flex items-center gap-1 sm:gap-2">
              {session?.user && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                      <div className="p-2 border-b border-border">
                        <h3 className="font-medium text-sm">Notifiche</h3>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Nessuna notifica</div>
                      ) : (
                        notifications.map((notification: any) => (
                          <DropdownMenuItem
                            key={notification._id}
                            className={`p-3 cursor-pointer ${notification.read ? "" : "bg-blue-50 dark:bg-blue-900/20"}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex gap-3 w-full">
                              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                {notification.type === "message" ? (
                                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.createdAt).toLocaleString("it-IT", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                      {notifications.length > 0 && (
                        <div className="p-2 border-t border-border">
                          <Link href="/notifiche" className="text-xs text-blue-600 hover:underline">
                            Vedi tutte le notifiche
                          </Link>
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link href="/messaggi">
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                </>
              )}

              <Link href={session?.user ? "/profile" : "/auth/login"}>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={session?.user?.image || "/placeholder.svg?height=40&width=40&query=user"}
                      alt="Profile"
                    />
                    <AvatarFallback>
                      {session?.user?.name
                        ? session.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar - Mobile Optimized */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca eventi, luoghi, esperienze..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm"
            />
            <Link href="/filtri">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Categories - Mobile Optimized */}
        <div className="px-3 sm:px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              className={`text-xs h-8 px-3 ${
                selectedCategory === "all" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-background"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              Tutti
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={`text-xs h-8 px-3 ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.gradient} text-white`
                    : "bg-background"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-1.5">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="px-3 sm:px-4 py-4">
        {/* Create Event Button - Mobile Optimized */}
        {session?.user && (
          <Link href="/crea-evento">
            <Button
              className="w-full mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crea Nuovo Evento
            </Button>
          </Link>
        )}

        {/* Featured Events - Mobile Optimized */}
        {featuredEvents.length > 0 && !loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                In Evidenza
              </h2>
              <Link href="/filtri" className="text-xs text-blue-600">
                Vedi tutti
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {featuredEvents.map((event) => (
                <Card
                  key={event._id}
                  className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => handleEventClick(event._id)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={event.images[0] || "/placeholder.svg?height=300&width=400&query=event"}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-black/30 backdrop-blur-md hover:bg-black/40 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(event._id)
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.includes(event._id) ? "fill-red-500 text-red-500" : "text-white"
                          }`}
                        />
                      </Button>
                    </div>
                    {event.verified && (
                      <Badge
                        className="absolute top-2 left-2 bg-blue-600/90 hover:bg-blue-700/90 text-white text-xs"
                        variant="secondary"
                      >
                        Verificato
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium">{event.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{formatDate(event.dateStart)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">
                          {event.availableSpots}/{event.totalSpots}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        {event.price}€ <span className="text-xs font-normal text-muted-foreground">/ persona</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Events List - Mobile Optimized */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {searchQuery
              ? "Risultati della ricerca"
              : selectedCategory !== "all"
                ? `${categories.find((c) => c.id === selectedCategory)?.name || "Eventi"}`
                : "Eventi Disponibili"}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-md">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-3">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">Nessun evento trovato</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Prova a modificare i termini di ricerca"
                  : selectedCategory !== "all"
                    ? "Non ci sono eventi in questa categoria"
                    : "Non ci sono eventi disponibili al momento"}
              </p>
              {selectedCategory !== "all" && (
                <Button variant="outline" onClick={() => setSelectedCategory("all")}>
                  Mostra tutti gli eventi
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
              >
                {events.map((event) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleEventClick(event._id)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={event.images[0] || "/placeholder.svg?height=300&width=400&query=event"}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/30 backdrop-blur-md hover:bg-black/40 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(event._id)
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                favorites.includes(event._id) ? "fill-red-500 text-red-500" : "text-white"
                              }`}
                            />
                          </Button>
                        </div>
                        {event.verified && (
                          <Badge
                            className="absolute top-2 left-2 bg-blue-600/90 hover:bg-blue-700/90 text-white text-xs"
                            variant="secondary"
                          >
                            Verificato
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-medium">{event.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{formatDate(event.dateStart)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {event.availableSpots}/{event.totalSpots}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm font-semibold">
                            {event.price}€ <span className="text-xs font-normal text-muted-foreground">/ persona</span>
                          </div>
                          {event.host && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={event.host.image || "/placeholder.svg"} />
                                <AvatarFallback className="text-[8px]">
                                  {event.host.name?.charAt(0) || "H"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{event.host.name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
