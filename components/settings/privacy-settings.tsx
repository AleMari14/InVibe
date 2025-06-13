"use client"

import type React from "react"

import { useState } from "react"
import { Shield, Eye, EyeOff, Lock, Fingerprint } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface PrivacySetting {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  enabled: boolean
}

export function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: "two-factor",
      title: "Autenticazione a due fattori",
      description: "Aumenta la sicurezza del tuo account",
      icon: <Lock className="h-4 w-4 text-blue-500" />,
      enabled: false,
    },
    {
      id: "profile-visibility",
      title: "Profilo pubblico",
      description: "Rendi visibile il tuo profilo agli altri utenti",
      icon: <Eye className="h-4 w-4 text-green-500" />,
      enabled: true,
    },
    {
      id: "biometric",
      title: "Autenticazione biometrica",
      description: "Usa l'impronta digitale o Face ID per accedere",
      icon: <Fingerprint className="h-4 w-4 text-purple-500" />,
      enabled: false,
    },
  ])

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleSetting = async (id: string) => {
    try {
      // Aggiorniamo localmente
      setSettings((prev) =>
        prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
      )

      // Simuliamo una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 600))

      const setting = settings.find((s) => s.id === id)
      const newState = !setting?.enabled

      toast.success(newState ? `${setting?.title} attivato` : `${setting?.title} disattivato`)
    } catch (error) {
      // Ripristiniamo lo stato precedente in caso di errore
      setSettings((prev) =>
        prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
      )
      toast.error("Errore durante l'aggiornamento delle impostazioni")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validazione
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("Le password non corrispondono")
        return
      }

      // Simuliamo una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 800))

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsPasswordDialogOpen(false)
      toast.success("Password aggiornata con successo")
    } catch (error) {
      toast.error("Errore durante l'aggiornamento della password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Privacy e Sicurezza
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => handleToggleSetting(setting.id)}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              {index < settings.length - 1 && <Separator className="my-4" />}
            </div>
          ))}

          <Separator className="my-4" />

          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-600">
                <Lock className="h-4 w-4 mr-2" />
                Cambia Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cambia Password</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Password Attuale</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nuova Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Conferma Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Aggiornamento..." : "Aggiorna Password"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="w-full mt-2 border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
            onClick={() => toast.info("Questa funzionalità sarà disponibile a breve")}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Elimina Dati di Navigazione
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
