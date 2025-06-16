"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Home, Search, Heart, User, Plus, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      active: isActive("/"),
    },
    {
      name: "Cerca",
      href: "/filtri",
      icon: Search,
      active: isActive("/filtri"),
    },
    {
      name: "Crea",
      href: session ? "/crea-evento" : "/auth/login",
      icon: Plus,
      active: isActive("/crea-evento"),
      special: true,
    },
    {
      name: "Preferiti",
      href: session ? "/preferiti" : "/auth/login",
      icon: Heart,
      active: isActive("/preferiti"),
    },
    {
      name: session ? "Profilo" : "Accedi",
      href: session ? "/profile" : "/auth/login",
      icon: session ? User : LogIn,
      active: isActive("/profile") || isActive("/auth"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-1 py-1 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className="relative flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full h-14 flex flex-col items-center justify-center gap-1 rounded-xl ${
                item.active ? "text-blue-600" : "text-muted-foreground"
              } ${item.special ? "pt-0" : ""}`}
            >
              {item.special ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 -mt-5 shadow-lg">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              <span className="text-[10px]">{item.name}</span>

              {/* Indicatore di notifiche non lette */}
              {item.name === "Profilo" && session && unreadCount > 0 && (
                <span className="absolute top-2 right-1/4 h-2 w-2 bg-red-500 rounded-full"></span>
              )}

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
