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
  Menu,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
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
    _id?: string
    name: string
    email: string
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
  const [refreshing, setRefreshing] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
    if (session?.user?.email) {
      fetchFavorites()
      fetchUserProfile()
    }
  }, [selectedCategory, searchQuery, session])

  const fetchUserProfile = async () => {
    if (!session?.user?.email) return

    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const userData = await response.json()
        if (userData.image) {
          setUserProfileImage(userData.image)
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

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
        // Set featured events (eventi con rating alto o molte visualizzazioni)
        const featured = data.filter((event: Event) => event.rating >= 4.7 || event.views > 30).slice(0, 3)
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
      setRefreshing(false)
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

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-3">
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
                  <Link href="/messaggi">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          userProfileImage || session.user?.image || "/placeholder.svg?height=32&width=32&query=user"
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {session.user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
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

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca eventi, luoghi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 h-10 text-sm"
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

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              className={`text-xs h-8 px-3 whitespace-nowrap ${
                selectedCategory === "all" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : ""
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
                className={`text-xs h-8 px-3 whitespace-nowrap ${
                  selectedCategory === category.id ? `bg-gradient-to-r ${category.gradient} text-white` : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-20">
        {/* Create Event CTA - Migliorato */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link href="/crea-evento">
              <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                {/* Background gradient animato */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity" />

                {/* Pattern decorativo */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12" />
                  <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full -translate-x-8 -translate-y-8" />
                </div>

                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-yellow-300" />
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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-xs">
            {refreshing ? "Aggiornamento..." : "Aggiorna"}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Featured Events */}
        {featuredEvents.length > 0 && !loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                In Evidenza
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="min-w-[280px] cursor-pointer"
                  onClick={() => handleEventClick(event._id)}
                >
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={event.images[0] || "/placeholder.svg?height=200&width=280&query=featured-event"}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="280px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-orange-500 text-white text-xs">⭐ Featured</Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/30 backdrop-blur-sm hover:bg-black/40 rounded-full"
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
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{event.title}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-white/80 text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location.split(",")[0]}
                          </p>
                          <div className="text-white font-semibold text-sm">€{event.price}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {searchQuery
              ? "Risultati della ricerca"
              : selectedCategory !== "all"
                ? `${categories.find((c) => c.id === selectedCategory)?.name || "Eventi"}`
                : "Eventi Disponibili"}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-md">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-3">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nessun evento trovato</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Prova a modificare i termini di ricerca"
                  : selectedCategory !== "all"
                    ? "Non ci sono eventi in questa categoria"
                    : "Non ci sono eventi disponibili al momento"}
              </p>
              {session ? (
                <Link href="/crea-evento">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    Crea il primo evento
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    Accedi per creare eventi
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleEventClick(event._id)}
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={event.images[0] || "/placeholder.svg?height=300&width=400&query=event"}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/30 backdrop-blur-sm hover:bg-black/40 rounded-full"
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
                          <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">✓ Verificato</Badge>
                        )}
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-600/90 text-white text-xs">
                              {event.availableSpots}/{event.totalSpots} posti
                            </Badge>
                            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded px-2 py-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-white text-xs font-medium">{event.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{event.title}</h3>

                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(event.dateStart)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{event.totalSpots} persone</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-blue-600">
                            €{event.price}
                            <span className="text-xs font-normal text-muted-foreground ml-1">/ persona</span>
                          </div>
                          {event.host && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={event.host.image || "/placeholder.svg?height=20&width=20&query=host"}
                                />
                                <AvatarFallback className="text-[8px]">
                                  {event.host.name?.charAt(0) || "H"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                {event.host.name}
                              </span>
                              {event.host.verified && <span className="text-green-500 text-xs">✓</span>}
                            </div>
                          )}
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
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center -mt-6 shadow-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">Crea</span>
          </Link>

          <Link href="/messaggi" className="flex flex-col items-center p-2 min-w-0">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Messaggi</span>
          </Link>

          <Link href={session ? "/profile" : "/auth/login"} className="flex flex-col items-center p-2 min-w-0">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Profilo</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
