"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowLeft, MessageSquare, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { it } from "date-fns/locale"
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
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
  } | null
  unreadCount: number
  archived: boolean
  otherUser: {
    email: string
    name: string
    image?: string
  }
}

export default function MessaggiPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session?.user?.email) {
      fetchChatRooms()
    }
  }, [session])

  const fetchChatRooms = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching chat rooms...")

      const response = await fetch("/api/messages/rooms")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nel caricamento delle chat")
      }

      const data = await response.json()
      console.log("Chat rooms received:", data.rooms?.length || 0)

      setChatRooms(data.rooms || [])
      setUnreadCount(data.rooms?.reduce((acc: number, room: ChatRoom) => acc + room.unreadCount, 0) || 0)
    } catch (error) {
      console.error("Error fetching chat rooms:", error)
      toast.error("Errore nel caricamento delle chat")
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/messages/read-all", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Errore nell'aggiornamento dei messaggi")
      setUnreadCount(0)
      setChatRooms((rooms) => rooms.map((room) => ({ ...room, unreadCount: 0 })))
      toast.success("Tutti i messaggi sono stati segnati come letti")
    } catch (error) {
      toast.error("Errore nell'aggiornamento dei messaggi")
    }
  }

  const filteredRooms = chatRooms.filter((room) => {
    const matchesSearch =
      room.initialEvent?.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      room.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "unread") return matchesSearch && room.unreadCount > 0
    if (activeTab === "archived") return matchesSearch && room.archived
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Messaggi
              </h1>
              {unreadCount > 0 && <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Segna tutti come letti
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca nei messaggi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="unread">Non letti</TabsTrigger>
            <TabsTrigger value="archived">Archiviati</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages List */}
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-4 space-y-4">
          {filteredRooms.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">
                {chatRooms.length === 0 ? "Nessuna chat ancora" : "Nessun messaggio trovato"}
              </p>
              <p className="text-sm">
                {chatRooms.length === 0
                  ? "Le tue conversazioni appariranno qui quando inizierai a chattare con altri utenti"
                  : "Prova a modificare i filtri di ricerca"}
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <Link key={room.roomId} href={`/messaggi/${room.roomId}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors border border-border"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={room.otherUser.image || "/placeholder.svg"} />
                    <AvatarFallback>{room.otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{room.otherUser.name}</h3>
                      {room.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(room.lastMessage.createdAt), "HH:mm", { locale: it })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {room.lastMessage ? room.lastMessage.content : "Nessun messaggio ancora"}
                      </p>
                      {room.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs">{room.unreadCount}</Badge>
                      )}
                    </div>
                    {room.initialEvent && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        Evento: {room.initialEvent.eventTitle}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
