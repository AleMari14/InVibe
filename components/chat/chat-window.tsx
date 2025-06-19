"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, ArrowLeft, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"

interface Message {
  _id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    _id: string
    name: string
    email: string
    image?: string
  }
}

interface ChatWindowProps {
  roomId: string
  eventTitle?: string
}

export function ChatWindow({ roomId, eventTitle }: ChatWindowProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { refresh: refreshNotifications } = useNotifications()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Funzione per ottenere l'URL dell'immagine da Cloudinary
  const getCloudinaryImageUrl = (imageUrl: string | null | undefined, size = 32) => {
    if (!imageUrl) return `/placeholder.svg?height=${size}&width=${size}&query=user`

    // Se è già un URL Cloudinary, ottimizzalo
    if (imageUrl.includes("cloudinary.com")) {
      const parts = imageUrl.split("/upload/")
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${size * 2},h_${size * 2},c_fill,f_auto,q_auto/${parts[1]}`
      }
    }

    return imageUrl
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        // Aggiorna il counter delle notifiche dopo aver letto i messaggi
        setTimeout(() => {
          refreshNotifications()
        }, 500)
      } else {
        toast.error("Errore nel caricamento dei messaggi")
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Errore nel caricamento dei messaggi")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/messages/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
        scrollToBottom()
        // Aggiorna il counter delle notifiche
        refreshNotifications()
      } else {
        toast.error("Errore nell'invio del messaggio")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Errore nell'invio del messaggio")
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Polling per nuovi messaggi ogni 3 secondi
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [roomId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-row items-center space-y-0 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <CardTitle className="text-lg">{eventTitle || "Chat"}</CardTitle>
          <p className="text-sm text-muted-foreground">{messages.length} messaggi</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nessun messaggio ancora.</p>
              <p className="text-sm">Inizia la conversazione!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === session?.user?.id
              return (
                <div key={message._id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={getCloudinaryImageUrl(message.sender?.image, 32) || "/placeholder.svg"}
                      alt={message.sender?.name || ""}
                    />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {message.sender?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                    <div
                      className={`inline-block p-3 rounded-2xl ${
                        isOwn ? "bg-blue-500 text-white rounded-br-md" : "bg-gray-100 dark:bg-gray-800 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {new Date(message.createdAt).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
