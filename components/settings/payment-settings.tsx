"use client"

import type React from "react"

import { useState } from "react"
import { CreditCard, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface PaymentMethod {
  id: string
  type: "card" | "paypal"
  name: string
  last4?: string
  expiryDate?: string
  icon: React.ReactNode
}

export function PaymentSettings() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "card-1",
      type: "card",
      name: "Visa",
      last4: "4242",
      expiryDate: "12/25",
      icon: <CreditCard className="h-4 w-4 text-blue-500" />,
    },
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simuliamo una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Aggiungiamo la nuova carta
      const newCard: PaymentMethod = {
        id: `card-${Date.now()}`,
        type: "card",
        name: formData.cardName ? `${formData.cardName}'s Card` : "Nuova Carta",
        last4: formData.cardNumber.slice(-4),
        expiryDate: formData.expiryDate,
        icon: <CreditCard className="h-4 w-4 text-blue-500" />,
      }

      setPaymentMethods((prev) => [...prev, newCard])
      setFormData({
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
      })
      setIsDialogOpen(false)
      toast.success("Carta aggiunta con successo", {
        description: `La carta terminante con ${newCard.last4} è stata aggiunta`,
      })
    } catch (error) {
      toast.error("Errore durante l'aggiunta della carta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCard = async (id: string) => {
    try {
      // Simuliamo una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 500))

      const cardToRemove = paymentMethods.find((method) => method.id === id)
      setPaymentMethods((prev) => prev.filter((method) => method.id !== id))

      toast.success("Metodo di pagamento rimosso", {
        description: `La carta terminante con ${cardToRemove?.last4} è stata rimossa`,
      })
    } catch (error) {
      toast.error("Errore durante la rimozione del metodo di pagamento")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Metodi di Pagamento
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                {method.icon}
                <div>
                  <p className="text-sm font-medium">{method.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.type === "card" ? `**** **** **** ${method.last4}` : method.name}
                    {method.expiryDate && ` • Scade ${method.expiryDate}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100/20"
                onClick={() => handleRemoveCard(method.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Metodo di Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Aggiungi una nuova carta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCard} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Numero Carta</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Nome sulla Carta</Label>
                  <Input
                    id="cardName"
                    name="cardName"
                    placeholder="Mario Rossi"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Data di Scadenza</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      placeholder="MM/AA"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Aggiunta in corso..." : "Aggiungi Carta"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </motion.div>
  )
}
