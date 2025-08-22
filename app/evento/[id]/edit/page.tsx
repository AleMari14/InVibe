"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Users,
  Euro,
  ImageIcon,
  Plus,
  X,
  AlertTriangle,
  Info,
  Tag,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationSearchInput } from "@/components/ui/location-search-input"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface Event {
  _id: string
  title: string
  description: string
  location: string
  coordinates: {
    lat: number
    lng: number
  }
  price: number
  category: string
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  images: string[]
  hostId: string
  host?: {
    _id: string
    name: string
    email: string
  }
}

const categories = [
  { id: "casa", name: "Casa/Appartamento", icon: "🏠" },
  { id: "viaggio", name: "Viaggio", icon: "✈️" },
  { id: "festa", name: "Festa", icon: "🥳" },
  { id: "evento", name: "Evento", icon: "🎉" },
  { id: "esperienza", name: "Esperienza", icon: "🌟" },
]

export default function EditEventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    coordinates: { lat: 0, lng: 0 },
    price: 0,
    category: "",
    dateStart: "",
    dateEnd: "",
    totalSpots: 1,
    images: [] as string[],
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated" && params?.id) {
      fetchEvent()
    }
  }, [status, params?.id, router])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError("")

      if (!params?.id) {
        setError("ID evento non valido")
        return
      }

      const response = await fetch(`/api/events/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Evento non trovato")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Event data received:", data)

      // Validate required fields
      if (!data || !data._id) {
        setError("Dati evento non validi")
        return
      }

      // Check if user is the owner
      const userEmail = session?.user?.email
      const hostEmail = data.host?.email

      if (userEmail && hostEmail && userEmail !== hostEmail) {
        setError("Non sei autorizzato a modificare questo evento")
        return
      }

      setEvent(data)
      setFormData({
        title: data.title || "",
        description: data.description || "",
        location: data.location || "",
        coordinates: data.coordinates || { lat: 0, lng: 0 },
        price: data.price || 0,
        category: data.category || "",
        dateStart: data.dateStart ? new Date(data.dateStart).toISOString().slice(0, 16) : "",
        dateEnd: data.dateEnd ? new Date(data.dateEnd).toISOString().slice(0, 16) : "",
        totalSpots: data.totalSpots || 1,
        images: data.images || [],
      })
      setImagePreviews(data.images || [])
    } catch (error) {
      console.error("💥 Error fetching event:", error)
      setError("Errore nel caricamento dell'evento")
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)

      // Check file size (max 5MB per file)
      const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        toast.error("Alcune immagini superano i 5MB")
        return
      }

      // Check total images limit
      const totalImages = formData.images.length + imageFiles.length + files.length
      if (totalImages > 10) {
        toast.error("Puoi caricare massimo 10 immagini")
        return
      }

      setImageFiles((prev) => [...prev, ...files])

      const newPreviews = files.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    const isExistingImage = index < formData.images.length

    if (isExistingImage) {
      // Remove from existing images
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }))
    } else {
      // Remove from new files
      const fileIndex = index - formData.images.length
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex))
    }

    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLocationSelect = (address: string, coordinates: { lat: number; lng: number } | null) => {
    setFormData((prev) => ({
      ...prev,
      location: address,
      coordinates: coordinates || { lat: 0, lng: 0 },
    }))
  }

  const handleGoBack = () => {
    // Check if we came from profile page
    const fromProfile = searchParams.get("from") === "profile"

    if (fromProfile) {
      router.push("/profile")
    } else {
      router.push(`/evento/${params.id}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Il titolo è obbligatorio")
      return
    }

    if (!formData.description.trim()) {
      toast.error("La descrizione è obbligatoria")
      return
    }

    if (!formData.location.trim()) {
      toast.error("La località è obbligatoria")
      return
    }

    if (!formData.category) {
      toast.error("Seleziona una categoria")
      return
    }

    if (!formData.dateStart) {
      toast.error("La data di inizio è obbligatoria")
      return
    }

    if (formData.price <= 0) {
      toast.error("Il prezzo deve essere maggiore di 0")
      return
    }

    if (formData.totalSpots <= 0) {
      toast.error("Il numero di posti deve essere maggiore di 0")
      return
    }

    if (!params?.id) {
      toast.error("ID evento non valido")
      return
    }

    try {
      setSaving(true)
      toast.info("Aggiornamento dell'evento in corso...")

      // 1. Upload new images to Cloudinary
      let newImageUrls: string[] = []
      if (imageFiles.length > 0) {
        toast.info(`Caricamento di ${imageFiles.length} nuove immagini...`)
        const uploadPromises = imageFiles.map(async (file) => {
          const formDataUpload = new FormData()
          formDataUpload.append("file", file)
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formDataUpload,
          })
          if (!response.ok) {
            throw new Error(`Caricamento immagine fallito per ${file.name}`)
          }
          const result = await response.json()
          return result.url
        })
        newImageUrls = await Promise.all(uploadPromises)
      }

      // 2. Combine existing and new images
      const allImages = [...formData.images, ...newImageUrls]

      const updateData = {
        ...formData,
        images: allImages,
        dateStart: new Date(formData.dateStart).toISOString(),
        dateEnd: formData.dateEnd ? new Date(formData.dateEnd).toISOString() : null,
        availableSpots: event ? event.availableSpots + (formData.totalSpots - event.totalSpots) : formData.totalSpots,
      }

      const response = await fetch(`/api/events/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'aggiornamento")
      }

      const data = await response.json()
      toast.success(data.message || "Evento aggiornato con successo!")

      // Check if we came from profile page
      const fromProfile = searchParams.get("from") === "profile"

      if (fromProfile) {
        router.push("/profile")
      } else {
        router.push(`/evento/${params.id}`)
      }
    } catch (error: any) {
      console.error("💥 Error updating event:", error)
      toast.error(error.message || "Errore durante l'aggiornamento dell'evento")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento evento...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Errore</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Link href="/user/events">
              <Button className="bg-blue-600 hover:bg-blue-700">I Miei Eventi</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
                Torna alla Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Evento non trovato</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Modifica Evento
            </h1>
            <p className="text-gray-400 mt-1">Aggiorna le informazioni del tuo evento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <Info className="h-5 w-5 text-blue-400" />
                Informazioni Principali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-medium text-gray-300">
                  Titolo dell'evento *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Es: Festa in spiaggia al tramonto"
                  className="mt-2 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium text-gray-300">
                  Descrizione *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrivi il tuo evento, cosa lo rende speciale?"
                  className="mt-2 min-h-[120px] text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <Tag className="h-5 w-5 text-green-400" />
                Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      formData.category === cat.id
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-gray-600 hover:border-blue-400"
                    }`}
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <p className="font-semibold mt-2 text-sm">{cat.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <Calendar className="h-5 w-5 text-red-400" />
                Luogo e Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium text-gray-300 mb-2 block">Località *</Label>
                <LocationSearchInput
                  onLocationSelect={handleLocationSelect}
                  defaultValue={formData.location}
                  className="h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dateStart" className="text-base font-medium text-gray-300">
                    Data di inizio *
                  </Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="dateStart"
                      type="datetime-local"
                      value={formData.dateStart}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateStart: e.target.value }))}
                      className="pl-10 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dateEnd" className="text-base font-medium text-gray-300">
                    Data fine (opzionale)
                  </Label>
                  <div className="relative mt-2">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="dateEnd"
                      type="datetime-local"
                      value={formData.dateEnd}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateEnd: e.target.value }))}
                      className="pl-10 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price and Spots */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <Euro className="h-5 w-5 text-yellow-400" />
                Dettagli Partecipazione
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price" className="text-base font-medium text-gray-300">
                  Prezzo per persona (€) *
                </Label>
                <div className="relative mt-2">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: Number.parseInt(e.target.value) || 0 }))}
                    className="pl-10 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="totalSpots" className="text-base font-medium text-gray-300">
                  Posti totali *
                </Label>
                <div className="relative mt-2">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="totalSpots"
                    type="number"
                    min="1"
                    value={formData.totalSpots}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, totalSpots: Number.parseInt(e.target.value) || 1 }))
                    }
                    className="pl-10 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                    placeholder="10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <ImageIcon className="h-5 w-5 text-purple-400" />
                Immagini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="relative aspect-square group">
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Label
                  htmlFor="image-upload"
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-700/50 transition-colors"
                >
                  <Plus className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-400">Aggiungi foto</span>
                </Label>
              </div>
              <Input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Puoi aggiungere più immagini per mostrare meglio il tuo evento (max 10 immagini, 5MB per file)
              </p>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg h-14"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Salva Modifiche
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-14 px-8 border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                onClick={handleGoBack}
              >
                Annulla
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
