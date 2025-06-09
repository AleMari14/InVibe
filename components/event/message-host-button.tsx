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
  eventId: string
  eventTitle: string
}

export function MessageHostButton({ hostId, hostName, eventId, eventTitle }: MessageHostButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!session) {
      toast.error("Devi effettuare l'accesso per inviare messaggi")
      router.push("/auth/login")
      return
    }

    setIsLoading(true)
    try {
      // Create or get existing chat room
      const response = await fetch("/api/messages/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: hostId, // This should be the host's email
          eventId,
          eventTitle,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Errore nella creazione della chat")
      }
      
      const { roomId } = await response.json()
      router.push(`/messaggi/${roomId}`)
    } catch (error) {
      console.error("Error creating chat room:", error)
      toast.error("Errore nell'apertura della chat")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Contatta {hostName}
    </Button>
  )
}
