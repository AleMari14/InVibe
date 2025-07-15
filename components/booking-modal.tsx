"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, Users, Euro, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface Event {
  _id: string
  title: string
  location: string
  price: number
  dateStart: string
  availableSpots: number
  totalSpots: number
}

interface BookingModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
}

interface BookingForm {
  guests: number
  specialRequests: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

export function BookingModal({ event, isOpen, onClose }: BookingModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<BookingForm>({
    guests: 1,
    specialRequests: "",
    acceptTerms: false,
    acceptPrivacy: false,
  })

  const handleInputChange = (field: keyof BookingForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast.error("Devi effettuare l'accesso per prenotare")
      router.push("/auth/login")
      return
    }

    if (!form.acceptTerms || !form.acceptPrivacy) {
      toast.error("Devi accettare i termini e la privacy policy")
      return
    }

    if (form.guests > event.availableSpots) {
      toast.error(`Massimo ${event.availableSpots} posti disponibili`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event._id,
          guests: form.guests,
          specialRequests: form.specialRequests,
          totalPrice: event.price * form.guests,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore nella prenotazione")
      }

      toast.success("Prenotazione completata con successo!")
      onClose()
      router.push("/prenotazioni")
    } catch (error: any) {
      console.error("Error booking:", error)
      toast.error(error.message || "Errore nella prenotazione")
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = event.price * form.guests

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Prenota evento
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">{event.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(event.dateStart).toLocaleDateString("it-IT", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>
                  {event.availableSpots} / {event.totalSpots} disponibili
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="guests">Numero ospiti</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                max={event.availableSpots}
                value={form.guests}
                onChange={(e) => handleInputChange("guests", Number.parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div>
              <Label htmlFor="specialRequests">Richieste speciali</Label>
              <Textarea
                id="specialRequests"
                value={form.specialRequests}
                onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                placeholder="Eventuali richieste..."
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Prezzo per persona</span>
                <span>€{event.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ospiti</span>
                <span>{form.guests}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Totale</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={form.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange("acceptTerms", !!checked)}
                />
                <Label htmlFor="terms" className="text-xs">
                  Accetto i termini e condizioni
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={form.acceptPrivacy}
                  onCheckedChange={(checked) => handleInputChange("acceptPrivacy", !!checked)}
                />
                <Label htmlFor="privacy" className="text-xs">
                  Accetto la privacy policy
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prenotazione...
                </>
              ) : (
                <>
                  <Euro className="mr-2 h-4 w-4" />
                  Prenota - €{totalPrice.toFixed(2)}
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
