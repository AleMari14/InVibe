"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface UserProfile {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  bio?: string | null
  phone?: string | null
  location?: string | null
  dateOfBirth?: string | null
}

export function useUserProfile() {
  const { data: session, status, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      setProfile(null)
      setIsLoading(false)
      return
    }

    if (session?.user) {
      // Usa i dati della sessione come base
      setProfile({
        id: session.user.id || "",
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        bio: null,
        phone: null,
        location: null,
        dateOfBirth: null,
      })

      // Carica i dati completi del profilo dal database
      fetchProfile()
    }
  }, [session, status])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/profile")

      if (!response.ok) {
        throw new Error("Errore nel caricamento del profilo")
      }

      const data = await response.json()

      if (data.success && data.user) {
        setProfile(data.user)
      }
    } catch (err: any) {
      console.error("Errore nel caricamento del profilo:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento del profilo")
      }

      const data = await response.json()

      if (data.success) {
        // Aggiorna lo stato locale
        setProfile((prev) => (prev ? { ...prev, ...updates } : null))

        // Aggiorna la sessione se necessario
        if (updates.name || updates.image) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: updates.name || session?.user?.name,
              image: updates.image || session?.user?.image,
            },
          })
        }

        return { success: true }
      } else {
        throw new Error(data.error || "Errore nell'aggiornamento")
      }
    } catch (err: any) {
      console.error("Errore nell'aggiornamento del profilo:", err)
      return { success: false, error: err.message }
    }
  }

  const refreshProfile = () => {
    fetchProfile()
  }

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile,
    isAuthenticated: status === "authenticated",
  }
}
