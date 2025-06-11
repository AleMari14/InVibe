"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Heart, MessageSquare, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/filtri", icon: Search, label: "Cerca" },
  { href: "/preferiti", icon: Heart, label: "Preferiti" },
  { href: "/messaggi", icon: MessageSquare, label: "Messaggi", hasNotifications: true },
  { href: "/profile", icon: User, label: "Profilo" },
]

export function Navigation() {
  const pathname = usePathname()
  const { unreadMessages, unreadCount } = useNotifications()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const showBadge = item.hasNotifications && (unreadMessages > 0 || unreadCount > 0)
          const badgeCount = item.href === "/messaggi" ? unreadMessages : unreadCount

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
