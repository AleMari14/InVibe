"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Star, Mail, Phone, MapPin, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    // eslint-disable-next-line
  }, [userId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/user-profile?id=${userId}`)
      if (!res.ok) throw new Error("Utente non trovato")
      const data = await res.json()
      setProfile(data.user)
    } catch (err: any) {
      setError(err.message || "Errore nel caricamento del profilo")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-32 w-32 rounded-full mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-lg text-red-500 mb-4">{error || "Profilo non trovato"}</p>
        <Button onClick={() => router.back()}>Torna indietro</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10">
      <Card className="w-full max-w-xl">
        <CardHeader className="flex flex-col items-center">
          <OptimizedAvatar src={profile.image} alt={profile.name} size={96} className="mb-2" />
          <CardTitle className="text-2xl font-bold text-center">{profile.name}</CardTitle>
          {profile.verified && (
            <Badge className="mt-2 bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
              <Award className="w-4 h-4" /> Membro verificato
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-yellow-400" />
            <span>{profile.rating.toFixed(1)} ({profile.reviewCount} recensioni)</span>
          </div>
          {profile.bio && (
            <div>
              <span className="font-semibold">Bio:</span>
              <p className="text-muted-foreground whitespace-pre-line">{profile.bio}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-4">
            <span>Iscritto dal: {new Date(profile.joinDate || profile.createdAt).toLocaleDateString("it-IT")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 