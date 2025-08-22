import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    console.log("🔍 Fetching events for user:", session.user.email)

    const { db } = await connectToDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("✅ User found:", user._id)

    // Get all events created by this user (including expired ones)
    const events = await db
      .collection("events")
      .find({
        hostId: user._id.toString(),
      })
      .sort({ dateStart: -1 })
      .toArray()

    console.log("Query userId:", user._id.toString(), session.user.email)
    console.log("Events found:", events.length)

    console.log(`📊 Found ${events.length} events for user`)

    // Add isExpired flag to each event
    const eventsWithStatus = events.map((event) => ({
      ...event,
      isExpired: new Date(event.dateStart) < new Date(),
    }))

    console.log("📤 Returning transformed events array with isExpired status")

    return NextResponse.json(eventsWithStatus)
  } catch (error: any) {
    console.error("💥 Error fetching user events:", error)
    return NextResponse.json(
      {
        error: "Errore interno del server",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
