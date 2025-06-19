"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Home, Heart, Plus, LogIn, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotifications } from "@/hooks/use-notifications"

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { unreadCount } = useNotifications()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname?.startsWith(path)
  }

  // Funzione per ottenere l'URL dell'immagine ottimizzato
  const getOptimizedImageUrl = (imageUrl: string | null | undefined, size = 24) => {
    if (!imageUrl) return `/placeholder.svg?height=${size}&width=${size}&query=user`

    // Se è un URL Cloudinary, ottimizzalo
    if (imageUrl.includes("cloudinary.com")) {
      try {
        const parts = imageUrl.split("/upload/")
        if (parts.length === 2) {
          // Aggiungi trasformazioni Cloudinary per ottimizzare l'immagine
          return `${parts[0]}/upload/w_${size * 2},h_${size * 2},c_fill,f_auto,q_auto,dpr_2.0/${parts[1]}`
        }
      } catch (error) {
        console.error("Error optimizing Cloudinary URL:", error)
        return imageUrl // Fallback all'URL originale
      }
    }

    // Se è un URL Google (da OAuth), restituiscilo così com'è
    if (imageUrl.includes("googleusercontent.com")) {
      return imageUrl
    }

    // Per altri URL, restituiscili così come sono
    return imageUrl
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      active: isActive("/") && !isActive("/preferiti") && !isActive("/messaggi") && !isActive("/profile"),
    },
    {
      name: "Preferiti",
      href: session ? "/preferiti" : "/auth/login",
      icon: Heart,
      active: isActive("/preferiti"),
    },
    {
      name: "Crea",
      href: session ? "/crea-evento" : "/auth/login",
      icon: Plus,
      active: isActive("/crea-evento"),
      special: true,
    },
    {
      name: "Messaggi",
      href: session ? "/messaggi" : "/auth/login",
      icon: MessageSquare,
      active: isActive("/messaggi"),
      badge: session && unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: session ? "Profilo" : "Accedi",
      href: session ? "/profile" : "/auth/login",
      icon: session ? null : LogIn, // null per usare avatar
      active: isActive("/profile") || isActive("/auth") || isActive("/prenotazioni") || isActive("/impostazioni"),
      isProfile: true,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-1 px-1 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className="relative flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                item.active ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30" : "text-muted-foreground"
              } ${item.special ? "pt-0" : ""}`}
            >
              {item.special ? (
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 -mt-6 shadow-lg">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
              ) : item.isProfile && session ? (
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={getOptimizedImageUrl(session.user?.image, 24) || "/placeholder.svg"}
                      alt={session.user?.name || ""}
                      onError={(e) => {
                        console.log("Navigation avatar failed to load:", e.currentTarget.src)
                      }}
                    />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {session.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {item.active && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
                  )}
                </div>
              ) : (
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </div>
              )}
              <span className="text-[10px] font-medium">{item.name}</span>

              {/* Indicatore attivo */}
              {item.active && !item.special && (
                <motion.div
                  layoutId="navigation-indicator"
                  className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
