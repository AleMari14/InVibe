"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useNotifications } from "@/hooks/use-notifications"
import { Bell, MessageSquare, Calendar, Star, Loader2, XCircle } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { timeAgo } from "@/lib/utils"

interface NotificationsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const { notifications, isLoading, error, markAllAsRead, markAsRead } = useNotifications()
  const router = useRouter()

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification._id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
    onOpenChange(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "new_message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "new_booking":
        return <Calendar className="h-5 w-5 text-green-500" />
      case "new_review":
        return <Star className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Notifiche</SheetTitle>
          <SheetDescription>
            {notifications.length > 0 ? "Ecco le tue notifiche più recenti." : "Non hai nuove notifiche."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto -mx-6">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="font-semibold">Errore nel caricamento</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-semibold">Nessuna notifica</p>
              <p className="text-sm text-muted-foreground">Quando ci saranno novità, le troverai qui.</p>
            </div>
          )}
          {!isLoading && notifications.length > 0 && (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-accent transition-colors ${
                    !notification.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.read && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-center" />}
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={markAllAsRead}
              disabled={notifications.every((n) => n.read)}
            >
              Segna tutte come lette
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
