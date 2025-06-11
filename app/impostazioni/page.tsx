"use client"

import type React from "react"

import { useState } from "react"
import {
  ArrowLeft,
  Shield,
  Globe,
  CreditCard,
  HelpCircle,
  LogOut,
  UserCheck,
  Bell,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface NotificationSetting {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  enabled: boolean
}

export default function ImpostazioniPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: "push",
      title: "Notifiche Push",
      description: "Ricevi notifiche per nuovi eventi e aggiornamenti",
      icon: <Bell className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "messages",
      title: "Messaggi",
      description: "Ricevi notifiche per nuovi messaggi",
      icon: <Bell className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "events",
      title: "Eventi",
      description: "Ricevi notifiche per eventi in arrivo",
      icon: <Bell className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "reviews",
      title: "Recensioni",
      description: "Ricevi notifiche per nuove recensioni",
      icon: <Bell className="h-4 w-4" />,
      enabled: false,
    },
  ])

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleChangeAccount = () => {
    signOut({ callbackUrl: "/auth/login" })
  }

  const handleThemeChange = async (value: string) => {
    setIsLoading(true)
    try {
      setTheme(value)
      // Simuliamo un'API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("Tema aggiornato con successo")
    } catch (error) {
      toast.error("Errore durante l'aggiornamento del tema")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleNotification = async (id: string) => {
    try {
      // Aggiorniamo localmente
      setNotificationSettings((prev) =>
        prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
      )

      // Simuliamo un'API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("Impostazioni notifiche aggiornate")
    } catch (error) {
      toast.error("Errore durante l'aggiornamento delle impostazioni")
      // Ripristiniamo lo stato precedente in caso di errore
      setNotificationSettings((prev) =>
        prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
      )
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Impostazioni
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Theme Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Tema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
                <div>
                  <RadioGroupItem value="light" id="light" className="peer sr-only" disabled={isLoading} />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    Chiaro
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="dark" className="peer sr-only" disabled={isLoading} />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    Scuro
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="system" id="system" className="peer sr-only" disabled={isLoading} />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Monitor className="mb-3 h-6 w-6" />
                    Sistema
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifiche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationSettings.map((setting, index) => (
                <div key={setting.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {setting.icon}
                      <div>
                        <Label className="text-sm font-medium">{setting.title}</Label>
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      </div>
                    </div>
                    <Switch checked={setting.enabled} onCheckedChange={() => handleToggleNotification(setting.id)} />
                  </div>
                  {index < notificationSettings.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account e Sicurezza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-accent"
                onClick={() => toast.info("Funzionalità in arrivo")}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Metodi di Pagamento
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-accent"
                onClick={() => toast.info("Funzionalità in arrivo")}
              >
                <Shield className="h-4 w-4 mr-3" />
                Privacy e Sicurezza
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-accent"
                onClick={() => toast.info("Funzionalità in arrivo")}
              >
                <Globe className="h-4 w-4 mr-3" />
                Lingua: Italiano
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-accent"
                onClick={() => toast.info("Funzionalità in arrivo")}
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                Aiuto e Supporto
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-3">
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
        </motion.div>
      </div>
    </div>
  )
}
