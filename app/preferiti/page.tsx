"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Heart, MapPin, Calendar, Users, Star, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

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
}

export default function PreferitiPage() {
  const [favorites, setFavorites] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (session?.user?.id) {
      fetchFavorites()
    }
  }, [session, status, router])

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

  const removeFavorite = async (eventId: string) => {
    try {
      console.log("💔 Removing favorite:", eventId)
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Favorite removed:", result)
        setFavorites((prev) => prev.filter((event) => event._id !== eventId))
      }
    } catch (error) {
      console.error("💥 Error removing favorite:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })
  }

  const filteredFavorites = favorites.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              I Miei Preferiti
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca nei preferiti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/80 backdrop-blur-sm border-border"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10 mb-4">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          // Loading skeletons
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-border">
                <Skeleton className="aspect-[16/10] w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? "Nessun risultato" : "Nessun preferito"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Prova a modificare la ricerca" : "Inizia ad aggiungere eventi ai tuoi preferiti"}
            </p>
            {!searchQuery && (
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Esplora Eventi
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredFavorites.length} {filteredFavorites.length === 1 ? "evento" : "eventi"}
              </p>
            </div>

            <AnimatePresence>
              {filteredFavorites.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="overflow-hidden border-border bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                    <div className="relative">
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <Image
                          src={event.images?.[0] || "/placeholder.svg?height=240&width=400"}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>

                      <div className="absolute top-3 left-3 flex gap-2">
                        {event.verified && (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">✓ Verificato</Badge>
                        )}
                        <Badge className="bg-blue-600/90 backdrop-blur-sm text-white text-xs">
                          {event.availableSpots}/{event.totalSpots} posti
                        </Badge>
                      </div>

                      <div className="absolute top-3 right-3">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-background/80 hover:bg-background backdrop-blur-sm h-8 w-8"
                            onClick={() => removeFavorite(event._id)}
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm ml-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{event.rating || 4.8}</span>
                          <span className="text-muted-foreground text-xs">({event.reviewCount || 0})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{event.location}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.dateStart)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{event.totalSpots} persone</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {event.amenities?.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {event.amenities?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{event.amenities.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                          {event.host && (
                            <span>
                              Organizzato da <span className="font-medium text-foreground">{event.host.name}</span>
                              {event.host.verified && <span className="text-green-500 ml-1">✓</span>}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            €{event.price}
                          </div>
                          <div className="text-xs text-muted-foreground">a persona</div>
                        </div>
                      </div>

                      <Link href={`/evento/${event._id}`}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm">
                            Vedi Dettagli
                          </Button>
                        </motion.div>
                      </Link>
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
