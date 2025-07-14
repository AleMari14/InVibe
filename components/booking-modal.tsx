"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface BookingModalProps {
  eventId: string
  onClose: () => void
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

export function BookingModal({ eventId, onClose }: BookingModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
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

  const handleInputChange = (field: keyof BookingForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!form.acceptTerms || !form.acceptPrivacy) {
      toast.error("Devi accettare i termini e la privacy policy")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          guests: form.guests,
          specialRequests: form.specialRequests,
          contactInfo: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nella prenotazione")
      }

      toast.success("Prenotazione completata con successo!")
      onClose()
      router.push("/prenotazioni")
    } catch (error: any) {
      console.error("Error creating booking:", error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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

        <div>
          <Label htmlFor="guests">Numero di ospiti *</Label>
          <Input
            id="guests"
            type="number"
            min="1"
            value={form.guests}
            onChange={(e) => handleInputChange("guests", Number.parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div>
          <Label htmlFor="specialRequests">Richieste speciali (opzionale)</Label>
          <Textarea
            id="specialRequests"
            value={form.specialRequests}
            onChange={(e) => handleInputChange("specialRequests", e.target.value)}
            placeholder="Eventuali richieste particolari..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={form.acceptTerms}
              onCheckedChange={(checked) => handleInputChange("acceptTerms", !!checked)}
            />
            <Label htmlFor="terms" className="text-sm">
              Accetto i termini e condizioni *
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy"
              checked={form.acceptPrivacy}
              onCheckedChange={(checked) => handleInputChange("acceptPrivacy", !!checked)}
            />
            <Label htmlFor="privacy" className="text-sm">
              Accetto la privacy policy *
            </Label>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            <X className="mr-2 h-4 w-4" />
            Annulla
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting || !form.acceptTerms || !form.acceptPrivacy}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Elaborazione...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Conferma
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
