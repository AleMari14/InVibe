"use client"

import {
  ArrowLeft,
  Settings,
  Star,
  Heart,
  MessageCircle,
  Edit,
  Plus,
  Eye,
  Sun,
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ProfiloPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailMarketing, setEmailMarketing] = useState(false)

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    router.push("/auth/login")
    return null
  }

  const user = {
    name: session.user?.name || "Utente",
    email: session.user?.email || "",
    avatar: session.user?.image || "/placeholder.svg?height=80&width=80",
    rating: 4.8,
    reviews: 23,
    joinDate: "Marzo 2023",
    verified: true,
  }

  const stats = [
    { label: "Eventi Partecipati", value: 12 },
    { label: "Eventi Organizzati", value: 5 },
    { label: "Recensioni", value: 23 },
  ]

  const mieiEventi = [
    {
      id: 1,
      title: "Villa con Piscina - Toscana",
      date: "15-17 Dic 2024",
      status: "Attivo",
      partecipanti: 5,
      totale: 8,
      image: "/placeholder.svg?height=60&width=60",
      views: 124,
    },
    {
      id: 2,
      title: "Appartamento Roma Centro",
      date: "28-30 Dic 2024",
      status: "Completo",
      partecipanti: 6,
      totale: 6,
      image: "/placeholder.svg?height=60&width=60",
      views: 89,
    },
  ]

  const prenotazioni = [
    {
      id: 1,
      title: "Weekend Sci Dolomiti",
      date: "20-22 Gen 2025",
      status: "Confermata",
      organizzatore: "Sofia M.",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      title: "Tour Costiera Amalfitana",
      date: "15 Nov 2024",
      status: "Completata",
      organizzatore: "Antonio L.",
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleChangeAccount = () => {
    signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
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
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Profile Info */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 ring-4 ring-blue-500">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
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
                  {user.verified && <Badge className="bg-green-600 text-white text-xs">✓ Verificato</Badge>}
                </div>
                <p className="text-muted-foreground mb-2">{user.email}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{user.rating}</span>
                    <span className="text-muted-foreground">({user.reviews} recensioni)</span>
                  </div>
                  <span className="text-muted-foreground">Membro dal {user.joinDate}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                <Edit className="h-4 w-4 mr-2" />
                Modifica
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/crea-evento">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-3" />
                Crea Nuovo Evento
              </Button>
            </Link>
            <Link href="/preferiti">
              <Button variant="outline" className="w-full justify-start border-border hover:bg-accent">
                <Heart className="h-4 w-4 mr-3" />I Miei Preferiti
              </Button>
            </Link>
            <Link href="/messaggi">
              <Button variant="outline" className="w-full justify-start border-border hover:bg-accent">
                <MessageCircle className="h-4 w-4 mr-3" />
                Messaggi
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Impostazioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4" />
                <div>
                  <Label className="text-sm font-medium">Tema Scuro</Label>
                  <p className="text-xs text-muted-foreground">Attiva/disattiva il tema scuro</p>
                </div>
              </div>
              <Switch defaultChecked={false} />
            </div>

            <Separator />

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4" />
                <div>
                  <Label className="text-sm font-medium">Notifiche Push</Label>
                  <p className="text-xs text-muted-foreground">Ricevi notifiche per nuovi eventi</p>
                </div>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>

            <Separator />

            {/* Email Marketing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4" />
                <div>
                  <Label className="text-sm font-medium">Email Marketing</Label>
                  <p className="text-xs text-muted-foreground">Ricevi offerte e novità via email</p>
                </div>
              </div>
              <Switch checked={emailMarketing} onCheckedChange={setEmailMarketing} />
            </div>

            <Separator />

            {/* Other Settings */}
            <Button variant="outline" className="w-full justify-start border-border hover:bg-accent">
              <CreditCard className="h-4 w-4 mr-3" />
              Metodi di Pagamento
            </Button>

            <Button variant="outline" className="w-full justify-start border-border hover:bg-accent">
              <Shield className="h-4 w-4 mr-3" />
              Privacy e Sicurezza
            </Button>

            <Button variant="outline" className="w-full justify-start border-border hover:bg-accent">
              <Globe className="h-4 w-4 mr-3" />
              Lingua: Italiano
            </Button>

            <Button variant="outline" className="w-full justify-start border-border hover:bg-accent">
              <HelpCircle className="h-4 w-4 mr-3" />
              Aiuto e Supporto
            </Button>

            <Separator />

            {/* Account Actions */}
            <Button
              variant="outline"
              className="w-full justify-start border-border hover:bg-accent"
              onClick={handleChangeAccount}
            >
              <UserCheck className="h-4 w-4 mr-3" />
              Cambia Account
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Disconnetti
            </Button>
          </CardContent>
        </Card>

        {/* Tabs for Events and Bookings */}
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <Tabs defaultValue="miei-eventi" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="miei-eventi">I Miei Eventi</TabsTrigger>
              <TabsTrigger value="prenotazioni">Le Mie Prenotazioni</TabsTrigger>
            </TabsList>

            <TabsContent value="miei-eventi" className="p-4 space-y-4">
              {mieiEventi.map((evento, index) => (
                <div key={evento.id}>
                  <div className="flex items-center gap-3">
                    <img
                      src={evento.image || "/placeholder.svg"}
                      alt={evento.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{evento.title}</h4>
                      <p className="text-sm text-muted-foreground">{evento.date}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={evento.status === "Attivo" ? "default" : "secondary"}>{evento.status}</Badge>
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
                  {index < mieiEventi.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="prenotazioni" className="p-4 space-y-4">
              {prenotazioni.map((prenotazione, index) => (
                <div key={prenotazione.id}>
                  <div className="flex items-center gap-3">
                    <img
                      src={prenotazione.image || "/placeholder.svg"}
                      alt={prenotazione.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{prenotazione.title}</h4>
                      <p className="text-sm text-muted-foreground">{prenotazione.date}</p>
                      <p className="text-xs text-muted-foreground">Organizzato da {prenotazione.organizzatore}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={prenotazione.status === "Confermata" ? "default" : "secondary"}>
                        {prenotazione.status}
                      </Badge>
                    </div>
                  </div>
                  {index < prenotazioni.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Bottom padding */}
      <div className="h-4"></div>
    </div>
  )
}
