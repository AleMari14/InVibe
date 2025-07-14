"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { ArrowLeft, Calendar, MapPin, Users, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { getEventImageUrl } from "@/lib/image-utils"

interface Event {
  _id: string
  title: string
  description: string
  location: string
  price: number
  images: string[]
  category: string
  dateStart: string
  dateEnd?: string
  totalSpots: number
  availableSpots: number
  host: {
    _id: string
    name: string
    image: string
    email: string
  }
}

export default function PrenotaPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    guests: 1,
    specialRequests: "",
    acceptTerms: false,
    acceptPrivacy: false,
  })

  const eventId = params.id as string

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        email: session.user.email || "",
      }))
    }
  }, [session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error("Evento non trovato")
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Impossibile caricare l'evento.")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast.error("Devi accettare i termini e la privacy policy")
      return
    }

    if (formData.guests < 1 || formData.guests > (event?.availableSpots || 0)) {
      toast.error(`Numero di ospiti non valido (max ${event?.availableSpots})`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event?._id,
          ...formData,
          totalPrice: (event?.price || 0) * formData.guests,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nella prenotazione")
      }

      const booking = await response.json()
      toast.success("Prenotazione completata con successo!")
      router.push(`/prenotazioni`)
    } catch (error: any) {
      console.error("Error creating booking:", error)
      toast.error(error.message || "Errore nella prenotazione")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento non trovato</h1>
          <Button onClick={() => router.push("/")}>Torna alla Home</Button>
        </div>
      </div>
    )
  }

  const isHost = session?.user?.id === event.host._id
  const totalPrice = event.price * formData.guests

  if (isHost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Non puoi prenotare il tuo evento</h1>
          <Button onClick={() => router.back()}>Torna indietro</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Prenota il tuo posto</h1>
              <p className="text-sm text-muted-foreground">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informazioni Personali */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informazioni Personali
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Cognome *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dettagli Prenotazione */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Dettagli Prenotazione
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="guests">Numero di ospiti *</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max={event.availableSpots}
                      value={formData.guests}
                      onChange={(e) => handleInputChange("guests", Number.parseInt(e.target.value) || 1)}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">Posti disponibili: {event.availableSpots}</p>
                  </div>
                  <div>
                    <Label htmlFor="specialRequests">Richieste speciali</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                      placeholder="Eventuali richieste particolari o note per l'organizzatore..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Termini e Privacy */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange("acceptTerms", checked)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-5">
                      Accetto i{" "}
                      <a href="/termini" className="text-primary hover:underline">
                        Termini e Condizioni
                      </a>{" "}
                      del servizio
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(checked) => handleInputChange("acceptPrivacy", checked)}
                    />
                    <Label htmlFor="privacy" className="text-sm leading-5">
                      Accetto la{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </a>{" "}
                      e il trattamento dei miei dati personali
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || !formData.acceptTerms || !formData.acceptPrivacy}
              >
                {submitting ? "Elaborazione..." : `Conferma Prenotazione - €${totalPrice.toFixed(2)}`}
              </Button>
            </form>
          </div>

          {/* Event Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-0">
                <div className="relative h-48">
                  <Image
                    src={getEventImageUrl(event.images[0], 400, 200) || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {event.category}
                    </Badge>
                    <h3 className="font-bold text-lg">{event.title}</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(event.dateStart).toLocaleDateString("it-IT", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{event.availableSpots} posti disponibili</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Prezzo per persona:</span>
                      <span>€{event.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Numero ospiti:</span>
                      <span>{formData.guests}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Totale:</span>
                      <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Organizzato da <span className="font-medium">{event.host.name}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
