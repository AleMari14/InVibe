import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Fetch user's events directly from events collection
    const events = await db.collection("events")
      .find({ hostId: user._id })
      .sort({ createdAt: -1 })
      .toArray()

    // Format events for the frontend
    const formattedEvents = events.map(event => ({
      _id: event._id.toString(),
      title: event.title,
      date: event.dateStart,
      status: event.verified ? "Verificato" : "In attesa",
      partecipanti: event.totalSpots - event.availableSpots,
      totale: event.totalSpots,
      image: event.images?.[0] || "/placeholder.svg",
      views: event.views || 0
    }))

    return NextResponse.json({
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        preferences: user.preferences,
        createdAt: user.createdAt,
        verified: user.verified || false,
        joinDate: user.createdAt,
      },
      stats: {
        recensioni: user.reviewCount || 0,
        eventiPartecipati: user.participatedEvents?.length || 0,
        eventiOrganizzati: events.length,
      },
      eventi: formattedEvents,
      prenotazioni: user.bookings || [],
    })
  } catch (error) {
    console.error("Errore nel recupero del profilo:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Errore interno del server",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, phone, location, preferences, image } = body

    const { db } = await connectToDatabase()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (preferences !== undefined) updateData.preferences = preferences
    if (image !== undefined) updateData.image = image

    updateData.updatedAt = new Date()

    const result = await db.collection("users").updateOne(
      { email: session.user.email },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const updatedUser = await db.collection("users").findOne({ email: session.user.email })

    return NextResponse.json({
      status: "success",
      message: "Profilo aggiornato con successo",
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        image: updatedUser?.image,
        bio: updatedUser?.bio,
        phone: updatedUser?.phone,
        location: updatedUser?.location,
        preferences: updatedUser?.preferences,
        updatedAt: updatedUser?.updatedAt,
      },
    })
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Errore interno del server",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request)
}
