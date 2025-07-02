"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import {
  ArrowLeft,
  Heart,
  Search,
  Grid3X3,
  List,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Share2,
  Trash2,
  Eye,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

interface FavoriteEvent {
  _id: string
  eventId: string
  title: string
  description: string
  date: string
  time: string
  location: {
    address: string
    city: string
  }
  price: number
  maxGuests: number
  currentGuests: number
  category: string
  tags?: string[]
  images?: string[]
  host: {
    name: string
    email: string
    image?: string
    verified?: boolean
  }
  verified?: boolean
  views?: number
  favorites?: number
  rating?: number
  totalReviews?: number
  amenities?: string[]
}

type ViewMode = "grid" | "list"
type SortOption = "date" | "price-asc" | "price-desc" | "rating" | "popularity" | "recent"

const categories = ["Tutti", "Feste", "Concerti", "Sport", "Arte", "Cibo", "Tecnologia", "Business", "Altro"]

export default function PreferitiPage() {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tutti")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  useEffect(() => {
    if (session?.user?.email) {
      fetchFavorites()
    }
  }, [session])

  useEffect(() => {
    filterAndSortFavorites()
  }, [favorites, searchQuery, selectedCategory, sortBy])

  const fetchFavorites = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/favorites")
      if (!response.ok) throw new Error("Errore nel caricamento dei preferiti")

      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
      toast.error("Errore nel caricamento dei preferiti")
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortFavorites = () => {
    let filtered = [...favorites]

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.host.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "Tutti") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "popularity":
          return (b.views || 0) - (a.views || 0)
        case "recent":
          return new Date(b._id).getTime() - new Date(a._id).getTime()
        default:
          return 0
      }
    })

    setFilteredFavorites(filtered)
  }

  const removeFavorite = async (eventId: string) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.eventId !== eventId))
        toast.success("Rimosso dai preferiti")
      } else {
        throw new Error("Errore nella rimozione")
      }
    } catch (error) {
      toast.error("Errore nella rimozione dai preferiti")
    }
  }

  const shareEvent = async (event: FavoriteEvent) => {
    const url = `${window.location.origin}/evento/${event.eventId}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url,
        })
      } catch (error) {
        navigator.clipboard.writeText(url)
        toast.success("Link copiato negli appunti!")
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success("Link copiato negli appunti!")
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("Tutti")
    setSortBy("date")
  }

  const hasActiveFilters = searchQuery.trim() || selectedCategory !== "Tutti" || sortBy !== "date"

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Accesso richiesto</h1>
          <p className="text-muted-foreground mb-4">Devi essere loggato per vedere i tuoi preferiti.</p>
          <Link href="/auth/login">
            <Button>Accedi</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 pb-20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                I miei preferiti
              </h1>
              <Badge className="bg-red-500 text-white">{favorites.length}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca nei tuoi preferiti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <ScrollArea className="flex-1">
            <div className="flex gap-2 pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Sort and View Controls */}
        <div className="flex items-center justify-between">
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data evento</SelectItem>
              <SelectItem value="price-asc">Prezzo crescente</SelectItem>
              <SelectItem value="price-desc">Prezzo decrescente</SelectItem>
              <SelectItem value="rating">Valutazione</SelectItem>
              <SelectItem value="popularity">Popolarità</SelectItem>
              <SelectItem value="recent">Aggiunti di recente</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Cancella filtri
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredFavorites.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-6 text-red-200" />
            {favorites.length === 0 ? (
              <>
                <h2 className="text-2xl font-bold mb-4">Nessun preferito ancora</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Inizia ad esplorare gli eventi e aggiungi quelli che ti interessano ai tuoi preferiti!
                </p>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                    Esplora eventi
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">Nessun risultato</h2>
                <p className="text-muted-foreground mb-6">
                  Non abbiamo trovato eventi che corrispondono ai tuoi criteri di ricerca.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Cancella tutti i filtri
                  </Button>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
          >
            <AnimatePresence>
              {filteredFavorites.map((event, index) => (
                <motion.div
                  key={event.eventId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  {viewMode === "grid" ? (
                    <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="relative h-48">
                        <Image
                          src={event.images?.[0] || "/placeholder.svg?height=200&width=400"}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-white/90 text-black">{event.category}</Badge>
                          {event.verified && <Badge className="bg-green-500 text-white">Verificato</Badge>}
                        </div>

                        {/* Actions */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.preventDefault()
                              shareEvent(event)
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <ConfirmDialog
                            title="Rimuovi dai preferiti"
                            description="Sei sicuro di voler rimuovere questo evento dai tuoi preferiti?"
                            onConfirm={() => removeFavorite(event.eventId)}
                            variant="destructive"
                          >
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 bg-white/90 hover:bg-white"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmDialog>
                        </div>

                        {/* Price */}
                        <div className="absolute bottom-3 right-3">
                          <Badge className="bg-blue-500 text-white font-bold">€{event.price}</Badge>
                        </div>
                      </div>

                      <Link href={`/evento/${event.eventId}`}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>

                          <div className="space-y-2 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span>{format(new Date(event.date), "d MMM yyyy", { locale: it })}</span>
                              <Clock className="h-4 w-4 text-green-500 ml-2" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              <span className="truncate">{event.location.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-500" />
                              <span>
                                {event.currentGuests}/{event.maxGuests} partecipanti
                              </span>
                            </div>
                          </div>

                          {/* Host */}
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={event.host.image || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {event.host.name?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground truncate">{event.host.name || "Host"}</span>
                            {event.host.verified && <Badge className="bg-blue-500 text-white text-xs">✓</Badge>}
                          </div>

                          {/* Rating and Stats */}
                          <div className="flex items-center justify-between text-sm">
                            {event.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{event.rating.toFixed(1)}</span>
                                {event.totalReviews && (
                                  <span className="text-muted-foreground">({event.totalReviews})</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-muted-foreground">
                              {event.views && (
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{event.views}</span>
                                </div>
                              )}
                              {event.favorites && (
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{event.favorites}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Amenities Preview */}
                          {event.amenities && event.amenities.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {event.amenities.slice(0, 3).map((amenity, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {event.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{event.amenities.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Link>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link href={`/evento/${event.eventId}`}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={event.images?.[0] || "/placeholder.svg?height=100&width=100"}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                                  {event.title}
                                </h3>
                                <div className="flex items-center gap-2 ml-2">
                                  <Badge className="bg-blue-500 text-white">€{event.price}</Badge>
                                  <ConfirmDialog
                                    title="Rimuovi dai preferiti"
                                    description="Sei sicuro di voler rimuovere questo evento dai tuoi preferiti?"
                                    onConfirm={() => removeFavorite(event.eventId)}
                                    variant="destructive"
                                  >
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </ConfirmDialog>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-blue-500" />
                                  <span>{format(new Date(event.date), "d MMM", { locale: it })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-green-500" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-red-500" />
                                  <span className="truncate">{event.location.city}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-purple-500" />
                                  <span>
                                    {event.currentGuests}/{event.maxGuests}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={event.host.image || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs">
                                      {event.host.name?.charAt(0)?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-muted-foreground">{event.host.name || "Host"}</span>
                                </div>

                                {event.rating && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{event.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
