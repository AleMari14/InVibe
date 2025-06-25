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
  Shield,
  LogOut,
  Edit3,
  Star,
  Globe,
  CreditCard,
  Moon,
  Sun,
  Monitor,
  HelpCircle,
  Award,
  Users,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { AchievementSystem } from "@/components/gamification/achievement-system"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useUserProfile } from "@/hooks/use-user-profile"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile, isLoading, updateProfile, refreshProfile } = useUserProfile()

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    phone: "",
    location: "",
    image: "",
  })

  const [notifications, setNotifications] = useState({
    events: true,
    messages: true,
    reviews: false,
    marketing: false,
  })

  const [realStats, setRealStats] = useState({
    eventsCreated: 0,
    eventsParticipated: 0,
    totalReviews: 0,
    totalMessages: 0,
    rating: 0,
    consecutiveDays: 7, // Mock data
    totalPoints: 0,
    level: 1,
  })

  useEffect(() => {
    setMounted(true)
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

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const data = await response.json()
          setRealStats({
            eventsCreated: data.stats?.eventsOrganized || 0,
            eventsParticipated: data.stats?.eventsParticipated || 0,
            totalReviews: data.stats?.totalReviews || 0,
            totalMessages: data.stats?.totalBookings || 0,
            rating: data.rating || 0,
            consecutiveDays: 7, // Mock data - implement real streak tracking
            totalPoints: 0, // Will be calculated by achievement system
            level: 1, // Will be calculated by achievement system
          })
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    if (session?.user) {
      fetchStats()
    }
  }, [session])

  if (status === "loading" || !mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/login")
    return null
  }

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

        // Aggiorna lo stato locale immediatamente
        setProfileData((prev) => ({ ...prev, image: newImageUrl }))

        // Aggiorna il profilo nel database
        const updateResult = await updateProfile({ image: newImageUrl })

        if (updateResult.success) {
          // Aggiorna la sessione NextAuth
          await update({
            ...session,
            user: {
              ...session?.user,
              image: newImageUrl,
            },
          })

          // Force refresh degli avatar
          setForceRefresh((prev) => prev + 1)

          // Refresh del profilo
          refreshProfile()

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
      // Ripristina l'immagine precedente in caso di errore
      setProfileData((prev) => ({ ...prev, image: profile?.image || "" }))
    } finally {
      setIsUploading(false)
      // Reset del file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setIsUploading(true)
      const result = await updateProfile(profileData)

      if (result.success) {
        // Update session if name or image changed
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

        // Force refresh degli avatar
        setForceRefresh((prev) => prev + 1)

        setIsEditingProfile(false)
        toast.success("Profilo aggiornato con successo!")
        refreshProfile()
      } else {
        toast.error(result.error || "Errore durante l'aggiornamento del profilo")
      }
    } catch (error: any) {
      toast.error("Errore durante l'aggiornamento del profilo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    toast.success("Impostazioni notifiche aggiornate")
  }

  const handleSignOut = () => {
    toast.info("Disconnessione in corso...")
    setTimeout(() => {
      signOut({ callbackUrl: "/" })
    }, 1000)
  }

  const handleAchievementUnlock = (achievement: any) => {
    // Handle achievement unlock - could trigger confetti, sound, etc.
    console.log("Achievement unlocked:", achievement)
  }

  const stats = [
    {
      label: "Eventi Creati",
      value: realStats.eventsCreated.toString(),
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Partecipazioni",
      value: realStats.eventsParticipated.toString(),
      icon: Users,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Rating",
      value: realStats.rating > 0 ? realStats.rating.toFixed(1) : "N/A",
      icon: Star,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Recensioni",
      value: realStats.totalReviews.toString(),
      icon: MessageCircle,
      color: "from-purple-500 to-pink-500",
    },
  ]

  const menuItems = [
    { label: "I Miei Eventi", href: "/user/events", icon: Calendar, color: "text-blue-500" },
    { label: "Prenotazioni", href: "/prenotazioni", icon: Calendar, color: "text-green-500" },
    { label: "Preferiti", href: "/preferiti", icon: Heart, color: "text-red-500" },
    { label: "Messaggi", href: "/messaggi", icon: MessageCircle, color: "text-purple-500" },
    { label: "Notifiche", href: "/notifiche", icon: Bell, color: "text-yellow-500" },
  ]

  const currentImage = profileData.image || profile?.image || session?.user?.image || ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-20">
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
                src={currentImage}
                alt={profile?.name || session?.user?.name || ""}
                size={96}
                className="h-24 w-24 border-4 border-white/30 shadow-xl"
                forceRefresh={forceRefresh > 0}
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
                  Membro Verificato
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

      <div className="px-4 py-6 space-y-6">
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

        {/* Enhanced Achievement System */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AchievementSystem stats={realStats} onAchievementUnlock={handleAchievementUnlock} />
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
                    <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-6 w-6 text-gray-600" />
                Impostazioni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Sun className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Tema Applicazione</Label>
                    <p className="text-sm text-muted-foreground">Personalizza l'aspetto</p>
                  </div>
                </div>
                <RadioGroup value={theme} onValueChange={setTheme} className="flex gap-2">
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="light" id="light" />
                    <Sun className="h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="dark" id="dark" />
                    <Moon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="system" id="system" />
                    <Monitor className="h-4 w-4" />
                  </div>
                </RadioGroup>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Bell className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Notifiche</Label>
                    <p className="text-sm text-muted-foreground">Gestisci le tue preferenze</p>
                  </div>
                </div>
                {Object.entries(notifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <Label className="font-medium cursor-pointer">
                      {key === "events" && "🎉 Eventi e Aggiornamenti"}
                      {key === "messages" && "💬 Messaggi e Chat"}
                      {key === "reviews" && "⭐ Recensioni e Feedback"}
                      {key === "marketing" && "📧 Offerte e Promozioni"}
                    </Label>
                    <Switch checked={value} onCheckedChange={(checked) => handleNotificationChange(key, checked)} />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 border-0 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Privacy</div>
                      <div className="text-sm text-muted-foreground">Sicurezza account</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 border-0 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Pagamenti</div>
                      <div className="text-sm text-muted-foreground">Metodi e fatture</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 border-0 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Lingua</div>
                      <div className="text-sm text-muted-foreground">Regione e formato</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 border-0 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <HelpCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Supporto</div>
                      <div className="text-sm text-muted-foreground">Aiuto e FAQ</div>
                    </div>
                  </div>
                </Button>
              </div>

              <Separator />

              {/* Logout */}
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full h-12 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Disconnetti
              </Button>
            </CardContent>
          </Card>
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
                  src={profileData.image}
                  alt={profileData.name}
                  size={96}
                  className="h-24 w-24 border-4 border-gray-200"
                  forceRefresh={forceRefresh > 0}
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
                  Cambia Foto
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
                <Label htmlFor="location">Località</Label>
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
                    Salvando...
                  </>
                ) : (
                  "Salva Modifiche"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditingProfile(false)} disabled={isUploading}>
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
