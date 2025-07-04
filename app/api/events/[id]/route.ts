import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Get host information
    let hostInfo = null
    if (event.hostId) {
      hostInfo = await db.collection("users").findOne({
        _id: new ObjectId(event.hostId),
      })
    }

    // Increment views
    await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $inc: { views: 1 } })

    // Transform event for frontend with safe date handling
    const transformedEvent = {
      _id: event._id.toString(),
      title: event.title || "Evento senza titolo",
      description: event.description || "",
      category: event.category || "evento",
      location: event.location || "",
      coordinates: event.coordinates || { lat: 0, lng: 0 },
      price: Number(event.price) || 0,
      // Safe date handling
      date: event.dateStart
        ? new Date(event.dateStart).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      time: event.dateStart
        ? new Date(event.dateStart).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
        : "00:00",
      dateStart: event.dateStart ? new Date(event.dateStart).toISOString() : new Date().toISOString(),
      dateEnd: event.dateEnd ? new Date(event.dateEnd).toISOString() : null,
      maxParticipants: Number(event.totalSpots) || 10,
      currentParticipants: Number(event.totalSpots) - Number(event.availableSpots) || 0,
      totalSpots: Number(event.totalSpots) || 10,
      availableSpots: Number(event.availableSpots) || 10,
      amenities: Array.isArray(event.amenities) ? event.amenities : [],
      images: Array.isArray(event.images) ? event.images : [],
      tags: Array.isArray(event.tags) ? event.tags : [],
      requirements: Array.isArray(event.requirements) ? event.requirements : [],
      bookingLink: event.bookingLink || "",
      externalBookingUrl: event.bookingLink || "",
      verified: Boolean(event.verified),
      views: Number(event.views) || 0,
      likes: Number(event.likes) || 0,
      rating: Number(event.rating) || 0,
      totalReviews: Number(event.reviewCount) || 0,
      reviewCount: Number(event.reviewCount) || 0,
      cancellationPolicy: event.cancellationPolicy || "Cancellazione gratuita fino a 24 ore prima dell'evento",
      host: {
        name: hostInfo?.name || "Host sconosciuto",
        email: hostInfo?.email || "",
        image: hostInfo?.image || "",
        verified: Boolean(hostInfo?.verified),
        rating: Number(hostInfo?.rating) || 0,
        totalReviews: Number(hostInfo?.reviewCount) || 0,
      },
      // Transform location for compatibility
      location: {
        address: event.location || "",
        city: event.location?.split(",")[1]?.trim() || event.location || "",
        coordinates: event.coordinates ? [event.coordinates.lng, event.coordinates.lat] : [0, 0],
      },
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : new Date().toISOString(),
    }

    console.log("✅ Event fetched:", transformedEvent.title)

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const eventId = params.id

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Find event and verify ownership
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Check if user owns the event
    const isOwner =
      event.hostId?.toString() === user._id.toString() ||
      event.createdBy?.toString() === user._id.toString() ||
      event.host?.email === session.user.email.toLowerCase()

    if (!isOwner) {
      return NextResponse.json({ error: "Non hai i permessi per eliminare questo evento" }, { status: 403 })
    }

    // Delete related data
    await Promise.all([
      // Delete bookings
      db
        .collection("bookings")
        .deleteMany({ eventId: new ObjectId(eventId) }),
      // Delete messages
      db
        .collection("messages")
        .deleteMany({ eventId: new ObjectId(eventId) }),
      // Delete chat rooms
      db
        .collection("chatRooms")
        .deleteMany({ eventId: new ObjectId(eventId) }),
      // Delete reviews
      db
        .collection("reviews")
        .deleteMany({ eventId: new ObjectId(eventId) }),
      // Remove from favorites
      db
        .collection("users")
        .updateMany({ favorites: new ObjectId(eventId) }, { $pull: { favorites: new ObjectId(eventId) } }),
    ])

    // Delete the event
    await db.collection("events").deleteOne({ _id: new ObjectId(eventId) })

    console.log("🗑️ Event deleted:", eventId)

    return NextResponse.json({
      message: "Evento eliminato con successo",
    })
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
