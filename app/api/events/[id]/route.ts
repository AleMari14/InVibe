import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"
import { ObjectId } from "mongodb"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB()
  try {
    const event = await Event.findById(params.id).lean()
    if (!event) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 })
    }
    return NextResponse.json(event)
  } catch (e) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
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
    await connectDB()

    // Find user
    const user = await User.findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Check if event exists and user is the owner
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    if (event.host?._id?.toString() !== user._id.toString()) {
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

    const result = await Event.findByIdAndUpdate(id, updateData, { new: true })

    if (!result) {
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

    await connectDB()

    // Find user
    const user = await User.findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Check if event exists and user is the owner
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    if (event.host?._id?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Non autorizzato a eliminare questo evento" }, { status: 403 })
    }

    // Delete event
    const result = await Event.findByIdAndDelete(id)

    if (!result) {
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
