"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { toast } from "sonner"

interface MessageHostButtonProps {
  hostId: string
  eventId: string
  eventTitle: string
}

export function MessageHostButton({ hostId, eventId, eventTitle }: MessageHostButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const handleClick = async () => {
    if (!session?.user) {
      toast.error("Devi effettuare il login per inviare messaggi")
      return
    }

    if (!hostId || !eventId || !eventTitle) {
      console.error("Missing required props:", { hostId, eventId, eventTitle })
      toast.error("Errore: dati mancanti")
      return
    }

    setLoading(true)
    try {
      console.log("Creating chat room with data:", { hostId, eventId, eventTitle })
      const response = await fetch("/api/messages/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId,
          eventId,
          eventTitle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Errore nella creazione della chat")
      }

      console.log("Chat room created successfully:", data)
      router.push(`/messaggi/${data.roomId}`)
    } catch (error) {
      console.error("Error creating chat room:", error)
      toast.error(error instanceof Error ? error.message : "Errore nella creazione della chat")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={handleClick}
      disabled={loading}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      {loading ? "Caricamento..." : "Contatta"}
    </Button>
  )
}
