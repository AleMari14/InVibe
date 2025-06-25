"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Settings,
  Heart,
  Calendar,
  MessageSquare,
  Bell,
  LogOut,
  Camera,
  Star,
  MapPin,
  Eye,
  Plus,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { AchievementSystem } from "@/components/gamification/achievement-system"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { getEventImageUrl } from "@/lib/image-utils"

interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  bio?: string
  location?: string
  phone?: string
  dateOfBirth?: string
  verified: boolean
  rating: number
  reviewCount: number
  joinedAt: string
  stats: {
    eventsCreated: number
    eventsAttended: number
    totalViews: number
    favoriteCount: number
  }
}

interface Event {
  _id: string
  title: string
  location: string
  price: number
  images: string[]
  dateStart: string
  availableSpots: number
  totalSpots: number
  views: number
  verified: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(0)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchRecentEvents()
    }
  }, [status, router, forceRefresh])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        // Assicurati che stats esista sempre con valori di default
        const profileData = {
          ...data,
          stats: {
            eventsCreated: data.stats?.eventsCreated || 0,
            eventsAttended: data.stats?.eventsAttended || 0,
            totalViews: data.stats?.totalViews || 0,
            favoriteCount: data.stats?.favoriteCount || 0,
          },
        }
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchRecentEvents = async () => {
    try {
      const response = await fetch("/api/user/events?limit=3")
      if (response.ok) {
        const data = await response.json()
        setRecentEvents(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching recent events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = () => {
    setForceRefresh((prev) => prev + 1)
    setShowEditDialog(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })
  }

  // Prepara le stats per l'AchievementSystem
  const achievementStats = profile
    ? {
        eventsCreated: profile.stats?.eventsCreated || 0,
        eventsParticipated: profile.stats?.eventsAttended || 0,
        totalReviews: profile.reviewCount || 0,
        totalMessages: 0, // Da implementare
        rating: profile.rating || 0,
        consecutiveDays: 7, // Mock data
        totalPoints: 0,
        level: 1,
      }
    : undefined

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
          <div className="px-4 py-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 bg-white/20" />
                <Skeleton className="h-4 w-48 bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Profile Info */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="px-4 py-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <OptimizedAvatar
                src={profile?.image}
                alt={profile?.name || "User"}
                fallback={profile?.name?.charAt(0).toUpperCase() || "U"}
                size={80}
                forceRefresh={forceRefresh}
                className="border-4 border-white/20"
              />
              <Button
                size="icon"
                className="absolute -bottom-2 -right-2 h-8 w-8 bg-white text-blue-600 hover:bg-white/90 shadow-lg"
                onClick={() => setShowEditDialog(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold truncate">{profile?.name || session?.user?.name}</h1>
                {profile?.verified && <Badge className="bg-white/20 text-white border-white/30">✓ Verificato</Badge>}
              </div>
              <p className="text-white/80 text-sm mb-2">{profile?.email || session?.user?.email}</p>
              {profile?.location && (
                <div className="flex items-center gap-1 text-white/70 text-sm mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.rating > 0 && (
                <div className="flex items-center gap-1 text-white/90 text-sm">
                  <Star className="h-3 w-3 text-yellow-300" />
                  <span>
                    {profile.rating.toFixed(1)} • {profile.reviewCount} recensioni
                  </span>
                </div>
              )}
            </div>
          </div>

          {profile?.bio && <p className="text-white/90 text-sm mb-4 leading-relaxed">{profile.bio}</p>}

          {/* Stats */}
          {profile?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.stats.eventsCreated}</div>
                <div className="text-white/70 text-xs">Eventi Creati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.stats.eventsAttended}</div>
                <div className="text-white/70 text-xs">Partecipazioni</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.stats.totalViews}</div>
                <div className="text-white/70 text-xs">Visualizzazioni</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.stats.favoriteCount}</div>
                <div className="text-white/70 text-xs">Preferiti</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Achievement System - Solo se abbiamo i dati del profilo */}
        {achievementStats && <AchievementSystem stats={achievementStats} />}

        {/* My Events Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />I Miei Eventi
              </CardTitle>
              <Link href="/user/events">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Vedi tutti
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">Non hai ancora creato nessun evento</p>
                <Link href="/crea-evento">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Crea il tuo primo evento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative w-16 h-12 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={getEventImageUrl(event.images?.[0], 64, 48) || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{event.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location.split(",")[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(event.dateStart)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {event.views}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-blue-600">€{event.price}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.availableSpots}/{event.totalSpots} posti
                      </div>
                    </div>
                  </motion.div>
                ))}
                <Link href="/user/events">
                  <Button variant="outline" className="w-full mt-3">
                    Gestisci tutti i miei eventi
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/preferiti">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Preferiti</h3>
                <p className="text-xs text-muted-foreground">Eventi salvati</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/prenotazioni">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Prenotazioni</h3>
                <p className="text-xs text-muted-foreground">I tuoi eventi</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          <Link href="/messaggi">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Messaggi</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/notifiche">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Notifiche</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/impostazioni">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Impostazioni</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Separator />

        {/* Account Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Membro dal {profile?.joinedAt ? formatDate(profile.joinedAt) : "N/A"}</p>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Esci
        </Button>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  )
}
