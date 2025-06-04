"use client"

import { useState } from "react"
import { Bell, MessageCircle, Calendar, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface NotificationSetting {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  enabled: boolean
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
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
      icon: <MessageCircle className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "events",
      title: "Eventi",
      description: "Ricevi notifiche per eventi in arrivo",
      icon: <Calendar className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "reviews",
      title: "Recensioni",
      description: "Ricevi notifiche per nuove recensioni",
      icon: <Star className="h-4 w-4" />,
      enabled: false,
    },
  ])

  const handleToggle = async (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    )

    try {
      // TODO: Implement actual notification settings update logic
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulated API call
      toast.success("Impostazioni notifiche aggiornate")
    } catch (error) {
      toast.error("Errore durante l'aggiornamento delle impostazioni")
      // Revert the change on error
      setSettings((prev) =>
        prev.map((setting) =>
          setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
        )
      )
    }
  }

  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifiche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map((setting, index) => (
          <div key={setting.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {setting.icon}
                <div>
                  <Label className="text-sm font-medium">{setting.title}</Label>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
              </div>
              <Switch checked={setting.enabled} onCheckedChange={() => handleToggle(setting.id)} />
            </div>
            {index < settings.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 