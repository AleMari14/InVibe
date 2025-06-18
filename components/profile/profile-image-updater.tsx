"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

interface ProfileImageUpdaterProps {
  imageUrl: string
  onUpdate: () => void
}

export function ProfileImageUpdater({ imageUrl, onUpdate }: ProfileImageUpdaterProps) {
  const { data: session, update } = useSession()

  useEffect(() => {
    if (imageUrl && session?.user && update) {
      // Aggiorna la sessione con la nuova immagine
      update({
        ...session,
        user: {
          ...session.user,
          image: imageUrl,
        },
      }).then(() => {
        onUpdate()
      })
    }
  }, [imageUrl, session, update, onUpdate])

  return null
}
