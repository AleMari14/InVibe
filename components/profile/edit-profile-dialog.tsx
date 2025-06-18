"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Camera, Loader2, User, Mail, Phone, MapPin, Calendar, Edit3, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface EditProfileDialogProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    bio?: string | null
    phone?: string | null
    location?: string | null
    dateOfBirth?: string | null
  }
  onProfileUpdate: (updatedUser: any) => void
}

export function EditProfileDialog({ user, onProfileUpdate }: EditProfileDialogProps) {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    location: user?.location || "",
    dateOfBirth: user?.dateOfBirth || "",
    image: user?.image || "",
  })

  if (!user) {
    return null
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verifica il tipo di file
    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un file immagine valido")
      return
    }

    // Verifica la dimensione del file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine deve essere inferiore a 5MB")
      return
    }

    setIsUploadingImage(true)

    try {
      // Crea FormData per l'upload
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", "profile")

      // Carica l'immagine
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nel caricamento dell'immagine")
      }

      const data = await response.json()

      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }))
        toast.success("Immagine caricata con successo!")
      } else {
        throw new Error(data.error || "Errore nel caricamento dell'immagine")
      }
    } catch (error: any) {
      console.error("Errore upload immagine:", error)
      toast.error(error.message || "Errore nel caricamento dell'immagine")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Sending profile update:", formData)

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("Profile update response:", data)

      if (!response.ok) {
        throw new Error(data.error || data.message || "Errore nell'aggiornamento del profilo")
      }

      if (data.success) {
        // Aggiorna la sessione con i nuovi dati
        if (session && update) {
          await update({
            ...session,
            user: {
              ...session.user,
              name: formData.name,
              image: formData.image,
            },
          })
        }

        // Notifica il componente padre con tutti i dati aggiornati
        onProfileUpdate({
          ...user,
          ...formData,
          id: user.id,
          email: user.email,
        })

        toast.success("Profilo aggiornato con successo!")
        setOpen(false)

        // Forza il refresh della pagina per aggiornare l'immagine
        window.location.reload()
      } else {
        throw new Error(data.error || "Errore nell'aggiornamento del profilo")
      }
    } catch (error: any) {
      console.error("Errore aggiornamento profilo:", error)
      toast.error(error.message || "Errore nell'aggiornamento del profilo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Edit3 className="h-4 w-4" />
          Modifica Profilo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Modifica Profilo
          </DialogTitle>
          <DialogDescription>Aggiorna le tue informazioni personali</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sezione Immagine Profilo */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.image || undefined} alt="Profilo" />
                    <AvatarFallback className="text-lg">
                      {formData.name?.charAt(0)?.toUpperCase() ||
                        user?.email?.charAt(0)?.toUpperCase() ||
                        session?.user?.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>

                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <p className="text-sm text-muted-foreground text-center">
                  Clicca sull'icona della fotocamera per cambiare l'immagine del profilo
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informazioni Personali */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome completo
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Il tuo nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">L'email non può essere modificata</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Raccontaci qualcosa di te..."
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500 caratteri</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefono
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+39 123 456 7890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Località
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="La tua città"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data di nascita
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </div>
          </div>

          {/* Pulsanti */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Modifiche
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
