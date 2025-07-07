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
  Star,
  Search,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Loader2,
  HeartOff,
  Sparkles,
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
    casa: "bg-green-900/50 text-green-300 border-green-700",
    viaggio: "bg-blue-900/50 text-blue-300 border-blue-700",
    evento: "bg-purple-900/50 text-purple-300 border-purple-700",
    esperienza: "bg-orange-900/50 text-orange-300 border-orange-700",
    festa: "bg-pink-900/50 text-pink-300 border-pink-700",
    musica: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
    sport: "bg-red-900/50 text-red-300 border-red-700",
    arte: "bg-purple-900/50 text-purple-300 border-purple-700",
    cibo: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  }
  return colors[category] || "bg-gray-900/50 text-gray-300 border-gray-700"
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

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })
      if (!response.ok) throw new Error("Errore nella rimozione dai preferiti")
      setEvents((prev) => prev.filter((event) => event._id !== eventId))
      toast.success("Rimosso dai preferiti")
    } catch (error: any) {
      toast.error(error.message || "Errore nella rimozione dai preferiti")
    } finally {
      setRemovingId(null)
    }
  }

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const startFormatted = start.toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    if (!endDate) return startFormatted
    const end = new Date(endDate)
    const endFormatted = end.toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    return `${startFormatted} - ${endFormatted}`
  }

  const getUniqueCategories = () => [...new Set(events.map((event) => event.category))]

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-10 h-10 rounded-full bg-gray-700" />
            <Skeleton className="h-8 w-48 bg-gray-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-gray-800/50 border-gray-700">
                <Skeleton className="w-full h-48 bg-gray-700" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-gray-700" />
                  <Skeleton className="h-3 w-full bg-gray-700" />
                  <Skeleton className="h-3 w-1/2 bg-gray-700" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 pb-20">
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-40">
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-blue-400 hover:bg-gray-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                I Miei Preferiti
              </h1>
              <p className="text-gray-400">
                {events.length} {events.length === 1 ? "evento salvato" : "eventi salvati"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Cerca nei tuoi preferiti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-800/70 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40 border-gray-700 focus:border-blue-500 bg-gray-800/70 text-white">
                    <Filter className="h-4 w-4 mr-2 text-blue-400" />
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
                    <Button variant="outline" className="border-gray-700 hover:bg-gray-800 bg-gray-800/70 text-white">
                      <SortAsc className="h-4 w-4 mr-2 text-blue-400" />
                      Ordina
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("newest")}>Più recenti</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("oldest")}>Meno recenti</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("date")}>Data evento</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price-low")}>Prezzo crescente</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price-high")}>Prezzo decrescente</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("rating")}>Valutazione</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("popular")}>Più popolari</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="border-gray-700 hover:bg-gray-800 bg-gray-800/70"
                >
                  {viewMode === "grid" ? (
                    <List className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Grid3X3 className="h-4 w-4 text-blue-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {filteredEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <HeartOff className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Nessun evento nei preferiti</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Inizia ad esplorare e salva gli eventi che ti interessano!
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8">
                <Sparkles className="h-4 w-4 mr-2" />
                Esplora Eventi
              </Button>
            </Link>
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
                    className={`overflow-hidden bg-gray-800/50 backdrop-blur-md border border-gray-700 shadow-lg hover:shadow-blue-500/10 hover:border-blue-700 transition-all duration-300 group ${
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
                      <div className="absolute top-3 left-3">
                        <Badge className={`text-xs font-medium border ${getCategoryColor(event.category)}`}>
                          {categoryIcons[event.category]} {event.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 bg-gray-900/50 hover:bg-gray-900/80 text-pink-400 hover:text-pink-300 backdrop-blur-sm rounded-full"
                        onClick={() => handleRemoveFromFavorites(event._id)}
                        disabled={removingId === event._id}
                      >
                        {removingId === event._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart className="h-4 w-4 fill-current" />
                        )}
                      </Button>
                      {event.verified && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-green-600 text-white text-xs">✓ Verificato</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className={`p-4 flex flex-col justify-between ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div>
                        <Link href={`/evento/${event._id}`}>
                          <h3 className="font-semibold text-lg line-clamp-2 text-white hover:text-blue-400 transition-colors">
                            {event.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">{event.description}</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4 text-purple-400" />
                          <span>{formatDateRange(event.dateStart, event.dateEnd)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-auto">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-white">{event.rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({event.reviewCount})</span>
                        </div>
                        <div className="text-lg font-bold text-blue-400">
                          {event.price === 0 ? "Gratuito" : `€${event.price}`}
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
