"use client"

import { useState, useEffect } from "react"
import { Settings, Star, MapPin, Calendar, Users, Heart, MessageSquare, Edit3, Eye, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { ProfileImageUpdater } from "@/components/profile/profile-image-updater"
import { AchievementSystem } from "@/components/gamification/achievement-system"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { getEventImageUrl } from "@/lib/image-utils"
import { useLanguage } from "@/contexts/language-context"

interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  bio?: string
  phone?: string
  verified: boolean
  rating: number
  reviewCount: number
  joinDate: string
  favorites: string[]
  createdAt: string
  updatedAt: string
}

interface UserEvent {
  _id: string
  title: string
  description: string
  location: string
  price: number
  rating: number
  reviewCount: number
  images: string[]
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  verified: boolean
  views: number
  participants: string[]
}

interface UserBooking {
  _id: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  guests: number
  totalPrice: number
  createdAt: string
  event: {
    _id: string
    title: string
    location: string
    dateStart: string
    images: string[]
  }
}

interface UserStats {
  totalEvents: number
  totalBookings: number
  totalViews: number
  totalParticipants: number
  averageRating: number
  completionRate: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userEvents, setUserEvents] = useState<UserEvent[]>([])
  const [userBookings, setUserBookings] = useState<UserBooking[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login")
      return
    }
    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProfile(data.user)
      setUserStats(data.stats)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Errore nel caricamento del profilo")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserEvents = async () => {
    try {
      setEventsLoading(true)
      const response = await fetch("/api/user/events")
      if (response.ok) {
        const data = await response.json()
        setUserEvents(data)
      }
    } catch (error) {
      console.error("Error fetching user events:", error)
    } finally {
      setEventsLoading(false)
    }
  }

  const fetchUserBookings = async () => {
    try {
      setBookingsLoading(true)
      const response = await fetch("/api/bookings")
      if (response.ok) {
        const data = await response.json()
        setUserBookings(data)
      }
    } catch (error) {
      console.error("Error fetching user bookings:", error)
    } finally {
      setBookingsLoading(false)
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

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "In attesa", color: "bg-yellow-100 text-yellow-700" },
      confirmed: { label: "Confermata", color: "bg-green-100 text-green-700" },
      cancelled: { label: "Annullata", color: "bg-red-100 text-red-700" },
      completed: { label: "Completata", color: "bg-blue-100 text-blue-700" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Profilo non trovato</h2>
          <p className="text-muted-foreground mb-4">Si è verificato un errore nel caricamento del profilo.</p>
          <Button onClick={() => router.push("/")}>Torna alla Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-md border-b border-border">
        <div className="px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <OptimizedAvatar
                src={profile.image}
                alt={profile.name}
                size={80}
                className="h-20 w-20 ring-4 ring-white shadow-lg"
              />
              <ProfileImageUpdater
                currentImage={profile.image}
                onImageUpdate={(newImage) => {
                  setProfile((prev) => (prev ? { ...prev, image: newImage } : null))
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-foreground truncate">{profile.name}</h1>
                {profile.verified && <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />}
              </div>

              <p className="text-sm text-muted-foreground mb-2">{profile.email}</p>

              {profile.bio && <p className="text-sm text-foreground mb-3 line-clamp-2">{profile.bio}</p>}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Iscritto da {formatJoinDate(profile.joinDate || profile.createdAt)}</span>
                </div>
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>
                      {profile.rating.toFixed(1)} ({profile.reviewCount})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Modifica
              </Button>
              <Link href="/impostazioni">
                <Button variant="ghost" size="sm" className="w-full flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Impostazioni
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.totalEvents}</div>
                <div className="text-xs text-muted-foreground">Eventi creati</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.totalBookings}</div>
                <div className="text-xs text-muted-foreground">Prenotazioni</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.totalViews}</div>
                <div className="text-xs text-muted-foreground">Visualizzazioni</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{userStats.totalParticipants}</div>
                <div className="text-xs text-muted-foreground">Partecipanti</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="events" onClick={() => !userEvents.length && fetchUserEvents()}>
              I miei eventi
            </TabsTrigger>
            <TabsTrigger value="bookings" onClick={() => !userBookings.length && fetchUserBookings()}>
              Prenotazioni
            </TabsTrigger>
            <TabsTrigger value="achievements">Obiettivi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Link href="/crea-evento">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Crea Evento
                  </Button>
                </Link>
                <Link href="/preferiti">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Heart className="h-4 w-4 mr-2" />
                    Preferiti
                  </Button>
                </Link>
                <Link href="/messaggi">
                  <Button variant="outline" className="w-full bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messaggi
                  </Button>
                </Link>
                <Link href="/user/events">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />I miei eventi
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attività Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profilo completato</p>
                      <p className="text-xs text-muted-foreground">Il tuo profilo è stato verificato</p>
                    </div>
                    <Badge variant="secondary">Completato</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">I miei eventi</h2>
              <Link href="/crea-evento">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Nuovo evento
                </Button>
              </Link>
            </div>

            {eventsLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userEvents.length > 0 ? (
              <div className="grid gap-4">
                {userEvents.map((event) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {event.images?.[0] ? (
                              <Image
                                src={getEventImageUrl(event.images[0], 80, 80) || "/placeholder.svg"}
                                alt={event.title}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                              <div className="flex gap-1 ml-2">
                                {event.verified && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">Verificato</Badge>
                                )}
                                <Link href={`/evento/${event._id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(event.dateStart)}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {event.totalSpots - event.availableSpots}/{event.totalSpots} partecipanti
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{event.views} visualizzazioni</span>
                                </div>
                                {event.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500" />
                                    <span>{event.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="text-sm font-semibold text-blue-600">€{event.price}</div>
                              <Link href={`/evento/${event._id}`}>
                                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                  Visualizza
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium mb-2">Nessun evento creato</h3>
                <p className="text-sm text-muted-foreground mb-4">Inizia creando il tuo primo evento!</p>
                <Link href="/crea-evento">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Crea il tuo primo evento
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Le mie prenotazioni</h2>
              <Badge variant="secondary">{userBookings.length} prenotazioni</Badge>
            </div>

            {bookingsLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="h-16 w-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userBookings.length > 0 ? (
              <div className="grid gap-4">
                {userBookings.map((booking) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {booking.event.images?.[0] ? (
                              <Image
                                src={getEventImageUrl(booking.event.images[0], 64, 64) || "/placeholder.svg"}
                                alt={booking.event.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-sm line-clamp-1">{booking.event.title}</h3>
                              {getStatusBadge(booking.status)}
                            </div>

                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{booking.event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(booking.event.dateStart)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{booking.guests} ospiti</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="text-sm font-semibold text-green-600">€{booking.totalPrice}</div>
                              <div className="text-xs text-muted-foreground">
                                Prenotato il {formatDate(booking.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium mb-2">Nessuna prenotazione</h3>
                <p className="text-sm text-muted-foreground mb-4">Inizia esplorando gli eventi disponibili!</p>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Esplora eventi</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <AchievementSystem />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        profile={profile}
        onProfileUpdate={(updatedProfile) => {
          setProfile(updatedProfile)
          toast.success("Profilo aggiornato con successo!")
        }}
      />
    </div>
  )
}
