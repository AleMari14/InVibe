"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Shield, HelpCircle, LogOut, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import Link from "next/link"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { LanguageSettings } from "@/components/settings/language-settings"
import { PaymentSettings } from "@/components/settings/payment-settings"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { ThemeSettings } from "@/components/profile/theme-settings"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ImpostazioniPage() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = () => {
    toast.info("Disconnessione in corso...", {
      duration: 1000,
    })
    setTimeout(() => {
      signOut({ callbackUrl: "/" })
    }, 1000)
  }

  const handleChangeAccount = () => {
    toast.info("Cambio account in corso...", {
      duration: 1000,
    })
    setTimeout(() => {
      signOut({ callbackUrl: "/auth/login" })
    }, 1000)
  }

  // Previene errori di idratazione
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header con effetto glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10"
      >
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="hover:bg-blue-500/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Impostazioni
            </h1>
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
        {/* Tema */}
        <ThemeSettings />

        {/* Notifiche */}
        <NotificationSettings />

        {/* Lingua */}
        <LanguageSettings />

        {/* Metodi di Pagamento */}
        <PaymentSettings />

        {/* Privacy e Sicurezza */}
        <PrivacySettings />

        {/* Aiuto e Supporto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-600"
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                Aiuto e Supporto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aiuto e Supporto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Hai bisogno di aiuto con InVibe? Ecco alcune risorse utili:
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsHelpDialogOpen(false)
                      toast.success("Centro assistenza aperto in una nuova scheda")
                    }}
                  >
                    Centro Assistenza
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsHelpDialogOpen(false)
                      toast.success("FAQ aperte in una nuova scheda")
                    }}
                  >
                    Domande Frequenti
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsHelpDialogOpen(false)
                      toast.success("Contatto con il supporto avviato")
                    }}
                  >
                    Contatta il Supporto
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="space-y-3 pt-4"
        >
          <Button
            variant="outline"
            className="w-full justify-start border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-600"
            onClick={handleChangeAccount}
          >
            <UserCheck className="h-4 w-4 mr-3" />
            Cambia Account
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Disconnetti
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
