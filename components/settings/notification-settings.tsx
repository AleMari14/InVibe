"use client"

import type React from "react"

import { useState } from "react"
import { Bell, MessageCircle, Calendar, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NotificationSetting {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  channels: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "events",
      title: "Eventi",
      description: "Ricevi notifiche per eventi in arrivo",
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
      enabled: true,
      channels: {
        email: true,
        push: true,
        sms: false,
      },
    },
    {
      id: "messages",
      title: "Messaggi",
      description: "Ricevi notifiche per nuovi messaggi",
      icon: <MessageCircle className="h-4 w-4 text-green-500" />,
      enabled: true,
      channels: {
        email: true,
        push: true,
        sms: false,
      },
    },
    {
      id: "reviews",
      title: "Recensioni",
      description: "Ricevi notifiche per nuove recensioni",
      icon: <Star className="h-4 w-4 text-amber-500" />,
      enabled: false,
      channels: {
        email: true,
        push: false,
        sms: false,
      },
    },
  ])

  const handleToggleMain = async (id: string) => {
    try {
      // Aggiorniamo localmente
      setSettings((prev) =>
        prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
      )

      // Simuliamo una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 600))

      const setting = settings.find((s) => s.id === id)
      const newState = !setting?.enabled

      toast.success(
        newState
          ? `Notifiche ${setting?.title.toLowerCase()} attivate`
          : `Notifiche ${setting?.title.toLowerCase()} disattivate`,
      )
    } catch (error) {
      // Ripristiniamo lo stato precedente in caso di errore
      setSettings((prev) =>
        prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
      )
      toast.error("Errore durante l'aggiornamento delle impostazioni")
    }
  }

  const handleToggleChannel = async (id: string, channel: keyof NotificationSetting["channels"]) => {
    try {
      // Aggiorniamo localmente
      setSettings((prev) =>
        prev.map((setting) =>
          setting.id === id
            ? {
                ...setting,
                channels: {
                  ...setting.channels,
                  [channel]: !setting.channels[channel],
                },
              }
            : setting,
        ),
      )

      // Simuliamo una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 600))

      const setting = settings.find((s) => s.id === id)
      const channelState = !setting?.channels[channel]
      const channelName = channel === "email" ? "email" : channel === "push" ? "push" : "SMS"

      toast.success(
        channelState
          ? `Notifiche ${channelName} per ${setting?.title.toLowerCase()} attivate`
          : `Notifiche ${channelName} per ${setting?.title.toLowerCase()} disattivate`,
      )
    } catch (error) {
      // Ripristiniamo lo stato precedente in caso di errore
      setSettings((prev) =>
        prev.map((setting) =>
          setting.id === id
            ? {
                ...setting,
                channels: {
                  ...setting.channels,
                  [channel]: !setting.channels[channel],
                },
              }
            : setting,
        ),
      )
      toast.error("Errore durante l'aggiornamento delle impostazioni")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Notifiche
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((setting, index) => (
            <div key={setting.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {setting.icon}
                  <div>
                    <Label className="text-sm font-medium">{setting.title}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => handleToggleMain(setting.id)}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>

              {setting.enabled && (
                <div className="ml-7 grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-md">
                  <TooltipProvider>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Email</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Switch
                              checked={setting.channels.email}
                              onCheckedChange={() => handleToggleChannel(setting.id, "email")}
                              className="data-[state=checked]:bg-blue-500 scale-75"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ricevi notifiche via email</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Push</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Switch
                              checked={setting.channels.push}
                              onCheckedChange={() => handleToggleChannel(setting.id, "push")}
                              className="data-[state=checked]:bg-blue-500 scale-75"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ricevi notifiche push sul dispositivo</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">SMS</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Switch
                              checked={setting.channels.sms}
                              onCheckedChange={() => handleToggleChannel(setting.id, "sms")}
                              className="data-[state=checked]:bg-blue-500 scale-75"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ricevi notifiche via SMS</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              )}

              {index < settings.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
