"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { useNotifications } from "@/hooks/use-notifications"

interface Message {
  _id: string
  roomId: string
  content: string
  senderId: string
  senderName: string
  senderImage?: string
  createdAt: string
  readBy: string[]
}

interface ChatWindowProps {
  roomId: string
  otherUser: {
    name: string
    email: string
    image?: string
  }
  onClose?: () => void
  initialMessage?: string
}

export function ChatWindow({ roomId, otherUser, onClose, initialMessage }: ChatWindowProps) {
  const { data: session } = useSession()
  const { refresh: refreshNotifications } = useNotifications()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (roomId) {
      fetchMessages()
      startPolling()
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [roomId])

  useEffect(() => {
    // Pre-compila il messaggio iniziale se fornito
    if (initialMessage && !newMessage) {
      setNewMessage(initialMessage)
    }
  }, [initialMessage])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true)
    }, 3000) // Polling ogni 3 secondi
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)

      const response = await fetch(`/api/messages/${roomId}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch messages")
      }

      const data = await response.json()
      setMessages(data.messages || [])

      // Aggiorna il counter delle notifiche dopo aver caricato i messaggi
      if (!silent) {
        setTimeout(() => {
          refreshNotifications()
        }, 500)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    try {
      const response = await fetch(`/api/messages/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const sentMessage = await response.json()
      setMessages((prev) => [...prev, sentMessage])

      // Aggiorna il counter delle notifiche
      setTimeout(() => {
        refreshNotifications()
        fetchMessages(true)
      }, 500)
    } catch (error) {
      console.error("Error sending message:", error)
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Oggi"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ieri"
    } else {
      return date.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Caricamento chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4 pb-24" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nessun messaggio ancora.</p>
              <p className="text-sm">Inizia la conversazione con {otherUser.name}!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.senderId === session?.user?.email
              const showDate =
                index === 0 || formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt)

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="text-center text-xs text-muted-foreground my-4">
                      <span className="bg-background px-2 py-1 rounded-full border">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                    <OptimizedAvatar
                      src={isOwnMessage ? session?.user?.image : message.senderImage || otherUser.image}
                      alt={isOwnMessage ? session?.user?.name || "" : message.senderName || otherUser.name}
                      size={32}
                      className="h-8 w-8"
                    />
                    <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input - Posizionato sopra la navbar */}
      <div className="fixed bottom-20 left-0 right-0 border-t bg-card/95 backdrop-blur-md p-4 z-20">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Scrivi a ${otherUser.name}...`}
            disabled={isSending}
            className="flex-1 bg-background"
            maxLength={1000}
          />
          <Button type="submit" disabled={!newMessage.trim() || isSending} size="icon">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Premi Invio per inviare • {newMessage.length}/1000
        </p>
      </div>
    </div>
  )
}
