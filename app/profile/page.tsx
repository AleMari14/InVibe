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
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { ProfileImageUpdater } from "@/components/profile/profile-image-updater"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingSettings, setIsEditingSettings] = useState(false)
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
        bio: "",
        phone: "",
        location: "",
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
      // Simula aggiornamento profilo
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
    { label: "Eventi Creati", value: "12", icon: Calendar },
    { label: "Partecipazioni", value: "28", icon: Star },
    { label: "Recensioni", value: "4.8", icon: Heart },
    { label: "Messaggi", value: "156", icon: MessageCircle },
  ]

  const menuItems = [
    { label: "I Miei Eventi", href: "/user/events", icon: Calendar },
    { label: "Prenotazioni", href: "/prenotazioni", icon: Calendar },
    { label: "Preferiti", href: "/preferiti", icon: Heart },
    { label: "Messaggi", href: "/messaggi", icon: MessageCircle },
    { label: "Notifiche", href: "/notifiche", icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white/20">
              <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <ProfileImageUpdater />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{session?.user?.name || "Utente"}</h1>
            <p className="text-white/80">{session?.user?.email}</p>
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
              Membro Verificato
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setIsEditingProfile(true)}
          >
            <Edit3 className="h-5 w-5" />
          </Button>
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
            <Card key={stat.label} className="text-center">
              <CardContent className="p-4">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Impostazioni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <Label>Tema</Label>
                </div>
                <RadioGroup value={theme} onValueChange={setTheme} className="flex gap-2">
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="light" id="light" />
                    <Sun className="h-3 w-3" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="dark" id="dark" />
                    <Moon className="h-3 w-3" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="system" id="system" />
                    <Monitor className="h-3 w-3" />
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifiche
                </Label>
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm capitalize">
                      {key === "events" && "Eventi"}
                      {key === "messages" && "Messaggi"}
                      {key === "reviews" && "Recensioni"}
                      {key === "marketing" && "Marketing"}
                    </Label>
                    <Switch checked={value} onCheckedChange={(checked) => handleNotificationChange(key, checked)} />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy e Sicurezza
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Metodi di Pagamento
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Lingua e Regione
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Aiuto e Supporto
                </Button>
              </div>

              <Separator />

              {/* Account Actions */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Cambia Account
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-500 hover:text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnetti
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
            <DialogTitle>Modifica Profilo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Raccontaci qualcosa di te..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
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
              <Button onClick={handleProfileUpdate}>Salva Modifiche</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
