"use client"

import { useState } from "react"
import { ArrowLeft, Calendar, Users, CreditCard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

export default function BookingPage() {
  const [guests, setGuests] = useState(2)
  const [specialRequests, setSpecialRequests] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const listing = {
    title: "Luxury Beach House Party",
    date: "December 15-17, 2024",
    price: 150,
    host: "Sarah M.",
  }

  const totalPrice = guests * listing.price
  const serviceFee = Math.round(totalPrice * 0.1)
  const finalTotal = totalPrice + serviceFee

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/listing/1">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Book Your Spot</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{listing.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{listing.date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>Hosted by {listing.host}</span>
            </div>
          </CardContent>
        </Card>

        {/* Guest Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Number of Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Guests</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setGuests(Math.max(1, guests - 1))}>
                  -
                </Button>
                <span className="w-8 text-center">{guests}</span>
                <Button variant="outline" size="icon" onClick={() => setGuests(Math.min(12, guests + 1))}>
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
            </div>
          </CardContent>
        </Card>

        {/* Special Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Special Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requests or dietary restrictions?"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" placeholder="123" />
              </div>
            </div>
            <div>
              <Label htmlFor="cardName">Name on Card</Label>
              <Input id="cardName" placeholder="John Doe" />
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>
                ${listing.price} × {guests} guests
              </span>
              <span>${totalPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>${serviceFee}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${finalTotal}</span>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={setAgreeToTerms} />
              <div className="text-sm">
                <Label htmlFor="terms" className="cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 rounded-lg">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Your payment is protected by our secure booking guarantee</span>
            </div>
          </CardContent>
        </Card>

        {/* Book Button */}
        <Button size="lg" className="w-full" disabled={!agreeToTerms}>
          Confirm Booking - ${finalTotal}
        </Button>
      </div>

      {/* Bottom padding */}
      <div className="h-4"></div>
    </div>
  )
}
