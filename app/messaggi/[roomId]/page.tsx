"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Send, ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Message {
  _id: string
  roomId: string
  senderId: string
  senderName: string
  senderImage?: string
  content: string
  createdAt: string
}

interface Participant {
  id: string
  name: string
  email: string
  image?: string
}

interface ChatRoom {
  _id: string
  participants: Participant[]
  eventTitle: string
  otherUser: Participant
}

export default function ChatRoomPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initialMessage = searchParams.get("initialMessage")

  useEffect(() => {
    if (initialMessage) {
      setNewMessage(decodeURIComponent(initialMessage))
      router.replace(`/messaggi/${roomId}`, { scroll: false })
    }
  }, [initialMessage, roomId, router])

  const fetchChatRoomDetails = useCallback(async () => {
    if (!roomId) return
    try {
      const response = await fetch(`/api/messages/room/${roomId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Chat room non trovata")
      }
      const data = await response.json()
      setChatRoom(data)
    } catch (error: any) {
      console.error("Error fetching chat room details:", error)
      toast.error(error.message)
      router.push("/messaggi")
    }
  }, [roomId, router])

  const fetchMessages = useCallback(async () => {
    if (!roomId) return
    try {
      const response = await fetch(`/api/messages/${roomId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nel caricamento dei messaggi")
      }
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error: any) {
      console.error("Error fetching messages:", error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchChatRoomDetails()
    fetchMessages()
  }, [fetchChatRoomDetails, fetchMessages])

  useEffect(() => {
    if (!session || !roomId) return

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001"
    const socket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    })
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Socket.IO connected successfully:", socket.id)
      socket.emit("joinRoom", roomId)
    })

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message)
      toast.error("Impossibile connettersi alla chat in tempo reale. I messaggi potrebbero non essere istantanei.")
    })

    socket.on("receiveMessage", (message: Message) => {
      setMessages((prevMessages) => {
        // Evita duplicati
        const exists = prevMessages.some((msg) => msg._id === message._id)
        if (exists) return prevMessages
        return [...prevMessages, message]
      })
    })

    socket.on("messageError", (data) => {
      toast.error(data.error)
      setIsSending(false)
    })

    return () => {
      if (socketRef.current) {
        console.log("Disconnecting Socket.IO")
        socketRef.current.disconnect()
      }
    }
  }, [session, roomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user || isSending) {
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    if (socketRef.current?.connected) {
      // Invia tramite WebSocket
      const messageData = {
        roomId,
        senderId: session.user.email,
        senderName: session.user.name || "Utente",
        senderImage: session.user.image,
        content: messageContent,
      }

      socketRef.current.emit("sendMessage", messageData)
      setIsSending(false)
    } else {
      // Fallback: invia tramite API REST
      sendMessageViaAPI(messageContent)
    }
  }

  const sendMessageViaAPI = async (content: string) => {
    try {
      const response = await fetch(`/api/messages/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nell'invio del messaggio")
      }

      const sentMessage = await response.json()
      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === sentMessage._id)
        if (exists) return prev
        return [...prev, sentMessage]
      })
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(error.message)
      setNewMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteChat = async () => {
    try {
      const response = await fetch(`/api/messages/room/${roomId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione della chat")
      }
      toast.success("Chat eliminata con successo")
      router.push("/messaggi")
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast.error("Impossibile eliminare la chat.")
    }
  }

  if (loading || !chatRoom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const otherParticipant = chatRoom.otherUser

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="flex items-center p-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 ml-2">
          <OptimizedAvatar src={otherParticipant?.image} alt={otherParticipant?.name || ""} size={40} />
          <div className="flex-1">
            <h2 className="font-bold text-sm">{otherParticipant?.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Riguardo: {chatRoom.eventTitle}</p>
          </div>
        </div>
        <div className="ml-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. Questo eliminerà permanentemente la cronologia di questa chat.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex items-end gap-2 ${msg.senderId === session?.user?.email ? "justify-end" : "justify-start"}`}
          >
            {msg.senderId !== session?.user?.email && (
              <OptimizedAvatar src={msg.senderImage || otherParticipant?.image} alt={msg.senderName} size={32} />
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                msg.senderId === session?.user?.email
                  ? "bg-blue-500 text-white rounded-br-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 border-t bg-white dark:bg-gray-800 dark:border-gray-700 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-none focus-visible:ring-0"
            autoComplete="off"
            disabled={isSending}
          />
          <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
        {!socketRef.current?.connected && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 text-center">
            Connessione in tempo reale non disponibile - usando modalità compatibilità
          </p>
        )}
      </footer>
    </div>
  )
}
