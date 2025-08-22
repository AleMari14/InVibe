"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Heart,
  Bell,
  Settings,
  LogOut,
  Edit,
  Star,
  MapPin,
  Phone,
  Mail,
  Camera,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { ProfileImageUpdater } from "@/components/profile/profile-image-updater"
import { motion } from "framer-motion"
import { toast } from "sonner"
import Link from "next/link"

interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  bio?: string
  phone?: string
  location?: string
  joinedDate: string
  eventsHosted: number
  eventsAttended: number
  rating: number
  reviewCount: number
  verified: boolean
}

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
  color?: string
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImageUpdater, setShowImageUpdater] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        toast.error("Errore nel caricamento del profilo")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Errore nel caricamento del profilo")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" })
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Errore durante il logout")
    }
  }

  const handleProfileUpdate = (updatedProfile: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updatedProfile })
    }
    // Update session if name or image changed
    if (updatedProfile.name || updatedProfile.image) {
      update({
        name: updatedProfile.name || profile?.name,
        image: updatedProfile.image || profile?.image,
      })
    }
  }

  const menuItems: MenuItem[] = [
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "I Miei Eventi",
      href: "/user/events",
      color: "text-blue-600",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Le Mie Prenotazioni",
      href: "/prenotazioni",
      color: "text-green-600",
    },
    {
      icon: <Heart className="h-5 w-5" />,
      label: "Preferiti",
      href: "/preferiti",
      color: "text-red-600",
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Notifiche",
      href: "/notifiche",
      color: "text-orange-600",
    },
  ]

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Il Mio Profilo
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(true)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  <OptimizedAvatar
                    src={profile?.image || session?.user?.image}
                    alt={profile?.name || session?.user?.name || "Profilo"}
                    size={120}
                    className="ring-4 ring-blue-500/20"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowImageUpdater(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">
                      {profile?.name || session?.user?.name || "Nome non disponibile"}
                    </h2>
                    {profile?.verified && (
                      <Badge className="bg-green-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Verificato
                      </Badge>
                    )}
                  </div>

                  {profile?.bio && <p className="text-gray-400 mb-4 leading-relaxed">{profile.bio}</p>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span>{profile?.email || session?.user?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="h-4 w-4 text-green-400" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="h-4 w-4 text-red-400" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span>
                        Iscritto dal{" "}
                        {profile?.joinedDate ? new Date(profile.joinedDate).toLocaleDateString("it-IT") : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Eventi Organizzati",
                value: profile?.eventsHosted || 0,
                color: "text-blue-400",
                bgColor: "bg-blue-600/20",
              },
              {
                label: "Eventi Partecipati",
                value: profile?.eventsAttended || 0,
                color: "text-green-400",
                bgColor: "bg-green-600/20",
              },
              {
                label: "Rating",
                value: profile?.rating ? `${profile.rating.toFixed(1)}⭐` : "N/A",
                color: "text-yellow-400",
                bgColor: "bg-yellow-600/20",
              },
              {
                label: "Recensioni",
                value: profile?.reviewCount || 0,
                color: "text-purple-400",
                bgColor: "bg-purple-600/20",
              },
            ].map((stat, index) => (
              <Card key={index} className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 ${stat.bgColor}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Menu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {menuItems.map((item, index) => (
                  <Link key={index} href={item.href}>
                    <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={item.color}>{item.icon}</div>
                        <span className="text-gray-200 group-hover:text-white transition-colors">{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="bg-blue-600 text-white">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
                <Separator className="bg-gray-700" />
                <Link href="/impostazioni">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-200 group-hover:text-white transition-colors">Impostazioni</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-900/20 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-red-400" />
                    <span className="text-gray-200 group-hover:text-red-300 transition-colors">Esci</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      {showEditDialog && profile && (
        <EditProfileDialog profile={profile} onClose={() => setShowEditDialog(false)} onUpdate={handleProfileUpdate} />
      )}

      {/* Profile Image Updater */}
      {showImageUpdater && (
        <ProfileImageUpdater
          currentImage={profile?.image || session?.user?.image}
          onClose={() => setShowImageUpdater(false)}
          onUpdate={(imageUrl) => {
            handleProfileUpdate({ image: imageUrl })
            setShowImageUpdater(false)
          }}
        />
      )}
    </div>
  )
}
