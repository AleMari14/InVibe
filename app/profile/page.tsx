"use client"

import type React from "react"

import {
  ArrowLeft,
  Settings,
  Star,
  Heart,
  MessageCircle,
  Plus,
  Eye,
  Shield,
  CreditCard,
  Calendar,
  MapPin,
  Users,
  Award,
  Clock,
  ActivityIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { format, formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

interface Event {
  _id: string
  title: string
  description: string
  location: string
  price: number
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  images: string[]
  views: number
  rating: number
  reviewCount: number
  verified: boolean
}

interface Review {
  _id: string
  userId: string
  eventId: string
  rating: number
  comment: string
  createdAt: string
  userName: string
  userImage?: string
  eventTitle: string
}

interface Booking {
  _id: string
  eventId: string
  userId: string
  status: string
  createdAt: string
  eventTitle: string
  eventImage: string
  eventDate: string
  guests: number
  totalPrice: number
}

interface ProfileActivity {
  _id: string
  type: string
  description: string
  createdAt: string
  relatedId?: string
  relatedTitle?: string
  relatedImage?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  progress: number
  maxProgress: number
  achieved: boolean
  unlockedAt?: string
}

interface ProfileData {
  name: string
  email: string
  image?: string
  verified: boolean
  rating: number
  reviewCount: number
  bio?: string
  location?: string
  memberSince: string
  stats: {
    eventsParticipated: number
    eventsOrganized: number
    totalReviews: number
    totalBookings: number
    totalFavorites: number
    responseRate: number
  }
  eventi: Event[]
  reviews: Review[]
  bookings: Booking[]
  activities: ProfileActivity[]
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated") {
      fetchProfileData()
    }
  }, [status, router])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }
      const data = await response.json()

      // Simuliamo alcuni dati aggiuntivi che verranno implementati nell'API
      const enhancedData = {
        ...data,
        bio: data.bio || "Ciao! Sono un appassionato di eventi e feste.",
        location: data.location || "Milano, Italia",
        memberSince: "2023-01-15",
        stats: {
          ...data.stats,
          totalBookings: 12,
          totalFavorites: 8,
          responseRate: 94,
        },
        reviews: generateMockReviews(5),
        bookings: generateMockBookings(3),
        activities: generateMockActivities(8),
      }

      setProfileData(enhancedData)
    } catch (error) {
      console.error("Error fetching profile data:", error)
      toast.error("Impossibile caricare i dati del profilo")
    } finally {
      setLoading(false)
    }
  }

  // Funzioni helper per generare dati di esempio
  const generateMockReviews = (count: number): Review[] => {
    return Array.from({ length: count }, (_, i) => ({
      _id: `review-${i}`,
      userId: `user-${i}`,
      eventId: `event-${i}`,
      rating: 4 + Math.random(),
      comment: [
        "Ottimo host, molto disponibile e cordiale!",
        "Evento fantastico, lo consiglio vivamente!",
        "Esperienza indimenticabile, tornerò sicuramente!",
        "Tutto perfetto, dall'organizzazione alla location.",
        "Host molto professionale e attento ai dettagli.",
      ][i % 5],
      createdAt: new Date(Date.now() - i * 86400000 * 7).toISOString(),
      userName: ["Marco R.", "Giulia T.", "Alessandro B.", "Francesca M.", "Roberto L."][i % 5],
      userImage: `/placeholder.svg?height=40&width=40&query=user${i}`,
      eventTitle: ["Festa di Compleanno", "Aperitivo in Terrazza", "Serata DJ Set", "Cena Gourmet", "Pool Party"][
        i % 5
      ],
    }))
  }

  const generateMockBookings = (count: number): Booking[] => {
    return Array.from({ length: count }, (_, i) => ({
      _id: `booking-${i}`,
      eventId: `event-${i}`,
      userId: session?.user?.email || "",
      status: ["confermato", "in attesa", "completato"][i % 3],
      createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      eventTitle: ["Festa in Spiaggia", "Degustazione Vini", "Concerto Live"][i % 3],
      eventImage: `/placeholder.svg?height=80&width=120&query=event${i}`,
      eventDate: new Date(Date.now() + (i + 1) * 86400000 * 10).toISOString(),
      guests: 2 + i,
      totalPrice: 25 * (2 + i),
    }))
  }

  const generateMockActivities = (count: number): ProfileActivity[] => {
    const types = ["booking", "review", "favorite", "event_created", "event_updated", "message"]
    return Array.from({ length: count }, (_, i) => ({
      _id: `activity-${i}`,
      type: types[i % types.length],
      description: [
        "Hai prenotato un nuovo evento",
        "Hai lasciato una recensione",
        "Hai aggiunto un evento ai preferiti",
        "Hai creato un nuovo evento",
        "Hai aggiornato un evento",
        "Hai ricevuto un nuovo messaggio",
      ][i % 6],
      createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      relatedId: `related-${i}`,
      relatedTitle: [
        "Festa in Spiaggia",
        "Degustazione Vini",
        "Concerto Live",
        "Aperitivo in Terrazza",
        "Pool Party",
        "Cena Gourmet",
      ][i % 6],
      relatedImage: `/placeholder.svg?height=40&width=40&query=activity${i}`,
    }))
  }

  // Achievements del profilo
  const achievements: Achievement[] = [
    {
      id: "first_event",
      title: "Primo Evento",
      description: "Hai creato il tuo primo evento",
      icon: <Award className="h-6 w-6 text-yellow-500" />,
      progress: profileData?.eventi.length || 0,
      maxProgress: 1,
      achieved: (profileData?.eventi.length || 0) >= 1,
      unlockedAt: profileData?.eventi.length ? "2023-05-10" : undefined,
    },
    {
      id: "event_master",
      title: "Event Master",
      description: "Crea 10 eventi di successo",
      icon: <Award className="h-6 w-6 text-blue-500" />,
      progress: profileData?.eventi.length || 0,
      maxProgress: 10,
      achieved: (profileData?.eventi.length || 0) >= 10,
    },
    {
      id: "popular_host",
      title: "Host Popolare",
      description: "Ricevi 20 recensioni positive",
      icon: <Star className="h-6 w-6 text-amber-500" />,
      progress: profileData?.stats.totalReviews || 0,
      maxProgress: 20,
      achieved: (profileData?.stats.totalReviews || 0) >= 20,
    },
    {
      id: "social_butterfly",
      title: "Social Butterfly",
      description: "Partecipa a 15 eventi",
      icon: <Users className="h-6 w-6 text-purple-500" />,
      progress: profileData?.stats.eventsParticipated || 0,
      maxProgress: 15,
      achieved: (profileData?.stats.eventsParticipated || 0) >= 15,
    },
    {
      id: "verified_profile",
      title: "Profilo Verificato",
      description: "Completa la verifica del profilo",
      icon: <Shield className="h-6 w-6 text-green-500" />,
      progress: profileData?.verified ? 1 : 0,
      maxProgress: 1,
      achieved: profileData?.verified || false,
      unlockedAt: profileData?.verified ? "2023-04-22" : undefined,
    },
  ]

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-8 w-24" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Errore</h2>
          <p className="text-muted-foreground mb-4">Impossibile caricare i dati del profilo.</p>
          <Button onClick={fetchProfileData}>Riprova</Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy", { locale: it })
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: it })
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleChangeAccount = () => {
    signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Il Mio Profilo
            </h1>
          </div>
          <Link href="/impostazioni">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-border bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <CardContent className="pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                <Avatar className="h-24 w-24 border-4 border-background ring-4 ring-blue-500/30">
                  <AvatarImage src={profileData.image || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl">
                    {profileData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-xl font-semibold text-foreground">{profileData.name}</h2>
                    {profileData.verified && <Badge className="bg-green-600 text-white text-xs">✓ Verificato</Badge>}
                  </div>
                  <p className="text-muted-foreground mb-2">{profileData.email}</p>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{profileData.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({profileData.reviewCount} recensioni)</span>
                    </div>
                    {profileData.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{profileData.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Membro dal {formatDate(profileData.memberSince)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <EditProfileDialog />
                </div>
              </div>

              {profileData.bio && (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>{profileData.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 sm:grid-cols-5 bg-muted">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="eventi">Eventi</TabsTrigger>
            <TabsTrigger value="prenotazioni">Prenotazioni</TabsTrigger>
            <TabsTrigger value="recensioni">Recensioni</TabsTrigger>
            <TabsTrigger value="achievements" className="hidden sm:block">
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{profileData.stats.eventsParticipated}</span>
                    </CardTitle>
                    <CardDescription>Eventi Partecipati</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>{profileData.stats.eventsOrganized}</span>
                    </CardTitle>
                    <CardDescription>Eventi Organizzati</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>{profileData.stats.totalReviews}</span>
                    </CardTitle>
                    <CardDescription>Recensioni</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{profileData.stats.totalFavorites}</span>
                    </CardTitle>
                    <CardDescription>Preferiti</CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Response Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    Tasso di Risposta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rispondi in media entro 2 ore</span>
                      <span className="font-medium">{profileData.stats.responseRate}%</span>
                    </div>
                    <Progress value={profileData.stats.responseRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center gap-2">
                    <ActivityIcon className="h-4 w-4 text-purple-500" />
                    Attività Recenti
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {profileData.activities.slice(0, 5).map((activity) => (
                      <div key={activity._id} className="flex items-center gap-3 p-4">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {activity.type === "booking" && <Calendar className="h-4 w-4 text-blue-500" />}
                          {activity.type === "review" && <Star className="h-4 w-4 text-amber-500" />}
                          {activity.type === "favorite" && <Heart className="h-4 w-4 text-red-500" />}
                          {activity.type === "event_created" && <Plus className="h-4 w-4 text-green-500" />}
                          {activity.type === "event_updated" && <ActivityIcon className="h-4 w-4 text-orange-500" />}
                          {activity.type === "message" && <MessageCircle className="h-4 w-4 text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{activity.description}</p>
                          {activity.relatedTitle && (
                            <p className="text-xs text-muted-foreground truncate">{activity.relatedTitle}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(activity.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setActiveTab("activities")}
                  >
                    Vedi tutte le attività
                  </Button>
                </CardFooter>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Link href="/crea-evento">
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 w-full">
                        <Plus className="h-5 w-5 text-green-500" />
                        <span className="text-xs">Crea Evento</span>
                      </Button>
                    </Link>
                    <Link href="/preferiti">
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 w-full">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className="text-xs">Preferiti</span>
                      </Button>
                    </Link>
                    <Link href="/messaggi">
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 w-full">
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                        <span className="text-xs">Messaggi</span>
                      </Button>
                    </Link>
                    <Link href="/prenotazioni">
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 w-full">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <span className="text-xs">Prenotazioni</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />I Tuoi Achievement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {achievements
                      .filter((a) => a.achieved)
                      .slice(0, 2)
                      .map((achievement) => (
                        <Card key={achievement.id} className="bg-muted/50">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                              {achievement.icon}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{achievement.title}</h4>
                              <p className="text-xs text-muted-foreground">{achievement.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setActiveTab("achievements")}
                  >
                    Vedi tutti gli achievement
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Eventi Tab */}
          <TabsContent value="eventi" className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">I Miei Eventi</h3>
                <Link href="/crea-evento">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Nuovo Evento
                  </Button>
                </Link>
              </div>

              {profileData.eventi.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nessun evento creato</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Non hai ancora creato nessun evento. Inizia a creare il tuo primo evento!
                    </p>
                    <Link href="/crea-evento">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Crea il tuo primo evento
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {profileData.eventi.map((event) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link href={`/evento/${event._id}`}>
                        <Card className="hover:bg-accent/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="relative h-24 w-24 flex-shrink-0">
                                <Image
                                  src={event.images[0] || "/placeholder.svg"}
                                  alt={event.title}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{event.title}</h4>
                                <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(event.dateStart)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>
                                      {event.availableSpots}/{event.totalSpots} posti
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span>{event.views} visualizzazioni</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="text-lg font-bold">€{event.price}</div>
                                {event.verified && <Badge className="bg-green-100 text-green-700">Verificato</Badge>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Prenotazioni Tab */}
          <TabsContent value="prenotazioni" className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Le Mie Prenotazioni</h3>
              </div>

              {profileData.bookings.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nessuna prenotazione</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Non hai ancora effettuato prenotazioni per eventi.
                    </p>
                    <Link href="/">
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Esplora eventi
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {profileData.bookings.map((booking) => (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="relative h-20 w-20 flex-shrink-0">
                              <Image
                                src={booking.eventImage || "/placeholder.svg"}
                                alt={booking.eventTitle}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">{booking.eventTitle}</h4>
                                <Badge
                                  className={
                                    booking.status === "confermato"
                                      ? "bg-green-100 text-green-700"
                                      : booking.status === "in attesa"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-blue-100 text-blue-700"
                                  }
                                >
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(booking.eventDate)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {booking.guests} {booking.guests === 1 ? "ospite" : "ospiti"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  <span>€{booking.totalPrice}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="px-4 py-2 border-t flex justify-between">
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Contatta Host
                          </Button>
                          <Link href={`/evento/${booking.eventId}`}>
                            <Button variant="outline" size="sm">
                              Dettagli Evento
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Recensioni Tab */}
          <TabsContent value="recensioni" className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Le Mie Recensioni</h3>
              </div>

              {profileData.reviews.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nessuna recensione</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Non hai ancora ricevuto recensioni per i tuoi eventi.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {profileData.reviews.map((review) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.userImage || "/placeholder.svg"} />
                              <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{review.userName}</h4>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < Math.floor(review.rating)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : i < review.rating
                                            ? "fill-yellow-400/50 text-yellow-400/50"
                                            : "text-muted-foreground/30"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">Per evento: {review.eventTitle}</p>
                              <p className="text-sm mt-2">{review.comment}</p>
                              <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(review.createdAt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">I Tuoi Achievement</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className={achievement.achieved ? "border-amber-200" : "opacity-70"}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-14 w-14 rounded-full flex items-center justify-center ${
                            achievement.achieved ? "bg-amber-100" : "bg-muted"
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{achievement.title}</h4>
                            {achievement.achieved && <Badge className="bg-amber-100 text-amber-700">Sbloccato</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>

                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progresso</span>
                              <span>
                                {achievement.progress}/{achievement.maxProgress}
                              </span>
                            </div>
                            <Progress
                              value={(achievement.progress / achievement.maxProgress) * 100}
                              className="h-1.5"
                            />
                          </div>

                          {achievement.achieved && achievement.unlockedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Sbloccato il {formatDate(achievement.unlockedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom padding */}
      <div className="h-4"></div>
    </div>
  )
}
