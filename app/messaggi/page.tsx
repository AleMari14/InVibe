"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MessageCircle, Search, MoreVertical, Trash2, Calendar, MapPin, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"

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
  lastMessage?: {
    content: string
    createdAt: string
    senderId: string
  }
  unreadCount: number
  updatedAt: string
}

export default function MessaggiPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (session) {
      fetchChatRooms()
    }
  }, [session])

  const fetchChatRooms = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/messages/rooms")
      if (response.ok) {
        const data = await response.json()
        setChatRooms(data)
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error)
      toast.error("Errore nel caricamento delle chat")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/messages/room/${roomId}/archive`, {
        method: "POST",
      })

      if (response.ok) {
        setChatRooms((prev) => prev.filter((room) => room._id !== roomId))
        toast.success("Chat eliminata con successo")
      } else {
        toast.error("Errore nell'eliminazione della chat")
      }
    } catch (error) {
      console.error("Error deleting room:", error)
      toast.error("Errore nell'eliminazione della chat")
    } finally {
      setDeleting(false)
      setDeleteRoomId(null)
    }
  }

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find((p) => p._id !== session?.user?.id)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Ora"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h fa`
    } else if (diffInHours < 48) {
      return "Ieri"
    } else {
      return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    }
  }

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    })
  }

  const filteredRooms = chatRooms.filter((room) => {
    const otherParticipant = getOtherParticipant(room)
    const searchLower = searchQuery.toLowerCase()

    return (
      otherParticipant?.name.toLowerCase().includes(searchLower) ||
      room.event?.title.toLowerCase().includes(searchLower)
    )
  })

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Devi essere loggato per vedere i messaggi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10"
      >
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t("messages")}
          </h1>
        </div>
      </motion.div>

      <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca conversazioni..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
            />
          </div>
        </motion.div>

        {/* Chat Rooms */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="space-y-3">
            {filteredRooms.map((room, index) => {
              const otherParticipant = getOtherParticipant(room)

              return (
                <motion.div
                  key={room._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-card/90 backdrop-blur-sm border-border/50 hover:bg-card/95 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar with unread badge */}
                        <div className="relative">
                          <OptimizedAvatar
                            src={otherParticipant?.image}
                            alt={otherParticipant?.name || "Utente"}
                            size={48}
                            className="ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all"
                          />
                          {room.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                              {room.unreadCount > 9 ? "9+" : room.unreadCount}
                            </div>
                          )}
                        </div>

                        {/* Chat Info */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => router.push(`/messaggi/${room._id}`)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {otherParticipant?.name || "Utente sconosciuto"}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {room.lastMessage ? formatTime(room.lastMessage.createdAt) : formatTime(room.updatedAt)}
                            </span>
                          </div>

                          {/* Event info */}
                          {room.event && (
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-primary/10 text-primary border-primary/20"
                              >
                                {room.event.category}
                              </Badge>
                              <span className="text-sm text-muted-foreground truncate">{room.event.title}</span>
                            </div>
                          )}

                          {/* Last message or event details */}
                          {room.lastMessage ? (
                            <p className="text-sm text-muted-foreground truncate">
                              {room.lastMessage.senderId === session.user?.id ? "Tu: " : ""}
                              {room.lastMessage.content}
                            </p>
                          ) : room.event ? (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatEventDate(room.event.date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{room.event.location.address}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Nessun messaggio ancora</p>
                          )}
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeleteRoomId(room._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina chat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "Nessuna conversazione trovata" : "Nessuna conversazione"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Prova a cercare con un termine diverso"
                : "Inizia a chattare con gli organizzatori degli eventi che ti interessano!"}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push("/")} variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Esplora Eventi
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Conversazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa conversazione? Tutti i messaggi verranno rimossi definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoomId && handleDeleteRoom(deleteRoomId)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
