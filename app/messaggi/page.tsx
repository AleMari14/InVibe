"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MessageCircle, Loader2, Search, Trash2, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null)

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

  const handleDeleteRoom = async (roomId: string) => {
    try {
      setDeletingRoom(roomId)
      const response = await fetch(`/api/messages/room/${roomId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Errore nell'eliminazione della chat")
      }

      setChatRooms((prev) => prev.filter((room) => room._id !== roomId))
      toast.success("Chat eliminata con successo")
    } catch (error: any) {
      console.error("Error deleting room:", error)
      toast.error(error.message)
    } finally {
      setDeletingRoom(null)
      setDeleteDialogOpen(false)
      setRoomToDelete(null)
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
    } else if (diffInHours < 168) {
      // 7 giorni
      return date.toLocaleDateString("it-IT", {
        weekday: "short",
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-muted/20">
        <Card className="p-8 max-w-md mx-4">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Accedi per vedere i messaggi</h2>
            <p className="text-muted-foreground">Effettua l'accesso per gestire le tue conversazioni</p>
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            Messaggi
          </h1>
          <p className="text-muted-foreground">Gestisci le tue conversazioni con gli host</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 shadow-sm border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cerca conversazioni o eventi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Chat List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Caricamento conversazioni...</p>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "Nessuna conversazione trovata" : "Nessuna conversazione"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Prova a modificare i termini di ricerca"
                      : "Inizia a chattare con gli host degli eventi che ti interessano!"}
                  </p>
                </div>
                {!searchQuery && (
                  <Button onClick={() => router.push("/")} variant="outline">
                    Esplora Eventi
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => (
              <Card
                key={room._id}
                className="group hover:shadow-md transition-all duration-200 border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80"
              >
                <CardContent className="p-0">
                  <div className="flex items-center">
                    {/* Chat Content - Clickable */}
                    <div
                      className="flex-1 flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors rounded-l-lg"
                      onClick={() => handleRoomClick(room._id)}
                    >
                      <div className="relative">
                        <OptimizedAvatar
                          src={room.otherUser.image}
                          alt={room.otherUser.name}
                          size={52}
                          className="ring-2 ring-background shadow-sm"
                        />
                        {room.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium shadow-sm">
                            {room.unreadCount > 9 ? "9+" : room.unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate pr-2">{room.otherUser.name}</h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(room.lastMessageAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {room.eventTitle}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground truncate">
                          {room.lastMessage || "Nessun messaggio ancora"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={deletingRoom === room._id}
                          >
                            {deletingRoom === room._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setRoomToDelete(room._id)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina conversazione
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina conversazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa conversazione? Tutti i messaggi verranno eliminati definitivamente.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roomToDelete && handleDeleteRoom(roomToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
