import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

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

    // Get host information if available
    let host = null
    if (event.hostId) {
      try {
        const hostUser = await db.collection("users").findOne({ _id: new ObjectId(event.hostId) })
        if (hostUser) {
          host = {
            _id: hostUser._id.toString(),
            name: hostUser.name || "Organizzatore",
            email: hostUser.email,
            image: hostUser.image || null,
            rating: Number(hostUser.rating) || 0,
            verified: Boolean(hostUser.verified),
          }
        }
      } catch (hostError) {
        console.warn("Error fetching host:", hostError)
      }
    }

    // Transform event for frontend
    const transformedEvent = {
      _id: event._id.toString(),
      title: event.title || "Evento senza titolo",
      description: event.description || "",
      category: event.category || "evento",
      location: event.location || "Posizione non specificata",
      coordinates: event.coordinates || { lat: 0, lng: 0 },
      price: Number(event.price) || 0,
      dateStart: safeDate(event.dateStart),
      dateEnd: event.dateEnd ? safeDate(event.dateEnd) : null,
      totalSpots: Number(event.totalSpots) || 10,
      availableSpots: Number(event.availableSpots) || Number(event.totalSpots) || 10,
      amenities: Array.isArray(event.amenities) ? event.amenities : [],
      images: Array.isArray(event.images) ? event.images : [],
      bookingLink: event.bookingLink || "",
      verified: Boolean(event.verified),
      hostId: event.hostId?.toString(),
      views: Number(event.views) || 0,
      rating: Number(event.rating) || 0,
      reviewCount: Number(event.reviewCount) || 0,
      createdAt: safeDate(event.createdAt),
      updatedAt: safeDate(event.updatedAt),
      host: host,
    }

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
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Check if event exists and user is the owner
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    if (event.hostId?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Non autorizzato a modificare questo evento" }, { status: 403 })
    }

    // Update event
    const updateData = {
      title: body.title || event.title,
      description: body.description || event.description,
      category: body.category || event.category,
      location: body.location || event.location,
      coordinates: body.coordinates || event.coordinates,
      price: Number(body.price) || event.price,
      dateStart: body.dateStart ? new Date(body.dateStart) : event.dateStart,
      dateEnd: body.dateEnd ? new Date(body.dateEnd) : event.dateEnd,
      totalSpots: Number(body.totalSpots) || event.totalSpots,
      availableSpots: Number(body.availableSpots) || event.availableSpots,
      amenities: Array.isArray(body.amenities) ? body.amenities : event.amenities,
      images: Array.isArray(body.images) ? body.images : event.images,
      bookingLink: body.bookingLink || event.bookingLink,
      updatedAt: new Date(),
    }

    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

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
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
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

    // Check if event exists and user is the owner
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    if (event.hostId?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Non autorizzato a eliminare questo evento" }, { status: 403 })
    }

    // Delete event
    const result = await db.collection("events").deleteOne({ _id: new ObjectId(id) })

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
      { status: 500 }
    )
  }
}
