"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { ChatWindow } from "@/components/chat/chat-window"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ChatRoom {
  _id: string
  eventTitle?: string
  lastMessage?: string
  lastMessageAt?: string
  otherUser: {
    name: string
    image?: string
    email: string
  }
}

export default function ChatRoomPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const roomId = params.roomId as string

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login")
      return
    }
    if (roomId) {
      fetchChatRoom()
    }
  }, [session, status, roomId])

  const fetchChatRoom = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/messages/rooms`)
      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms")
      }

      const rooms = await response.json()
      const room = rooms.find((r: ChatRoom) => r._id === roomId)

      if (!room) {
        setError("Chat room not found")
        return
      }

      setChatRoom(room)
    } catch (error) {
      console.error("Error fetching chat room:", error)
      setError("Errore nel caricamento della chat")
      toast.error("Errore nel caricamento della chat")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Errore</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => router.push("/messaggi")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Torna ai messaggi
        </button>
      </div>
    )
  }

  if (!chatRoom || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ChatWindow
      roomId={roomId}
      otherUser={{
        _id: chatRoom.otherUser.email, // Using email as fallback ID
        name: chatRoom.otherUser.name,
        image: chatRoom.otherUser.image,
      }}
      eventTitle={chatRoom.eventTitle}
    />
  )
}
