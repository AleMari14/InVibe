"use client"

import { useState, useEffect } from "react"
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
  UserCheck,
  Trophy,
  Award,
  Crown,
  Medal,
  Users,
  MapPin,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    phone: "",
    location: "",
    website: "",
  })
  const [notifications, setNotifications] = useState({
    events: true,
    messages: true,
    reviews: false,
    marketing: false,
  })

  useEffect(() => {
    setMounted(true)
    if (session?.user) {
      setProfileData({
        name: session.user.name || "",
        email: session.user.email || "",
        bio: "Amante delle esperienze uniche e dei viaggi indimenticabili! 🌟",
        phone: "",
        location: "Milano, Italia",
        website: "",
      })
    }
  }, [session])

  if (status === "loading" || !mounted) {
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

  const handleProfileUpdate = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsEditingProfile(false)
      toast.success("Profilo aggiornato con successo!")
    } catch (error) {
      toast.error("Errore durante l'aggiornamento del profilo")
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

  const stats = [
    { label: "Eventi Creati", value: "12", icon: Calendar, color: "from-blue-500 to-cyan-500" },
    { label: "Partecipazioni", value: "28", icon: Users, color: "from-green-500 to-emerald-500" },
    { label: "Rating", value: "4.8", icon: Star, color: "from-yellow-500 to-orange-500" },
    { label: "Messaggi", value: "156", icon: MessageCircle, color: "from-purple-500 to-pink-500" },
  ]

  const achievements = [
    {
      id: 1,
      title: "Primo Evento",
      description: "Hai creato il tuo primo evento!",
      icon: Trophy,
      unlocked: true,
      color: "from-yellow-400 to-yellow-600",
      progress: 100,
    },
    {
      id: 2,
      title: "Socializzatore",
      description: "Partecipa a 10 eventi",
      icon: Users,
      unlocked: true,
      color: "from-green-400 to-green-600",
      progress: 100,
    },
    {
      id: 3,
      title: "Esploratore",
      description: "Visita 5 città diverse",
      icon: MapPin,
      unlocked: true,
      color: "from-blue-400 to-blue-600",
      progress: 100,
    },
    {
      id: 4,
      title: "Influencer",
      description: "Raggiungi 50 partecipanti",
      icon: Crown,
      unlocked: false,
      color: "from-purple-400 to-purple-600",
      progress: 56,
    },
    {
      id: 5,
      title: "Fotografo",
      description: "Carica 20 foto eventi",
      icon: Camera,
      unlocked: false,
      color: "from-pink-400 to-pink-600",
      progress: 75,
    },
    {
      id: 6,
      title: "Leggenda",
      description: "Crea 100 eventi",
      icon: Medal,
      unlocked: false,
      color: "from-orange-400 to-red-600",
      progress: 12,
    },
  ]

  const menuItems = [
    { label: "I Miei Eventi", href: "/user/events", icon: Calendar, color: "text-blue-500" },
    { label: "Prenotazioni", href: "/prenotazioni", icon: Calendar, color: "text-green-500" },
    { label: "Preferiti", href: "/preferiti", icon: Heart, color: "text-red-500" },
    { label: "Messaggi", href: "/messaggi", icon: MessageCircle, color: "text-purple-500" },
    { label: "Notifiche", href: "/notifiche", icon: Bell, color: "text-yellow-500" },
  ]

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
              <Avatar className="h-24 w-24 border-4 border-white/30 shadow-xl">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl font-bold">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
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
                {session?.user?.name || "Utente"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 mb-2"
              >
                {session?.user?.email}
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
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  VIP
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

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Achievements
                <Badge variant="secondary" className="ml-auto">
                  3/6 Completati
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      achievement.unlocked
                        ? "border-transparent bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg"
                        : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-r ${achievement.color} ${
                          achievement.unlocked ? "shadow-lg" : "opacity-50"
                        }`}
                      >
                        <achievement.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-sm ${
                            achievement.unlocked ? "text-gray-900 dark:text-white" : "text-gray-500"
                          }`}
                        >
                          {achievement.title}
                        </h3>
                        <p
                          className={`text-xs mt-1 ${
                            achievement.unlocked ? "text-gray-600 dark:text-gray-300" : "text-gray-400"
                          }`}
                        >
                          {achievement.description}
                        </p>
                        {!achievement.unlocked && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progresso</span>
                              <span>{achievement.progress}%</span>
                            </div>
                            <Progress value={achievement.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                    {achievement.unlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
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
              <Link href={item.href}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-0 shadow-md">
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
                    <Label className="font-medium">
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

              {/* Account Actions */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 border-0 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Cambia Account</div>
                      <div className="text-sm text-muted-foreground">Gestisci account multipli</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 border-0 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 hover:text-red-700"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Disconnetti</div>
                      <div className="text-sm text-red-500">Esci dall'applicazione</div>
                    </div>
                  </div>
                </Button>
              </div>
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Il tuo nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="email@esempio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Raccontaci qualcosa di te..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                placeholder="+39 123 456 7890"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Località</Label>
              <Input
                id="location"
                placeholder="Milano, Italia"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                Annulla
              </Button>
              <Button onClick={handleProfileUpdate} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Salva Modifiche
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
