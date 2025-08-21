"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Loader2,
  MapPin,
  Calendar,
  Users,
  Euro,
  ImageIcon,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationPicker } from "@/components/ui/location-picker"
import Link from "next/link"
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
  amenities: string[]
  images: string[]
  bookingLink: string
  verified: boolean
  hostId: string
}

const categories = [
  { id: "casa", name: "Casa", icon: "🏠" },
  { id: "viaggio", name: "Viaggio", icon: "✈️" },
  { id: "evento", name: "Evento", icon: "🎉" },
  { id: "esperienza", name: "Esperienza", icon: "🌟" },
]

const commonAmenities = [
  "WiFi",
  "Parcheggio",
  "Colazione inclusa",
  "Animali ammessi",
  "Piscina",
  "Palestra",
  "Aria condizionata",
  "Cucina",
  "Lavatrice",
  "TV",
  "Riscaldamento",
  "Terrazza",
]

export default function EditEventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [newAmenity, setNewAmenity] = useState("")
  const { data: session, status } = useSession()
  const router = useRouter()

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
    amenities: [] as string[],
    images: [] as string[],
    bookingLink: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchEvent()
    }
  }, [status, params.id, router])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError("")

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

      // Check if user is the owner
      if (data.host?.email !== session?.user?.email) {
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
        amenities: data.amenities || [],
        images: data.images || [],
        bookingLink: data.bookingLink || "",
      })
    } catch (error) {
      console.error("💥 Error fetching event:", error)
      setError("Errore nel caricamento dell'evento")
    } finally {
      setLoading(false)
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

    try {
      setSaving(true)

      const updateData = {
        ...formData,
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

      // Redirect to event detail page
      router.push(`/evento/${params.id}`)
    } catch (error: any) {
      console.error("💥 Error updating event:", error)
      toast.error(error.message || "Errore durante l'aggiornamento dell'evento")
    } finally {
      setSaving(false)
    }
  }

  const handleLocationSelect = (location: string, coordinates: { lat: number; lng: number }) => {
    setFormData((prev) => ({
      ...prev,
      location,
      coordinates,
    }))
  }

  const addAmenity = (amenity: string) => {
    if (amenity && !formData.amenities.includes(amenity)) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenity],
      }))
    }
    setNewAmenity("")
  }

  const removeAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }))
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento evento...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Errore</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Link href="/user/events">
              <Button>I Miei Eventi</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Torna alla Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/evento/${params.id}`}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Modifica Evento</h1>
              <p className="text-white/80">Aggiorna le informazioni del tuo evento</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Informazioni Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Titolo del tuo evento"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrizione *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrivi il tuo evento..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          {category.icon} {category.name}
                        </span>
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
                Località
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationPicker
                value={formData.location}
                onLocationSelect={handleLocationSelect}
                placeholder="Cerca una località..."
              />
            </CardContent>
          </Card>

          {/* Date and Price */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date e Prezzo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateStart">Data Inizio *</Label>
                  <Input
                    id="dateStart"
                    type="datetime-local"
                    value={formData.dateStart}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateStart: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateEnd">Data Fine (opzionale)</Label>
                  <Input
                    id="dateEnd"
                    type="datetime-local"
                    value={formData.dateEnd}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateEnd: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prezzo per persona (€) *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, price: Number.parseInt(e.target.value) || 0 }))
                      }
                      className="pl-10"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="totalSpots">Numero massimo partecipanti *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="totalSpots"
                      type="number"
                      min="1"
                      value={formData.totalSpots}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, totalSpots: Number.parseInt(e.target.value) || 1 }))
                      }
                      className="pl-10"
                      placeholder="1"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Servizi Inclusi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {commonAmenities.map((amenity) => (
                  <Button
                    key={amenity}
                    type="button"
                    variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (formData.amenities.includes(amenity)) {
                        removeAmenity(amenity)
                      } else {
                        addAmenity(amenity)
                      }
                    }}
                  >
                    {amenity}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Aggiungi servizio personalizzato..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addAmenity(newAmenity)
                    }
                  }}
                />
                <Button type="button" onClick={() => addAmenity(newAmenity)} disabled={!newAmenity.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                      {amenity}
                      <button type="button" onClick={() => removeAmenity(amenity)} className="ml-1 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Link */}
          <Card>
            <CardHeader>
              <CardTitle>Link di Prenotazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="bookingLink">URL per prenotare (es. Airbnb, Booking.com)</Label>
                <Input
                  id="bookingLink"
                  type="url"
                  value={formData.bookingLink}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bookingLink: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
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
            <Link href={`/evento/${params.id}`}>
              <Button type="button" variant="outline">
                Annulla
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
