"use client"

import { useState } from "react"
import { ArrowLeft, Search, MessageCircle, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"

interface Message {
  id: string
  sender: {
    name: string
    image?: string
  }
  lastMessage: string
  timestamp: string
  unread: boolean
  eventTitle?: string
}

export default function MessaggiPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Dati di esempio
  const messages: Message[] = [
    {
      id: "1",
      sender: {
        name: "Sofia M.",
        image: "/placeholder.svg?height=40&width=40",
      },
      lastMessage: "Ciao! Hai domande sulla villa in Toscana?",
      timestamp: "2 min fa",
      unread: true,
      eventTitle: "Villa con Piscina - Toscana",
    },
    {
      id: "2",
      sender: {
        name: "Marco R.",
        image: "/placeholder.svg?height=40&width=40",
      },
      lastMessage: "Perfetto, ci vediamo venerdì!",
      timestamp: "1 ora fa",
      unread: false,
      eventTitle: "Weekend Sci Dolomiti",
    },
    {
      id: "3",
      sender: {
        name: "Anna L.",
        image: "/placeholder.svg?height=40&width=40",
      },
      lastMessage: "Grazie per l'organizzazione!",
      timestamp: "3 ore fa",
      unread: false,
      eventTitle: "Tour Costiera Amalfitana",
    },
  ]

  const filteredMessages = messages.filter(
    (message) =>
      message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Messaggi
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca conversazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/80 backdrop-blur-sm border-border"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {filteredMessages.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? "Nessun risultato" : "Nessun messaggio"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Prova a modificare la ricerca" : "I tuoi messaggi con gli organizzatori appariranno qui"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <Card className="border-border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={message.sender.image || "/placeholder.svg"} />
                        <AvatarFallback>
                          {message.sender.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-foreground">{message.sender.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                            {message.unread && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                        </div>

                        {message.eventTitle && (
                          <Badge variant="secondary" className="text-xs mb-1">
                            {message.eventTitle}
                          </Badge>
                        )}

                        <p
                          className={`text-sm line-clamp-1 ${
                            message.unread ? "font-medium text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {message.lastMessage}
                        </p>
                      </div>

                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
