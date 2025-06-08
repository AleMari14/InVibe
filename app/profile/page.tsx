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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ProfileData {
  user: {
    name: string
    email: string
    image: string
    bio: string
    phone: string
    location: string
    verified: boolean
    joinDate: string
  }
  stats: {
    eventiPartecipati: number
    eventiOrganizzati: number
    recensioni: number
  }
  eventi: Array<{
    _id: string
    title: string
    date: string
    status: string
    partecipanti: number
    totale: number
    image: string
    views: number
  }>
  prenotazioni: Array<{
    _id: string
    title: string
    date: string
    status: string
    organizzatore: string
    image: string
  }>
}

export default function ProfiloPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (session) {
      fetchProfileData()
    }
  }, [session, status, router])

  async function fetchProfileData() {
    try {
      console.log("🔍 Fetching profile data...")
      const response = await fetch("/api/profile")
      console.log("📦 Profile API response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Profile API error:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("✅ Profile data received:", data)
      
      // Transform the API response to match our expected structure
      const transformedData: ProfileData = {
        user: {
          name: data.user.name || "",
          email: data.user.email || "",
          image: data.user.image || "",
          bio: data.user.bio || "",
          phone: data.user.phone || "",
          location: data.user.location || "",
          verified: data.user.verified || false,
          joinDate: data.user.createdAt || new Date().toISOString()
        },
        stats: {
          eventiPartecipati: 0,
          eventiOrganizzati: 0,
          recensioni: 0
        },
        eventi: [],
        prenotazioni: []
      }
      
      setProfileData(transformedData)
    } catch (error) {
      console.error("💥 Error fetching profile:", error)
      toast.error("Errore nel caricamento del profilo")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !profileData) {
    return null
  }

  // Add default values for all profile data to prevent undefined errors
  const user = profileData.user || {
    name: "",
    email: "",
    image: "",
    bio: "",
    phone: "",
    location: "",
    verified: false,
    joinDate: new Date().toISOString()
  }

  const stats = profileData.stats || {
    eventiPartecipati: 0,
    eventiOrganizzati: 0,
    recensioni: 0
  }

  const eventi = profileData.eventi || []
  const prenotazioni = profileData.prenotazioni || []

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
                <AvatarImage src={user.image} />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
                  {user.verified && (
                    <Badge className="bg-green-600 text-white text-xs">✓ Verificato</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{user.email}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{stats.recensioni}</span>
                    <span className="text-muted-foreground">recensioni</span>
                  </div>
                  <span className="text-muted-foreground">
                    Membro dal {new Date(user.joinDate).toLocaleDateString("it-IT", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
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
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stats.eventiPartecipati}
                </div>
                <div className="text-sm text-muted-foreground">Eventi Partecipati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stats.eventiOrganizzati}
                </div>
                <div className="text-sm text-muted-foreground">Eventi Organizzati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stats.recensioni}
                </div>
                <div className="text-sm text-muted-foreground">Recensioni</div>
              </div>
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

        {/* Events and Bookings */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <Tabs defaultValue="miei-eventi" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="miei-eventi">I Miei Eventi</TabsTrigger>
              <TabsTrigger value="prenotazioni">Le Mie Prenotazioni</TabsTrigger>
            </TabsList>

            <TabsContent value="miei-eventi" className="p-4 space-y-4">
              {eventi.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Non hai ancora creato nessun evento
                </p>
              ) : (
                eventi.map((evento, index) => (
                  <div key={evento._id}>
                    <div className="flex items-center gap-3">
                      <img
                        src={evento.image}
                        alt={evento.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{evento.title}</h4>
                        <p className="text-sm text-muted-foreground">{evento.date}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={evento.status === "Attivo" ? "default" : "secondary"}>
                            {evento.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {evento.partecipanti}/{evento.totale} partecipanti
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Eye className="h-3 w-3" />
                          {evento.views}
                        </div>
                        <Button variant="outline" size="sm">
                          Gestisci
                        </Button>
                      </div>
                    </div>
                    {index < eventi.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="prenotazioni" className="p-4 space-y-4">
              {prenotazioni.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Non hai ancora effettuato nessuna prenotazione
                </p>
              ) : (
                prenotazioni.map((prenotazione, index) => (
                  <div key={prenotazione._id}>
                    <div className="flex items-center gap-3">
                      <img
                        src={prenotazione.image}
                        alt={prenotazione.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{prenotazione.title}</h4>
                        <p className="text-sm text-muted-foreground">{prenotazione.date}</p>
                        <p className="text-xs text-muted-foreground">
                          Organizzato da {prenotazione.organizzatore}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={prenotazione.status === "Confermata" ? "default" : "secondary"}
                        >
                          {prenotazione.status}
                        </Badge>
                      </div>
                    </div>
                    {index < prenotazioni.length - 1 && <Separator className="mt-4" />}
                  </div>
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
