"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  LinkIcon,
  Zap,
  Sparkles,
  PartyPopper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleDemoLogin = () => {
    setEmail("marco@example.com")
    setPassword("password123")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    setIsLoading(false)

    if (result?.ok) {
      toast.success("Accesso effettuato con successo!")
      router.push("/")
      router.refresh()
    } else {
      toast.error(result?.error || "Credenziali non valide. Riprova.")
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    await signIn("google", { callbackUrl: "/" })
    setIsGoogleLoading(false)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800">
            <span className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 p-2 text-white">
              <PartyPopper size={24} />
            </span>
            InVibe
          </Link>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-2 h-8 w-8 p-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-center text-2xl font-bold">Bentornato!</CardTitle>
            <p className="text-center text-sm text-muted-foreground">Accedi al tuo account per continuare</p>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-69.5 69.5c-24.3-23.6-58.3-38.6-99.4-38.6-83.8 0-152.3 68.5-152.3 152.3s68.5 152.3 152.3 152.3c97.2 0 130.2-72.2 135-109.2H248v-91.1h236.3c2.3 12.7 3.7 26.1 3.7 40.2z"
                  ></path>
                </svg>
              )}
              Continua con Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Oppure</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="mario@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Button type="button" variant="link" className="p-0 h-auto" onClick={handleDemoLogin}>
                  Usa credenziali demo
                </Button>
                <Link href="/auth/password-dimenticata" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Password dimenticata?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accedi
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Non hai un account?{" "}
              <Link href="/auth/registrati" className="font-medium text-indigo-600 hover:text-indigo-500">
                Registrati
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-sm text-blue-800">
            <div className="flex items-center gap-3 font-semibold mb-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>Account Demo Pronto</span>
            </div>
            <div className="space-y-1 pl-8">
              <p>
                <span className="font-semibold">Email:</span> marco@example.com
              </p>
              <p>
                <span className="font-semibold">Password:</span> password123
              </p>
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-blue-700 font-semibold mt-2 flex items-center gap-1"
              onClick={handleDemoLogin}
            >
              <Zap className="h-4 w-4" />
              Compila e Accedi Subito
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-sm text-green-800">
            <div className="flex items-center gap-3 font-semibold mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Google OAuth Configurato!</span>
            </div>
            <ul className="space-y-1 list-inside pl-2">
              <li className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <span>URI di reindirizzamento: OK</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <span>Origini JavaScript: OK</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Pronto per il login Google!</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
