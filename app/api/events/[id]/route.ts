import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    console.log("🔍 Fetching event with ID:", eventId)

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) })

    if (!event) {
      console.log("❌ Event not found")
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    console.log("✅ Event found:", event.title)

    // Increment views
    await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $inc: { views: 1 } })

    // Get host information
    let hostInfo = {
      name: "Organizzatore",
      email: "host@example.com",
      image: null,
      verified: false,
      rating: 0,
      totalReviews: 0,
    }

    if (event.hostId) {
      const host = await db.collection("users").findOne({ _id: new ObjectId(event.hostId) })
      if (host) {
        hostInfo = {
          name: host.name || "Organizzatore",
          email: host.email || "host@example.com",
          image: host.image || null,
          verified: host.verified || false,
          rating: host.rating || 0,
          totalReviews: host.reviewCount || 0,
        }
      }
    }

    // Safe date handling
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

    const safeLocation = (location: any) => {
      if (typeof location === "string") {
        return {
          address: location,
          city: "",
          coordinates: [0, 0],
        }
      }
      return {
        address: location?.address || location || "Indirizzo non specificato",
        city: location?.city || "",
        coordinates: location?.coordinates || [0, 0],
      }
    }

    // Transform event for frontend
    const transformedEvent = {
      _id: event._id.toString(),
      title: event.title || "Evento senza titolo",
      description: event.description || "",
      category: event.category || "evento",
      location: safeLocation(event.location),
      price: Number(event.price) || 0,
      dateStart: safeDate(event.dateStart),
      dateEnd: event.dateEnd ? safeDate(event.dateEnd) : null,
      date: safeDate(event.dateStart).split("T")[0], // Extract date part
      time: (() => {
        try {
          const date = new Date(safeDate(event.dateStart))
          return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
        } catch {
          return "00:00"
        }
      })(),
      maxParticipants: Number(event.totalSpots) || Number(event.maxParticipants) || 10,
      currentParticipants: Number(event.totalSpots) - Number(event.availableSpots) || 0,
      totalSpots: Number(event.totalSpots) || 10,
      availableSpots: Number(event.availableSpots) || Number(event.totalSpots) || 10,
      tags: Array.isArray(event.tags) ? event.tags : [],
      images: Array.isArray(event.images) ? event.images : [],
      amenities: Array.isArray(event.amenities) ? event.amenities : [],
      requirements: Array.isArray(event.requirements) ? event.requirements : [],
      bookingLink: event.bookingLink || "",
      externalBookingUrl: event.externalBookingUrl || event.bookingLink || "",
      cancellationPolicy: event.cancellationPolicy || "",
      verified: Boolean(event.verified),
      views: Number(event.views) || 0,
      likes: Number(event.likes) || 0,
      rating: Number(event.rating) || 0,
      totalReviews: Number(event.reviewCount) || 0,
      host: hostInfo,
      createdAt: safeDate(event.createdAt),
      updatedAt: safeDate(event.updatedAt),
    }

    console.log("📤 Returning transformed event")
    return NextResponse.json(transformedEvent)
  } catch (error: any) {
    console.error("💥 Error fetching event:", error)
    return NextResponse.json(
      {
        error: "Errore nel caricamento dell'evento",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const body = await request.json()

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    const result = await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    return NextResponse.json({ message: "Evento aggiornato con successo" })
  } catch (error: any) {
    console.error("💥 Error updating event:", error)
    return NextResponse.json(
      {
        error: "Errore nell'aggiornamento dell'evento",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("events").deleteOne({ _id: new ObjectId(eventId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    return NextResponse.json({ message: "Evento eliminato con successo" })
  } catch (error: any) {
    console.error("💥 Error deleting event:", error)
    return NextResponse.json(
      {
        error: "Errore nell'eliminazione dell'evento",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
