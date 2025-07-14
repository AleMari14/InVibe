"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  Shield,
  CheckCircle,
} from "lucide-react"
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
  const [numeroPersone, setNumeroPersone] = useState(1)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [richieste, setRichieste] = useState("")
  const [accettoTermini, setAccettoTermini] = useState(false)
  const [accettoPrivacy, setAccettoPrivacy] = useState(false)

  const id = params.id as string

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  useEffect(() => {
    if (session?.user) {
      setFirstName(session.user.name?.split(" ")[0] || "")
      setLastName(session.user.name?.split(" ").slice(1).join(" ") || "")
      setEmail(session.user.email || "")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!accettoTermini || !accettoPrivacy) {
      toast.error("Devi accettare i termini di servizio e la privacy policy")
      return
    }

    setSubmitting(true)

    try {
      const bookingData = {
        eventId: event?._id,
        numeroPersone,
        firstName,
        lastName,
        email,
        phone,
        richieste,
        totalPrice: (event?.price || 0) * numeroPersone,
      }

      // Qui implementeresti la chiamata API per salvare la prenotazione
      console.log("Prenotazione:", bookingData)

      // Simula una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success("Prenotazione effettuata con successo!")
      router.push(`/prenotazioni`)
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error("Errore durante la prenotazione")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Evento non trovato</h1>
        <Button asChild>
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    )
  }

  const totalPrice = event.price * numeroPersone
  const isHost = session?.user?.id === event.host._id

  if (isHost) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Non puoi prenotare il tuo evento</h1>
        <Button asChild>
          <Link href={`/evento/${event._id}`}>Torna all'evento</Link>
        </Button>
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
              <p className="text-sm text-muted-foreground">Completa la prenotazione per {event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form di prenotazione */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informazioni personali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Cognome *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="pl-10 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="numeroPersone">Numero di persone *</Label>
                    <Input
                      id="numeroPersone"
                      type="number"
                      value={numeroPersone}
                      onChange={(e) => setNumeroPersone(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      min="1"
                      max={event.availableSpots}
                      required
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Massimo {event.availableSpots} posti disponibili
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="richieste">Richieste speciali</Label>
                    <Textarea
                      id="richieste"
                      value={richieste}
                      onChange={(e) => setRichieste(e.target.value)}
                      rows={4}
                      className="mt-1"
                      placeholder="Eventuali richieste particolari o informazioni aggiuntive..."
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Termini e condizioni
                    </h3>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="termini" checked={accettoTermini} onCheckedChange={setAccettoTermini} />
                      <Label htmlFor="termini" className="text-sm leading-relaxed">
                        Accetto i{" "}
                        <Link href="/termini" className="text-primary hover:underline">
                          Termini di Servizio
                        </Link>{" "}
                        e confermo di aver letto le condizioni di partecipazione all'evento
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="privacy" checked={accettoPrivacy} onCheckedChange={setAccettoPrivacy} />
                      <Label htmlFor="privacy" className="text-sm leading-relaxed">
                        Accetto la{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>{" "}
                        e autorizzo il trattamento dei miei dati personali
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!accettoTermini || !accettoPrivacy || submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Prenotando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Conferma prenotazione
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Riepilogo evento */}
          <div className="space-y-6">
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
                  <Badge variant="secondary" className="mb-2">
                    {event.category}
                  </Badge>
                  <h3 className="font-bold text-lg">{event.title}</h3>
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
                    <span>{event.availableSpots} posti disponibili</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Riepilogo costi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Prezzo per persona</span>
                  <span>{event.price > 0 ? `€${event.price}` : "Gratuito"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Numero persone</span>
                  <span>{numeroPersone}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Totale</span>
                  <span>{totalPrice > 0 ? `€${totalPrice}` : "Gratuito"}</span>
                </div>
                {totalPrice > 0 && (
                  <p className="text-xs text-muted-foreground">Il pagamento verrà processato al momento dell'evento</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
