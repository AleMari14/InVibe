"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface MessageHostButtonProps {
  hostEmail: string
  hostName: string
  eventId: string
  eventTitle: string
}

export function MessageHostButton({ hostEmail, hostName, eventId, eventTitle }: MessageHostButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleMessageHost = async () => {
    if (!session?.user?.email) {
      toast.error("Devi essere loggato per inviare messaggi")
      return
    }

    if (session.user.email === hostEmail) {
      toast.error("Non puoi inviare messaggi a te stesso")
      return
    }

    setIsLoading(true)
    try {
      console.log("Creating chat room with:", { hostEmail, eventId, eventTitle })

      const response = await fetch("/api/messages/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostEmail,
          eventId,
          eventTitle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nella creazione della chat")
      }

      const data = await response.json()
      console.log("Chat room created/found:", data.roomId)

      // Navigate to the chat
      router.push(`/messaggi/${data.roomId}`)
      toast.success(`Chat avviata con ${hostName}`)
    } catch (error) {
      console.error("Error creating chat:", error)
      toast.error("Errore nell'avvio della chat")
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if user is the host
  if (session?.user?.email === hostEmail) {
    return null
  }

  return (
    <Button onClick={handleMessageHost} disabled={isLoading} className="w-full" variant="outline">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creazione chat...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Contatta {hostName}
        </>
      )}
    </Button>
  )
}
