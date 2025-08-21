"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationSearchInput } from "@/components/ui/location-search-input"
import { toast } from "sonner"
import { ArrowLeft, Calendar, MapPin, Euro, FileText, Camera, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  price: number
  maxParticipants: number
  images: string[]
  category: string
  hostId: string
}

const categories = [
  "Festa",
  "Compleanno",
  "Matrimonio",
  "Evento Aziendale",
  "Concerto",
  "Teatro",
  "Sport",
  "Cultura",
  "Gastronomia",
  "Altro",
]

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [newImages, setNewImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    price: "",
    maxParticipants: "",
    category: "",
  })

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`)
      if (!response.ok) throw new Error("Evento non trovato")

      const eventData = await response.json()

      // Verifica che l'utente sia il proprietario dell'evento
      if (eventData.hostId !== session?.user?.id) {
        toast.error("Non hai i permessi per modificare questo evento")
        router.push(`/evento/${params.id}`)
        return
      }

      setEvent(eventData)
      setFormData({
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        price: eventData.price.toString(),
        maxParticipants: eventData.maxParticipants.toString(),
        category: eventData.category,
      })
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Errore nel caricamento dell'evento")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Verifica che non si superino le 10 immagini totali
    const totalImages = (event?.images.length || 0) + newImages.length + files.length
    if (totalImages > 10) {
      toast.error("Puoi caricare massimo 10 immagini")
      return
    }

    // Verifica dimensione file (max 5MB per file)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error("Alcune immagini superano i 5MB")
      return
    }

    setNewImages((prev) => [...prev, ...files])

    // Crea preview per le nuove immagini
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeExistingImage = (index: number) => {
    if (!event) return
    const updatedImages = event.images.filter((_, i) => i !== index)
    setEvent({ ...event, images: updatedImages })
  }

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Errore upload immagine")
      const data = await response.json()
      return data.url
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return

    setSaving(true)

    try {
      // Upload nuove immagini se presenti
      let uploadedImageUrls: string[] = []
      if (newImages.length > 0) {
        uploadedImageUrls = await uploadImages(newImages)
      }

      // Combina immagini esistenti con quelle nuove
      const allImages = [...event.images, ...uploadedImageUrls]

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        price: Number.parseFloat(formData.price),
        maxParticipants: Number.parseInt(formData.maxParticipants),
        category: formData.category,
        images: allImages,
      }

      const response = await fetch(`/api/events/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) throw new Error("Errore nell'aggiornamento")

      toast.success("Evento aggiornato con successo!")
      router.push(`/evento/${params.id}`)
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Errore nell'aggiornamento dell'evento")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Caricamento evento...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Evento non trovato</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/evento/${params.id}`}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al dettaglio evento
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Modifica Evento
            </h1>
            <p className="text-gray-400">Aggiorna le informazioni del tuo evento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informazioni Base */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <FileText className="h-5 w-5" />
                Informazioni Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">
                    Titolo Evento
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Es. Festa di Compleanno"
                    required
                    className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300">
                    Categoria
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="h-12 bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-700">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Descrizione
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descrivi il tuo evento..."
                  rows={4}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data e Orario */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Calendar className="h-5 w-5" />
                Data e Orario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-300">
                    Data
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                    className="h-12 bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-gray-300">
                    Orario
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    required
                    className="h-12 bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Luogo */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <MapPin className="h-5 w-5" />
                Luogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-300">
                  Indirizzo
                </Label>
                <LocationSearchInput
                  value={formData.location}
                  onChange={(value) => handleInputChange("location", value)}
                  placeholder="Cerca indirizzo..."
                  className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prezzo e Partecipanti */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                <Euro className="h-5 w-5" />
                Prezzo e Partecipanti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-300">
                    Prezzo per persona (€)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    required
                    className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants" className="text-gray-300">
                    Numero massimo partecipanti
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                    placeholder="10"
                    required
                    className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Immagini */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Camera className="h-5 w-5" />
                Immagini Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Immagini esistenti */}
              {event.images.length > 0 && (
                <div>
                  <Label className="text-gray-300 mb-3 block">Immagini attuali</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {event.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden">
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`Immagine ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeExistingImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nuove immagini */}
              {imagePreviews.length > 0 && (
                <div>
                  <Label className="text-gray-300 mb-3 block">Nuove immagini da aggiungere</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden">
                          <Image
                            src={preview || "/placeholder.svg"}
                            alt={`Nuova immagine ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeNewImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload nuove immagini */}
              <div>
                <Label htmlFor="images" className="text-gray-300">
                  Aggiungi nuove immagini
                </Label>
                <div className="mt-2">
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Clicca per caricare</span> o trascina qui
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB per file)</p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Puoi aggiungere fino a {10 - (event.images.length + newImages.length)} immagini aggiuntive
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bottoni azione */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/evento/${params.id}`)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salva Modifiche"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
