"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { toast } from "sonner"

export default function PasswordDimenticataPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Inserisci il tuo indirizzo email")
      return
    }

    if (!email.includes("@")) {
      setError("Inserisci un indirizzo email valido")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      console.log("📧 Sending password reset request for:", email)

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Errore durante l'invio dell'email")
      }

      console.log("✅ Password reset request successful")
      setIsSuccess(true)
      toast.success("Email di reset inviata con successo!")
    } catch (error: any) {
      console.error("💥 Password reset error:", error)
      setError(error.message || "Errore durante l'invio dell'email di reset")
      toast.error("Errore durante l'invio dell'email")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Email Inviata!
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Abbiamo inviato le istruzioni per reimpostare la password all'indirizzo{" "}
                  <span className="font-semibold text-blue-600">{email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Controlla anche la cartella spam se non vedi l'email nella posta in arrivo.
                </p>

                <div className="space-y-3">
                  <Link href="/auth/login">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg">
                      Torna al Login
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSuccess(false)
                      setEmail("")
                      setError("")
                    }}
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    Invia di nuovo
                  </Button>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="icon" className="absolute left-4 top-4 hover:bg-blue-100">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Password Dimenticata
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Inserisci il tuo indirizzo email e ti invieremo le istruzioni per reimpostare la password
            </p>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Indirizzo Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="mario.rossi@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white/70"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Invia Email di Reset
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Ti sei ricordato la password?{" "}
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Torna al Login
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-0 w-16 h-16 bg-pink-200/30 rounded-full blur-xl"></div>
      </motion.div>
    </div>
  )
}
