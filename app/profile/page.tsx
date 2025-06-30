"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  User,
  MapPin,
  Phone,
  Calendar,
  Star,
  Users,
  Heart,
  MessageSquare,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { ProfileImageUpdater } from "@/components/profile/profile-image-updater"
import Link from "next/link"
import { motion } from "framer-motion"

interface UserProfile {
  _id: string
  email: string
  name: string
  image?: string
  bio?: string
  location?: string
  phone?: string
  dateOfBirth?: string
  interests: string[]
  rating: number
  reviewCount: number
  verified: boolean
  createdAt: string
  updatedAt: string
  stats: {
    eventsCreated: number
    bookingsMade: number
    reviewsReceived: number
    reviewsGiven: number
  }
  recentBookings: Array<{
    _id: string
    status: string
    createdAt: string
    event: {
      _id: string
      title: string
    }
  }>
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  const maxRetries = 3

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, retryCount])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Fetching profile...")

      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Profile loaded:", data)

      setProfile(data)
      setRetryCount(0) // Reset retry count on success
    } catch (error: any) {
      console.error("💥 Error fetching profile:", error)
      setError(error.message || "Errore nel caricamento del profilo")

      // Auto-retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, delay)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(0)
    fetchProfile()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confermata"
      case "pending":
        return "In attesa"
      case "cancelled":
        return "Annullata"
      default:
        return status
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && retryCount >= maxRetries) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Errore nel caricamento</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Riprova
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                Torna alla Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento profilo...</p>
          {retryCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Tentativo {retryCount + 1} di {maxRetries + 1}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.image || "/placeholder.svg"} alt={profile.name} />
                <AvatarFallback className="text-xl">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <ProfileImageUpdater currentImage={profile.image} onImageUpdate={fetchProfile} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{profile.name || "Nome non impostato"}</h1>
                {profile.verified && <Badge className="bg-blue-100 text-blue-700">Verificato</Badge>}
              </div>
              <p className="text-muted-foreground mb-2">{profile.email}</p>
              {profile.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{profile.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({profile.reviewCount} recensioni)</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowEditDialog(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Bio */}
        {profile.bio && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informazioni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(profile.dateOfBirth)}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Membro dal {formatDate(profile.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Interessi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profile.stats.eventsCreated}</div>
                    <div className="text-sm text-muted-foreground">Eventi creati</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profile.stats.bookingsMade}</div>
                    <div className="text-sm text-muted-foreground">Prenotazioni</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profile.stats.reviewsReceived}</div>
                    <div className="text-sm text-muted-foreground">Recensioni ricevute</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profile.stats.reviewsGiven}</div>
                    <div className="text-sm text-muted-foreground">Recensioni date</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Recent Activity */}
        {profile.recentBookings && profile.recentBookings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>Attività Recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.recentBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Link
                          href={`/evento/${booking.event._id}`}
                          className="font-medium hover:text-blue-600 transition-colors"
                        >
                          {booking.event.title}
                        </Link>
                        <div className="text-sm text-muted-foreground">{formatDate(booking.createdAt)}</div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>{getStatusText(booking.status)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle>Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <Link href="/user/events" className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">I Miei Eventi</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <Link href="/prenotazioni" className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Prenotazioni</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <Link href="/preferiti" className="flex flex-col items-center gap-2">
                  <Heart className="h-6 w-6" />
                  <span className="text-sm">Preferiti</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <Link href="/impostazioni" className="flex flex-col items-center gap-2">
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">Impostazioni</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        profile={profile}
        onProfileUpdate={fetchProfile}
      />
    </div>
  )
}
