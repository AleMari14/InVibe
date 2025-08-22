"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, MoreVertical, Trash2, Phone, Video, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import io, { type Socket } from "socket.io-client"

interface Message {
  _id: string
  content: string
  senderId: string
  senderName: string
  senderImage?: string
  createdAt: string
  readBy: string[]
}

interface ChatRoom {
  _id: string
  participants: Array<{
    _id: string
    name: string
    image?: string
  }>
  event?: {
    _id: string
    title: string
    category: string
    date: string
    location: {
      address: string
    }
  }
  messages: Message[]
}

interface OnlineUser {
  userId: string
  isOnline: boolean
}

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session && params.roomId) {
      fetchRoom()
      initializeSocket()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [session, params.roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeSocket = () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001"
    const newSocket = io(wsUrl, {
      transports: ["websocket", "polling"],
    })

    newSocket.on("connect", () => {
      console.log("🔌 Connected to WebSocket")
      if (session?.user?.id) {
        newSocket.emit("authenticate", {
          userId: session.user.id,
          userName: session.user.name,
        })
        newSocket.emit("joinRoom", params.roomId)
      }
    })

    newSocket.on("newMessage", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    newSocket.on("userOnlineStatus", (data: OnlineUser) => {
      setOnlineUsers((prev) => {
        const filtered = prev.filter((user) => user.userId !== data.userId)
        return [...filtered, data]
      })
    })

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket")
    })

    setSocket(newSocket)
  }

  const fetchRoom = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages/room/${params.roomId}`)
      if (response.ok) {
        const data = await response.json()
        setRoom(data)
        setMessages(data.messages || [])
        markMessagesAsRead()
      } else {
        toast.error("Errore nel caricamento della chat")
        router.push("/messaggi")
      }
    } catch (error) {
      console.error("Error fetching room:", error)
      toast.error("Errore nel caricamento della chat")
      router.push("/messaggi")
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await fetch("/api/messages/read-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: params.roomId }),
      })
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !session) return

    setSending(true)
    try {
      const response = await fetch(`/api/messages/${params.roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (response.ok) {
        setNewMessage("")
      } else {
        toast.error("Errore nell'invio del messaggio")
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
        year: "numeric",
      })
    }
  }

  const getOtherParticipant = () => {
    return room?.participants.find((p) => p._id !== session?.user?.id)
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.find((user) => user.userId === userId)?.isOnline || false
  }

  const otherParticipant = getOtherParticipant()
  const isOtherUserOnline = otherParticipant ? isUserOnline(otherParticipant._id) : false

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Caricamento chat...</p>
        </div>
      </div>
    )
  }

  if (!room || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chat non trovata</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <OptimizedAvatar src={otherParticipant?.image} alt={otherParticipant?.name || "Utente"} size={40} />
                {/* Online Status Indicator */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOtherUserOnline ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isOtherUserOnline ? "Online" : "Offline"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{otherParticipant?.name || "Utente sconosciuto"}</h2>
                {room.event && (
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">{room.event.title}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  Info chat
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Event Info */}
      {room.event && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {room.event.category}
                </Badge>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{room.event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(room.event.date).toLocaleDateString("it-IT")} • {room.event.location.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="space-y-4 py-4">
          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwn = message.senderId === session.user?.id
              const showDate =
                index === 0 || formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt)

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <Badge variant="outline" className="text-xs">
                        {formatDate(message.createdAt)}
                      </Badge>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && (
                      <OptimizedAvatar src={message.senderImage} alt={message.senderName} size={32} className="mt-1" />
                    )}
                    <div className={`max-w-[70%] ${isOwn ? "order-first" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-border bg-card/50 backdrop-blur-sm p-4"
      >
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
