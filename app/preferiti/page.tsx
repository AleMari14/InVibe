"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Heart,
  MapPin,
  Calendar,
  Users,
  Star,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  Trash2,
  Share2,
  Eye,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

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
  verified: boolean
  host?: {
    name: string
    verified: boolean
  }
  views?: number
  createdAt: string
}

type SortOption = "recent" | "price-low" | "price-high" | "rating" | "date" | "popularity"
type ViewMode = "grid" | "list"

export default function PreferitiPage() {
  const [favorites, setFavorites] = useState<Event[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [error, setError] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (session?.user?.email) {
      fetchFavorites()
    }
  }, [session, status, router])

  useEffect(() => {
    filterAndSortFavorites()
  }, [favorites, searchQuery, sortBy, selectedCategory])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("💖 Fetching favorites...")

      const response = await fetch("/api/favorites")
      console.log("📋 Favorites response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Favorites data received:", data?.length || 0, "favorites")

      if (Array.isArray(data)) {
        setFavorites(data)
      } else {
        console.error("❌ Favorites data is not an array:", typeof data)
        setFavorites([])
        setError("Formato dati non valido ricevuto dal server")
      }
    } catch (error) {
      console.error("💥 Error fetching favorites:", error)
      setError("Errore nel caricamento dei preferiti. Riprova.")
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortFavorites = () => {
    let filtered = [...favorites]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "date":
          return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
        case "popularity":
          return (b.views || 0) - (a.views || 0)
        default:
          return 0
      }
    })

    setFilteredFavorites(filtered)
  }

  const removeFavorite = async (eventId: string) => {
    try {
      setDeletingEvent(eventId)
      console.log("💔 Removing favorite:", eventId)
      const response = await fetch(`/api/favorites?eventId=${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Favorite removed:", result)
        setFavorites((prev) => prev.filter((event) => event._id !== eventId))
        toast.success("Rimosso dai preferiti")
      }
    } catch (error) {
      console.error("💥 Error removing favorite:", error)
      toast.error("Errore nella rimozione")
    } finally {
      setDeletingEvent(null)
      setShowDeleteDialog(false)
      setEventToDelete(null)
    }
  }

  const shareEvent = async (event: Event) => {
    const url = `${window.location.origin}/evento/${event._id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Guarda questo evento: ${event.title}`,
          url: url,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success("Link copiato negli appunti!")
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getUniqueCategories = () => {
    const categories = favorites.map((event) => event.category).filter(Boolean)
    return [...new Set(categories)]
  }

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "recent":
        return "Più recenti"
      case "price-low":
        return "Prezzo crescente"
      case "price-high":
        return "Prezzo decrescente"
      case "rating":
        return "Valutazione"
      case "date":
        return "Data evento"
      case "popularity":
        return "Popolarità"
      default:
        return "Ordina per"
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-pink-200/50 dark:border-gray-700/50 px-4 py-4 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-pink-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                I Miei Preferiti
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredFavorites.length} {filteredFavorites.length === 1 ? "evento" : "eventi"}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca per nome, luogo o categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-pink-200 dark:border-gray-700 focus:border-pink-400 dark:focus:border-purple-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 bg-white/80 dark:bg-gray-800/80 border-pink-200 dark:border-gray-700">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-44 bg-white/80 dark:bg-gray-800/80 border-pink-200 dark:border-gray-700">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Più recenti</SelectItem>
                <SelectItem value="price-low">Prezzo crescente</SelectItem>
                <SelectItem value="price-high">Prezzo decrescente</SelectItem>
                <SelectItem value="rating">Valutazione</SelectItem>
                <SelectItem value="date">Data evento</SelectItem>
                <SelectItem value="popularity">Popolarità</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-white/80 dark:bg-gray-800/80 rounded-lg border border-pink-200 dark:border-gray-700 p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : ""}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10 mb-6">
            <AlertDescription className="text-red-600 dark:text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          // Enhanced Loading skeletons
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              >
                <Skeleton className="aspect-[16/10] w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-16 w-16 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              {searchQuery || selectedCategory !== "all" ? "Nessun risultato" : "Nessun preferito"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory !== "all"
                ? "Prova a modificare i filtri di ricerca per trovare quello che cerchi."
                : "Non hai ancora aggiunto eventi ai preferiti. Inizia a esplorare e salva quelli che ti interessano!"}
            </p>
            <div className="flex gap-3 justify-center">
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                  className="border-pink-200 hover:bg-pink-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
                >
                  Cancella filtri
                </Button>
              )}
              <Button
                asChild
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
              >
                <Link href="/">
                  <Heart className="h-4 w-4 mr-2" />
                  Esplora eventi
                </Link>
              </Button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${sortBy}-${selectedCategory}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`grid gap-6 ${
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 max-w-4xl mx-auto"
              }`}
            >
              {filteredFavorites.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Card
                    className={`overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:scale-[1.02] ${
                      viewMode === "list" ? "flex flex-row" : ""
                    }`}
                  >
                    <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : "aspect-[16/10]"}`}>
                      <Image
                        src={event.images?.[0] || "/placeholder.svg?height=200&width=300"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Enhanced overlay with gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Enhanced badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 shadow-lg">
                          {event.category}
                        </Badge>
                        {event.verified && (
                          <Badge className="bg-green-500 text-white border-0 shadow-lg">✓ Verificato</Badge>
                        )}
                      </div>

                      {/* Enhanced action buttons */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                          onClick={(e) => {
                            e.preventDefault()
                            shareEvent(event)
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-red-500/90 hover:bg-red-600 text-white shadow-lg"
                          onClick={(e) => {
                            e.preventDefault()
                            setEventToDelete(event._id)
                            setShowDeleteDialog(true)
                          }}
                          disabled={deletingEvent === event._id}
                        >
                          {deletingEvent === event._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Price badge */}
                      <div className="absolute bottom-3 right-3">
                        <Badge className="bg-white/95 text-gray-900 font-bold shadow-lg">
                          {event.price === 0 ? "Gratuito" : `€${event.price}`}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className={`p-4 flex-1 ${viewMode === "list" ? "flex flex-col justify-between" : ""}`}>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.dateStart)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(event.dateStart)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {event.availableSpots}/{event.totalSpots}
                              </span>
                            </div>
                            {event.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{event.rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({event.reviewCount})</span>
                              </div>
                            )}
                          </div>
                          {event.views && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              <span className="text-xs">{event.views}</span>
                            </div>
                          )}
                        </div>

                        {event.amenities && event.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.amenities.slice(0, 3).map((amenity, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-purple-200 text-purple-700">
                                {amenity}
                              </Badge>
                            ))}
                            {event.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                                +{event.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {event.host && (
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {event.host.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {event.host.name}
                              {event.host.verified && <span className="text-green-500 ml-1">✓</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      <Link href={`/evento/${event._id}`} className="block mt-4">
                        <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg">
                          Visualizza dettagli
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Rimuovi dai preferiti
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler rimuovere questo evento dai tuoi preferiti? Potrai sempre aggiungerlo di nuovo in
              seguito.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1"
              disabled={deletingEvent !== null}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => eventToDelete && removeFavorite(eventToDelete)}
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={deletingEvent !== null}
            >
              {deletingEvent ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rimozione...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Rimuovi
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
