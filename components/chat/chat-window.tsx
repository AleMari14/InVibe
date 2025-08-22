"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Send, ArrowLeft, Loader2, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader } from "@/components/ui/card"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"

interface Message {
  _id: string
  content: string
  senderId: string
  senderName: string
  senderImage?: string
  createdAt: string
  read?: boolean
}

interface ChatUser {
  _id: string
  name: string
  image?: string
}

interface ChatWindowProps {
  roomId: string
  otherUser: ChatUser
  eventTitle?: string
}

export function ChatWindow({ roomId, otherUser, eventTitle }: ChatWindowProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionType, setConnectionType] = useState<"websocket" | "polling">("polling")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 3

  useEffect(() => {
    if (session?.user && roomId) {
      fetchMessages()
      initializeConnection()
      markMessagesAsRead()
    }

    return () => {
      cleanup()
    }
  }, [roomId, session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const cleanup = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const initializeConnection = () => {
    // Start with polling as primary method for Vercel
    startPolling()

    // Try WebSocket as enhancement (but don't rely on it)
    tryWebSocketConnection()
  }

  const tryWebSocketConnection = () => {
    try {
      console.log("🔌 Attempting WebSocket connection...")

      const socketUrl = typeof window !== "undefined" ? window.location.origin : ""
      const newSocket = io(socketUrl, {
        path: "/api/socket",
        transports: ["polling", "websocket"],
        timeout: 10000,
        reconnection: false, // We'll handle reconnection manually
        forceNew: true,
      })

      newSocket.on("connect", () => {
        console.log("✅ WebSocket connected:", newSocket.id)
        setIsConnected(true)
        setConnectionType("websocket")
        reconnectAttemptsRef.current = 0

        // Stop polling when WebSocket is connected
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }

        // Join room and authenticate
        newSocket.emit("joinRoom", roomId)
        if (session?.user) {
          newSocket.emit("authenticate", {
            userId: session.user.id,
            email: session.user.email,
          })
        }
      })

      newSocket.on("connect_error", (error) => {
        console.log("❌ WebSocket connection failed:", error.message)
        setIsConnected(false)
        handleWebSocketFailure()
      })

      newSocket.on("disconnect", (reason) => {
        console.log("❌ WebSocket disconnected:", reason)
        setIsConnected(false)
        handleWebSocketFailure()
      })

      newSocket.on("receiveMessage", (message: Message) => {
        console.log("📨 Received message via WebSocket:", message)
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id)
          if (exists) return prev
          return [...prev, message]
        })
        scrollToBottom()
      })

      setSocket(newSocket)
    } catch (error) {
      console.error("❌ WebSocket initialization failed:", error)
      handleWebSocketFailure()
    }
  }

  const handleWebSocketFailure = () => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++
      const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000

      console.log(
        `🔄 WebSocket reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`,
      )

      reconnectTimeoutRef.current = setTimeout(() => {
        tryWebSocketConnection()
      }, delay)
    } else {
      console.log("🔄 Max WebSocket reconnect attempts reached, using polling only")
      startPolling()
    }
  }

  const startPolling = () => {
    if (pollingIntervalRef.current) return // Already polling

    console.log("🔄 Starting polling mode")
    setConnectionType("polling")
    setIsConnected(true)

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true)
    }, 3000)
  }

  const fetchMessages = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true)

      const response = await fetch(`/api/messages/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        const messagesArray = Array.isArray(data) ? data : []

        if (isPolling) {
          // For polling, only add new messages
          setMessages((prev) => {
            const newMessages = messagesArray.filter((msg: Message) => !prev.some((p) => p._id === msg._id))
            return newMessages.length > 0 ? [...prev, ...newMessages] : prev
          })
        } else {
          setMessages(messagesArray)
        }
      } else {
        console.error("Failed to fetch messages:", response.status)
        if (!isPolling) {
          toast.error("Errore nel caricamento dei messaggi")
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      if (!isPolling) {
        toast.error("Errore nel caricamento dei messaggi")
      }
    } finally {
      if (!isPolling) {
        setLoading(false)
      }
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await fetch(`/api/messages/read-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      })
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      // Always use HTTP API for sending messages (more reliable)
      const response = await fetch(`/api/messages/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageContent,
          receiverId: otherUser._id,
        }),
      })

      if (response.ok) {
        const message = await response.json()

        // Try to send via WebSocket for real-time updates
        if (socket?.connected && connectionType === "websocket") {
          socket.emit("sendMessage", {
            roomId,
            senderId: session?.user?.id,
            senderName: session?.user?.name,
            senderImage: session?.user?.image,
            content: messageContent,
          })
        } else {
          // For polling mode, add message locally and it will be synced
          setMessages((prev) => [...prev, message])
          scrollToBottom()
        }
      } else {
        toast.error("Errore nell'invio del messaggio")
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Errore nell'invio del messaggio")
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("it-IT", {
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/messaggi")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <OptimizedAvatar src={otherUser.image} alt={otherUser.name} size={40} />
            <div className="flex-1">
              <h2 className="font-semibold">{otherUser.name}</h2>
              {eventTitle && <p className="text-sm text-muted-foreground truncate">{eventTitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-3 w-3" />
                  <span className="text-xs">{connectionType === "websocket" ? "Live" : "Sync"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <WifiOff className="h-3 w-3" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ paddingBottom: "120px" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : Array.isArray(messages) && messages.length > 0 ? (
          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwn = message.senderId === session?.user?.id
              const showDate =
                index === 0 || formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <Badge variant="secondary" className="text-xs">
                        {formatDate(message.createdAt)}
                      </Badge>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!isOwn && <OptimizedAvatar src={message.senderImage} alt={message.senderName} size={32} />}
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm ${
                          isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Inizia la conversazione</h3>
            <p className="text-sm text-muted-foreground">Invia il primo messaggio a {otherUser.name}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Scrivi a ${otherUser.name}...`}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={sending}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="icon" className="shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
