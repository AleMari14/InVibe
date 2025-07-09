"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Home, Heart, Plus, MessageSquare, Bell, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationsSheet } from "./notifications-sheet"

function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { unreadCount: unreadMessagesCount } = useNotifications() // Assuming this is for messages
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="fixed bottom-0 left-0 right-0 z-[100] h-16 bg-background/95 border-t border-border" />
  }

  const handleAuthRedirect = (e: React.MouseEvent, href: string) => {
    if (status === "unauthenticated") {
      e.preventDefault()
      router.push("/auth/login")
    }
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Preferiti", href: "/preferiti", icon: Heart },
    { name: "Crea", href: "/crea-evento", icon: Plus, special: true },
    { name: "Messaggi", href: "/messaggi", icon: MessageSquare, badge: unreadMessagesCount },
    // { name: "Notifiche", href: "#", icon: Bell, action: () => setIsSheetOpen(true) }, // Rimossa
  ]

  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path))

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb">
        <div className="flex items-center justify-around py-1 px-1 max-w-md mx-auto">
          {navItems.map((item) => (
            <div key={item.name} className="relative flex-1">
              <button
                onClick={(e) => {
                  if (item.action) {
                    if (status === "unauthenticated") {
                      router.push("/auth/login")
                      return
                    }
                    item.action()
                  } else {
                    handleAuthRedirect(e, item.href)
                    router.push(item.href)
                  }
                }}
                className={`w-full h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                  item.href !== "#" && isActive(item.href) ? "text-primary" : "text-muted-foreground"
                } ${item.special ? "pt-0" : ""}`}
              >
                {item.special ? (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 -mt-6 shadow-lg">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.badge && item.badge > 0 ? (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white">
                        {item.badge > 9 ? "9+" : item.badge}
                      </Badge>
                    ) : null}
                  </div>
                )}
                <span className="text-[10px] font-medium">{item.name}</span>
                {item.href !== "#" && isActive(item.href) && !item.special && (
                  <motion.div
                    layoutId="navigation-indicator"
                    className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </div>
          ))}
          {/* Profile Link */}
          <div className="relative flex-1">
            <Link
              href={status === "authenticated" ? "/profile" : "/auth/login"}
              className={`w-full h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                isActive("/profile") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {status === "authenticated" ? (
                <OptimizedAvatar src={session?.user?.image} alt={session?.user?.name || ""} size={24} />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="text-[10px] font-medium">Profilo</span>
              {isActive("/profile") && (
                <motion.div
                  layoutId="navigation-indicator-profile"
                  className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          </div>
        </div>
      </div>
      {/* {status === "authenticated" && <NotificationsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />} */}
    </>
  )
}

export default Navigation
