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
  MapPin,
  Users,
  Star,
  Share2,
  Trash2,
  Eye,
  Loader2,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { getEventImageUrl } from "@/lib/image-utils"

interface FavoriteEvent {
  _id: string
  title: string
  description: string
  dateStart: string
  location: string
  price: number
  totalSpots: number
  availableSpots: number
  category: string
  images: string[]
  host: {
    name: string
    email: string
    image?: string
    verified?: boolean
  }
  amenities?: string[]
  views?: number
  likes?: number
  rating?: number
  reviewCount?: number
}

const categoryIcons: Record<string, string> = {
  casa: "🏠",
  viaggio: "✈️",
  evento: "🎉",
  esperienza: "🌟",
}

const categories = ["Tutti", "casa", "viaggio", "evento", "esperienza"]

const sortOptions = [
  { value: "date", label: "Data" },
  { value: "price", label: "Prezzo" },
  { value: "rating", label: "Rating" },
  { value: "popularity", label: "Popolarità" },
  { value: "recent", label: "Aggiunti di recente" },
  { value: "alphabetical", label: "Alfabetico" },
]

export default function PreferitiPage() {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tutti")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToRemove, setEventToRemove] = useState<string | null>(null)

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
      setFavorites(data || [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
      toast.error("Errore nel caricamento dei preferiti")
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortFavorites = () => {
    let filtered = [...favorites]

    // Filtro per ricerca
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.host.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filtro per categoria
    if (selectedCategory !== "Tutti") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Ordinamento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
        case "price":
          return a.price - b.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "popularity":
          return (b.views || 0) - (a.views || 0)
        case "alphabetical":
          return a.title.localeCompare(b.title)
        case "recent":
        default:
          return b._id.localeCompare(a._id)
      }
    })

    setFilteredFavorites(filtered)
  }

  const removeFavorite = async (eventId: string) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) throw new Error("Errore nella rimozione dai preferiti")

      setFavorites((prev) => prev.filter((event) => event._id !== eventId))
      toast.success("Evento rimosso dai preferiti")
    } catch (error) {
      console.error("Error removing favorite:", error)
      toast.error("Errore nella rimozione dai preferiti")
    }
  }

  const shareEvent = async (event: FavoriteEvent) => {
    const shareData = {
      title: event.title,
      text: event.description,
      url: `${window.location.origin}/evento/${event._id}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("Condivisione annullata")
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
      toast.success("Link copiato negli appunti!")
    }
  }

  const handleRemoveClick = (eventId: string) => {
    setEventToRemove(eventId)
    setDeleteDialogOpen(true)
  }

  const confirmRemove = () => {
    if (eventToRemove) {
      removeFavorite(eventToRemove)
      setEventToRemove(null)
    }
    setDeleteDialogOpen(false)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("Tutti")
    setSortBy("recent")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "d MMM yyyy", { locale: it })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-pink-600 font-medium">Caricamento preferiti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-md border-b border-pink-200/50 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-pink-100/50 text-pink-600">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                I Miei Preferiti
              </h1>
              <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg">
                {favorites.length}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid"
                  ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg hover:from-pink-600 hover:to-red-600"
                  : "hover:bg-pink-100/50 border-pink-200"
              }
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg hover:from-pink-600 hover:to-red-600"
                  : "hover:bg-pink-100/50 border-pink-200"
              }
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtri con stile gradiente */}
        <div className="space-y-3">
          {/* Ricerca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
            <Input
              placeholder="Cerca nei preferiti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/70 backdrop-blur-sm"
            />
          </div>

          {/* Filtri avanzati */}
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 border-pink-200 focus:border-pink-400 bg-white/70 backdrop-blur-sm">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="hover:bg-pink-50">
                    <div className="flex items-center gap-2">
                      {category !== "Tutti" && <span>{categoryIcons[category] || "🎉"}</span>}
                      {category}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 border-pink-200 focus:border-pink-400 bg-white/70 backdrop-blur-sm">
                <SelectValue placeholder="Ordina per" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-pink-50">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || selectedCategory !== "Tutti" || sortBy !== "recent") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-pink-200 hover:bg-pink-100/50 bg-white/70 backdrop-blur-sm text-pink-600"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Cancella filtri
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {filteredFavorites.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Heart className="h-12 w-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
              {favorites.length === 0 ? "Nessun preferito ancora" : "Nessun risultato"}
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {favorites.length === 0
                ? "Inizia ad aggiungere eventi ai tuoi preferiti per vederli qui. Tocca il cuore sugli eventi che ti interessano!"
                : "Prova a modificare i filtri di ricerca per trovare quello che stai cercando"}
            </p>
            {favorites.length === 0 ? (
              <Button
                asChild
                className="bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 shadow-lg px-8 py-3"
              >
                <Link href="/">
                  <Heart className="h-4 w-4 mr-2" />
                  Esplora Eventi
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-pink-200 hover:bg-pink-100/50 bg-white/70 backdrop-blur-sm text-pink-600"
              >
                Cancella filtri
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence>
              {filteredFavorites.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {viewMode === "grid" ? (
                    <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={getEventImageUrl(event.images?.[0], 400, 200) || "/placeholder.svg?height=200&width=400"}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                            {categoryIcons[event.category]} {event.category}
                          </Badge>
                          {event.host.verified && (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                              ✓ Verificato
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm rounded-full shadow-lg"
                            onClick={(e) => {
                              e.preventDefault()
                              shareEvent(event)
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-white/20 hover:bg-red-500/80 text-white backdrop-blur-sm rounded-full shadow-lg transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              handleRemoveClick(event._id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="absolute bottom-3 right-3">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg">
                            {event.price === 0 ? "Gratuito" : `€${event.price}`}
                          </Badge>
                        </div>
                      </div>

                      <Link href={`/evento/${event._id}`}>
                        <CardContent className="p-5">
                          <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-pink-600 transition-colors">
                            {event.title}
                          </h3>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-pink-500" />
                              {formatDate(event.dateStart)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-pink-500" />
                              <span className="truncate">{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4 text-pink-500" />
                              {event.availableSpots}/{event.totalSpots} posti disponibili
                            </div>
                          </div>

                          {/* Host */}
                          <div className="flex items-center gap-2 mb-4">
                            <Avatar className="h-7 w-7 ring-2 ring-pink-200">
                              <AvatarImage src={event.host.image || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs bg-gradient-to-r from-pink-100 to-purple-100 text-pink-600">
                                {event.host.name?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-700">{event.host.name}</span>
                            {event.host.verified && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                ✓
                              </Badge>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {event.views || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-pink-500" />
                                {event.likes || 0}
                              </div>
                              {event.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {event.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Amenities Preview */}
                          {event.amenities && event.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.amenities.slice(0, 3).map((amenity, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-pink-200 text-pink-600">
                                  {amenity}
                                </Badge>
                              ))}
                              {event.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs border-pink-200 text-pink-600">
                                  +{event.amenities.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Link>
                    </Card>
                  ) : (
                    <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link href={`/evento/${event._id}`}>
                        <div className="flex gap-4 p-4">
                          <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={
                                getEventImageUrl(event.images?.[0], 150, 100) || "/placeholder.svg?height=100&width=150"
                              }
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                            <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs shadow-lg">
                              {categoryIcons[event.category]}
                            </Badge>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-lg line-clamp-1 group-hover:text-pink-600 transition-colors">
                                {event.title}
                              </h3>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-100"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    shareEvent(event)
                                  }}
                                >
                                  <Share2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleRemoveClick(event._id)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.description}</p>

                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-pink-500" />
                                {formatDate(event.dateStart)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-pink-500" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-pink-500" />
                                {event.availableSpots}/{event.totalSpots}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={event.host.image || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs bg-gradient-to-r from-pink-100 to-purple-100 text-pink-600">
                                    {event.host.name?.charAt(0)?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-700">{event.host.name}</span>
                                {event.host.verified && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                    ✓
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {event.views || 0}
                                </div>
                                {event.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {event.rating.toFixed(1)}
                                  </div>
                                )}
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs shadow-lg">
                                  {event.price === 0 ? "Gratuito" : `€${event.price}`}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Rimuovi dai preferiti
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Sei sicuro di voler rimuovere questo evento dai tuoi preferiti? Potrai sempre aggiungerlo di nuovo in
              seguito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-pink-200 hover:bg-pink-50">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
