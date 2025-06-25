import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const eventId = params.id

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) })

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Transform event to match expected format
    const transformedEvent = {
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
      createdBy: event.createdBy,
      host: event.host || {},
    }

    return NextResponse.json(transformedEvent)
  } catch (error) {
    console.error("💥 Error fetching event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const eventId = params.id

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    // Find user
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Check if event exists and user owns it
    const existingEvent = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
      $or: [
        { createdBy: user._id.toString() },
        { createdBy: user._id },
        { "host.id": user._id.toString() },
        { "host.email": session.user.email },
      ],
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Evento non trovato o non autorizzato" }, { status: 404 })
    }

    const body = await request.json()

    // Update event
    const updateResult = await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Evento aggiornato con successo",
    })
  } catch (error) {
    console.error("💥 Error updating event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const eventId = params.id

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    // Find user
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("🗑️ Attempting to delete event:", eventId, "by user:", user._id)

    // Check if event exists and user owns it
    const existingEvent = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
      $or: [
        { createdBy: user._id.toString() },
        { createdBy: user._id },
        { "host.id": user._id.toString() },
        { "host.email": session.user.email },
      ],
    })

    if (!existingEvent) {
      console.log("❌ Event not found or not authorized")
      return NextResponse.json({ error: "Evento non trovato o non autorizzato" }, { status: 404 })
    }

    // Delete event
    const deleteResult = await db.collection("events").deleteOne({ _id: new ObjectId(eventId) })

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Errore durante l'eliminazione" }, { status: 500 })
    }

    console.log("✅ Event deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Evento eliminato con successo",
    })
  } catch (error) {
    console.error("💥 Error deleting event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
