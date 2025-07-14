"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { ArrowLeft, Calendar, MapPin, Users, Clock, User } from "lucide-react"
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

interface BookingForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  guests: number
  specialRequests: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

export default function PrenotaPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<BookingForm>({
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
      const names = session.user.name?.split(" ") || ["", ""]
      setForm((prev) => ({
        ...prev,
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
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

  const handleInputChange = (field: keyof BookingForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const calculateTotal = () => {
    if (!event) return 0
    return event.price * form.guests
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!form.acceptTerms || !form.acceptPrivacy) {
      toast.error("Devi accettare i termini di servizio e la privacy policy")
      return
    }

    if (form.guests > (event?.availableSpots || 0)) {
      toast.error("Numero di ospiti superiore ai posti disponibili")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ...form,
          totalPrice: calculateTotal(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore nella prenotazione")
      }

      toast.success("Prenotazione completata con successo!")
      router.push(`/prenotazioni`)
    } catch (error: any) {
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
              <div className="space-y-6">
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

  if (isHost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Non puoi prenotare il tuo evento</h1>
          <Button onClick={() => router.push(`/evento/${eventId}`)}>Torna all'evento</Button>
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
          {/* Form di prenotazione */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informazioni personali */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informazioni personali
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Cognome *</Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
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
                      value={form.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefono *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dettagli prenotazione */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Dettagli prenotazione
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
                      value={form.guests}
                      onChange={(e) => handleInputChange("guests", Number.parseInt(e.target.value) || 1)}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Massimo {event.availableSpots} ospiti disponibili
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="specialRequests">Richieste speciali (opzionale)</Label>
                    <Textarea
                      id="specialRequests"
                      value={form.specialRequests}
                      onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                      placeholder="Eventuali richieste particolari o note per l'organizzatore..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Termini e condizioni */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={form.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange("acceptTerms", !!checked)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-5">
                      Accetto i{" "}
                      <a href="/termini" className="text-primary hover:underline">
                        termini di servizio
                      </a>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={form.acceptPrivacy}
                      onCheckedChange={(checked) => handleInputChange("acceptPrivacy", !!checked)}
                    />
                    <Label htmlFor="privacy" className="text-sm leading-5">
                      Accetto la{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        privacy policy
                      </a>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Prenotazione in corso..." : `Prenota ora - €${calculateTotal()}`}
              </Button>
            </form>
          </div>

          {/* Riepilogo evento */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Riepilogo prenotazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <Image
                    src={getEventImageUrl(event.images[0], 400, 200) || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {event.category}
                  </Badge>
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
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(event.dateStart).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.availableSpots} / {event.totalSpots} posti disponibili
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Prezzo per persona</span>
                    <span>€{event.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Numero ospiti</span>
                    <span>{form.guests}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Totale</span>
                    <span>€{calculateTotal()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Prenotando questo evento accetti i termini di servizio e la privacy policy. La prenotazione è
                    soggetta a conferma da parte dell'organizzatore.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
