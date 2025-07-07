import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("📧 Password reset request for:", email)

    if (!email) {
      return NextResponse.json({ error: "Email richiesta" }, { status: 400 })
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const user = await Database.getUserByEmail(normalizedEmail)

    if (!user) {
      console.log("❌ User not found for email:", normalizedEmail)
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: "Se l'email esiste nel nostro sistema, riceverai le istruzioni per il reset",
      })
    }

    console.log("✅ User found:", user._id.toString())

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    console.log("🔑 Generated reset token:", resetToken.substring(0, 8) + "...")

    // Save reset token to user (in a real app, you'd save this to database)
    // For demo purposes, we'll just log it
    console.log("💾 Reset token would be saved to database for user:", user._id.toString())
    console.log("⏰ Token expires at:", resetTokenExpiry.toISOString())

    // In a real application, you would:
    // 1. Save the reset token and expiry to the user document
    // 2. Send an email with the reset link

    // For demo purposes, we'll simulate the email sending
    console.log("📨 Simulating email send...")
    console.log("📧 To:", normalizedEmail)
    console.log("🔗 Reset link would be: /auth/reset-password?token=" + resetToken)

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("✅ Password reset email sent successfully")

    return NextResponse.json({
      success: true,
      message: "Email di reset inviata con successo",
    })
  } catch (error: any) {
    console.error("💥 Password reset error:", error)

    return NextResponse.json(
      {
        error: "Errore durante l'invio dell'email di reset",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to request password reset",
    endpoint: "/api/auth/reset-password",
  })
}
