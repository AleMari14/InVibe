"use client"

import { useState } from "react"
import { ArrowLeft, Shield, Globe, CreditCard, HelpCircle, LogOut, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { ThemeSettings } from "@/components/profile/theme-settings"
import { NotificationSettings } from "@/components/profile/notification-settings"
import { toast } from "sonner"

export default function ImpostazioniPage() {
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleChangeAccount = () => {
    signOut({ callbackUrl: "/auth/login" })
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
          <ThemeSettings />
        </motion.div>

        {/* Notification Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <NotificationSettings />
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
