"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Settings,
  Heart,
  Calendar,
  MessageCircle,
  Bell,
  LogOut,
  Edit3,
  Star,
  Globe,
  Moon,
  Sun,
  Monitor,
  Award,
  Users,
  Camera,
  Trophy,
  Sparkles,
  CheckCircle,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  Crown,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

interface UserSettings {
  notifications: {
    events: boolean
    messages: boolean
    reviews: boolean
    marketing: boolean
    push: boolean
    email: boolean
  }
  privacy: {
    profileVisible: boolean
    showEmail: boolean
    showPhone: boolean
    allowMessages: boolean
  }
  language: string
  theme: string
}

interface Review {
  _id: string
  rating: number
  comment: string
  createdAt: string
  event: {
    _id: string
    title: string
  }
  reviewer?: {
    name: string
    image?: string
  }
  host?: {
    name: string
    image?: string
  }
}

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

interface UserStats {
  totalEvents: number
  totalBookings: number
  totalViews: number
  totalParticipants: number
  averageRating: number
  completionRate: number
  eventsOrganized: number
  eventsParticipated: number
  totalReviews: number
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageKey, setImageKey] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    phone: "",
    location: "",
    image: "",
  })

  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      events: true,
      messages: true,
      reviews: false,
      marketing: false,
      push: true,
      email: true,
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false,
      allowMessages: true,
    },
    language: "it",
    theme: "system",
  })

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch profile data
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (session?.user) {
      fetchProfile()
    }
  }, [session, status, router])

  // Update profile data when profile changes
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        image: profile.image || "",
      })
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      setProfileLoading(true)
      setProfileError(null)

      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.user) {
        throw new Error("Dati profilo non validi")
      }

      setProfile(data.user)
      setUserStats(
        data.stats || {
          totalEvents: 0,
          totalBookings: 0,
          totalViews: 0,
          totalParticipants: 0,
          averageRating: 0,
          completionRate: 0,
          eventsOrganized: 0,
          eventsParticipated: 0,
          totalReviews: 0,
        },
      )
      setRetryCount(0)
    } catch (error: any) {
      console.error("Error fetching profile:", error)
      setProfileError(error.message || "Errore nel caricamento del profilo")

      // Auto retry up to 3 times
      if (retryCount < 3) {
        setTimeout(
          () => {
            setRetryCount((prev) => prev + 1)
            fetchProfile()
          },
          2000 * (retryCount + 1),
        ) // Exponential backoff
      }
    } finally {
      setProfileLoading(false)
    }
  }

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user) return

      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      }
    }

    fetchSettings()
  }, [session])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine deve essere inferiore a 5MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un file immagine valido")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "profile")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Errore durante l'upload")
      }

      const data = await response.json()

      if (data.success && data.url) {
        const newImageUrl = data.url

        // Update local state immediately
        setProfileData((prev) => ({ ...prev, image: newImageUrl }))

        // Update profile in database
        const updateResult = await updateProfile({ image: newImageUrl })

        if (updateResult.success) {
          // Update NextAuth session
          await update({
            ...session,
            user: {
              ...session?.user,
              image: newImageUrl,
            },
          })

          // Force refresh of avatars
          setImageKey((prev) => prev + 1)

          // Refresh profile
          fetchProfile()

          toast.success("Immagine profilo aggiornata con successo!")
        } else {
          throw new Error(updateResult.error || "Errore durante l'aggiornamento del profilo")
        }
      } else {
        throw new Error(data.error || "Errore durante l'upload")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Errore durante l'upload dell'immagine")
      setProfileData((prev) => ({ ...prev, image: profile?.image || "" }))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'aggiornamento")
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setIsUploading(true)
      const result = await updateProfile(profileData)

      if (result.success) {
        if (profileData.name !== session?.user?.name || profileData.image !== session?.user?.image) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: profileData.name,
              image: profileData.image,
            },
          })
        }

        setImageKey((prev) => prev + 1)
        setIsEditingProfile(false)
        toast.success("Profilo aggiornato con successo!")
        fetchProfile()
      } else {
        toast.error(result.error || "Errore durante l'aggiornamento del profilo")
      }
    } catch (error: any) {
      toast.error("Errore durante l'aggiornamento del profilo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSettingsUpdate = async (newSettings: Partial<UserSettings>) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSettings((prev) => ({ ...prev, ...newSettings }))
        toast.success("Impostazioni aggiornate con successo!")
      } else {
        throw new Error("Errore durante l'aggiornamento")
      }
    } catch (error) {
      toast.error("Errore durante l'aggiornamento delle impostazioni")
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as "it" | "en" | "es")
    handleSettingsUpdate({ language: newLanguage })
  }

  const handleSignOut = () => {
    toast.info("Disconnessione in corso...")
    setTimeout(() => {
      signOut({ callbackUrl: "/" })
    }, 1000)
  }

  // Fetch reviews
  const fetchReviews = async (type = "all") => {
    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/reviews?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setReviewsLoading(false)
    }
  }

  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // Will redirect in useEffect
  }

  if (profileLoading) {
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

  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Errore nel caricamento</h2>
          <p className="text-muted-foreground mb-6">{profileError}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchProfile} disabled={profileLoading}>
              {profileLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Riprovo...
                </>
              ) : (
                "Riprova"
              )}
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Torna alla Home
            </Button>
          </div>
          {retryCount > 0 && <p className="text-xs text-muted-foreground mt-4">Tentativo {retryCount}/3</p>}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Profilo non disponibile</h2>
          <p className="text-muted-foreground mb-4">Non è stato possibile caricare i dati del profilo.</p>
          <Button onClick={fetchProfile}>Riprova</Button>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: "Eventi creati",
      value: userStats?.eventsOrganized?.toString() || "0",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Partecipazioni",
      value: userStats?.eventsParticipated?.toString() || "0",
      icon: Users,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Valutazione",
      value: userStats?.averageRating && userStats.averageRating > 0 ? userStats.averageRating.toFixed(1) : "N/A",
      icon: Star,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Recensioni",
      value: userStats?.totalReviews?.toString() || "0",
      icon: MessageCircle,
      color: "from-purple-500 to-pink-500",
    },
  ]

  const menuItems = [
    { label: "I miei eventi", href: "/user/events", icon: Calendar, color: "text-blue-500" },
    { label: "Prenotazioni", href: "/prenotazioni", icon: Calendar, color: "text-green-500" },
    { label: "Preferiti", href: "/preferiti", icon: Heart, color: "text-red-500" },
    { label: "Messaggi", href: "/messaggi", icon: MessageCircle, color: "text-purple-500" },
    { label: "Notifiche", href: "/notifiche", icon: Bell, color: "text-yellow-500" },
  ]

  // Achievement definitions with translations
  const achievements = [
    {
      id: "first_event",
      title: "Primo Evento",
      description: "Hai creato il tuo primo evento",
      icon: Trophy,
      requirement: 1,
      current: userStats?.eventsOrganized || 0,
      unlocked: (userStats?.eventsOrganized || 0) >= 1,
      points: 50,
      rarity: "common" as const,
    },
    {
      id: "event_creator",
      title: "Creatore di Eventi",
      description: "Hai creato 5 eventi",
      icon: Calendar,
      requirement: 5,
      current: userStats?.eventsOrganized || 0,
      unlocked: (userStats?.eventsOrganized || 0) >= 5,
      points: 200,
      rarity: "rare" as const,
    },
    {
      id: "event_master",
      title: "Maestro degli Eventi",
      description: "Hai creato 20 eventi",
      icon: Crown,
      requirement: 20,
      current: userStats?.eventsOrganized || 0,
      unlocked: (userStats?.eventsOrganized || 0) >= 20,
      points: 500,
      rarity: "epic" as const,
    },
    {
      id: "social_butterfly",
      title: "Farfalla Sociale",
      description: "Hai partecipato a 10 eventi",
      icon: Users,
      requirement: 10,
      current: userStats?.eventsParticipated || 0,
      unlocked: (userStats?.eventsParticipated || 0) >= 10,
      points: 150,
      rarity: "common" as const,
    },
    {
      id: "party_animal",
      title: "Animale da Festa",
      description: "Hai partecipato a 50 eventi",
      icon: Zap,
      requirement: 50,
      current: userStats?.eventsParticipated || 0,
      unlocked: (userStats?.eventsParticipated || 0) >= 50,
      points: 400,
      rarity: "rare" as const,
    },
    {
      id: "reviewer",
      title: "Recensore",
      description: "Hai scritto 10 recensioni",
      icon: Star,
      requirement: 10,
      current: userStats?.totalReviews || 0,
      unlocked: (userStats?.totalReviews || 0) >= 10,
      points: 100,
      rarity: "common" as const,
    },
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-400 to-gray-500"
      case "rare":
        return "from-blue-400 to-blue-500"
      case "epic":
        return "from-purple-400 to-purple-500"
      case "legendary":
        return "from-yellow-400 to-yellow-500"
      default:
        return "from-gray-400 to-gray-500"
    }
  }

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "rare":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "epic":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "legendary":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const currentImage = profileData.image || profile?.image || session?.user?.image || ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-24 relative z-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0 bg-white/5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px",
              }}
            ></div>
          </div>
        </div>

        <div className="relative p-6 text-white">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative"
            >
              <OptimizedAvatar
                key={`profile-header-${imageKey}-${currentImage}`}
                src={currentImage}
                alt={profile?.name || session?.user?.name || ""}
                size={96}
                className="h-24 w-24 border-4 border-white/30 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </motion.div>

            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-1"
              >
                {profile?.name || session?.user?.name || "Utente"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 mb-2"
              >
                {profile?.email || session?.user?.email}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-2"
              >
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Award className="w-3 h-3 mr-1" />
                  Membro verificato
                </Badge>
              </motion.div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={() => setIsEditingProfile(true)}
            >
              <Edit3 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-6 space-y-6 relative z-10">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-10`}></div>
                <CardContent className="p-4 text-center relative">
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${stat.color} mb-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievement System - Improved Design */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Sistema Obiettivi
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    Livello{" "}
                    {Math.floor(achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0) / 500) + 1}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0)} punti
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso prossimo livello</span>
                  <span>
                    {Math.round(
                      ((achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0) % 500) / 500) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    ((achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0) % 500) / 500) * 100
                  }
                  className="h-3"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer
                      ${
                        achievement.unlocked
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800"
                          : "bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                      }
                    `}
                  >
                    {/* Rarity Glow Effect */}
                    {achievement.unlocked && (
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${getRarityColor(
                          achievement.rarity,
                        )} opacity-10 blur-sm`}
                      />
                    )}

                    <div className="relative">
                      {/* Header with Icon and Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-3 rounded-full transition-all duration-300 ${
                            achievement.unlocked
                              ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white shadow-lg`
                              : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                          }`}
                        >
                          <achievement.icon className="h-6 w-6" />
                        </div>
                        {achievement.unlocked && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                              <Sparkles className="h-3 w-3 mr-1" />+{achievement.points}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Title and Description */}
                      <div className="mb-4">
                        <h4
                          className={`font-bold text-base mb-1 ${
                            achievement.unlocked
                              ? "text-green-800 dark:text-green-200"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{achievement.description}</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span>Progresso</span>
                          <span className="font-medium">
                            {Math.min(achievement.current, achievement.requirement)}/{achievement.requirement}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress
                            value={
                              (Math.min(achievement.current, achievement.requirement) / achievement.requirement) * 100
                            }
                            className="h-2"
                          />
                          {achievement.unlocked && (
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Rarity Badge */}
                      <div className="flex justify-center">
                        <Badge className={`text-xs font-medium px-3 py-1 ${getRarityBadgeColor(achievement.rarity)}`}>
                          {achievement.rarity === "common" && "Comune"}
                          {achievement.rarity === "rare" && "Raro"}
                          {achievement.rarity === "epic" && "Epico"}
                          {achievement.rarity === "legendary" && "Leggendario"}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Link href={item.href} className="block">
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-0 shadow-md cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto p-4 border-0 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowSettings(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Impostazioni</div>
                  <div className="text-sm text-muted-foreground">Personalizza l'app</div>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-4 border-0 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                setShowReviews(true)
                fetchReviews()
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Recensioni</div>
                  <div className="text-sm text-muted-foreground">Le tue recensioni</div>
                </div>
              </div>
            </Button>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full h-12 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Disconnetti
          </Button>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Modifica Profilo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <OptimizedAvatar
                  key={`profile-edit-${imageKey}-${profileData.image}`}
                  src={profileData.image}
                  alt={profileData.name}
                  size={96}
                  className="h-24 w-24 border-4 border-gray-200"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Cambia foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Il tuo nome"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Raccontaci qualcosa di te..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="location">Posizione</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="La tua città"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+39 123 456 7890"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleProfileUpdate} disabled={isUploading} className="flex-1">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvataggio...
                  </>
                ) : (
                  "Salva modifiche"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditingProfile(false)} disabled={isUploading}>
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Impostazioni
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Generali</TabsTrigger>
              <TabsTrigger value="notifications">Notifiche</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              {/* Language */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Lingua
                </Label>
                <RadioGroup value={language} onValueChange={handleLanguageChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="it" id="lang-it" />
                    <Label htmlFor="lang-it" className="flex items-center gap-2">
                      🇮🇹 Italiano
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="lang-en" />
                    <Label htmlFor="lang-en" className="flex items-center gap-2">
                      🇬🇧 English
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="es" id="lang-es" />
                    <Label htmlFor="lang-es" className="flex items-center gap-2">
                      🇪🇸 Español
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Theme */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Tema
                </Label>
                <RadioGroup value={theme} onValueChange={setTheme}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light" className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Chiaro
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark" className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Scuro
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Label htmlFor="theme-system" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Sistema
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              {settings.notifications &&
                Object.entries(settings.notifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <Label className="font-medium cursor-pointer">
                      {key === "events" && `🎉 Aggiornamenti eventi`}
                      {key === "messages" && `💬 Messaggi e chat`}
                      {key === "reviews" && `⭐ Recensioni e feedback`}
                      {key === "marketing" && `📧 Offerte e promozioni`}
                      {key === "push" && `📱 Notifiche push`}
                      {key === "email" && `📧 Notifiche email`}
                    </Label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        const newNotifications = { ...settings.notifications, [key]: checked }
                        handleSettingsUpdate({ notifications: newNotifications })
                      }}
                    />
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              {settings.privacy &&
                Object.entries(settings.privacy).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <Label className="font-medium cursor-pointer flex items-center gap-2">
                      {key === "profileVisible" && (
                        <>
                          <Eye className="h-4 w-4" />
                          Profilo visibile
                        </>
                      )}
                      {key === "showEmail" && (
                        <>
                          <Mail className="h-4 w-4" />
                          Mostra email
                        </>
                      )}
                      {key === "showPhone" && (
                        <>
                          <Phone className="h-4 w-4" />
                          Mostra telefono
                        </>
                      )}
                      {key === "allowMessages" && (
                        <>
                          <MessageCircle className="h-4 w-4" />
                          Consenti messaggi
                        </>
                      )}
                    </Label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        const newPrivacy = { ...settings.privacy, [key]: checked }
                        handleSettingsUpdate({ privacy: newPrivacy })
                      }}
                    />
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Reviews Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recensioni
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" onClick={() => fetchReviews("received")}>
                Ricevute
              </TabsTrigger>
              <TabsTrigger value="given" onClick={() => fetchReviews("given")}>
                Inviate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">Nessuna recensione trovata</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <OptimizedAvatar
                          src={review.reviewer?.image || "/placeholder.svg"}
                          alt={review.reviewer?.name || "Utente"}
                          size={40}
                          className="h-10 w-10"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{review.reviewer?.name}</span>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">Evento: {review.event.title}</p>
                          {review.comment && <p className="text-sm">{review.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.createdAt).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="given" className="space-y-4">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">Nessuna recensione inviata</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <OptimizedAvatar
                          src={review.host?.image || "/placeholder.svg"}
                          alt={review.host?.name || "Host"}
                          size={40}
                          className="h-10 w-10"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Host: {review.host?.name}</span>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">Evento: {review.event.title}</p>
                          {review.comment && <p className="text-sm">{review.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.createdAt).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
