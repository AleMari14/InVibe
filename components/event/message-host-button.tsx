"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface MessageHostButtonProps {
  hostId: string
  hostEmail: string
  hostName: string
  eventId: string
  eventTitle: string
  initialMessage?: string
}

export function MessageHostButton({
  hostId,
  hostEmail,
  hostName,
  eventId,
  eventTitle,
  initialMessage = "",
}: MessageHostButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleContactHost = async () => {
    if (!session) {
      toast.error("Devi effettuare l'accesso per contattare l'host")
      router.push("/auth/login")
      return
    }

    if (session.user?.email === hostEmail) {
      toast.error("Non puoi contattare te stesso")
      return
    }

    setIsLoading(true)

    try {
      console.log("Contacting host with data:", {
        hostId,
        hostEmail,
        hostName,
        eventId,
        eventTitle,
      })

      const response = await fetch("/api/messages/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId,
          hostEmail,
          hostName,
          eventId,
          eventTitle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nella creazione della chat")
      }

      const { roomId, isNewRoom } = await response.json()

      console.log("Chat room response:", { roomId, isNewRoom })

      if (!roomId) {
        throw new Error("ID room non ricevuto dal server")
      }

      // Naviga alla chat con messaggio iniziale se fornito
      const url = initialMessage
        ? `/messaggi/${roomId}?initialMessage=${encodeURIComponent(initialMessage)}`
        : `/messaggi/${roomId}`

      router.push(url)

      if (isNewRoom) {
        toast.success("Nuova chat creata!")
      } else {
        toast.success("Chat aperta!")
      }
    } catch (error: any) {
      console.error("Error contacting host:", error)
      toast.error(error.message || "Errore nel contattare l'host")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleContactHost} disabled={isLoading} className="w-full bg-transparent" variant="outline">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creazione chat...
        </>
      ) : (
        <>
          <MessageCircle className="mr-2 h-4 w-4" />
          Contatta Host
        </>
      )}
    </Button>
  )
}
