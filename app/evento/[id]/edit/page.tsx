"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Save, X, MapPin, Calendar, Users, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationPicker } from "@/components/ui/location-picker"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: {
    address: string
    lat: number
    lng: number
  }
  category: string
  maxParticipants: number
  price: number
  images: string[]
  hostId: string
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null)
  const [category, setCategory] = useState("")
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [price, setPrice] = useState(0)
  const [images, setImages] = useState<string[]>([])

  const categories = [
    "Festa",
    "Compleanno",
    "Matrimonio",
    "Evento aziendale",
    "Concerto",
    "Teatro",
    "Sport",
    "Cena",
    "Aperitivo",
    "Altro",
  ]

  useEffect(() => {
    if (session?.user?.id) {
      fetchEvent()
    }
  }, [params.id, session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)

      if (!response.ok) {
        throw new Error("Evento non trovato")
      }

      const eventData = await response.json()

      // Check if user is the host
      if (eventData.hostId !== session?.user?.id) {
        toast.error("Non hai i permessi per modificare questo evento")
        router.push(`/evento/${params.id}`)
        return
      }

      setEvent(eventData)

      // Populate form
      setTitle(eventData.title || "")
      setDescription(eventData.description || "")
      setDate(eventData.date ? new Date(eventData.date).toISOString().split("T")[0] : "")
      setTime(eventData.time || "")
      setLocation(eventData.location || null)
      setCategory(eventData.category || "")
      setMaxParticipants(eventData.maxParticipants || 10)
      setPrice(eventData.price || 0)
      setImages(eventData.images || [])
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Errore nel caricamento dell'evento")
      router.push("/profile")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedImages: string[] = []

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedImages.push(data.url)
        }
      }

      setImages((prev) => [...prev, ...uploadedImages])
      toast.success(`${uploadedImages.length} immagine/i caricate`)
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Errore nel caricamento delle immagini")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !date || !time || !location || !category) {
      toast.error("Compila tutti i campi obbligatori")
      return
    }

    setSaving(true)

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        location,
        category,
        maxParticipants,
        price,
        images,
      }

      const response = await fetch(`/api/events/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        toast.success("Evento aggiornato con successo!")

        // Navigate based on where user came from
        const from = searchParams.get("from")
        if (from === "profile") {
          router.push("/profile")
        } else {
          router.push(`/evento/${params.id}`)
        }
      } else {
        throw new Error("Errore nell'aggiornamento")
      }
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Errore nell'aggiornamento dell'evento")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const from = searchParams.get("from")
    if (from === "profile") {
      router.push("/profile")
    } else {
      router.push(`/evento/${params.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Evento non trovato</h2>
          <Button onClick={() => router.push("/profile")}>Torna al profilo</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Modifica Evento</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salva
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informazioni Base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome dell'evento"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrizione *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi il tuo evento..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="time">Ora *</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Posizione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationPicker value={location} onChange={setLocation} placeholder="Cerca indirizzo..." />
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dettagli
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxParticipants">Numero massimo partecipanti</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                max="1000"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number.parseInt(e.target.value) || 10)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="price">Prezzo (€)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number.parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Immagini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="images">Carica immagini</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="mt-1"
              />
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento in corso...
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Immagine ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
