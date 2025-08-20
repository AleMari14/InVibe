"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Star, Mail, Phone, MapPin, Award, Calendar, Heart, Users, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  bio?: string
  phone?: string
  location?: string
  verified: boolean
  rating: number
  reviewCount: number
  joinDate: string
  favorites: string[]
  createdAt: string
  updatedAt: string
  eventsCreated?: number
  totalBookings?: number
  lastActive?: string
}

export default function PublicUserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = params.id as string

  useEffect(() => {
    if (userId) {
      fetchProfile()
    }
  }, [userId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/user-profile?id=${userId}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Utente non trovato")
      }
      const data = await res.json()
      setProfile(data.user)
    } catch (err: any) {
      setError(err.message || "Errore nel caricamento del profilo")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Oggi"
    if (diffInDays === 1) return "Ieri"
    if (diffInDays < 7) return `${diffInDays} giorni fa`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} settimane fa`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} mesi fa`
    return `${Math.floor(diffInDays / 365)} anni fa`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="flex flex-col items-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 text-center">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-semibold mb-2">Profilo non trovato</h2>
            <p className="text-muted-foreground mb-4">
              {error || "L'utente che stai cercando non esiste o non è più disponibile."}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              Torna indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header del profilo */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <OptimizedAvatar
                src={profile.image}
                alt={profile.name}
                size={96}
                className="ring-4 ring-background shadow-lg"
              />
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2 justify-center">
                  {profile.name}
                  {profile.verified && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Verificato
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{profile.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({profile.reviewCount} {profile.reviewCount === 1 ? "recensione" : "recensioni"})
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Informazioni di base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informazioni di base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.bio && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Bio</h4>
                <p className="text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telefono</p>
                    <p className="text-sm text-muted-foreground">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Posizione</p>
                    <p className="text-sm text-muted-foreground">{profile.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Membro dal</p>
                  <p className="text-sm text-muted-foreground">{formatDate(profile.joinDate || profile.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiche attività */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Attività su InVibe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{profile.favorites?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Preferiti</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{profile.reviewCount}</p>
                <p className="text-sm text-muted-foreground">Recensioni</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg col-span-2 md:col-span-1">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{getTimeAgo(profile.updatedAt)}</p>
                <p className="text-sm text-muted-foreground">Ultimo accesso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Azioni */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push(`/messaggi?user=${userId}`)}
                className="flex-1 flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Invia messaggio
              </Button>
              <Button variant="outline" onClick={() => router.back()} className="flex-1">
                Torna indietro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
