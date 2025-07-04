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

    // Get host information
    const host = await db.collection("users").findOne({ _id: event.hostId })

    // Increment views
    await db.collection("events").updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } })

    const eventData = {
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
      host: host
        ? {
            _id: host._id.toString(),
            name: host.name,
            email: host.email,
            image: host.image,
            verified: host.verified || false,
            rating: host.rating || 0,
          }
        : null,
    }

    return NextResponse.json(eventData)
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

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Find event and check ownership
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })
    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Check if user owns this event
    const isOwner =
      event.hostId?.toString() === user._id.toString() || event.createdBy?.toString() === user._id.toString()

    if (!isOwner) {
      return NextResponse.json({ error: "Non hai i permessi per modificare questo evento" }, { status: 403 })
    }

    // Update event
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    const result = await db.collection("events").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Nessuna modifica effettuata" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Evento aggiornato con successo" })
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

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Find event and check ownership
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })
    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Check if user owns this event
    const isOwner =
      event.hostId?.toString() === user._id.toString() || event.createdBy?.toString() === user._id.toString()

    if (!isOwner) {
      return NextResponse.json({ error: "Non hai i permessi per eliminare questo evento" }, { status: 403 })
    }

    // Delete event
    const result = await db.collection("events").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Evento non trovato o già eliminato" }, { status: 404 })
    }

    // Also delete related bookings
    await db.collection("bookings").deleteMany({ eventId: id })

    return NextResponse.json({ success: true, message: "Evento eliminato con successo" })
  } catch (error) {
    console.error("💥 Error deleting event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
