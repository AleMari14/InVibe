"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatWindow } from "@/components/chat/chat-window"
import { toast } from "sonner"

interface ChatRoom {
  _id: string
  eventId: string
  eventTitle: string
  participants: string[]
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
  } | null
  otherUser: {
    name: string
    email: string
    image: string
  }
}

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email) {
      router.push("/auth/login")
      return
    }

    // Try to get host info from sessionStorage first
    const storedHostInfo = sessionStorage.getItem('chatHostInfo')
    if (storedHostInfo) {
      try {
        const hostInfo = JSON.parse(storedHostInfo)
        setChatRoom(prev => prev ? { ...prev, otherUser: hostInfo } : null)
      } catch (error) {
        console.error("Error parsing stored host info:", error)
      }
    }

    fetchChatRoom()
  }, [session, params.roomId])

  const fetchChatRoom = async () => {
    try {
      const response = await fetch(`/api/messages/room/${params.roomId}`)
      if (!response.ok) {
        throw new Error("Chat room not found")
      }
      const data = await response.json()
      setChatRoom(data)
    } catch (error) {
      console.error("Error fetching chat room:", error)
      toast.error("Errore nel caricamento della chat")
      router.push("/messaggi")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!chatRoom) {
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/messaggi")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-medium">Chat con {chatRoom.otherUser.name}</h1>
          <p className="text-sm text-muted-foreground">{chatRoom.eventTitle}</p>
        </div>
      </div>

      <div className="flex-1">
        <ChatWindow
          roomId={params.roomId}
          otherUser={chatRoom.otherUser}
          onClose={() => router.push("/messaggi")}
        />
      </div>
    </div>
  )
}
