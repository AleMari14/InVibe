"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatWindow } from "@/components/chat/chat-window"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"
interface Conversation {
  _id: string
  lastMessage: {
    content: string
    createdAt: string
    senderId: string
  }
  unreadCount: number
  otherUser: {
    name: string
    email: string
    image: string
  }
}

export default function MessaggiPage() {
  console.log("📦 MessaggiPage component rendering...")
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChat, setSelectedChat] = useState<{
    roomId: string
    otherUser: {
      name: string
      email: string
      image: string
    }
  } | null>(null)

  useEffect(() => {
    console.log("✨ MessaggiPage useEffect triggered. Session status:", status)
    if (session) {
      console.log("🔑 Session found, fetching conversations...")
      fetchConversations()
    } else if (status !== "loading") {
       console.log("❌ No session found, redirecting to login...")
       router.push("/auth/login")
    }
  }, [session, status]) // Added status to dependency array

  const fetchConversations = async () => {
    console.log("fetching conversations...")
    try {
      // Fetch conversations from the new API endpoint
      const response = await fetch("/api/user/conversations")
      if (!response.ok) throw new Error("Errore nel caricamento delle conversazioni")
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setConversations(data)
      } else {
        console.error("Invalid data format for conversations:", data)
        setConversations([])
        toast.error("Formato dati conversazioni non valido.")
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoading(false)
      console.log("Finished fetching conversations. isLoading set to false.")
    }
  }

  const handleStartChat = async (email: string) => {
    try {
      const response = await fetch("/api/socket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId: email }),
      })

      if (!response.ok) throw new Error("Errore nella creazione della chat")
      const { roomId } = await response.json()

      const conversation = conversations.find(
        (conv) => conv.otherUser.email === email
      )

      if (conversation) {
        setSelectedChat({
          roomId,
          otherUser: conversation.otherUser,
        })
      }
    } catch (error) {
      console.error("Error starting chat:", error)
    }
  }

  console.log("Rendering MessaggiPage - isLoading:", isLoading, "session:", !!session)

  if (status === "loading" || isLoading) {
    console.log("Displaying loading state...")
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
     console.log("Session not found, middleware should handle redirect.")
     return null; // Middleware should handle redirect, but this prevents rendering protected content
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  console.log("Displaying conversations list.", filteredConversations.length, "found.")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Messaggi
            </h1>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca conversazioni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() =>
                    setSelectedChat({
                      roomId: conversation._id,
                      otherUser: conversation.otherUser,
                    })
                  }
                  className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-accent transition-colors ${
                    selectedChat?.roomId === conversation._id ? "bg-accent" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.otherUser.image} />
                    <AvatarFallback>
                      {conversation.otherUser.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {conversation.otherUser.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conversation.lastMessage.createdAt), "HH:mm", {
                          locale: it,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 && !isLoading && (
                 <div className="text-center text-muted-foreground p-4">Nessuna conversazione trovata.</div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow
              roomId={selectedChat.roomId}
              otherUser={selectedChat.otherUser}
              onClose={() => setSelectedChat(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Seleziona una conversazione per iniziare a chattare
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
