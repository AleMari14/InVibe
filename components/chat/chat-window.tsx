"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { ArrowLeft, Send, Loader2, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"
import { io, type Socket } from "socket.io-client"

interface Message {
  _id: string
  content: string
  senderId: string
  senderName: string
  senderImage?: string
  timestamp: string
  roomId: string
}

interface ChatWindowProps {
  roomId: string
  recipientName: string
  recipientImage?: string
  onBack: () => void
}

export function ChatWindow({ roomId, recipientName, recipientImage, onBack }: ChatWindowProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectionType, setConnectionType] = useState<"websocket" | "polling">("websocket")
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (session?.user && roomId) {
      initializeConnection()
      fetchMessages()
    }

    return () => {
      cleanup()
    }
  }, [session, roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeConnection = () => {
    try {
      // Try WebSocket connection first
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
      console.log("🔌 Attempting WebSocket connection to:", wsUrl)

      const socket = io(wsUrl, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        forceNew: true,
      })

      socketRef.current = socket

      socket.on("connect", () => {
        console.log("✅ WebSocket connected")
        setConnected(true)
        setConnectionType("websocket")
        reconnectAttemptsRef.current = 0

        // Stop polling if it was active
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }

        // Join room
        socket.emit("joinRoom", roomId)
      })

      socket.on("disconnect", () => {
        console.log("❌ WebSocket disconnected")
        setConnected(false)
        attemptReconnect()
      })

      socket.on("connect_error", (error) => {
        console.error("🚫 WebSocket connection error:", error)
        setConnected(false)
        attemptReconnect()
      })

      socket.on("receiveMessage", (message: Message) => {
        console.log("📨 Received message via WebSocket:", message)
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === message._id)) {
            return prev
          }
          return [...prev, message]
        })
      })

      socket.on("newMessage", (message: Message) => {
        console.log("📨 Received new message via WebSocket:", message)
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === message._id)) {
            return prev
          }
          return [...prev, message]
        })
      })
    } catch (error) {
      console.error("🚫 Failed to initialize WebSocket:", error)
      startPolling()
    }
  }

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++
      const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000 // Exponential backoff

      console.log(`🔄 Attempting reconnect ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`)

      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect()
        }
      }, delay)
    } else {
      console.log("🔄 Max reconnect attempts reached, falling back to polling")
      startPolling()
    }
  }

  const startPolling = () => {
    console.log("🔄 Starting polling fallback")
    setConnectionType("polling")
    setConnected(true) // Consider polling as "connected"

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true)
    }, 2000)
  }

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const fetchMessages = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true)

      const response = await fetch(`/api/messages/room/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        // Ensure we have a valid array
        const messagesArray = Array.isArray(data?.messages) ? data.messages : Array.isArray(data) ? data : []

        if (!isPolling) {
          setMessages(messagesArray)
        } else {
          // For polling, only add new messages
          setMessages((prev) => {
            const newMessages = messagesArray.filter((msg: Message) => !prev.some((p) => p._id === msg._id))
            return newMessages.length > 0 ? [...prev, ...newMessages] : prev
          })
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      if (!isPolling) {
        toast.error("Errore nel caricamento dei messaggi")
      }
    } finally {
      if (!isPolling) setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const messageData = {
        roomId,
        content: newMessage.trim(),
        recipientName,
      }

      // Try WebSocket first
      if (socketRef.current?.connected) {
        socketRef.current.emit("sendMessage", messageData)
        setNewMessage("")
      } else {
        // Fallback to HTTP
        const response = await fetch(`/api/messages/room/${roomId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        })

        if (response.ok) {
          setNewMessage("")
          // Immediately fetch new messages for HTTP fallback
          setTimeout(() => fetchMessages(true), 100)
        } else {
          throw new Error("Failed to send message")
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Errore nell'invio del messaggio")
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <OptimizedAvatar src={recipientImage} alt={recipientName} size={32} />
            <CardTitle className="text-lg">{recipientName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">{connectionType === "websocket" ? "WebSocket" : "Fallback"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Disconnesso</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Nessun messaggio ancora.</p>
                <p className="text-sm">Inizia la conversazione!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === session?.user?.id
                return (
                  <div key={message._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!isOwn && <OptimizedAvatar src={message.senderImage} alt={message.senderName} size={32} />}
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
