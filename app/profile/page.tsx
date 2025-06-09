"use client"

import {
  ArrowLeft,
  Settings,
  Star,
  Heart,
  MessageCircle,
  Plus,
  Eye,
  LogOut,
  UserCheck,
  Shield,
  Bell,
  Globe,
  CreditCard,
  HelpCircle,
  Calendar,
  MapPin,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { NotificationSettings } from "@/components/profile/notification-settings"
import { ThemeSettings } from "@/components/profile/theme-settings"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import Image from "next/image"

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

interface ProfileData {
  name: string
  email: string
  image?: string
  verified: boolean
  rating: number
  reviewCount: number
  stats: {
    eventsParticipated: number
    eventsOrganized: number
    totalReviews: number
  }
  eventi: Event[]
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

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
      setProfileData(data)
    } catch (error) {
      console.error("Error fetching profile data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleChangeAccount = () => {
    signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <div className="min-h-screen bg-background">
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
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 ring-4 ring-blue-500">
                <AvatarImage src={profileData.image || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {profileData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-foreground">{profileData.name}</h2>
                  {profileData.verified && (
                    <Badge className="bg-green-600 text-white text-xs">✓ Verificato</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{profileData.email}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{profileData.rating}</span>
                    <span className="text-muted-foreground">({profileData.reviewCount} recensioni)</span>
                  </div>
                </div>
              </div>
              <EditProfileDialog />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{profileData.stats.eventsParticipated}</CardTitle>
                  <CardDescription>Eventi Partecipati</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{profileData.stats.eventsOrganized}</CardTitle>
                  <CardDescription>Eventi Organizzati</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{profileData.stats.totalReviews}</CardTitle>
                  <CardDescription>Recensioni</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <Heart className="h-5 w-5" />
                <span className="text-xs">Preferiti</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Messaggi</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <Bell className="h-5 w-5" />
                <span className="text-xs">Notifiche</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <Settings className="h-5 w-5" />
                <span className="text-xs">Impostazioni</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <Tabs defaultValue="miei-eventi" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="miei-eventi">I Miei Eventi</TabsTrigger>
            </TabsList>

            <TabsContent value="miei-eventi" className="p-4 space-y-4">
              {profileData.eventi.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Non hai ancora creato nessun evento
                </p>
              ) : (
                profileData.eventi.map((event) => (
                  <Link key={event._id} href={`/evento/${event._id}`}>
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
                                <span>{event.availableSpots}/{event.totalSpots} posti</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{event.views} visualizzazioni</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-lg font-bold">€{event.price}</div>
                            {event.verified && (
                              <Badge className="bg-green-100 text-green-700">Verificato</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Bottom padding */}
      <div className="h-4"></div>
    </div>
  )
}
