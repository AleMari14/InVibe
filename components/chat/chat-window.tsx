"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Send, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"

interface Message {
  _id: string
  content: string
  senderId: string
  createdAt: string
}

interface ChatWindowProps {
  roomId: string
  otherUser: {
    name: string
    email: string
    image: string
  }
  onClose: () => void
}

export function ChatWindow({ roomId, otherUser, onClose }: ChatWindowProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchMessages()
    setupWebSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [roomId])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${roomId}`)
      if (!response.ok) throw new Error("Errore nel caricamento dei messaggi")
      const data = await response.json()
      setMessages(data.messages)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Errore nel caricamento dei messaggi")
    } finally {
      setIsLoading(false)
    }
  }

  const setupWebSocket = () => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/chat?roomId=${roomId}&userId=${session?.user?.email}`
    )

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages((prev) => [...prev, message])
      scrollToBottom()
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      toast.error("Errore di connessione")
    }

    socketRef.current = ws
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socketRef.current) return

    setIsSending(true)
    try {
      socketRef.current.send(
        JSON.stringify({
          content: newMessage,
          roomId,
          senderId: session?.user?.email,
        })
      )
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Errore nell'invio del messaggio")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherUser.image} />
          <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{otherUser.name}</h3>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === session?.user?.email
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={isOwnMessage ? session?.user?.image : otherUser.image}
                    />
                    <AvatarFallback>
                      {isOwnMessage
                        ? session?.user?.name?.[0]
                        : otherUser.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {format(new Date(message.createdAt), "HH:mm", {
                        locale: it,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 