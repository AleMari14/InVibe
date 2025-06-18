"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatWindow } from "@/components/chat/chat-window"
import { toast } from "sonner"

interface ChatRoom {
  _id: string
  roomId: string
  participants: Array<{
    email: string
    name: string
    image?: string
  }>
  initialEvent?: {
    eventId: string
    eventTitle: string
  }
  otherUser: {
    email: string
    name: string
    image?: string
  }
}

export default function ChatRoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const roomId = params.roomId as string
  const initialMessage = searchParams.get("initialMessage")

  useEffect(() => {
    if (roomId && session?.user?.email) {
      fetchChatRoom()
    }
  }, [roomId, session])

  const fetchChatRoom = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching chat room:", roomId)

      const response = await fetch(`/api/messages/room/${roomId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Chat room not found")
      }

      const data = await response.json()
      console.log("Chat room data:", data)

      // Trova l'altro utente
      const otherUser = data.participants.find((p: any) => p.email !== session?.user?.email)

      setChatRoom({
        ...data,
        otherUser: otherUser || {
          email: "unknown",
          name: "Utente Sconosciuto",
          image: null,
        },
      })
    } catch (error) {
      console.error("Error fetching chat room:", error)
      setError("Errore nel caricamento della chat")
      toast.error("Errore nel caricamento della chat")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento chat...</p>
        </div>
      </div>
    )
  }

  if (error || !chatRoom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Chat non trovata</p>
          <p className="text-muted-foreground mb-4">La chat che stai cercando non esiste o è stata eliminata.</p>
          <Link href="/messaggi">
            <Button>Torna ai Messaggi</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/messaggi">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-semibold">{chatRoom.otherUser.name}</h1>
              {chatRoom.initialEvent && (
                <p className="text-sm text-muted-foreground">Evento: {chatRoom.initialEvent.eventTitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window - con padding bottom per navbar */}
      <div className="flex-1 pb-20">
        <ChatWindow
          roomId={roomId}
          otherUser={chatRoom.otherUser}
          initialMessage={initialMessage ? decodeURIComponent(initialMessage) : undefined}
        />
      </div>
    </div>
  )
}
