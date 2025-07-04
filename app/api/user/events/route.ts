import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching user events...")

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    console.log("👤 User email:", session.user.email)

    const { db } = await connectToDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("✅ User found:", user._id.toString())

    // Find events created by this user - check multiple possible fields
    const events = await db
      .collection("events")
      .find({
        $or: [
          { hostId: user._id },
          { hostId: user._id.toString() },
          { createdBy: user._id },
          { createdBy: user._id.toString() },
          { "host.email": session.user.email.toLowerCase() },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`📊 Found ${events.length} user events`)

    // Transform events to match expected format
    const transformedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title || "Evento senza titolo",
      description: event.description || "",
      location: event.location || "",
      price: Number(event.price) || 0,
      rating: Number(event.rating) || 0,
      reviewCount: Number(event.reviewCount) || 0,
      images: Array.isArray(event.images) ? event.images : [],
      category: event.category || "evento",
      dateStart: event.dateStart ? new Date(event.dateStart).toISOString() : new Date().toISOString(),
      dateEnd: event.dateEnd ? new Date(event.dateEnd).toISOString() : null,
      totalSpots: Number(event.totalSpots) || 10,
      availableSpots: Number(event.availableSpots) || Number(event.totalSpots) || 10,
      amenities: Array.isArray(event.amenities) ? event.amenities : [],
      bookingLink: event.bookingLink || "",
      verified: Boolean(event.verified),
      views: Number(event.views) || 0,
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : new Date().toISOString(),
    }))

    console.log("✅ Returning transformed events:", transformedEvents.length)

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
