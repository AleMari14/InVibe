"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MessageCircle, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ChatRoom {
  _id: string
  eventTitle: string
  lastMessage: string
  lastMessageAt: string | null
  otherUser: {
    name: string
    email: string
    image?: string
  }
  unreadCount: number
}

export default function MessaggiPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (session) {
      fetchChatRooms()
    }
  }, [session])

  const fetchChatRooms = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/messages/rooms")
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle chat")
      }
      const data = await response.json()
      setChatRooms(data.rooms || [])
    } catch (error: any) {
      console.error("Error fetching chat rooms:", error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredRooms = chatRooms.filter(
    (room) =>
      room.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
      })
    }
  }

  const handleRoomClick = (roomId: string) => {
    router.push(`/messaggi/${roomId}`)
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Effettua l'accesso per vedere i tuoi messaggi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <h1 className="text-2xl font-bold mb-4">Messaggi</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cerca conversazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 dark:bg-gray-700 border-none"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchQuery ? "Nessuna conversazione trovata" : "Nessuna conversazione ancora"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Inizia a chattare con gli host degli eventi che ti interessano!
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {filteredRooms.map((room) => (
              <Button
                key={room._id}
                variant="ghost"
                className="w-full h-auto p-4 justify-start hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleRoomClick(room._id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <OptimizedAvatar src={room.otherUser.image} alt={room.otherUser.name} size={48} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">{room.otherUser.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {formatTime(room.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">{room.eventTitle}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                      {room.lastMessage || "Nessun messaggio ancora"}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                      {room.unreadCount}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
