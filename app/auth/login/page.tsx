"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const message = searchParams.get("message")
  const authError = searchParams.get("error")

  // Pre-compila con credenziali demo
  useEffect(() => {
    const isDemoMode = searchParams.get("demo") === "true"
    if (isDemoMode) {
      setEmail("marco@example.com")
      setPassword("password123")
    }

    // Mostra messaggio di successo registrazione
    if (message === "registration-success") {
      setSuccess("Registrazione completata! Ora puoi effettuare il login.")
    }

    // Gestisci errori OAuth
    if (authError) {
      switch (authError) {
        case "OAuthSignin":
          setError("Errore durante l'accesso con Google. Verifica la configurazione OAuth.")
          break
        case "OAuthCallback":
          setError("Errore di callback OAuth. L'URI di reindirizzamento potrebbe non essere configurato correttamente.")
          break
        case "OAuthCreateAccount":
          setError("Errore durante la creazione dell'account Google.")
          break
        case "EmailCreateAccount":
          setError("Errore durante la creazione dell'account email.")
          break
        case "Callback":
          setError("Errore di callback. Riprova.")
          break
        case "OAuthAccountNotLinked":
          setError("Account già esistente con email diversa. Usa l'email originale.")
          break
        case "EmailSignin":
          setError("Errore durante l'invio dell'email di verifica.")
          break
        case "CredentialsSignin":
          setError("Email o password non corretti.")
          break
        case "SessionRequired":
          setError("Accesso richiesto. Effettua il login.")
          break
        case "Configuration":
          setError("Errore di configurazione OAuth. Controlla le credenziali Google.")
          break
        default:
          setError(`Si è verificato un errore durante l'autenticazione: ${authError}`)
      }
    }
  }, [searchParams, message, authError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validazione client-side
    if (!email.trim() || !password) {
      setError("Email e password sono obbligatori")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Inserisci un'email valida")
      setIsLoading(false)
      return
    }

    try {
      console.log("🔐 Attempting login with:", { email: email.toLowerCase().trim(), password: "***" })

      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl: "https://in-vibe.vercel.app/",
      })

      console.log("📋 Login result:", result)

      if (result?.error) {
        console.error("❌ Login error:", result.error)
        switch (result.error) {
          case "CredentialsSignin":
            setError("Email o password non corretti")
            break
          case "EmailSignin":
            setError("Errore durante l'accesso. Verifica le credenziali.")
            break
          default:
            setError("Errore durante il login. Riprova.")
        }
      } else if (result?.ok) {
        setSuccess("Login effettuato con successo!")

        // Aggiorna la sessione
        const session = await getSession()
        console.log("✅ Session after login:", session)

        // Reindirizza sempre alla produzione
        setTimeout(() => {
          window.location.href = "https://in-vibe.vercel.app/"
        }, 1000)
      } else {
        setError("Si è verificato un errore durante il login")
      }
    } catch (error) {
      console.error("💥 Login exception:", error)
      setError("Si è verificato un errore. Riprova.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      console.log("🔍 Starting Google OAuth...")
      console.log("🌐 Current URL:", window.location.href)

      const result = await signIn("google", {
        callbackUrl: "https://in-vibe.vercel.app/",
        redirect: true,
      })
      console.log("📋 Google OAuth result:", result)
    } catch (error) {
      console.error("💥 Google sign in error:", error)
      setError("Errore durante l'accesso con Google")
      setGoogleLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail("marco@example.com")
    setPassword("password123")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="bg-card/80 hover:bg-card backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IV</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              InVibe
            </h1>
          </div>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Bentornato!</CardTitle>
            <p className="text-muted-foreground">Accedi al tuo account per continuare</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-border hover:bg-accent"
              onClick={handleGoogleSignIn}
              disabled={isLoading || googleLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accesso con Google...
                </>
              ) : (
                "Continua con Google"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">oppure</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="mario@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background border-border"
                    autoComplete="email"
                    required
                    disabled={isLoading || googleLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-background border-border"
                    autoComplete="current-password"
                    required
                    disabled={isLoading || googleLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || googleLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fillDemoCredentials}
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                  disabled={isLoading || googleLoading}
                >
                  Usa credenziali demo
                </Button>
                <Link href="/auth/password-dimenticata" className="text-sm text-blue-400 hover:underline">
                  Password dimenticata?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading || googleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  "Accedi"
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-muted-foreground">Non hai un account? </span>
              <Link href="/auth/registrati" className="text-blue-400 hover:underline font-medium">
                Registrati
              </Link>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400 font-medium mb-3 text-center">🎭 Account Demo Pronto</p>
              <div className="space-y-2 text-center">
                <p className="text-xs text-blue-300">📧 Email: marco@example.com</p>
                <p className="text-xs text-blue-300">🔑 Password: password123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoCredentials}
                className="mt-3 w-full text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                disabled={isLoading || googleLoading}
              >
                ⚡ Compila e Accedi Subito
              </Button>
            </div>

            {/* Success Message */}
            <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-400 font-medium mb-2 text-center">✅ Google OAuth Configurato!</p>
              <div className="space-y-1 text-center">
                <p className="text-xs text-green-300">🔗 URI di reindirizzamento: OK</p>
                <p className="text-xs text-green-300">🌐 Origini JavaScript: OK</p>
                <p className="text-xs text-green-300">🎉 Pronto per il login Google!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
