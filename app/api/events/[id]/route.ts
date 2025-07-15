import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()

    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    let host = null
    if (event.hostId && ObjectId.isValid(event.hostId)) {
      host = await db
        .collection("users")
        .findOne({ _id: new ObjectId(event.hostId) }, { projection: { name: 1, image: 1, email: 1, _id: 1 } })
    }

    const fullEvent = {
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      host: host
        ? {
            _id: host._id.toString(),
            name: host.name || "Host",
            image: host.image || "",
            email: host.email || "",
          }
        : null,
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
    }

    return NextResponse.json(fullEvent)
  } catch (error: any) {
    console.error(`Errore nel recupero dell'evento ${id}:`, error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = params

    if (!id || !ObjectId.isValid(id)) {
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

    const result = await db.collection("events").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

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
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { id } = params

    if (!id || !ObjectId.isValid(id)) {
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
      { status: 500 },
    )
  }
}
