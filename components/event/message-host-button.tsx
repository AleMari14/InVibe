"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface MessageHostButtonProps {
  hostId: string
  hostName: string
  hostEmail: string
  eventId: string
  eventTitle: string
  className?: string
}

export function MessageHostButton({
  hostId,
  hostName,
  hostEmail,
  eventId,
  eventTitle,
  className = "",
}: MessageHostButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleMessageHost = async () => {
    if (!session?.user) {
      toast.error("Devi effettuare l'accesso per inviare messaggi")
      router.push("/auth/login")
      return
    }

    if (session.user.email === hostEmail) {
      toast.error("Non puoi inviare messaggi a te stesso")
      return
    }

    setIsLoading(true)

    try {
      console.log("Creating/finding chat room...")

      // Crea o trova la chat room
      const response = await fetch("/api/messages/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
      console.log("Chat room ready:", roomId, "New room:", isNewRoom)

      // Prepara il messaggio iniziale come parametro URL invece di inviarlo
      const initialMessage = encodeURIComponent(
        `Ciao ${hostName}! 👋\n\nSono interessato/a al tuo evento "${eventTitle}".\n\nPotresti darmi maggiori informazioni? Grazie! 😊`,
      )

      // Naviga alla chat con il messaggio pre-compilato
      router.push(`/messaggi/${roomId}?initialMessage=${initialMessage}`)

      if (isNewRoom) {
        toast.success("Chat creata! Scrivi il tuo messaggio.")
      } else {
        toast.success("Chat aperta!")
      }
    } catch (error) {
      console.error("Error creating chat:", error)
      toast.error("Errore nella creazione della chat")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleMessageHost}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className}`}
      variant="outline"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      {isLoading ? "Apertura..." : "Contatta Host"}
    </Button>
  )
}
