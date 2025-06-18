"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useState } from "react"

interface EditProfileDialogProps {
  user: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfileUpdate?: () => void // Aggiungi questa prop
}

export function EditProfileDialog({ user, open, onOpenChange, onProfileUpdate }: EditProfileDialogProps) {
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")

  const handleSubmit = async () => {
    const result = await new Promise<{ success: boolean }>((resolve) => {
      setTimeout(() => {
        // Simulate API call
        resolve({ success: true })
      }, 500)
    })

    if (result.success) {
      toast.success("Profilo aggiornato con successo!")
      onOpenChange(false)

      // Notifica il componente padre dell'aggiornamento
      if (onProfileUpdate) {
        onProfileUpdate()
      }
    } else {
      toast.error("Errore durante l'aggiornamento del profilo.")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Modifica Profilo</AlertDialogTitle>
          <AlertDialogDescription>
            Apporta modifiche al tuo profilo qui. Clicca su salva quando hai finito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit}>Salva</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
