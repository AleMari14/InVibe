"use client"

import { useState } from "react"
import { ArrowLeft, Bell, MessageSquare, Calendar, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useNotifications } from "@/hooks/use-notifications"
import { toast } from "sonner"

interface Notification {
  _id: string
  type: "message" | "booking" | "favorite" | "review" | "event" | "system"
  title: string
  message: string
  eventId?: string
  eventTitle?: string
  roomId?: string
  fromUserId?: string
  fromUserName?: string
  fromUserImage?: string
  read: boolean
  createdAt: string
}

export default function NotifichePage() {
  const [activeTab, setActiveTab] = useState("all")
  const { notifications, unreadCount, markAsRead } = useNotifications()

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "booking":
        return <Calendar className="h-5 w-5 text-green-500" />
      case "favorite":
        return <Star className="h-5 w-5 text-yellow-500" />
      case "review":
        return <Star className="h-5 w-5 text-orange-500" />
      case "event":
        return <Users className="h-5 w-5 text-purple-500" />
      case "system":
        return <Bell className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id)
    }

    // Navigate based on notification type
    if (notification.type === "message" && notification.roomId) {
      window.location.href = `/messaggi/${notification.roomId}`
    } else if (notification.eventId) {
      window.location.href = `/evento/${notification.eventId}`
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      for (const notification of unreadNotifications) {
        await markAsRead(notification._id)
      }
      toast.success("Tutte le notifiche sono state segnate come lette")
    } catch (error) {
      toast.error("Errore nel segnare le notifiche come lette")
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notif.read
    return notif.type === activeTab
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} min fa`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ore fa`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} giorni fa`
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Notifiche
              </h1>
              {unreadCount > 0 && <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Segna tutte come lette
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="all">Tutte</TabsTrigger>
            <TabsTrigger value="unread">Non lette</TabsTrigger>
            <TabsTrigger value="message">Messaggi</TabsTrigger>
            <TabsTrigger value="booking">Eventi</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 py-4">
        {filteredNotifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nessuna notifica</h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "unread" ? "Tutte le notifiche sono state lette" : "Le tue notifiche appariranno qui"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card
                    className={`border-border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                      !notification.read ? "ring-2 ring-blue-500/20" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {notification.fromUserImage ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={notification.fromUserImage || "/placeholder.svg"} />
                              <AvatarFallback>{notification.fromUserName?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              {getIcon(notification.type)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3
                              className={`font-medium ${
                                !notification.read ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.createdAt)}
                              </span>
                              {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </div>
                          </div>

                          <p className={`text-sm ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.message}
                          </p>

                          {notification.eventTitle && (
                            <p className="text-xs text-muted-foreground mt-1">Evento: {notification.eventTitle}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
