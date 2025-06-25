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

    console.log("🔍 Looking for events created by user:", user._id)

    // Find events created by this user
    const events = await db
      .collection("events")
      .find({
        createdBy: user._id.toString(),
        // Also try with ObjectId format
        $or: [
          { createdBy: user._id.toString() },
          { createdBy: user._id },
          { "host.id": user._id.toString() },
          { "host.email": session.user.email },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log("📊 Found events:", events.length)

    // Transform events to match expected format
    const transformedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title || event.name || "Evento senza titolo",
      description: event.description || "",
      location: event.location || event.address || "",
      price: event.price || 0,
      rating: event.rating || 0,
      reviewCount: event.reviewCount || 0,
      images: event.images || [event.image].filter(Boolean) || [],
      category: event.category || "evento",
      dateStart: event.dateStart || event.date || new Date().toISOString(),
      dateEnd: event.dateEnd || null,
      totalSpots: event.totalSpots || event.maxGuests || 10,
      availableSpots: event.availableSpots || event.maxGuests || 10,
      amenities: event.amenities || [],
      bookingLink: event.bookingLink || "",
      verified: event.verified || false,
      views: event.views || 0,
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: event.updatedAt || new Date().toISOString(),
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error("💥 Error fetching user events:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
