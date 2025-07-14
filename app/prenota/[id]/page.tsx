"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Users, Clock, CreditCard, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

  const id = params.id as string

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
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
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Evento non trovato</h1>
          <Button asChild className="mt-4">
            <Link href="/">Torna alla Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isHost = session?.user?.id === event.host?._id
  const totalPrice = event.price * formData.guests

  if (isHost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Non puoi prenotare il tuo evento</h1>
          <p className="text-muted-foreground mt-2">Sei l'organizzatore di questo evento</p>
          <Button asChild className="mt-4">
            <Link href={`/evento/${event._id}`}>Torna all'evento</Link>
          </Button>
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
              <h1 className="text-xl font-semibold">Prenota il tuo posto</h1>
              <p className="text-sm text-muted-foreground">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informazioni Personali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  />
                </div>
              </CardContent>
            </Card>

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
                    placeholder="Eventuali richieste particolari..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termini e Condizioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange("acceptTerms", checked)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-5">
                    Accetto i{" "}
                    <Link href="/termini" className="text-primary hover:underline">
                      termini e condizioni
                    </Link>{" "}
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
                    <Link href="/privacy" className="text-primary hover:underline">
                      privacy policy
                    </Link>
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !formData.acceptTerms || !formData.acceptPrivacy}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Elaborazione...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Conferma Prenotazione
                </>
              )}
            </Button>
          </div>

          {/* Riepilogo */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Riepilogo Prenotazione</CardTitle>
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
                  <Badge variant="secondary" className="mb-2">
                    {event.category}
                  </Badge>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
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
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.guests} ospiti</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Prezzo per persona</span>
                    <span>{event.price > 0 ? `€${event.price}` : "Gratuito"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Numero ospiti</span>
                    <span>×{formData.guests}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Totale</span>
                    <span>{totalPrice > 0 ? `€${totalPrice}` : "Gratuito"}</span>
                  </div>
                </div>

                {event.host && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Organizzato da</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {event.host.image ? (
                            <Image
                              src={event.host.image || "/placeholder.svg"}
                              alt={event.host.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{event.host.name}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
