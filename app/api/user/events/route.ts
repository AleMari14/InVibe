import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("🔍 Looking for events created by user:", user._id, "email:", session.user.email)

    // Find events created by this user - check multiple possible fields
    const events = await db
      .collection("events")
      .find({
        $or: [
          { hostId: user._id },
          { hostId: user._id.toString() },
          { createdBy: user._id },
          { createdBy: user._id.toString() },
          { "host.id": user._id.toString() },
          { "host.email": session.user.email },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log("📊 Found user events:", events.length)

    // If no events found, let's also check what events exist in the collection
    if (events.length === 0) {
      const allEvents = await db.collection("events").find({}).limit(5).toArray()
      console.log(
        "🔍 Sample events in collection:",
        allEvents.map((e) => ({
          _id: e._id,
          title: e.title,
          hostId: e.hostId,
          createdBy: e.createdBy,
          host: e.host,
        })),
      )
    }

    // Transform events to match expected format
    const transformedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title || "Evento senza titolo",
      description: event.description || "",
      location: event.location || "",
      price: event.price || 0,
      rating: event.rating || 0,
      reviewCount: event.reviewCount || 0,
      images: event.images || [],
      category: event.category || "evento",
      dateStart: event.dateStart?.toISOString?.() || event.dateStart || new Date().toISOString(),
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd || null,
      totalSpots: event.totalSpots || 10,
      availableSpots: event.availableSpots || event.totalSpots || 10,
      amenities: event.amenities || [],
      bookingLink: event.bookingLink || "",
      verified: event.verified || false,
      views: event.views || 0,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt || new Date().toISOString(),
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt || new Date().toISOString(),
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error("💥 Error fetching user events:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
