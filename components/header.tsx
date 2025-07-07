"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Bell, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { useNotifications } from "@/hooks/use-notifications"
import { Badge } from "@/components/ui/badge"
import { NotificationsSheet } from "./notifications-sheet"
import { useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const { unreadCount } = useNotifications()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">InVibe</span>
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Button variant="ghost" size="icon" className="relative" onClick={() => setIsSheetOpen(true)}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifiche</span>
                </Button>
                <Link href="/profile">
                  <OptimizedAvatar src={session.user?.image} alt={session.user?.name || "Profilo"} size={32} />
                </Link>
              </>
            ) : (
              <Button asChild>
                <Link href="/auth/login">Accedi</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <NotificationsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  )
}
