import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("📧 Password reset request received")

    const { email } = await request.json()
    console.log("📧 Reset password for email:", email)

    if (!email) {
      return NextResponse.json({ error: "Email è obbligatoria", success: false }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const users = db.collection("users")

    // Check if user exists
    const user = await users.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      console.log("❌ User not found for email:", email)
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: "Se l'email esiste nel nostro sistema, riceverai le istruzioni per il reset",
      })
    }

    console.log("✅ User found, generating reset token")

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to user
    await users.updateOne(
      { email: email.toLowerCase().trim() },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date(),
        },
      },
    )

    console.log("✅ Reset token saved to database")

    // In a real app, you would send an email here
    // For demo purposes, we'll just log the reset link
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`
    console.log("🔗 Reset link (for demo):", resetLink)

    // Simulate email sending
    console.log("📧 Simulating email send to:", email)
    console.log("📧 Email content would include reset link:", resetLink)

    return NextResponse.json({
      success: true,
      message: "Email di reset inviata con successo",
      // In production, don't include the token in the response
      ...(process.env.NODE_ENV === "development" && { resetToken, resetLink }),
    })
  } catch (error) {
    console.error("💥 Reset password error:", error)
    return NextResponse.json({ error: "Errore interno del server", success: false }, { status: 500 })
  }
}
