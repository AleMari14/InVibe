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

    // Find events created by this user with multiple possible field matches
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

    // Safe date handling function
    const safeDate = (dateValue: any): string => {
      if (!dateValue) return new Date().toISOString()

      try {
        if (dateValue instanceof Date) {
          return dateValue.toISOString()
        }
        if (typeof dateValue === "string") {
          const parsed = new Date(dateValue)
          if (isNaN(parsed.getTime())) {
            return new Date().toISOString()
          }
          return parsed.toISOString()
        }
        return new Date().toISOString()
      } catch (error) {
        console.warn("Date parsing error:", error)
        return new Date().toISOString()
      }
    }

    // Transform events to match expected format
    const transformedEvents = events.map((event) => {
      const dateStart = safeDate(event.dateStart)

      return {
        _id: event._id.toString(),
        title: event.title || "Evento senza titolo",
        description: event.description || "",
        location: typeof event.location === "string" ? event.location : event.location?.address || event.location || "",
        price: Number(event.price) || 0,
        rating: Number(event.rating) || 0,
        reviewCount: Number(event.reviewCount) || 0,
        images: Array.isArray(event.images) ? event.images : [],
        category: event.category || "evento",
        dateStart: dateStart,
        dateEnd: event.dateEnd ? safeDate(event.dateEnd) : null,
        date: dateStart.split("T")[0], // Extract date part
        time: (() => {
          try {
            const date = new Date(dateStart)
            return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
          } catch {
            return "00:00"
          }
        })(),
        totalSpots: Number(event.totalSpots) || 10,
        availableSpots: Number(event.availableSpots) || Number(event.totalSpots) || 10,
        maxParticipants: Number(event.totalSpots) || Number(event.maxParticipants) || 10,
        currentParticipants: Number(event.totalSpots) - Number(event.availableSpots) || 0,
        amenities: Array.isArray(event.amenities) ? event.amenities : [],
        bookingLink: event.bookingLink || "",
        verified: Boolean(event.verified),
        views: Number(event.views) || 0,
        hostId: event.hostId?.toString(),
        participants: Array.isArray(event.participants) ? event.participants.map((p: any) => p.toString()) : [],
        coordinates: event.coordinates || { lat: 0, lng: 0 },
        createdAt: safeDate(event.createdAt),
        updatedAt: safeDate(event.updatedAt),
      }
    })

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
