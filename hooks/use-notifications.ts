"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export function useNotifications() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUnreadCount = async () => {
    if (!session?.user?.email) {
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/messages/unread-count")
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch iniziale
  useEffect(() => {
    fetchUnreadCount()
  }, [session])

  // Polling ogni 30 secondi per aggiornamenti real-time
  useEffect(() => {
    if (!session?.user?.email) return

    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [session])

  // Funzione per aggiornare manualmente il counter
  const refreshUnreadCount = () => {
    fetchUnreadCount()
  }

  // Funzione per decrementare il counter quando si legge un messaggio
  const markAsRead = (count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count))
  }

  // Funzione per azzerare il counter
  const markAllAsRead = () => {
    setUnreadCount(0)
  }

  return {
    unreadCount,
    isLoading,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
  }
}
