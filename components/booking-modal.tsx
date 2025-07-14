"use client"

import Link from "next/link"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useSession } from "next-auth/react"

interface BookingModalProps {
  eventId: string
  onClose: () => void
}

export function BookingModal({ eventId, onClose }: BookingModalProps) {
  const [numeroPersone, setNumeroPersone] = useState(1)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [richieste, setRichieste] = useState("")
  const [accettoTermini, setAccettoTermini] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data: session } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    // Implementa la logica di prenotazione qui
    console.log("Prenotazione effettuata per l'evento:", eventId)
    onClose()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Prenota il tuo posto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">Nome</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="lastName">Cognome</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phone">Numero di Telefono</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="richieste">Richieste Speciali</Label>
            <Textarea id="richieste" value={richieste} onChange={(e) => setRichieste(e.target.value)} rows={3} />
          </div>
          <div>
            <Label htmlFor="numeroPersone">Numero di Persone</Label>
            <Input
              id="numeroPersone"
              type="number"
              value={numeroPersone}
              onChange={(e) => setNumeroPersone(Number.parseInt(e.target.value))}
              min="1"
              required
            />
          </div>
          <div>
            <Checkbox id="termini" checked={accettoTermini} onCheckedChange={setAccettoTermini} />
            <Label htmlFor="termini" className="ml-2">
              Accetto i <Link href="/termini">Termini di Servizio</Link> e la{" "}
              <Link href="/privacy">Privacy Policy</Link>
            </Label>
          </div>
          <Button type="submit" disabled={!accettoTermini || submitting} className="w-full">
            {submitting ? "Prenotando..." : "Prenota Ora"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
