"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Heart,
  MapPin,
  Calendar,
  Users,
  Star,
  Euro,
  Search,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Loader2,
  HeartOff,
  Sparkles,
  TrendingUp,
  Clock,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  views: number
  verified: boolean
  hostName?: string
  createdAt: string
}

const categoryIcons: Record<string, string> = {
  casa: "🏠",
  viaggio: "✈️",
  evento: "🎉",
  esperienza: "🌟",
  festa: "🎊",
  musica: "🎵",
  sport: "⚽",
  arte: "🎨",
  cibo: "🍽️",
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    casa: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200",
    viaggio: "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 border-blue-200",
    evento: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200",
    esperienza: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200",
    festa: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200",
    musica: "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200",
    sport: "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200",
    arte: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200",
    cibo: "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200",
  }
  return colors[category] || "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200"
}

export default function PreferitiPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [removingId, setRemovingId] = useState<string | null>(null)

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchFavorites()
    }
  }, [status, router])

  useEffect(() => {
    filterAndSortEvents()
  }, [events, searchQuery, selectedCategory, sortBy])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/favorites")

      if (!response.ok) {
        throw new Error("Errore nel caricamento dei preferiti")
      }

      const data = await response.json()
      setEvents(data.favorites || [])
    } catch (error: any) {
      console.error("Error fetching favorites:", error)
      toast.error(error.message || "Errore nel caricamento dei preferiti")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortEvents = () => {
    let filtered = [...events]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        case "popular":
          return b.views - a.views
        case "date":
          return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
        default:
          return 0
      }
    })

    setFilteredEvents(filtered)
  }

  const handleRemoveFromFavorites = async (eventId: string) => {
    try {
      setRemovingId(eventId)

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) {
        throw new Error("Errore nella rimozione dai preferiti")
      }

      // Remove from local state
      setEvents((prev) => prev.filter((event) => event._id !== eventId))
      toast.success("Rimosso dai preferiti")
    } catch (error: any) {
      console.error("Error removing from favorites:", error)
      toast.error(error.message || "Errore nella rimozione dai preferiti")
    } finally {
      setRemovingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
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

  const getUniqueCategories = () => {
    const categories = events.map((event) => event.category)
    return [...new Set(categories)]
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-200/50">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-pink-600 hover:bg-pink-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                I Miei Preferiti
              </h1>
              <p className="text-pink-600/70">
                {events.length} {events.length === 1 ? "evento salvato" : "eventi salvati"}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
                <Input
                  placeholder="Cerca nei tuoi preferiti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400/20 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40 border-pink-200 focus:border-pink-400 bg-white/70 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2 text-pink-500" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    {getUniqueCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryIcons[category]} {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-pink-200 hover:bg-pink-50 bg-white/70 backdrop-blur-sm">
                      <SortAsc className="h-4 w-4 mr-2 text-pink-500" />
                      Ordina
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("newest")}>
                      <Clock className="h-4 w-4 mr-2" />
                      Più recenti
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                      <Clock className="h-4 w-4 mr-2" />
                      Meno recenti
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("date")}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Data evento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price-low")}>
                      <Euro className="h-4 w-4 mr-2" />
                      Prezzo crescente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price-high")}>
                      <Euro className="h-4 w-4 mr-2" />
                      Prezzo decrescente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("rating")}>
                      <Star className="h-4 w-4 mr-2" />
                      Valutazione
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("popular")}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Più popolari
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="border-pink-200 hover:bg-pink-50 bg-white/70 backdrop-blur-sm"
                >
                  {viewMode === "grid" ? (
                    <List className="h-4 w-4 text-pink-500" />
                  ) : (
                    <Grid3X3 className="h-4 w-4 text-pink-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedCategory !== "all") && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200">
                    Ricerca: "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="ml-2 hover:text-pink-900">
                      ×
                    </button>
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                    {categoryIcons[selectedCategory]} {selectedCategory}
                    <button onClick={() => setSelectedCategory("all")} className="ml-2 hover:text-purple-900">
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-pink-600/70">
            {filteredEvents.length === 0
              ? "Nessun evento trovato"
              : `${filteredEvents.length} ${filteredEvents.length === 1 ? "evento trovato" : "eventi trovati"}`}
          </p>
        </div>

        {/* Events Grid/List */}
        {filteredEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchQuery || selectedCategory !== "all" ? (
                <Search className="h-10 w-10 text-pink-500" />
              ) : (
                <HeartOff className="h-10 w-10 text-pink-500" />
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2 text-pink-800">
              {searchQuery || selectedCategory !== "all" ? "Nessun risultato trovato" : "Nessun evento nei preferiti"}
            </h3>
            <p className="text-pink-600/70 mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory !== "all"
                ? "Prova a modificare i filtri di ricerca per trovare quello che stai cercando."
                : "Inizia ad esplorare gli eventi e salva quelli che ti interessano di più!"}
            </p>
            {!searchQuery && selectedCategory === "all" && (
              <Link href="/">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Esplora Eventi
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            <AnimatePresence>
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className={`overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : "h-48"}`}>
                      <Link href={`/evento/${event._id}`}>
                        <Image
                          src={
                            getEventImageUrl(event.images?.[0], viewMode === "list" ? 192 : 400, 192) ||
                            "/placeholder.svg"
                          }
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes={
                            viewMode === "list" ? "192px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          }
                        />
                      </Link>

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className={`text-xs font-medium ${getCategoryColor(event.category)}`}>
                          {categoryIcons[event.category]} {event.category}
                        </Badge>
                      </div>

                      {/* Favorite Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 bg-white/80 hover:bg-white text-pink-500 hover:text-pink-600 backdrop-blur-sm"
                        onClick={() => handleRemoveFromFavorites(event._id)}
                        disabled={removingId === event._id}
                      >
                        {removingId === event._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart className="h-4 w-4 fill-current" />
                        )}
                      </Button>

                      {/* Verified Badge */}
                      {event.verified && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-green-500 text-white text-xs">✓ Verificato</Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="space-y-3">
                        <div>
                          <Link href={`/evento/${event._id}`}>
                            <h3 className="font-semibold text-lg line-clamp-2 hover:text-pink-600 transition-colors">
                              {event.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-pink-500" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span>{formatDateRange(event.dateStart, event.dateEnd)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>
                              {event.availableSpots}/{event.totalSpots} posti disponibili
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            {event.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{event.rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({event.reviewCount})</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              <span>{event.views}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-pink-600">
                              {event.price === 0 ? "Gratuito" : `€${event.price}`}
                            </div>
                            {event.price > 0 && <div className="text-xs text-muted-foreground">per persona</div>}
                          </div>
                        </div>
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
  )
}
