"use client"

import { useState, useEffect, useCallback } from "react"
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

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.email) {
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/messages/unread-count", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.email])

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.email) {
      setNotifications([])
      return
    }

    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }, [session?.user?.email])

  const fetchData = useCallback(async () => {
    await Promise.all([fetchUnreadCount(), fetchNotifications()])
  }, [fetchUnreadCount, fetchNotifications])

  // Fetch iniziale
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Polling ogni 10 secondi per aggiornamenti real-time più frequenti
  useEffect(() => {
    if (!session?.user?.email) return
    const interval = setInterval(fetchUnreadCount, 10000)
    return () => clearInterval(interval)
  }, [session?.user?.email, fetchUnreadCount])

  // Funzione per aggiornare manualmente
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Funzione per decrementare il counter quando si legge un messaggio
  const markAsRead = useCallback((count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count))
  }, [])

  // Funzione per azzerare il counter
  const markAllAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  }
}
