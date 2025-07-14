"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { ArrowLeft, Calendar, MapPin, Users, Loader2, CreditCard } from "lucide-react"
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
  totalSpots: number
  availableSpots: number
  host?: {
    _id: string
    name: string
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

  const id = params.id as string

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  useEffect(() => {
    if (session?.user) {
      const name = session.user.name?.split(" ") || ["", ""]
      setForm((prev) => ({
        ...prev,
        firstName: name[0] || "",
        lastName: name.slice(1).join(" ") || "",
        email: session.user.email || "",
      }))
    }
  }, [session])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${id}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.acceptTerms || !form.acceptPrivacy) {
      toast.error("Devi accettare i termini e la privacy policy")
      return
    }

    if (!session) {
      toast.error("Devi effettuare l'accesso per prenotare")
      router.push("/auth/login")
      return
    }

    if (form.guests > (event?.availableSpots || 0)) {
      toast.error(`Massimo ${event?.availableSpots} posti disponibili`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event?._id,
          ...form,
          totalPrice: (event?.price || 0) * form.guests,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore nella prenotazione")
      }

      toast.success("Prenotazione completata con successo!")
      router.push("/prenotazioni")
    } catch (error: any) {
      console.error("Error booking:", error)
      toast.error(error.message || "Errore nella prenotazione")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Evento non trovato</h1>
        <Button onClick={() => router.push("/")}>Torna alla Home</Button>
      </div>
    )
  }

  const isHost = session?.user?.id === event.host?._id
  const totalPrice = event.price * form.guests

  if (isHost) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Non puoi prenotare il tuo evento</h1>
        <Button onClick={() => router.back()}>Torna indietro</Button>
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
              <h1 className="text-xl font-bold">Prenota evento</h1>
              <p className="text-sm text-muted-foreground">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dettagli prenotazione</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informazioni personali */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informazioni personali</h3>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label htmlFor="phone">Telefono</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dettagli prenotazione */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dettagli prenotazione</h3>
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
                        Massimo {event.availableSpots} posti disponibili
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="specialRequests">Richieste speciali</Label>
                      <Textarea
                        id="specialRequests"
                        value={form.specialRequests}
                        onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                        placeholder="Eventuali richieste particolari..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Termini e condizioni */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={form.acceptTerms}
                        onCheckedChange={(checked) => handleInputChange("acceptTerms", !!checked)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        Accetto i{" "}
                        <a href="/termini" className="text-primary hover:underline">
                          termini e condizioni
                        </a>{" "}
                        *
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="privacy"
                        checked={form.acceptPrivacy}
                        onCheckedChange={(checked) => handleInputChange("acceptPrivacy", !!checked)}
                      />
                      <Label htmlFor="privacy" className="text-sm">
                        Accetto la{" "}
                        <a href="/privacy" className="text-primary hover:underline">
                          privacy policy
                        </a>{" "}
                        *
                      </Label>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Prenotazione in corso...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Conferma prenotazione - €{totalPrice.toFixed(2)}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Riepilogo */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Riepilogo evento</CardTitle>
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

                  <div className="space-y-2 text-sm">
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
                      <span>
                        {event.availableSpots} / {event.totalSpots} posti disponibili
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Prezzo per persona</span>
                      <span>€{event.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Numero ospiti</span>
                      <span>{form.guests}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Totale</span>
                      <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
