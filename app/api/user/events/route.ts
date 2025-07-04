import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching user events...")

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    console.log("👤 User email:", session.user.email)

    // Get user from database
    const user = await Database.getUserByEmail(session.user.email)

    if (!user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("✅ User found:", user._id.toString())

    // Get user events
    const events = await Database.getUserEvents(user._id.toString())

    console.log(`📊 Found ${events.length} user events`)

    // Transform events for frontend
    const transformedEvents = events.map((event: any) => ({
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
    }))

    console.log("✅ Returning transformed events")

    return NextResponse.json(transformedEvents)
  } catch (error: any) {
    console.error("💥 Error fetching user events:", error)

    return NextResponse.json(
      {
        error: "Errore nel caricamento degli eventi",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
