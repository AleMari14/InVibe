"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface MessageHostButtonProps {
  hostId: string
  hostName: string
  hostEmail: string
  eventId: string
  eventTitle: string
}

export function MessageHostButton({ hostId, hostName, hostEmail, eventId, eventTitle }: MessageHostButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const handleClick = async () => {
    if (!session?.user) {
      toast.error("Devi effettuare l'accesso per inviare messaggi")
      router.push("/auth/login")
      return
    }

    // Check if user is trying to message themselves
    if (hostEmail === session.user.email) {
      toast.error("Non puoi inviare messaggi a te stesso")
      return
    }

    if (!hostEmail || !eventId || !eventTitle) {
      console.error("Missing required props:", { hostEmail, eventId, eventTitle })
      toast.error("Errore: dati mancanti per la chat")
      return
    }

    setIsLoading(true)
    try {
      console.log("Creating chat room with data:", {
        hostId: hostEmail,
        eventId,
        eventTitle,
        currentUser: session.user.email,
      })

      const response = await fetch("/api/messages/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: hostEmail,
          eventId,
          eventTitle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.error || "Errore nella creazione della chat")
      }

      const data = await response.json()
      console.log("Chat room created:", data)

      // Navigate to the chat room
      router.push(`/messaggi/${data.roomId}`)
    } catch (error) {
      console.error("Error creating chat room:", error)
      toast.error(error instanceof Error ? error.message : "Errore nell'apertura della chat")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isLoading} className="flex items-center gap-2">
      <MessageSquare className="h-4 w-4" />
      {isLoading ? "Caricamento..." : `Contatta ${hostName}`}
    </Button>
  )
}
