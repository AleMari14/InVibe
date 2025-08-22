"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationPicker } from "@/components/ui/location-picker"
import { toast } from "sonner"
import { ArrowLeft, Save, Loader2, Calendar, Clock, MapPin, Users, Euro, Tag, ImageIcon, X } from "lucide-react"
import { motion } from "framer-motion"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: {
    address: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  price: number
  maxParticipants: number
  category: string
  images: string[]
  hostId: string
  tags?: string[]
  requirements?: string[]
  amenities?: string[]
}

const categories = [
  "Festa",
  "Concerto",
  "Sport",
  "Cultura",
  "Cibo & Bevande",
  "Networking",
  "Workshop",
  "Arte",
  "Tecnologia",
  "Benessere",
  "Altro",
]

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const eventId = params.id as string
  const fromProfile = searchParams.get("from") === "profile"

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: {
      address: "",
      coordinates: undefined as { lat: number; lng: number } | undefined,
    },
    price: 0,
    maxParticipants: 10,
    category: "",
    images: [] as string[],
    tags: [] as string[],
    requirements: [] as string[],
    amenities: [] as string[],
  })

  const [newTag, setNewTag] = useState("")
  const [newRequirement, setNewRequirement] = useState("")
  const [newAmenity, setNewAmenity] = useState("")

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        price: event.price,
        maxParticipants: event.maxParticipants,
        category: event.category,
        images: event.images || [],
        tags: event.tags || [],
        requirements: event.requirements || [],
        amenities: event.amenities || [],
      })
    }
  }, [event])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch event")
      }
      const eventData = await response.json()

      // Check if user is the owner
      if (session?.user?.id !== eventData.hostId) {
        toast.error("Non hai i permessi per modificare questo evento")
        router.push("/")
        return
      }

      setEvent(eventData)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Errore nel caricamento dell'evento")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLocationChange = (location: { address: string; coordinates?: { lat: number; lng: number } }) => {
    setFormData((prev) => ({
      ...prev,
      location,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "events")

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        return data.secure_url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }))

      toast.success("Immagini caricate con successo")
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Errore nel caricamento delle immagini")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }))
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }))
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }))
      setNewAmenity("")
    }
  }

  const removeAmenity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim() || !formData.date || !formData.time) {
      toast.error("Compila tutti i campi obbligatori")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update event")
      }

      toast.success("Evento aggiornato con successo!")

      // Navigate based on where user came from
      if (fromProfile) {
        router.push("/profile")
      } else {
        router.push(`/evento/${eventId}`)
      }
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Errore nell'aggiornamento dell'evento")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (fromProfile) {
      router.push("/profile")
    } else {
      router.back()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-2xl font-bold mb-4">Evento non trovato</h1>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleCancel} className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Modifica Evento
              </h1>
              <p className="text-gray-400 mt-1">Aggiorna i dettagli del tuo evento</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 bg-transparent"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva modifiche
            </Button>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Tag className="h-5 w-5 text-blue-400" />
                  Informazioni di base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">
                      Titolo evento *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Inserisci il titolo dell'evento"
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">
                      Categoria *
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Descrizione *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Descrivi il tuo evento..."
                    rows={4}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Date & Time */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5 text-green-400" />
                  Data e orario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-white">
                      Data evento *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-white">
                      Orario *
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Location */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-red-400" />
                  Posizione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationPicker
                  value={formData.location}
                  onChange={handleLocationChange}
                  placeholder="Inserisci l'indirizzo dell'evento"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing & Capacity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Euro className="h-5 w-5 text-yellow-400" />
                  Prezzo e partecipanti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white">
                      Prezzo (€)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants" className="text-white">
                      Numero massimo partecipanti
                    </Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange("maxParticipants", Number.parseInt(e.target.value) || 1)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Images */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ImageIcon className="h-5 w-5 text-purple-400" />
                  Immagini evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-gray-800 border-gray-600 text-white file:bg-gray-700 file:text-white file:border-0"
                    disabled={uploading}
                  />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tags */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Tag className="h-5 w-5 text-cyan-400" />
                  Tag
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Aggiungi un tag"
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                  >
                    Aggiungi
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-md text-sm">
                        <span className="text-white">{tag}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-gray-600"
                          onClick={() => removeTag(index)}
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Requirements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-orange-400" />
                  Requisiti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Aggiungi un requisito"
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                  />
                  <Button
                    type="button"
                    onClick={addRequirement}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                  >
                    Aggiungi
                  </Button>
                </div>
                {formData.requirements.length > 0 && (
                  <div className="space-y-2">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-md">
                        <span className="text-white text-sm">{req}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 hover:bg-gray-600"
                          onClick={() => removeRequirement(index)}
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Amenities */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5 text-pink-400" />
                  Servizi inclusi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Aggiungi un servizio"
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                  />
                  <Button
                    type="button"
                    onClick={addAmenity}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                  >
                    Aggiungi
                  </Button>
                </div>
                {formData.amenities.length > 0 && (
                  <div className="space-y-2">
                    {formData.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-md">
                        <span className="text-white text-sm">{amenity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 hover:bg-gray-600"
                          onClick={() => removeAmenity(index)}
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
