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
      console.log("Creating/finding chat room with data:", {
        hostEmail,
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
          hostEmail,
          eventId,
          eventTitle,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: "Errore nella comunicazione con il server" }
        }

        throw new Error(errorData.error || "Errore nella gestione della chat")
      }

      const data = await response.json()
      console.log("Chat room result:", data)

      if (!data.roomId) {
        throw new Error("Nessun ID della chat ricevuto dal server")
      }

      // If it's a new chat, send an initial message with event info
      if (data.isNew) {
        try {
          const initialMessage = `Ciao! Sono interessato/a al tuo evento "${eventTitle}". Potresti darmi maggiori informazioni?`

          const messageResponse = await fetch(`/api/messages/${data.roomId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: initialMessage,
            }),
          })

          if (messageResponse.ok) {
            toast.success("Chat creata e messaggio inviato!")
          } else {
            toast.success("Chat creata!")
          }
        } catch (error) {
          console.error("Error sending initial message:", error)
          toast.success("Chat creata!")
        }
      } else {
        toast.success("Chat esistente aperta!")
      }

      // Navigate to the chat room
      router.push(`/messaggi/${data.roomId}`)
    } catch (error) {
      console.error("Error handling chat room:", error)
      toast.error(error instanceof Error ? error.message : "Errore nell'apertura della chat")
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if user is the host
  if (session?.user?.email === hostEmail) {
    return null
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isLoading} className="flex items-center gap-2">
      <MessageSquare className="h-4 w-4" />
      {isLoading ? "Caricamento..." : `Contatta ${hostName}`}
    </Button>
  )
}
