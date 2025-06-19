"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  fromUserName?: string
  eventId?: string
  roomId?: string
}

export function useNotifications() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchData = async () => {
    if (!session?.user?.email) {
      setUnreadCount(0)
      setNotifications([])
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch iniziale
  useEffect(() => {
    fetchData()
  }, [session])

  // Polling ogni 30 secondi per aggiornamenti real-time
  useEffect(() => {
    if (!session?.user?.email) return
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [session])

  // Funzione per aggiornare manualmente il counter
  const refresh = () => fetchData()

  // Funzione per decrementare il counter quando si legge un messaggio
  const markAsRead = (count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count))
  }

  // Funzione per azzerare il counter
  const markAllAsRead = () => {
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  }
}
