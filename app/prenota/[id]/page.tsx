"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, Users, Shield, ExternalLink, Info, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface Event {
  _id: string
  title: string
  location: string
  price: number
  dateStart: string
  dateEnd?: string
  availableSpots: number
  totalSpots: number
  bookingLink: string
  host?: {
    name: string
  }
}

export default function PrenotaPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [numeroPersone, setNumeroPersone] = useState(1)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [richieste, setRichieste] = useState("")
  const [accettoTermini, setAccettoTermini] = useState(false)

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    fetchEvent()

    // Pre-fill user data if available
    if (session?.user) {
      const nameParts = session.user.name?.split(" ") || []
      setFirstName(nameParts[0] || "")
      setLastName(nameParts.slice(1).join(" ") || "")
      setEmail(session.user.email || "")
    }
  }, [params.id, session, status])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = formatDate(startDate)
    if (!endDate) return start
    const end = formatDate(endDate)
    return `${start} - ${end}`
  }

  const prezzoTotale = numeroPersone * (event?.price || 0)
  const commissione = Math.round(prezzoTotale * 0.05)
  const totaleFinale = prezzoTotale + commissione

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !session?.user?.id) return

    setSubmitting(true)

    try {
      const bookingData = {
        eventId: event._id,
        guests: numeroPersone,
        totalPrice: totaleFinale,
        specialRequests: richieste,
        firstName,
        lastName,
        email,
        phone,
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/prenotazioni")
        }, 2000)
      } else {
        throw new Error("Errore nella prenotazione")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("Errore nella prenotazione. Riprova.")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="px-4 py-4 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Evento non trovato</h2>
          <Link href="/">
            <Button>Torna alla Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Prenotazione Confermata!</h2>
              <p className="text-muted-foreground mb-4">
                La tua prenotazione è stata registrata con successo. Verrai reindirizzato alle tue prenotazioni.
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/evento/${event._id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Unisciti al Gruppo
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-20">
        {/* Event Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDateRange(event.dateStart, event.dateEnd)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Organizzato da {event.host?.name}</span>
              </div>
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  Rimangono solo <strong>{event.availableSpots} posti</strong> disponibili!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>

        {/* Guest Count */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Numero di Partecipanti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Persone</span>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNumeroPersone(Math.max(1, numeroPersone - 1))}
                    disabled={numeroPersone <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{numeroPersone}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNumeroPersone(Math.min(event.availableSpots, numeroPersone + 1))}
                    disabled={numeroPersone >= event.availableSpots}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informazioni di Contatto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="phone">Numero di Telefono</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Special Requests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Richieste Speciali</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Hai qualche richiesta particolare o allergie alimentari?"
                value={richieste}
                onChange={(e) => setRichieste(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Link */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Prenotazione Alloggio</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 mb-4">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700 dark:text-orange-400">
                  <strong>Importante:</strong> Dovrai prenotare l'alloggio separatamente tramite il link ufficiale.
                </AlertDescription>
              </Alert>
              <a
                href={event.bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border border-blue-200 rounded-lg hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600 font-medium">Prenota su piattaforma ufficiale</span>
              </a>
            </CardContent>
          </Card>
        </motion.div>

        {/* Price Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Riepilogo Prezzi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>
                  €{event.price} × {numeroPersone} {numeroPersone === 1 ? "persona" : "persone"}
                </span>
                <span>€{prezzoTotale}</span>
              </div>
              <div className="flex justify-between">
                <span>Commissione servizio InVibe</span>
                <span>€{commissione}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Totale</span>
                <span>€{totaleFinale}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                * Non include il costo dell'alloggio da prenotare separatamente
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Terms */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Checkbox id="termini" checked={accettoTermini} onCheckedChange={setAccettoTermini} />
                <div className="text-sm">
                  <Label htmlFor="termini" className="cursor-pointer">
                    Accetto i{" "}
                    <Link href="/termini" className="text-blue-600 underline">
                      Termini di Servizio
                    </Link>{" "}
                    e la{" "}
                    <Link href="/privacy" className="text-blue-600 underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  La tua prenotazione è protetta dalla garanzia InVibe
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!accettoTermini || submitting || event.availableSpots === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confermando...
              </>
            ) : (
              `Conferma Partecipazione - €${totaleFinale}`
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}
