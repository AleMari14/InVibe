"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Home, Heart, Plus, LogIn, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationsSheet } from "./notifications-sheet"

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { unreadCount } = useNotifications()
  const [mounted, setMounted] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname?.startsWith(path)
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home, active: isActive("/") },
    { name: "Preferiti", href: "/preferiti", icon: Heart, active: isActive("/preferiti") },
    { name: "Crea", href: "/crea-evento", icon: Plus, active: isActive("/crea-evento"), special: true },
    { name: "Messaggi", href: "/messaggi", icon: MessageSquare, active: isActive("/messaggi") },
    { name: "Profilo", href: "/profile", icon: OptimizedAvatar, active: isActive("/profile"), isProfile: true },
  ]

  const handleAuthRedirect = (e: React.MouseEvent, href: string) => {
    if (!session) {
      e.preventDefault()
      window.location.href = "/auth/login"
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb">
        <div className="flex items-center justify-around py-1 px-1 max-w-md mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleAuthRedirect(e, item.href)}
              className="relative flex-1"
              aria-current={item.active ? "page" : undefined}
            >
              <div
                className={`w-full h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                  item.active ? "text-blue-600" : "text-muted-foreground"
                } ${item.special ? "pt-0" : ""}`}
              >
                {item.special ? (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 -mt-6 shadow-lg">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                ) : item.isProfile ? (
                  <div className="relative">
                    {session ? (
                      <OptimizedAvatar
                        src={session.user?.image}
                        alt={session.user?.name || ""}
                        size={28}
                        className="h-7 w-7"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                        <LogIn className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.name === "Messaggi" && session && unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </div>
                )}
                <span className="text-[10px] font-medium">{session && item.isProfile ? "Profilo" : item.name}</span>

                {item.active && !item.special && (
                  <motion.div
                    layoutId="navigation-indicator"
                    className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      {session && <NotificationsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />}
    </>
  )
}
