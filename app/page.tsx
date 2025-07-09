"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
  Menu,
  Zap,
  Compass,
  X,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getEventImageUrl } from "@/lib/image-utils"
import { Slider } from "@/components/ui/slider"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationsSheet } from "@/components/notifications-sheet"

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
  host?: {
    _id?: string
    name: string
    image?: string
    verified: boolean
  }
  verified: boolean
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [favorites, setFavorites] = useState<string[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [error, setError] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchRadius, setSearchRadius] = useState(50) // Default 50km
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { unreadCount } = useNotifications()

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (searchQuery) params.append("search", searchQuery)
      if (userLocation) {
        params.append("lat", userLocation.lat.toString())
        params.append("lng", userLocation.lng.toString())
        params.append("radius", searchRadius.toString())
      }

      const response = await fetch(`/api/events?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      const data = responseData.events

      if (Array.isArray(data)) {
        setEvents(data)
        const featured = [...data]
          .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
          .slice(0, 5)
        setFeaturedEvents(featured)
      } else {
        setEvents([])
        setFeaturedEvents([])
        setError("Formato dati non valido ricevuto dal server")
      }
    } catch (error: any) {
      setError(error.message || "Errore nel caricamento degli eventi. Riprova.")
      setEvents([])
      setFeaturedEvents([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, userLocation, searchRadius])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (session?.user?.email) {
      fetchFavorites()
    }
  }, [session])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      toast.info("Accesso alla tua posizione...")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          toast.success("Posizione trovata! Verranno mostrati gli eventi vicino a te.")
        },
        () => {
          toast.error("Impossibile accedere alla posizione. Controlla i permessi del browser.")
        },
      )
    } else {
      toast.error("La geolocalizzazione non è supportata da questo browser.")
    }
  }

  const clearLocationFilter = () => {
    setUserLocation(null)
    toast.info("Filtro di posizione rimosso.")
  }

  const fetchFavorites = async () => {
    if (!session?.user?.email) return
    try {
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setFavorites(data.map((event: Event) => event._id))
        }
      }
    } catch (error) {
      console.error("💥 Error fetching favorites:", error)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation()
    if (!session?.user?.email) {
      toast.error("Devi essere loggato per aggiungere ai preferiti")
      router.push("/auth/login")
      return
    }

    const isCurrentlyFavorite = favorites.includes(eventId)
    // Optimistic update
    if (isCurrentlyFavorite) {
      setFavorites((prev) => prev.filter((id) => id !== eventId))
      toast.success("Rimosso dai preferiti")
    } else {
      setFavorites((prev) => [...prev, eventId])
      toast.success("Aggiunto ai preferiti")
    }

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) {
        // Revert optimistic update on failure
        if (isCurrentlyFavorite) {
          setFavorites((prev) => [...prev, eventId])
        } else {
          setFavorites((prev) => prev.filter((id) => id !== eventId))
        }
        toast.error("Errore nell'aggiornamento dei preferiti")
      }
    } catch (error) {
      console.error("💥 Error toggling favorite:", error)
      toast.error("Errore nell'aggiornamento dei preferiti")
    }
  }

  const handleEventClick = (eventId: string) => {
    router.push(`/evento/${eventId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })
  }

  const MobileMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold">InVibe</h2>
          </div>

          <nav className="flex-1 space-y-2">
            <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
              <Search className="h-5 w-5" />
              <span>Esplora</span>
            </Link>
            <Link href="/preferiti" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
              <Heart className="h-5 w-5" />
              <span>Preferiti</span>
            </Link>
            <Link href="/messaggi" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
              <MessageSquare className="h-5 w-5" />
              <span>Messaggi</span>
            </Link>
            <Link href="/prenotazioni" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
              <Calendar className="h-5 w-5" />
              <span>Prenotazioni</span>
            </Link>
            {session ? (
              <>
                <Link href="/crea-evento" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
                  <Plus className="h-5 w-5" />
                  <span>Crea Evento</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
                  <Users className="h-5 w-5" />
                  <span>Profilo</span>
                </Link>
              </>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent">
                <Users className="h-5 w-5" />
                <span>Accedi</span>
              </Link>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MobileMenu />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  InVibe
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => setIsSheetOpen(true)}>
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                  <NotificationsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
                  <Link href="/profile">
                    <OptimizedAvatar
                      src={session.user?.image}
                      alt={session.user?.name || ""}
                      size={32}
                      className="h-8 w-8 ring-2 ring-blue-200 hover:ring-blue-300 transition-all cursor-pointer"
                    />
                  </Link>
                </>
              ) : (
                <Link href="/auth/login">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    Accedi
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <Input
                placeholder="Cerca eventi, luoghi, esperienze..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-20 h-12 text-sm bg-white/90 backdrop-blur-sm border-2 border-white/30 focus:border-blue-300 focus:bg-white rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 placeholder:text-gray-400"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Link href="/filtri">
                  <Button
                    size="sm"
                    className="h-8 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xs font-medium"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Filtri
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                className={`text-xs h-9 px-4 whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-500 text-white shadow-lg"
                    : "hover:bg-blue-50 hover:text-blue-600"
                }`}
                onClick={() => setSelectedCategory("all")}
              >
                Tutti
              </Button>
            </motion.div>
            {categories.map((category) => (
              <motion.div key={category.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  className={`text-xs h-9 px-4 whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg`
                      : "hover:bg-blue-50 hover:text-blue-600"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        {/* Location Search */}
        <Card className="mb-6 bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-200">Eventi Vicino a Te</h3>
              <p className="text-sm text-gray-400">
                {userLocation ? `Ricerca attiva entro ${searchRadius} km` : "Attiva la ricerca per posizione"}
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full h-12 w-12 transition-colors ${
                    userLocation ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-gray-600"
                  }`}
                >
                  <Compass className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-800 border-gray-700 text-white">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Ricerca per Posizione</h4>
                    <p className="text-sm text-gray-400">
                      Trova eventi nel raggio che preferisci dalla tua posizione attuale.
                    </p>
                  </div>
                  <Button onClick={getUserLocation} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Compass className="mr-2 h-4 w-4" />
                    Usa la mia posizione
                  </Button>
                  {userLocation && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="radius" className="text-gray-300">
                            Raggio di ricerca
                          </Label>
                          <span className="text-sm font-medium text-blue-400">{searchRadius} km</span>
                        </div>
                        <Slider
                          id="radius"
                          defaultValue={[searchRadius]}
                          max={200}
                          step={10}
                          onValueChange={(value) => setSearchRadius(value[0])}
                        />
                      </div>
                      <Button onClick={clearLocationFilter} variant="destructive" className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        Rimuovi filtro posizione
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Welcome Banner for Non-Logged Users */}
        {!session && status !== "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 opacity-20">
                <motion.div
                  className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full"
                  animate={{
                    x: [-64, -48, -64],
                    y: [-64, -48, -64],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full"
                  animate={{
                    x: [48, 32, 48],
                    y: [48, 32, 48],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>

              <CardContent className="relative p-6 text-white">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    className="inline-block mb-3"
                  >
                    <Sparkles className="h-8 w-8 text-yellow-300" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">Benvenuto su InVibe!</h2>
                  <p className="text-white/90 text-sm mb-4 max-w-md mx-auto">
                    Scopri eventi incredibili, incontra persone fantastiche e vivi esperienze uniche nella tua città
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/auth/login">
                      <Button className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-6">
                        Accedi Ora
                      </Button>
                    </Link>
                    <Link href="/auth/registrati">
                      <Button
                        variant="outline"
                        className="border-white text-white hover:bg-white/10 px-6 bg-transparent"
                      >
                        Registrati Gratis
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Create Event CTA - Solo per utenti loggati */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link href="/crea-evento">
              <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity" />

                <div className="absolute inset-0 opacity-10">
                  <motion.div
                    className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full"
                    animate={{
                      x: [-64, -48, -64],
                      y: [-64, -48, -64],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full"
                    animate={{
                      x: [48, 32, 48],
                      y: [48, 32, 48],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  />
                </div>

                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                          <Zap className="h-5 w-5 text-yellow-300" />
                        </motion.div>
                        <h3 className="text-lg font-bold text-white">Crea il tuo evento</h3>
                      </div>
                      <p className="text-white/90 text-sm mb-3">
                        Condividi esperienze uniche e incontra persone fantastiche
                      </p>
                      <div className="flex items-center gap-4 text-white/80 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Trova compagni
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Crea ricordi
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          Dividi i costi
                        </span>
                      </div>
                    </div>

                    <motion.div className="ml-4" whileHover={{ scale: 1.1, rotate: 90 }} transition={{ duration: 0.3 }}>
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Plus className="h-7 w-7 text-white" />
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Pull to Refresh */}
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={loading}
            className="text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Aggiornamento...
              </>
            ) : (
              "Aggiorna"
            )}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Featured Events */}
        {featuredEvents.length > 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              In Evidenza Vicino a Te
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="min-w-[280px] sm:min-w-[300px] cursor-pointer"
                  onClick={() => handleEventClick(event._id)}
                >
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={getEventImageUrl(event.images?.[0], event.category, 300, 225) || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="300px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/30 backdrop-blur-sm hover:bg-black/40 rounded-full"
                          onClick={(e) => toggleFavorite(e, event._id)}
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              favorites.includes(event._id) ? "fill-red-500 text-red-500" : "text-white"
                            }`}
                          />
                        </Button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-white text-sm line-clamp-2 mb-2">{event.title}</h3>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Events Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Eventi Disponibili</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-md">
                  <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">Nessun evento trovato</h3>
              <p className="text-muted-foreground mb-6">
                Prova ad allargare il raggio di ricerca o a cambiare categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col"
                      onClick={() => handleEventClick(event._id)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={getEventImageUrl(event.images?.[0], event.category, 400, 300) || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/30 backdrop-blur-sm hover:bg-black/40 rounded-full"
                            onClick={(e) => toggleFavorite(e, event._id)}
                          >
                            <Heart
                              className={`h-4 w-4 transition-all ${
                                favorites.includes(event._id) ? "fill-red-500 text-red-500" : "text-white"
                              }`}
                            />
                          </Button>
                        </div>
                        <Badge className="absolute top-3 left-3 bg-black/50 text-white">{event.category}</Badge>
                      </div>
                      <CardContent className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <MapPin className="h-3 w-3 text-blue-400" />
                            <span>{event.location.split(",")[0]}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Users className="h-3 w-3 text-purple-400" />
                            <span>
                              {event.availableSpots}/{event.totalSpots}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-green-400">
                            {event.price > 0 ? `€${event.price}` : "Gratis"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          <Link href="/" className="flex flex-col items-center p-2 min-w-0">
            <div className="relative">
              <Search className="h-5 w-5 text-blue-600" />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
            </div>
            <span className="text-[10px] text-blue-600 font-medium">Home</span>
          </Link>

          <Link href="/preferiti" className="flex flex-col items-center p-2 min-w-0">
            <Heart className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Preferiti</span>
          </Link>

          <Link href={session ? "/crea-evento" : "/auth/login"} className="flex flex-col items-center p-2 min-w-0">
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Crea</span>
          </Link>

          <Link href="/messaggi" className="flex flex-col items-center p-2 min-w-0">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Messaggi</span>
          </Link>

          <Link href={session ? "/profile" : "/auth/login"} className="flex flex-col items-center p-2 min-w-0">
            {session ? (
              <OptimizedAvatar src={session.user?.image} alt={session.user?.name || ""} size={20} className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground">Profilo</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
