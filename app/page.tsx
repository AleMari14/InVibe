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
    if (!session?.user?.id) return

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
    if (!session?.user?.email) return

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isFavorite) {
          setFavorites((prev) => [...prev, eventId])
        } else {
          setFavorites((prev) => prev.filter((id) => id !== eventId))
        }
      }
    } catch (error) {
      console.error("💥 Error toggling favorite:", error)
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
    <div className="min-h-screen bg-background pb-20">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                InVibe
              </h1>
            </motion.div>

            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {session ? (
                  <>
                    {/* Notifications Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <div className="p-2">
                          <h3 className="font-semibold mb-2">Notifiche</h3>
                          {notifications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nessuna notifica</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {notifications.slice(0, 5).map((notification) => (
                                <DropdownMenuItem
                                  key={notification._id}
                                  className="flex flex-col items-start p-3 cursor-pointer"
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium text-sm">{notification.title}</span>
                                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                                  <span className="text-xs text-muted-foreground mt-1">
                                    {new Date(notification.createdAt).toLocaleDateString("it-IT")}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          )}
                          {notifications.length > 5 && (
                            <Link href="/notifiche">
                              <Button variant="ghost" size="sm" className="w-full mt-2">
                                Vedi tutte
                              </Button>
                            </Link>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/crea-evento">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm px-3 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Crea</span>
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Avatar className="h-8 w-8 ring-2 ring-blue-500 hover:ring-purple-500 transition-all duration-300">
                        <AvatarImage src={session?.user?.image || "/placeholder.svg?height=32&width=32"} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                          {session?.user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </>
                ) : (
                  <Link href="/auth/login">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm px-3 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Accedi
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca case, viaggi, esperienze..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 bg-background/80 backdrop-blur-sm border-border focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-lg"
            />
            <Link href="/filtri">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-blue-500/10"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Categories */}
      <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-background via-card/50 to-background">
        <motion.div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={`whitespace-nowrap text-xs sm:text-sm px-4 py-1 shadow-md ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  : "border-border hover:bg-accent hover:shadow-lg transition-all duration-300"
              }`}
            >
              ✨ Tutti
            </Button>
          </motion.div>
          {categories.map((category) => (
            <motion.div key={category.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap text-xs sm:text-sm px-4 py-1 shadow-md ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.gradient} hover:shadow-lg text-white`
                    : "border-border hover:bg-accent hover:shadow-lg transition-all duration-300"
                }`}
              >
                {category.icon} {category.name}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-3 sm:px-4 py-2">
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <div className="px-3 sm:px-4 py-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold text-foreground">In Evidenza</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="min-w-[240px] cursor-pointer"
                  onClick={() => handleEventClick(event._id)}
                >
                  <Card className="overflow-hidden border-border bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="relative">
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <Image
                          src={event.images?.[0] || "/placeholder.svg?height=200&width=280"}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="280px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs shadow-lg">
                          ⭐ Featured
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="font-bold text-white text-sm line-clamp-2">{event.title}</h3>
                        <p className="text-white/80 text-xs">{event.location}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Events Grid - Ora cliccabile */}
      <div className="px-3 sm:px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <AnimatePresence>
            {loading
              ? // Loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="overflow-hidden border-border h-[360px]">
                      <Skeleton className="aspect-[16/10] w-full" />
                      <CardContent className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              : events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                    onClick={() => handleEventClick(event._id)}
                  >
                    <Card className="overflow-hidden border-border bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-[360px] flex flex-col">
                      <div className="relative">
                        <div className="aspect-[16/10] relative overflow-hidden">
                          <Image
                            src={event.images?.[0] || "/placeholder.svg?height=180&width=320"}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="absolute top-2 left-2 flex gap-1">
                          {event.verified && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs shadow-lg">✓</Badge>
                          )}
                          <Badge className="bg-blue-600/90 backdrop-blur-sm text-white text-xs shadow-lg">
                            {event.availableSpots}/{event.totalSpots}
                          </Badge>
                        </div>

                        {session && (
                          <div className="absolute top-2 right-2">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="bg-background/80 hover:bg-background backdrop-blur-sm h-7 w-7 shadow-lg"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleFavorite(event._id)
                                }}
                              >
                                <Heart
                                  className={`h-4 w-4 transition-colors duration-300 ${
                                    favorites.includes(event._id)
                                      ? "fill-red-500 text-red-500"
                                      : "text-foreground hover:text-red-500"
                                  }`}
                                />
                              </Button>
                            </motion.div>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs ml-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{event.rating || 4.8}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs line-clamp-1">{event.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(event.dateStart)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{event.totalSpots}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {event.amenities?.slice(0, 2).map((amenity) => (
                            <Badge
                              key={amenity}
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              {amenity}
                            </Badge>
                          ))}
                          {event.amenities?.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{event.amenities.length - 2}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-2 mt-auto">
                          <div className="text-xs text-muted-foreground">
                            {event.host && (
                              <span className="line-clamp-1">
                                Da <span className="font-medium text-foreground">{event.host.name}</span>
                                {event.host.verified && <span className="text-green-500 ml-1">✓</span>}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              €{event.price}
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event._id)
                          }}
                        >
                          Vedi Dettagli
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
          </AnimatePresence>
        </div>

        {!loading && events.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nessun evento trovato</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "Non ci sono ancora eventi pubblicati. Sii il primo a crearne uno!"}
            </p>
            <div className="flex gap-2 justify-center">
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                  variant="outline"
                >
                  Azzera filtri
                </Button>
              )}
              {session ? (
                <Link href="/crea-evento">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Crea il primo evento
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Accedi per creare eventi
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border safe-area-pb shadow-2xl">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 min-w-0 group">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Search className="h-5 w-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
            </motion.div>
            <span className="text-xs text-blue-500 font-medium">Cerca</span>
          </Link>
          <Link href="/preferiti" className="flex flex-col items-center p-2 min-w-0 group">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Heart className="h-5 w-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
            </motion.div>
            <span className="text-xs text-muted-foreground">Preferiti</span>
          </Link>
          <Link href="/crea-evento" className="flex flex-col items-center p-2 min-w-0 group">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-1 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </motion.div>
            <span className="text-xs text-muted-foreground">Crea</span>
          </Link>
          <Link href="/prenotazioni" className="flex flex-col items-center p-2 min-w-0 group">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </motion.div>
            <span className="text-xs text-muted-foreground">Prenotazioni</span>
          </Link>
          <Link href="/messaggi" className="flex flex-col items-center p-2 min-w-0 group">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </motion.div>
            <span className="text-xs text-muted-foreground">Messaggi</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
